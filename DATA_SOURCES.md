# Data sources

Every dataset and external service SafarSetu uses, what is **real**, what is **derived**, and what is **synthetic**. The app labels data quality (`synthetic` / `scheduled` / `live`) in API responses and the UI footer. Machine-readable log of the scrape: [`packages/core/scripts/scrape/SOURCES.json`](packages/core/scripts/scrape/SOURCES.json). Refresh with `pnpm --filter @repo/core scrape:mh`.

Status key: ✅ used · ⚠️ used with limits · ❌ attempted, not usable · 🔜 planned

## 1. Transport timetables

| Source | What we take | Status | Licence / terms | Notes and limits |
|---|---|---|---|---|
| **Indian Railways timetable via Datameet** — `github.com/datameet/railways` (`stations.json`, `trains.json`, `schedules.json`) | **549 stations / 959 train routes** inside Maharashtra with real scheduled times; one route per train, contiguous Maharashtra segment; stops with dwell > 0 treated as halts | ✅ real (scraped 2026-10-29) | ODbL-1.0 (Datameet); underlying data from Indian Railways | **No run-days** in the dataset → every train assumed daily. Pass-through vs 1-minute halts can't be distinguished, so some real halts are lost (e.g. Deccan Queen shows as CSTM–KJT–LNL–SVJR–PUNE). ~4,500 stations have no state tag → admitted with a coarse Maharashtra polygon (±20 km border error possible). Stations without coordinates are skipped. Snapshot is undated/old; no live status |
| **Mumbai urban pack** (`packages/core/src/data/mumbai.ts`) | Western & Central locals, Metro 1 & 3, 7 BEST routes, 13 places | ⚠️ **synthetic** | own work | Station order follows the real lines; coordinates approximate; **all timings invented** |
| **Pune urban pack** (`data/pune.ts`) | Purple & Aqua metro, Pune–Lonavala local, 4 bus routes, 13 places | ⚠️ **synthetic** | own work | Same caveat. The real railway timetable above is merged in alongside |
| **Metro (Nagpur, Pune, Navi Mumbai, Thane)** | — | ❌ not imported | — | OSM relations not retrievable in time; only Mumbai Lines 2B/9 were fetched and skipped (covered synthetically) |
| **City buses** — community GTFS `github.com/croyla/pmpml-gtfs` (PMPML), BEST | — | 🔜 not imported | repo README reachable | Largest gap for first/last mile: without buses most intra-city legs become walk/cab. Import = reduced weekday GTFS → `routes` |
| **MSRTC (state buses)** | — | ❌ no open feed | — | MSRTC publishes no open timetable/GTFS; needs an agreement |
| **Pune Metro / Maha-Metro timetables** | — | 🔜 manual transcription from official sites | official pages | No API |
| **Live running status** — NTES / GTFS-Realtime | — | 🔜 | licensed / agency access | Demo uses the **disruption simulator** instead |

## 2. Places (points of interest)

| Source | What we take | Status | Licence | Notes |
|---|---|---|---|---|
| **OpenStreetMap via Overpass API** (`overpass-api.de`, mirrors `overpass.kumi.systems`, `maps.mail.ru`) | **71 named tourism / historic / worship places** — Ajanta & Ellora 12, Nagpur 12, Chhatrapati Sambhajinagar 9, Nashik 9, Thane 8, Navi Mumbai 6, Alibag 5, Kolhapur 4, Amravati 2, Solapur, Lonavala, Mahabaleshwar, Shirdi 1 each | ⚠️ real coordinates/names | ODbL © OpenStreetMap contributors | Overpass was flaky (502/timeouts) so coverage is thin and uneven; ranking by tag richness, some minor items (gates, statues). **Opening hours and dwell times are category defaults (assumed)** |
| Mumbai / Pune places | 26 curated attractions | ⚠️ synthetic hours | public knowledge | Hours and dwell invented |

## 3. Live services (called at runtime, all keyless)

| Service | Use | Where | Terms / limits |
|---|---|---|---|
| **Photon** `photon.komoot.io` | Place/address autocomplete (stops, report areas) | `GET /v1/geocode` | OSM data; best-effort public demo server; proxied + cached 1 h; falls back to our local gazetteer |
| **Nominatim** `nominatim.openstreetmap.org` | Reverse geocode (name for a clicked point) | `GET /v1/reverse` | **1 request/second, User-Agent required** — serialised and cached 24 h |
| **OSRM foot** `routing.openstreetmap.de/routed-foot` | Real walking paths for walk legs of the selected plan | `GET /v1/walk` | Fair use; cached 24 h; falls back to straight lines (not reachable from the build sandbox, so unverified there) |
| **Open-Meteo** `api.open-meteo.com` | Hourly rain probability → "rain around 15:00" notice | `GET /v1/weather` | Free, non-commercial; cached 15 min |
| **OpenStreetMap tiles** `tile.openstreetmap.org` | Basemap (CSS-greyscaled) | browser | OSM tile usage policy — light/demo use only; use MapTiler/Stadia or self-host for production. (CARTO's free basemap started requiring an API key during testing) |
| Google Fonts — Inter | Typeface (Black 900 stands in for Wise Sans) | web + mobile | SIL OFL |
| *Optional, not used:* TomTom Traffic, Google Routes | Live road traffic for cab legs | — | need API keys; see `NEEDED_FROM_YOU.md` |

## 4. Modelled / assumed values (not data)

| Item | Value | Basis |
|---|---|---|
| Delay profiles for on-time confidence | metro 10 % late (mean 3 min), bus 45 % (4), train 45 % (12) | **assumed**; to be replaced by learned per-route/hour distributions from stored delays |
| Fares | metro ₹10 + ₹3/stop (cap 35), bus ₹5 + ₹2/stop (cap 25), train ₹10 + ₹2/stop (cap 35), cab ₹40 + ₹14/km | approximations of public slabs |
| Walking speed | 60 / 80 / 95 m/min (relaxed / normal / fast), ×1.25 detour factor | typical pedestrian speeds |
| Cab | 22 km/h urban average + 5 min pickup | assumed; fallback only |
| Transfer walk | stops within 400 m auto-linked | design rule |

## 5. Citizen-report and portal data

| Item | Status | Notes |
|---|---|---|
| 56 seeded connectivity-gap reports (Pune, Mumbai, Nashik, Nagpur, Chhatrapati Sambhajinagar, Kolhapur) | **synthetic** (`synthetic=true`, labelled in the portal) | Plausible area pairs; invented counts/dates (`apps/api/src/seed-reports.ts`) |
| Authority accounts | **demo only** | `apps/api/src/demo-users.ts`; production uses agency SSO / Supabase Auth |
| Regions (jurisdictions) | approximate city centres + radius (`packages/core/src/regions.ts`) | to be replaced by official ward/district boundaries |

## 6. Research inputs (not runtime)

`Research.md`, `Prototype-Ideas.md`, `safarsetu_product_workflow_spec.md`, `tools.md` in the repo root; Seva First Innovation Challenge 2026 page (`sevafirst.mic.gov.in`) for judging criteria.

## 7. How to improve the data

1. Import PMPML/BEST GTFS (buses) → biggest realism gain for first/last mile.
2. Ask Indian Railways/CRIS for run-days + live status; until then keep the "assumed daily" label.
3. Transcribe Pune/Nagpur/Mumbai metro timetables; request GTFS from Maha-Metro.
4. Re-run `scrape:mh` when Overpass is healthy to deepen POIs; add opening hours from official pages.
5. Log realised delays → learn delay distributions → replace section 4 assumptions.
