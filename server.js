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

const SYSTEM_PROMPT = `You are a friendly heat pump sizing assistant. Your job is to gather the building details needed to run a heat pump sizing calculation, then return them as structured JSON.

You need to collect these parameters:
- wallArea (m²), wallU (W/m²K) — wall surface area and insulation U-value
- roofArea (m²), roofU (W/m²K) — roof surface area and U-value
- floorArea (m²), floorU (W/m²K) — floor surface area and U-value
- latitude and longitude — location coordinates (you can infer from a city name)
- flowTemp (°C) — heat pump flow temperature, typically 35–55°C
- maxOutput (kW) — the heat pump capacity the user wants to evaluate
- baseTemp (°C) — outdoor temperature below which heating is needed, typically 14–16°C
- indoorTemp (°C) — desired indoor temperature, typically 20°C
- electricityPrice (p/kWh) — UK default is 28.6
- thresholdHours — max hours/year the pump can be over-capacity, default 24

Ask questions conversationally, one or two at a time. Make reasonable assumptions for defaults (indoorTemp=20, baseTemp=14, thresholdHours=24, electricityPrice=28.6) and tell the user what you're assuming.

When you have enough information (at minimum: wall/roof/floor areas and U-values, location, flowTemp, maxOutput), respond with ONLY valid JSON in this exact format — no markdown, no explanation:
{"type":"ready","params":{"wallArea":120,"wallU":0.2,"roofArea":80,"roofU":0.15,"floorArea":80,"floorU":0.18,"latitude":51.5074,"longitude":-0.1278,"flowTemp":45,"maxOutput":8,"baseTemp":14,"indoorTemp":20,"electricityPrice":28.6,"thresholdHours":24},"summary":"A 3-bed semi in London..."}

While still gathering info, respond with plain conversational text only — no JSON.`;

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
        const reply = completion.content[0].text.trim();

        // Detect if the model returned a ready JSON payload
        if (reply.startsWith('{') && reply.includes('"type":"ready"')) {
            try {
                const parsed = JSON.parse(reply);
                return res.json({ type: 'ready', params: parsed.params, summary: parsed.summary });
            } catch {
                // Fall through and return as plain text if JSON parse fails
            }
        }

        res.json({ type: 'message', text: reply });

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
