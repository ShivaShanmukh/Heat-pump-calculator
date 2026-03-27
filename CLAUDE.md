# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Local development
```bash
# Install server dependencies
npm install

# Install and build the React client
npm run build          # runs: cd client && npm install && npm run build

# Start the server (serves built client from client/dist in production)
NODE_ENV=production node server.js

# Client dev server (hot reload, proxies /api and /calculate to Express)
cd client && npm run dev
```

### Environment
Create a `.env` file at the root:
```
ANTHROPIC_API_KEY=sk-ant-...
```
The server reads this via `dotenv/config`. On Railway, set it as a service variable — it does **not** auto-deploy on variable change; you must trigger a redeploy manually.

## Architecture

This is a monorepo: an Express server at the root and a React/Vite client under `client/`.

### Data flow
1. User describes their home in the `/chat` UI (`ChatConversation.tsx` → `ChatMode`)
2. Each message is sent to `POST /api/interpret` on the server
3. Server forwards the conversation to Claude Haiku via the Anthropic Messages API
4. When the LLM has gathered enough info it returns `{"type":"ready","params":{...}}` — the server parses this and passes it back to the client
5. The client calls `POST /calculate` three times in parallel (undersized / optimal / oversized scenarios)
6. `POST /calculate` fetches Typical Meteorological Year data from the PVGIS API (EU Commission), runs the heat model, and returns results
7. Results are stored in `CalcContext` (React context, in-memory only — not persisted) and the user is navigated to `/results`

### Key server modules
- `src/heatModel.js` — all physics: COP lookup table, heat loss (U-value × area × ΔT), hourly processing, quantile-based pump sizing. All functions are pure.
- `src/pvgisClient.js` — PVGIS fetch with in-memory cache (so 3 scenario calls for the same location only hit the external API once per server session)
- `src/validate.js` — input validation, returns an array of error strings
- `server.js` — Express routes only; no business logic

### Sizing algorithm
`recommendHeatPumpSize` uses a quantile approach: collect all hourly heat loads for the year, sort descending, and pick the load at index `thresholdHours - 1`. A pump sized to this value will be undersized for at most `thresholdHours` hours/year (default: 24).

### Client routes
| Path | Component |
|------|-----------|
| `/` | `LandingPage` — marketing entry point |
| `/chat` | `ChatConversation` — LLM intake + Expert Mode form toggle |
| `/results` | `ResultsScreen` — 3 scenario cards |
| `/results/detail` | `ResultsDetailScreen` — heat loss breakdown + SVG house cross-section |
| `/results/climate` | `ClimateProjectionScreen` — IPCC RCP4.5 projections for 2030/2040/2050 |

### State management
`CalcContext` (`client/src/app/context/CalcContext.tsx`) holds `params`, `scenarios`, and `summary` in React state. This is session-only — refreshing `/results` directly shows a "No results yet" fallback that redirects to `/chat`.

### Deployment
Deployed on Railway. The build command is `npm run build` (builds the Vite client into `client/dist`). The start command is `node server.js`. In production, Express serves `client/dist` as static files and falls back to `client/dist/index.html` for all unknown routes (SPA fallback).
