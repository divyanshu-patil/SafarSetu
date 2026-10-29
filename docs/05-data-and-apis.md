# 05 — Data & free APIs

Principle: **free and keyless first; synthetic only where no feed exists; label everything.** Every response carries `dataQuality: 'synthetic' | 'scheduled' | 'live'` and the UI shows it.

## Services we use (and why)

| Need | Choice | Why | Limits / production path |
|---|---|---|---|
| Map | **Leaflet + CARTO Positron tiles (OSM data)** | No key, tiny, monochrome basemap that fits the design system; RN equivalent exists | Free tiles are for light/demo use → MapTiler/Stadia or self-hosted tiles in production; Mappls for India-grade POI |
| Autocomplete | **Photon** (komoot) | Typeahead-friendly, OSM-based, keyless | Demo server best-effort; self-host or Pelias later |
| Geocode / reverse | **Nominatim** | Canonical OSM geocoder | **1 req/s, User-Agent required, no autocomplete** → we proxy + cache + rate-limit server-side |
| Walking geometry | **FOSSGIS OSRM foot** (`routing.openstreetmap.de/routed-foot`) | Real pedestrian paths, keyless (the main OSRM demo server is car-only) | Fair-use; self-host OSRM/Valhalla or OpenRouteService (free key) in prod |
| Weather | **Open-Meteo** | Keyless, hourly rain probability, non-commercial free | Commercial plan or IMD feed when monetised |
| Live road traffic | *(optional)* TomTom Traffic / Google Routes | Only matters for cab fallback legs; both need keys | Free tiers (TomTom ≈ 2 500 req/day) — **not required for demo** |
| Transit schedules | **Synthetic Pune pack** (this repo) | Pune Metro/Railways publish no API | See below |
| Fares | Slab formulas per mode | Official slabs approximated | Replace with GTFS `fare_rules` |

### Using maps efficiently

- **Draw from our own data:** stops, routes and transit legs are drawn from the network coordinates — zero external calls.
- **Call routing only for walking legs of the *selected* plan** (not every alternative), batched, cached 24 h by rounded coordinates (5-decimal ≈ 1 m), straight-line fallback ×1.3 if the service is down.
- **Debounce** autocomplete 350 ms, min 3 chars, bias to the city bbox, local gazetteer first.
- **One tile layer, `detectRetina` off at low zoom,** fit-bounds once per plan, no per-second map redraws (live marker moves via `setLatLng`).
- Server cache is an in-process LRU (`Map` with TTL) → Redis when multi-instance.

## Synthetic packs (`packages/core/src/data/pune.ts`, `mumbai.ts`)

Modelled on the real network so the demo looks right, **not** claimed accurate:

| Mode | Content | Source of shape |
|---|---|---|
| Metro | Purple (PCMC–Swargate, 14 stops), Aqua (Vanaz–Ramwadi, 16 stops), shared Civil Court interchange; 10/15-min headways, 06:00–22:00 | Public station lists; coordinates approximated |
| Local train | Pune Jn ↔ Lonavala (Pune Suburban), ~hourly explicit timetable, *higher delay profile* | Public line/stations; times invented |
| Bus | 4 feeder routes (Swargate–Parvati, Station–Koregaon Park–Aga Khan Palace, Deccan–University–Baner, Shivajinagar–University–Aundh), 20-min headway | Invented; mirrors PMPML coverage |
| Places | ~16 attractions with opening hours and dwell ranges (Shaniwar Wada, Dagdusheth Ganpati, Kelkar Museum, Aga Khan Palace, Parvati, Osho Garden, University, …) | Public knowledge |
| Delay profiles | per-mode distributions | Assumed; to be learned |

**Mumbai pack:** Western (Churchgate–Borivali, fast) and Central (CSMT–Thane) locals, Metro Line 1 (Versova–Ghatkopar) and Line 3 (Cuffe Parade–Aarey) with the Marol Naka interchange, 7 BEST feeder routes, 13 places (Gateway of India, CSMT, Marine Drive, museum, Haji Ali, Siddhivinayak, Juhu, SGNP …). Each city also ships 2 one-click *presets* for the demo.

Accuracy caveat is printed in the dashboard footer and in every API response `meta`.

## Real-data upgrade path

1. **Buses:** import community PMPML GTFS (`croyla/pmpml-gtfs`) → `scripts/import-gtfs.ts` (planned) writes `stops/routes` tables; expand `frequencies.txt` or `stop_times.txt` into `departures[]`.
2. **Metro:** MahaMetro timetable transcribed from the official site (no API); request GTFS from operator.
3. **Rail:** timetable from Indian Railways open timetable dumps; live status via a licensed NTES-backed provider.
4. **Quality loop:** log realised vs scheduled → learn per-route/hour delay distributions → replace assumed profiles.
5. **New city = new data pack:** GTFS + places JSON + city config (bbox, timezone, fare slabs). No code change.
