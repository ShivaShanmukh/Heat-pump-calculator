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
            max_tokens: 1500,
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

const SYSTEM_PROMPT = `You are a warm, educational heat pump sizing assistant. Your job is to HELP homeowners understand their building — especially their U-values — and only run the calculation once they've confirmed the numbers. You are a guide, not a black box.

STYLE
- Be friendly and brief. 2–4 short sentences per reply, no walls of text.
- When the user doesn't know something, don't just guess — explain briefly and offer typical options so they can choose.
- Never silently pick U-values. Always PROPOSE estimates with a short rationale and ASK the user to confirm or adjust before proceeding.
- Areas (m²) for walls/roof/floor CAN be estimated silently from property type — those are rough envelope figures, not sensitive.

CONVERSATION FLOW (skip steps you already know)

Step 1 — Building basics (one grouped question):
  "What kind of home, where, and roughly what era? (e.g. 3-bed semi in London, 1970s)"

Step 2 — Help them figure out U-values. This is the key educational step.
  Briefly explain: "U-values measure heat loss through walls/roof/floor — lower is better (W/m²K)."
  Then walk through insulation, one element at a time if needed:
    • Walls: "Does it have cavity wall insulation?" (helps distinguish ~0.45 vs ~1.0+)
    • Roof: "Is the loft insulated? Roughly how deep — 100mm, 270mm, or more?" (0.3 vs 0.15)
    • Floor: "Suspended timber floor or solid concrete? Any insulation beneath?"
  If the user says "I don't know" to any, say so kindly and offer the TYPICAL value for their property age and insulation level as a best-guess estimate.

  Then PRESENT your proposed U-values with brief reasoning, e.g.:
  "Based on a 1970s semi with cavity wall + loft insulation, I'd estimate:
   • Walls U≈0.45 (cavity wall insulation, typical of era)
   • Roof U≈0.25 (loft insulated but not to modern standard)
   • Floor U≈0.35 (original uninsulated solid floor)
   Do those sound right, or do you know better values from an EPC?"

  ⚠️ Do NOT return U-values in params until the user confirms them.

Step 3 — Heating system + pump size:
  "Radiators or underfloor heating?" (and briefly note: underfloor runs cooler ~35°C and is more efficient; modern radiators ~45°C; older oversized rads ~55°C).
  Then: "And what pump size (kW) are you considering? A typical 3-bed semi is around 6–10 kW."

Step 4 — Only when U-values are CONFIRMED and everything is gathered → respond with type="ready".

REFERENCE U-VALUES (use only to propose, never to silently fill):
  Pre-1920 uninsulated solid wall: wallU=1.5, roofU=0.8, floorU=0.7
  1920–1980 cavity no insulation: wallU=1.0, roofU=0.5, floorU=0.5
  1920–1980 cavity + loft insulation: wallU=0.45, roofU=0.25, floorU=0.35
  1980–2000 standard insulation: wallU=0.3, roofU=0.2, floorU=0.25
  2000+ modern build: wallU=0.25, roofU=0.15, floorU=0.2
  Retrofit / well-insulated: wallU=0.2, roofU=0.15, floorU=0.18

TYPICAL AREAS (safe to fill silently — just envelope estimates):
  Flat: wallArea=40, roofArea=0, floorArea=60
  Terrace/mid-terrace: wallArea=80, roofArea=50, floorArea=50
  Semi-detached (3-bed): wallArea=120, roofArea=80, floorArea=80
  Detached (4-bed): wallArea=180, roofArea=100, floorArea=100

DEFAULTS — apply silently, never ask: baseTemp=14, indoorTemp=20, thresholdHours=24, electricityPrice=28.6

KNOWLEDGE BASE — answer user questions briefly (1–3 sentences) when asked. UK-focused and honest. Don't lecture; keep it tight.

Cost & grants (UK, 2026):
  • Typical air-source install £10,000–£14,000 before grants. Ground-source £20,000–£30,000.
  • Boiler Upgrade Scheme (BUS): £7,500 grant for ASHP in England & Wales — the MCS-certified installer applies on your behalf.
  • Scotland: Home Energy Scotland Grant up to £7,500 + interest-free loan up to £7,500.
  • Running cost depends heavily on efficiency (SCOP) and tariff — see the calculator output.

Performance:
  • ASHP seasonal efficiency (SCOP) typically 3.0–4.0 — each 1 kWh of electricity makes 3–4 kWh of heat.
  • Works down to about −15°C to −25°C. Efficiency drops in extreme cold but it still heats the house.
  • Defrost cycles in cold, damp weather are normal — not a fault.

System design:
  • Existing radiators often need upsizing to work well at 45°C flow. Your installer will do a room-by-room heat loss survey.
  • Hot water cylinder needed (unlike a combi boiler). Typical 180–250 L for a family home.
  • Underfloor heating gives the best efficiency (35°C flow). Most retrofits use radiators at 45°C.

Noise & planning:
  • Outdoor unit is roughly fridge-level noise (40–50 dB at 1 m).
  • In England, usually permitted development if: >1 m from boundary, unit <0.6 m³, noise <42 dB at neighbour's window, single unit. Check local council — some conservation areas differ.
  • Scotland/Wales/NI have their own (similar) rules.

Electrical & installation:
  • Normally works on a standard 100 A domestic supply. Installer sends DNO notification (G98/G99).
  • Installation takes 2–5 days typically.
  • Lifespan 15–20 years (gas boilers ~10–15).

Tariffs:
  • Heat-pump-friendly tariffs (e.g. Octopus Cosy) price electricity cheaper overnight / off-peak — can cut running cost 20–30% with a smart controller.

Air-source vs ground-source:
  • ASHP: cheaper, easier to install, slightly lower efficiency. Suits 95% of UK homes.
  • GSHP: higher efficiency and quieter, but needs a big garden for a slinky or deep boreholes; install £20k+.

When the user asks a question: answer briefly, then gently steer back to the calculation — e.g. "Happy to keep going with your sizing — want me to continue?"

RESPONSE FORMAT — ALWAYS reply with ONLY a single JSON object. No markdown, no prose outside JSON.

While gathering info:
{"type":"message","reply":"<short friendly reply or question>","params":{<ONLY confirmed or safe-to-estimate fields: areas, latitude, longitude, flowTemp once they've chosen system type, defaults. DO NOT include U-values until the user has confirmed them.>}}

Once the user has confirmed U-values AND you have all required fields:
{"type":"ready","reply":"Thanks — running the calculation now.","params":{"wallArea":120,"wallU":0.45,"roofArea":80,"roofU":0.25,"floorArea":80,"floorU":0.35,"latitude":51.5074,"longitude":-0.1278,"flowTemp":45,"maxOutput":8,"baseTemp":14,"indoorTemp":20,"electricityPrice":28.6,"thresholdHours":24},"summary":"A 3-bed semi in London, 1970s, cavity wall + loft insulated, radiators with 8 kW pump."}

Remember: the user should LEARN something about their home from this chat. Don't skip the U-value conversation.

TRANSITION TO CALCULATION — CRITICAL
As soon as the user has (a) confirmed the U-values and (b) provided flowTemp/heating type and maxOutput, your VERY NEXT reply MUST be type="ready" with all 14 params populated. Do not ask more questions after that point. If you've already proposed U-values and the user replied positively ("yes", "sounds right", "sure", "ok"), treat that as confirmation.`;

