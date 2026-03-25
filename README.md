# Heat Pump Sizing Calculator

A web-based tool that helps homeowners and installers size heat pumps accurately, understand the financial case for switching from gas, and see how system design choices affect running costs — built on real hourly weather data from the European Commission's PVGIS API.

**Live demo:** `npm install && npm start` → [http://localhost:3000](http://localhost:3000)

---

## Why I built it this way

Most heat pump calculators answer one question: *what size do I need?* This one answers the questions that actually drive purchasing decisions:

- **Is switching from gas worth it?** → Gas vs heat pump cost comparison with CO₂ savings
- **Does my heating system design matter?** → Flow temperature comparison showing how underfloor heating vs radiators affects running costs
- **What happens if I go slightly smaller to save money?** → Scenario cards showing undersized / recommended / oversized trade-offs
- **How cold will my house get on the worst days?** → Hour-by-hour indoor temperature modelling when the pump is undersized

The LLM chat interface (Claude Haiku via Anthropic API) means a homeowner can describe their house in plain English and get a full calculation — no knowledge of U-values or PVGIS coordinates required.

---

## Features

### Conversational intake — LLM chat UI
A chat panel replaces the form as the default interface. The user describes their building naturally; the AI asks follow-up questions, fills in sensible defaults, and triggers the calculation automatically when it has enough information. An Expert Mode toggle exposes the full technical form for engineers.

### Heat pump sizing — core calculation
- Heat loss: `Σ(Area × U-value × ΔT)` for walls, roof, and floor
- 8,760 hourly data points from **PVGIS TMY** (Typical Meteorological Year) — real historical averages, not guesses
- CoP lookup table by flow temperature and outdoor temperature (2.0–4.5)
- Quantile-based sizing: recommends the minimum pump size where heating load exceeds capacity for at most N hours/year (configurable, default 24)

### Gas boiler vs heat pump comparison
Side-by-side annual running costs, assuming a standard 88% efficient condensing boiler. Shows:
- Annual cost for gas boiler vs heat pump at current tariffs
- Annual saving (or honest loss — the numbers aren't fudged)
- CO₂ reduction in tonnes, with a relatable equivalent (short-haul flights avoided per year)

This is the feature most relevant to Midsummer's sales process.

### Flow temperature comparison (35 / 45 / 55°C)
Computes running costs and average CoP for three flow temperature scenarios from the same weather data — no extra API calls. Shows the efficiency penalty of high-temperature systems and quantifies the savings from underfloor heating vs standard radiators. Directly supports the argument for low-temperature system design.

### Scenario cards (undersized / recommended / oversized)
Three side-by-side cards computed client-side from hourly results, showing how cold hours per year, running costs, and comfort change across pump sizes. Makes the sizing trade-off tangible.

### Indoor temperature modelling
When the pump is undersized, calculates actual indoor temperature hour-by-hour using steady-state heat balance:
```
T_indoor = T_outdoor + (Q_delivered × 1000) / UA_total
```
Displayed as an interactive daily chart. Limitations (thermal mass, ventilation, solar gains) are documented honestly.

### Charts and daily drill-down
- Monthly bar chart — heat energy and electrical energy by month
- Daily detail chart — hourly outdoor temperature and electrical use for any selected day
- Indoor temperature chart — actual vs setpoint vs outdoor for the undersized scenario

---

## Technical decisions

**Why PVGIS TMY instead of live weather?**
Sizing a heat pump on one unusually cold winter would lead to oversizing. TMY data represents the statistically "typical" year across 15+ years of observations — the right basis for equipment sizing.

**Why quantile-based sizing?**
A heat pump doesn't need to cover 100% of hours — that leads to gross oversizing. The threshold-hours approach (default: permit 24 hours/year of under-capacity) is how MCS-certified installers think about sizing. It's configurable.

**Why Claude Haiku for the chat?**
Fast, cheap, and accurate enough for structured data extraction. The system prompt instructs it to return plain JSON when it has enough information, making the transition from chat to calculation seamless without any UI friction.

**Why recompute flow-temp scenarios client-side?**
The hourly results array already has `heatLoss` and `outdoorTemp` for every hour. Recomputing CoP for a different flow temperature is trivial client-side and avoids a second PVGIS API call (which takes 3–5 seconds).

---

## Technology stack

| Component | Technology |
|---|---|
| Backend | Node.js + Express.js |
| LLM | Claude Haiku (Anthropic API) via native `fetch` |
| Weather data | PVGIS TMY API v5.2 (European Commission) |
| Charts | Chart.js 4.x |
| Frontend | Vanilla HTML / CSS / JS — no framework |

---

## Setup

```bash
git clone https://github.com/midsummer-energy/midsummer-siva.git
cd midsummer-siva
npm install
```

Create a `.env` file:
```
ANTHROPIC_API_KEY=your_key_here
```

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000). The chat UI loads immediately. For a quick test, try:

> *"I have a 3-bed semi in London, built in the 1970s with cavity wall insulation. I'm considering an 8kW heat pump at 45°C flow temperature."*

---

## Example inputs (London semi, manual form)

| Parameter | Value |
|---|---|
| Walls area / U-value | 120 m² / 0.20 W/m²K |
| Roof area / U-value | 80 m² / 0.15 W/m²K |
| Floor area / U-value | 80 m² / 0.18 W/m²K |
| Location | 51.5074, -0.1278 |
| Flow temperature | 45°C |
| Max output | 8 kW |
| Base temperature | 14°C |
| Electricity price | 28.6 p/kWh |
| Gas price | 5.5 p/kWh |

---

## File structure

```
midsummer-siva/
├── server.js              # Express — route orchestration only (~160 lines)
├── src/
│   ├── validate.js        # Input validation
│   ├── pvgisClient.js     # PVGIS API client
│   └── heatModel.js       # Heat loss, CoP, sizing calculations
├── index.html             # All frontend — chat UI, form, charts, results
├── .env                   # ANTHROPIC_API_KEY (not committed)
└── package.json
```

---

## AI tools used

Built with **Claude Code** (Anthropic) as the primary development environment. The conversational intake feature uses **Claude Haiku** at runtime via the Anthropic API.

The base calculator was provided as a starting point. All feature additions — LLM intake, scenario cards, gas comparison, flow temperature comparison, indoor temperature modelling, module extraction, and bug fixes — were built in this session.

---

## Changelog

### v2.0.0 — Feature additions
- LLM conversational intake (`/api/interpret` route + chat UI)
- Gas boiler vs heat pump annual cost and CO₂ comparison
- Flow temperature comparison (35 / 45 / 55°C) with savings insight
- Scenario cards (undersized / recommended / oversized)
- Heat loss SVG building visualisation
- Annual running cost (£/yr) with configurable electricity price
- Gas price input for comparison calculations

### v1.1.0 — Refactoring & bug fixes
- Fixed off-by-one error in quantile-based heat pump sizing
- Proper HTTP status codes (400 / 502 / 500)
- Extracted logic into `src/` modules — `server.js` is now a thin orchestration layer

---

## License

MIT
