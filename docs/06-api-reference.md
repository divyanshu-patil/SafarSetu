# 06 — API reference (`apps/api`, port 4000)

Express 5, JSON, zod-validated. All times in responses are **minutes since midnight** (`*Min`) plus ISO helpers where noted. Demo identity: header `x-user-id` (defaults `demo`); production → Supabase Auth JWT.

Envelope: success → payload; error → `{ error: { code, message } }` with 4xx/5xx.

## System
| Method | Path | Notes |
|---|---|---|
| GET | `/health` | `{ ok, store: 'supabase'\|'memory', now }` |
| GET | `/v1/cities` | cities with bbox, presets, data-quality meta (`pune`, `mumbai`) |
| GET | `/v1/network?city=` | places, presets, bbox, `meta.dataQuality`, `counts`; add `&full=1` for stops + timetabled routes. Cities: `maharashtra`, `mumbai`, `pune` |
| GET | `/v1/places` | curated POIs; `?q=` filters |

## Planning
| Method | Path | Body / query | Returns |
|---|---|---|---|
| POST | `/v1/route` | `{from:{lat,lon}, to:{lat,lon}, date, departMin? , arriveByMin?, prefs?}` | `{ itineraries[], leaveByMin? }` each with `confidence` |
| POST | `/v1/plans` | `PlanRequest` (below) | `Plan` (persisted, reminders scheduled) |
| GET | `/v1/plans/:id` | | `Plan` |
| GET | `/v1/plans?userId=` | | recent plans |
| POST | `/v1/plans/:id/replan` | `{ reason? }` | new revision |
| GET | `/v1/plans/:id/status` | | `{ state, nowMin, current, next, slackMin, updates[] }` |

`PlanRequest`: `{ city?:'maharashtra'\|'pune'\|'mumbai', date:'YYYY-MM-DD', origin:{name,lat,lon}, startMin, endMin, returnToOrigin?, keepOrder?, places:[{placeId?|name,lat,lon, task?, required?, arriveBy?, priority:1|2|3, minDwell?, maxDwell?, opens?, closes?}], prefs?:{pace, maxWalkM, avoid:[mode], style:'calm'|'brief'}, traveller?:{name} }`

`Plan`: `{ id, revision, request, timeline:[Leg|Visit], visits[], dropped[{place,reason}], reminders[], totals:{walkM,fare,transfers,confidencePct}, changes[], meta }`

## Live
| Method | Path | Notes |
|---|---|---|
| GET | `/v1/stream/:planId` | **SSE**: events `notification`, `plan`, `clock` |
| GET | `/v1/notifications?planId=` | history |
| POST | `/v1/devices` | `{ platform:'web'\|'expo', token }` register push target |
| GET | `/v1/disruptions` | active |
| POST | `/v1/disruptions` | `Disruption` (ingestion endpoint; requires `x-ingest-key` in prod) |
| DELETE | `/v1/disruptions/:id` | |

## Simulator (demo; disabled when `SIM_ENABLED=false`)
| Method | Path | Notes |
|---|---|---|
| GET/POST | `/v1/sim/clock` | `{ date, minute, speed, running }` |
| POST | `/v1/sim/scenario` | `{ name, planId?, city? }`, name ∈ `train-late-30`, `metro-late-5` (too small to alert), `metro-cancelled`, `stop-closed`, `heavy-rain`, `clear`; aimed at what the plan rides next |

## Proxies (cached)
| Method | Path | Upstream |
|---|---|---|
| GET | `/v1/geocode?q=&city=` | Photon → Nominatim → local gazetteer |
| GET | `/v1/reverse?lat&lon` | Nominatim |
| GET | `/v1/walk?from=lat,lon&to=lat,lon` | OSRM foot → straight-line fallback |
| GET | `/v1/weather?lat&lon` | Open-Meteo |

## Reports & authority
See [12](12-reports-and-authority.md): `/v1/reports`, `/v1/auth/*`, `/v1/authority/*`.

## Insights (rider-side aggregate)
| GET | `/v1/insights` | aggregate: delays by route, replans, minutes saved, notifications |