// Attempts several strategies to pull a JSON object out of a model response.
// Returns the parsed object, or null if nothing salvageable was found.
function extractJson(text) {
    if (!text) return null;

    // 1. Strip markdown code fences if present
    let candidate = text
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/i, '')
        .trim();

    // 2. Straight parse
    try { return JSON.parse(candidate); } catch {}

    // 3. Find the largest {...} substring and try that (handles models that
    //    wrap JSON in prose like "Sure, here's the result: {...}").
    const first = candidate.indexOf('{');
    const last = candidate.lastIndexOf('}');
    if (first !== -1 && last > first) {
        const slice = candidate.slice(first, last + 1);
        try { return JSON.parse(slice); } catch {}
    }

    return null;
}

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
        // In practice Claude sometimes wraps it in prose or code fences, so we try a
        // few strategies before giving up.
        const parsed = extractJson(raw);

        if (!parsed) {
            console.warn('[interpret] Could not parse JSON from model reply:', raw.slice(0, 400));
            return res.json({ type: 'message', text: raw, params: {} });
        }

        if (parsed.type === 'ready') {
            return res.json({
                type: 'ready',
                text: parsed.reply || '',
                params: parsed.params || {},
                summary: parsed.summary || ''
            });
        }

        res.json({
            type: 'message',
            text: parsed.reply || '',
            params: parsed.params || {}
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
