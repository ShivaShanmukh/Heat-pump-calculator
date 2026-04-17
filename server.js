import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import { validateInputs } from './src/validate.js';
import { fetchPVGISData } from './src/pvgisClient.js';
import { processHourlyData, recommendHeatPumpSize } from './src/heatModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

async function anthropicChat(messages) {
    // Anthropic uses a separate system param — extract it from the messages array
    const system = messages.find(m => m.role === 'system')?.content || '';
    const convo = messages.filter(m => m.role !== 'system');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 500,
            system,
            messages: convo
        })
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Anthropic API error ${res.status}`);
    }
    return res.json();
}

const SYSTEM_PROMPT = `You are a concise heat pump sizing assistant. Your goal: get to a calculation in as FEW exchanges as possible (ideally 2–3 total user turns). Be brief, infer aggressively, and group related questions together.

Parameters you eventually need:
- wallArea, wallU, roofArea, roofU, floorArea, floorU (areas in m², U-values in W/m²K)
- latitude, longitude (infer from city name)
- flowTemp (°C, typically 35 for underfloor, 45 for modern radiators, 55 for older rads)
- maxOutput (kW)
- baseTemp=14, indoorTemp=20, thresholdHours=24, electricityPrice=28.6 — ALWAYS use these defaults silently, never ask.

Ask at most these three grouped questions (skip any you already know):
1. Property type + city + age — e.g. "What kind of home, where, and roughly what era? (e.g. 3-bed semi in London, 1970s)"
2. Insulation level — "Is it well insulated, average, or poorly insulated?"
3. Heating system + pump size — "Underfloor heating or radiators, and what pump size are you considering (kW)?"

INFER DEFAULTS from what the user says — do NOT ask about U-values or areas directly.

U-values by age/insulation:
  Pre-1920 uninsulated: wallU=1.5, roofU=0.8, floorU=0.7
  1920–1980 basic: wallU=0.8, roofU=0.4, floorU=0.5
  1980–2000 cavity+loft: wallU=0.45, roofU=0.25, floorU=0.35
  2000+ modern: wallU=0.25, roofU=0.15, floorU=0.2
  Retrofit / well-insulated: wallU=0.2, roofU=0.15, floorU=0.18

Typical areas by property type:
  Flat: wallArea=40, roofArea=0, floorArea=60
  Terrace/mid-terrace: wallArea=80, roofArea=50, floorArea=50
  Semi-detached (3-bed): wallArea=120, roofArea=80, floorArea=80
  Detached (4-bed): wallArea=180, roofArea=100, floorArea=100

RESPONSE FORMAT — ALWAYS reply with a single JSON object only. No markdown, no prose outside JSON.

While gathering info:
{"type":"message","reply":"<one short sentence question or acknowledgement>","params":{<any fields you've inferred so far — include as many as possible>}}

When you have ALL required fields (wall/roof/floor areas + U-values, lat/long, flowTemp, maxOutput):
{"type":"ready","reply":"Got everything — running the calculation now.","params":{"wallArea":120,"wallU":0.2,"roofArea":80,"roofU":0.15,"floorArea":80,"floorU":0.18,"latitude":51.5074,"longitude":-0.1278,"flowTemp":45,"maxOutput":8,"baseTemp":14,"indoorTemp":20,"electricityPrice":28.6,"thresholdHours":24},"summary":"A 3-bed semi in London, 1970s…"}

Keep "reply" SHORT. Populate "params" with every field you can infer, even partially — the UI fills the form live as you learn things.`;

app.use(express.json());

// In production (Vercel) serve the built React app; locally serve index.html from root
const staticDir = process.env.NODE_ENV === 'production'
    ? path.join(__dirname, 'client/dist')
    : __dirname;
app.use(express.static(staticDir));

// ─── POST /api/interpret ──────────────────────────────────────────────────────
app.post('/api/interpret', async (req, res) => {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'message is required' });
    }

    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history,
        { role: 'user', content: message }
    ];

    try {
        const completion = await anthropicChat(messages);
        const raw = completion.content[0].text.trim();

        // The system prompt instructs the model to ALWAYS return a single JSON object.
        // We try to parse it; if it fails, we gracefully fall back to treating the
        // whole output as a plain message.
        let parsed = null;
        try {
            // Strip possible markdown code fences just in case
            const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
            parsed = JSON.parse(cleaned);
        } catch {
            return res.json({ type: 'message', text: raw, params: {} });
        }

        if (parsed?.type === 'ready') {
            return res.json({
                type: 'ready',
                text: parsed.reply || '',
                params: parsed.params || {},
                summary: parsed.summary || ''
            });
        }

        res.json({
            type: 'message',
            text: parsed?.reply || '',
            params: parsed?.params || {}
        });

    } catch (error) {
        console.error('Anthropic error:', error);
        res.status(502).json({ error: 'AI service error: ' + error.message });
    }
});

// ─── POST /calculate ──────────────────────────────────────────────────────────
app.post('/calculate', async (req, res) => {
    try {
        const body = req.body;

        // Parse numerics
        for (const key of Object.keys(body)) {
            body[key] = parseFloat(body[key]);
        }

        // Validate — returns 400 for invalid inputs
        const validationErrors = validateInputs(body);
        if (validationErrors.length > 0) {
            return res.status(400).json({ error: validationErrors.join(' ') });
        }

        const thresholdHours = body.thresholdHours !== undefined && !isNaN(body.thresholdHours)
            ? Math.max(0, Math.round(body.thresholdHours))
            : 24;

        // Fetch weather data from PVGIS
        const pvgisData = await fetchPVGISData(body.latitude, body.longitude);
        const hourlyData = pvgisData.outputs.tmy_hourly;

        // Run heat model calculations
        const results = processHourlyData(hourlyData, body);

        // Recommended heat pump size (quantile-based)
        const recommendedSize = recommendHeatPumpSize(hourlyData, body, thresholdHours);

        const electricityPricePennies = parseFloat(body.electricityPrice) || 28.6;
        const annualCostPounds = (results.electricalEnergy * electricityPricePennies) / 100;

        res.json({
            ...results,
            recommendedSize,
            thresholdHours,
            annualCostPounds: parseFloat(annualCostPounds.toFixed(2)),
            electricityPricePennies
        });

    } catch (error) {
        console.error('Calculation error:', error);

        // Classify error type for correct HTTP status:
        //   - PVGIS/API failures → 502 (bad gateway — upstream service problem)
        //   - Everything else    → 500 (internal server error)
        let status = 500;
        if (error.message.includes('PVGIS') || error.message.includes('API')) {
            status = 502;
        }

        res.status(status).json({ error: error.message });
    }
});

// ─── SPA fallback — serves index.html for all React Router routes ─────────────
app.get('*', (req, res) => {
    const indexPath = process.env.NODE_ENV === 'production'
        ? path.join(__dirname, 'client/dist/index.html')
        : path.join(__dirname, 'index.html');
    res.sendFile(indexPath);
});

// ─── Start (skipped on Vercel, which imports the app as a module) ─────────────
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`Heat pump sizing server running at http://localhost:${PORT}`);
        console.log(`Open your browser to http://localhost:${PORT} to use the calculator`);
    });
}

export default app;
