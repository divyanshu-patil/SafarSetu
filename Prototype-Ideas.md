# Prototype Ideas — Last-Mile-Aware Journey Planner

> Companion to `Research.md`. This file covers **what to build for the pitch/prototype round**: the core concept, an MVP scope, feature implementations, demo scripts, a hardware add-on, architecture and a build plan.
> Guiding rule from the Problem Solver's Guide: **"Make it the simplest thing that works."** Build one focused, polished flow, not twenty half-features.

---

## 1. Concept in one line (Step 2 format)

> **"A last-mile-aware journey planner that builds the best door-to-door route for your visit type and time window, then watches live traffic, train and weather disruptions and re-plans so you still arrive on time."**

- **Made of:** a mobile/web app (plus a WhatsApp bot), a station-level last-mile database (crowd + survey + operator data), a routing/re-planning engine, and an operator dashboard.
- **Used by:** commuters, business visitors and tourists (front end); metro/bus operators and the municipal corporation (dashboard).
- **Replaces:** guessing at the station exit, asking auto drivers, juggling Google Maps + m-Indicator + Uber, and showing up late.
- **What it is NOT:** not a cab company, not a ticket issuer, not a Google Maps clone. It **orchestrates** existing services and fills the last-mile data gap.

**Working names (pick one or invent):** *Setu* ("bridge"), *Pahuch* ("reach"), *LastMile+*, *DwaarSe* ("from the door"), *SafarSaathi*.

---

## 2. Prototype scope: what's IN vs OUT

| IN for the pitch prototype ✅ | OUT (mention as roadmap) ❌ |
|---|---|
| One city, **one metro line, 2–3 real stations** surveyed by you | All-India coverage |
| Trip input: source, destination, **visit type**, **arrive-by / time window** | In-app payment and ticket issuing |
| 3 ranked route options (Fastest / Cheapest / Comfort-Safe) with **on-time probability** | Real ONDC buyer-app onboarding |
| **Station last-mile card** (per exit: share auto, feeder bus, e-bike, walk, fares, wait time) | Full ML forecasting across the city |
| **Live disruption simulation** + automatic re-plan with explanation | Integration with every operator |
| Crowd report ("no autos at Exit 2", "lift down") | Driver payment / incentive systems |
| Deep links to Uber/Rapido/Namma Yatri/Mumbai One/Google Maps | |
| Mini **operator dashboard** (heat-map of last-mile gaps) | |
| Optional: **1 hardware piece** (GPS tracker or station display) | |

---

## 3. Core user flow (the "hero journey")

```
[Home]
  "Where are you going?"  From: Home (auto-detect)   To: Infosys Phase 1, Hinjewadi
  Visit type: [Commuter] [Business ✔] [Tourist] [Student] [Medical/Accessible]
  Arrive by: 10:00 AM   Flexibility: ±10 min
        │
        ▼
[Plan options]
  ① Fastest        09:52 arrival · ₹180 · 94% on time
     Walk 6m → Metro (Line 3) 22m → Cab 14m
  ② Cheapest       09:55 arrival · ₹45  · 81% on time
     Walk 6m → Metro 22m → Share auto (Exit B) 18m
  ③ Comfort-Safe   09:48 arrival · ₹260 · 97% on time   ← recommended for "Business"
     Cab to station → Metro AC → pre-booked cab at Exit A
  [Leave by 08:58]  🔔 Remind me
        │
        ▼
[Live trip mode]
  Step 2 of 4 · On Metro · ETA 09:52 ✅
  ⚠ Alert: Accident on Hinjewadi Rd (TomTom) — share-auto leg +14 min
  ➜ New plan: get off one station later, take feeder bus F12 (leaves 09:31, 3 min walk)
     New ETA 09:56 ✅ still on time.   [Accept] [Keep current]
        │
        ▼
[Arrived] 09:56 · saved ₹135 vs cab · 1.2 kg CO₂ saved · "Rate the last mile at Exit B"
```

---

## 4. Feature implementations (how to actually build each one)

### F1. Visit-type-aware route scoring ⭐ (core)
- **Idea:** the same O-D pair gives different "best" routes depending on intent.
- **Implementation:**
  1. Get candidate itineraries from **OpenTripPlanner** (GTFS + OSM) and/or **Google Routes API (TRANSIT + DRIVE)**.
  2. Stitch in last-mile options from your station DB for each candidate's first/last station.
  3. Score each itinerary:
     `score = w_t·time + w_c·cost + w_w·walking + w_x·transfers + w_r·(1 − on_time_prob) + w_s·safety_penalty + w_a·accessibility_penalty`
  4. Weights come from visit-type presets:

| Visit type | Time | Cost | Walking | Transfers | Reliability | Safety | Accessibility |
|---|---|---|---|---|---|---|---|
| Commuter | 0.30 | 0.30 | 0.10 | 0.10 | 0.15 | 0.05 | 0 |
| Business | 0.25 | 0.05 | 0.15 | 0.15 | 0.35 | 0.05 | 0 |
| Tourist | 0.15 | 0.15 | 0.10 | 0.15 | 0.10 | 0.25 | 0.10 |
| Student | 0.15 | 0.50 | 0.05 | 0.05 | 0.15 | 0.10 | 0 |
| Medical/Accessible | 0.15 | 0.05 | 0.25 | 0.15 | 0.15 | 0.05 | 0.20 |

  5. Expose **sliders** ("I care more about cost") that adjust weights. Judges love seeing the ranking change live.

### F2. Time-window guarantee / on-time probability ⭐ (core differentiator)
- For each leg, keep a **travel-time distribution** (mean + std-dev, or P50/P90) by hour of day:
  - Metro: timetable headway + small variance
  - Road legs: Google/Mappls traffic ETA as mean; variance from historical samples (or assumed 15–30%)
  - Share-auto / feeder wait: from your field survey per hour (e.g. 8–9 AM: mean 7 min, P90 15 min)
- Sum the legs with a quick **Monte-Carlo (1,000 samples)** → P(arrival ≤ deadline).
- Output: "**Leave by 08:58 for 95% on-time**" or "Leave by 09:05 for 80%".
- Simple to code (NumPy / JS), and it looks impressive on screen.

### F3. Station Last-Mile Card ⭐ (the unique data layer)
- Data model (PostGIS):
  ```
  station(id, name, line, lat, lon)
  station_exit(id, station_id, name, lat, lon, has_lift, has_escalator, step_free)
  lastmile_option(id, exit_id, mode[share_auto|auto|feeder_bus|ebike|walk|cab_pickup],
                  destination_area, route_polyline, fare_min, fare_max,
                  operating_hours, provider, deeplink, source[survey|operator|crowd])
  wait_profile(option_id, day_type, hour, mean_wait_min, p90_wait_min, sample_n)
  crowd_report(id, exit_id, type, message, lat, lon, created_at, expires_at, upvotes, user_rep)
  ```
- UI: per exit, show a mini-map with walking line, chips such as `Share auto → Hinjewadi Ph1 · ₹20–25 · wait ~6 min`, a "last confirmed 12 min ago" freshness tag, and an accessibility icon row.
- **Seed it with your own survey of 2–3 stations.** That is real evidence for Step 1 and Step 4.

### F4. Live disruption monitor + auto re-plan ⭐
- **Inputs:**
  - TomTom/HERE **Traffic Incidents** in a bounding box around each active route (poll every 2–5 min per corridor, not per user)
  - Google/Mappls traffic ETA re-check for road legs at key checkpoints
  - Weather: Open-Meteo/OpenWeather rainfall + a static **waterlogging hotspot** list
  - Operator advisories (scraped RSS/press, or manual entry in the operator console) parsed by an LLM into `{line, station, type, delay_min, valid_until}`
  - Crowd reports
- **Logic:** an event is matched to an active trip if it intersects the route geometry or a station on it → recompute the on-time probability → if it drops below a threshold (e.g. 80%) or by more than 10 points, generate alternatives and push a notification **with the reason**.
- **For the demo:** build a **"Disruption Simulator" admin panel** with buttons such as *Metro delay 15 min*, *Accident on road X*, *Heavy rain*, *No autos at Exit B*. Click one during the pitch and the phone re-plans live. This is the single most powerful demo moment.

### F5. Natural-language & voice trip input
- "I have a client meeting at Hinjewadi Phase 1 at 10, starting from Kothrud, carrying a laptop bag" → an LLM extracts `{from, to, arrive_by, visit_type=business, constraints=[luggage_light]}`.
- Support Marathi/Hindi voice through a speech-to-text API. This makes a strong inclusivity point for government judges.

### F6. WhatsApp bot (low-tech channel)
- Same backend, reached through the WhatsApp Business API (or Twilio sandbox for the demo).
- User sends: *"Swargate to Shivajinagar by 6pm"* → replies with 3 options as text plus "Reply 1/2/3 for live updates".
- Disruption alerts are pushed to the chat. Reaches users who won't install another app, and it's also your **Stage 1 trial vehicle**.

### F7. Fair fare checker
- Input the auto ride distance → RTO tariff calculation (base fare + per km, night surcharge) → "A fair fare is ₹62–68. The driver asked ₹150 ⚠".
- Tourist mode shows a phrase card in Marathi/Hindi: *"Meter ne chala, please"*.

### F8. Safety & accessibility modes
- **Night/women safety:** prefer well-lit, busier walking segments (OSM `lit=yes` tags + crowd ratings), avoid isolated feeder stops, add a "share live trip" link and an SOS button (dials 112).
- **Accessibility:** route only through exits with lifts or step-free access; flag "lift reported broken 20 min ago".
- **Luggage:** avoid stairs-only exits and peak-hour local trains; suggest a cab for the final leg.

### F9. Tourist time-window planner (visit-type extension)
- "I have 4 hours near CSMT, starting 2 PM": suggest 3–4 nearby attractions in order, using open hours, walking/transit times and a buffer to reach the return station on time.
- Use Places API (or a curated JSON for the demo city) with a simple greedy/TSP ordering.

### F10. Crowd reports + gamification
- One-tap reports: `No autos`, `Long queue`, `Lift down`, `Waterlogging`, `Feeder bus just left`, `Unsafe/dark`.
- Auto-expire after 30–60 min; confirmations extend them; GPS must be within ~200 m.
- Points and a "Station Champion" badge; a leaderboard per station. Ties into the guide's "who runs it at each site".

### F11. Operator / Government dashboard ⭐ (B2G angle)
- **Last-mile gap heat-map:** anonymised trip searches whose last mile is > 1 km with no good option, plus high-wait reports.
- **Station scorecard:** average last-mile time, wait P90, % on-time, accessibility issues open.
- **Suggested interventions:** "Add feeder route Station X → IT Park (210 searches/day, current wait P90 = 22 min)".
- **Broadcast console:** push an advisory to everyone whose active trip uses Line 3 between stations A and B.
- This dashboard is what makes Maha-Metro / MMRDA / the municipal corporation *want* to pilot it.

### F12. Driver/stand-side micro-app (stretch)
- Ultra-simple Marathi UI for share-auto drivers or stand leaders: "At Exit B · going to Hinjewadi Ph1 · seats free: 3 · leaving in 2 min".
- Gives live last-mile supply data nobody else has. Even a mock-up strengthens the pitch.

### F13. Booking hand-offs
- Deep links: Uber (`uber://?action=setPickup...`), Rapido/Ola/Namma Yatri app links, Google Maps directions URL, Mumbai One / operator apps for tickets.
- Roadmap: ONDC/Beckn buyer-app integration for metro QR tickets and autos.

### F14. Impact tracker
- Per trip: minutes saved vs typical, ₹ saved vs cab-only, CO₂ saved. Monthly summary card.
- The aggregate feeds your **Step 4 impact numbers** directly.

---

## 5. Demonstrative features for the pitch (ranked by wow-per-effort)

| Rank | Demo moment | Why it lands | Effort |
|---|---|---|---|
| 1 | **Live disruption → auto re-plan** (simulator button pressed on stage) | Shows the "smooth ride all the way" promise visibly | Medium |
| 2 | **Same trip, 3 visit types → 3 different best routes** | Shows personalisation in 10 seconds | Low |
| 3 | **On-time probability + "leave by" time** | Concrete, quantitative, novel | Low–Med |
| 4 | **Station Last-Mile Card with your real survey photos & data** | Proves field work (the guide's #1 credibility rule) | Low (data collection is the work) |
| 5 | **Operator heat-map dashboard** | Speaks directly to government judges | Medium |
| 6 | **WhatsApp bot on a judge's phone** | Interactive, inclusive | Low–Med |
| 7 | **Hardware: live GPS dot of a "share auto" + station e-ink board updating** | Physical, memorable | Medium |
| 8 | **Marathi voice input** | Inclusivity | Low (API) |

### Suggested 5-minute pitch demo script
1. **(0:00–0:45) Problem with evidence.** Photo of a feeder queue at your station. "We timed 40 trips: the last 2 km took 38% of total time, and 1 in 4 people were late." (Use your real numbers; if the trial hasn't run yet, say so.)
2. **(0:45–1:30) Plan a trip.** Business visitor, arrive by 10:00 → 3 options with on-time %, Comfort-Safe recommended.
3. **(1:30–2:00) Switch visit type** to Student → Cheapest route jumps to the top.
4. **(2:00–3:00) Live trip.** Teammate presses "Accident on Hinjewadi Rd" in the simulator → phone buzzes → re-plan with reason → still on time.
5. **(3:00–3:45) Operator dashboard.** Heat-map + "suggested feeder route" card → "This is what we'd give Maha-Metro."
6. **(3:45–4:30) Scaling & finance.** 1 station → 10 → line → city; cost per station ≈ ₹X; benefit = minutes and rupees saved plus extra ridership.
7. **(4:30–5:00) What failed & what we changed.** e.g. "Our first version only used Google transit, which had no share-auto data, so we built the station survey layer." The guide calls this your strongest credibility line.

---

## 6. Hardware add-on prototype ideas (pick one)

### H1. Share-auto / feeder GPS tracker (recommended)
- **Parts:** ESP32 (~₹400) + NEO-6M GPS (~₹350) + SIM800L/A7670 4G module (~₹600–1,500) + power bank/buck converter → **≈ ₹2,000–3,000**
- **Flow:** ESP32 reads GPS every 10 s → MQTT/HTTP to backend → appears as a live vehicle on the Station Last-Mile Card with "arriving in 3 min".
- **Demo:** a teammate walks around the venue carrying it, and the dot moves on the projector.

### H2. Smart Last-Mile Board at station exit
- **Parts:** ESP32 + 4.2"/7.5" e-ink display or P10 LED matrix (≈ ₹1,500–4,000)
- Shows: `Feeder F12 → IT Park: 4 min | Share auto queue: ~6 people | Walk to Phase 1: 18 min | ⚠ Waterlogging on Rd X`
- Pulls a JSON from your API every 30 s. Goes from offline signage to live info.

### H3. Queue / wait-time counter at auto stand
- **Parts:** Raspberry Pi + camera (or ESP32-CAM) running a lightweight person-detector (YOLO-nano / MobileNet-SSD), or IR break-beam counters
- Estimates people in queue → converts to predicted wait → feeds F2's on-time probability.

### H4. Waterlogging sensor (monsoon mode)
- **Parts:** ESP32 + JSN-SR04T waterproof ultrasonic sensor (≈ ₹800)
- Water level above threshold → marks the underpass blocked → routes avoid it. Very Mumbai/Pune-relevant.

### H5. BLE beacon exit guidance
- Cheap BLE beacons at exits → the app detects "you're at Exit B" → opens the right last-mile card automatically.

---

## 7. Prototype architecture

```
 ┌───────────────┐   ┌──────────────┐   ┌───────────────────┐
 │ Mobile/PWA app│   │ WhatsApp bot │   │ Operator dashboard│
 └──────┬────────┘   └──────┬───────┘   └─────────┬─────────┘
        └──────────── REST / WebSocket ───────────┘
                           │
                 ┌─────────▼──────────┐
                 │   API (FastAPI /   │
                 │   NestJS)          │
                 ├────────────────────┤
                 │ Trip planner       │──► OpenTripPlanner (GTFS + OSM)
                 │ Scoring + Monte    │──► Google Routes / Mappls / Ola Maps (traffic ETA)
                 │   Carlo on-time    │
                 │ Disruption engine  │◄── TomTom/HERE incidents, weather API,
                 │                    │    LLM-parsed advisories, crowd reports,
                 │                    │    Simulator panel (demo)
                 │ Notification svc   │──► FCM push / WhatsApp / SMS
                 └───┬───────────┬────┘
                     │           │
           ┌─────────▼───┐  ┌────▼─────┐      ┌───────────────┐
           │ PostgreSQL  │  │  Redis   │◄─────│ MQTT broker   │◄── ESP32 GPS / boards / sensors
           │ + PostGIS   │  │ (cache,  │      └───────────────┘
           │ stations,   │  │ live     │
           │ last-mile,  │  │ state)   │
           │ reports     │  └──────────┘
           └─────────────┘
```

**Quick-build alternative (hackathon-speed):** Next.js PWA + Supabase (Postgres/PostGIS + auth + realtime) + Google Routes API + a hand-curated JSON for 3 stations + a Python Monte-Carlo function + a simulator page. You can get this running in a weekend.

---

## 8. Data you need to prepare for the demo

| Dataset | How to get it | Time |
|---|---|---|
| 2–3 stations: exits, lifts, auto stands, feeder stops (lat/lon) | Walk the station, drop pins with Google Maps/OSM, take photos | 1 day |
| Last-mile options & fares per exit | Ask drivers, check fare boards | Same day |
| Wait times by hour (peak/off-peak) | Stand with a stopwatch for 30–60 min at 2–3 time slots | 2–3 sessions |
| Metro timetable & line geometry | Operator website / GTFS / OSM | 2 hrs |
| Bus GTFS | Community GTFS (Pune/Mumbai) or manually encode 2–3 feeder routes | 2–4 hrs |
| Waterlogging hotspots | Municipal corporation monsoon lists / news | 1 hr |
| Baseline commuter data | 20–30 interviews + 10–40 timed trips | 2–3 days |

> Label every synthetic or simulated value **"simulated"** in the UI or footnote. The guide warns that invented numbers are always caught.

---

## 9. Build plan (≈ 3–4 weeks, 4-person team)

| Week | Product/Backend | Frontend | Field/Research | Hardware (optional) |
|---|---|---|---|---|
| 1 | DB schema, OTP or Google Routes integration, station JSON | Wireframes, trip input screen | Station survey, interviews, baseline timing | Order parts |
| 2 | Scoring + visit-type weights, Monte-Carlo on-time, last-mile stitching | Results screen, last-mile card | More timing sessions, refine data | ESP32 GPS → MQTT working |
| 3 | Disruption engine + simulator, push notifications, WhatsApp bot | Live trip mode, re-plan UI | 1-week WhatsApp concierge trial with 5–10 users | Display board / map dot |
| 4 | Operator dashboard, impact metrics | Polish, Marathi/Hindi strings | Compile before/after numbers, 2-page govt note | Integrate into demo |
| Final days | Rehearse demo, backup video recording, offline fallback | | One-page template from the guide | |

**Team split suggestion:** (1) backend/routing, (2) frontend/UX, (3) data & field research + govt note, (4) hardware + dashboard + demo ops.

---

## 10. Pitch checklist mapped to the guide's one-page template

| Template section | What to put |
|---|---|
| Project name | e.g. *Setu: Door-to-Door, On Time* |
| Problem (one sentence) | "[Commuters at Station X] lose [~N min & ₹M per trip] because [no live, reliable last-mile option is visible], [every working day]." |
| Evidence | 2–3 facts from your interviews + one cited stat (WRI: 75%+ of last-mile trips are walk/shared; Pune feeder queues of 30–40 min) |
| Solution | The one-liner from §1 |
| How we devised it | Observation → 5 Whys (Research §2.2) → options A–D (Research §9) → WhatsApp concierge + app prototype → test results |
| What failed & what we changed | Your honest failure (e.g. Google-only routing missed share autos; first UI overloaded users; crowd reports went stale) |
| Impact | Before → after from the trial; per person (hrs/month, ₹/month); total commuters on the line |
| Govt department | Urban Development Dept → Maha-Metro / MMRDA (+ PMPML/BEST, ward office); officer designation |
| Scaling plan | 1 → 5–10 stations → line/city → state; station champions run it |
| Finance | One-time / monthly / benefit / who pays (Research §11) |
| Team | Names + roles |

---

## 11. Likely judge questions (prepare answers)

1. **"Why not just use Google Maps or Mumbai One?"** They cover the main transit leg and ticketing. We cover the last-mile options at each station, visit-type intent, the on-time guarantee and the operator gap dashboard, and we can feed our data *into* them.
2. **"Where does your real-time data come from?"** Traffic: TomTom/Google (live). Metro: timetable + operator alerts. Last mile: our survey + crowd + (future) GPS devices / operator feeds. Simulated parts are labelled.
3. **"How will you get users?"** Station QR standees, WhatsApp bot, college groups, partnership with the operator app.
4. **"What does it cost to run per station?"** Show the Step 7 table.
5. **"What happens when crowd data is wrong?"** Expiry, confirmations, reputation, fallback to historical averages.
6. **"Privacy?"** DPDP consent, anonymised aggregates for the dashboard, no sale of personal data.
7. **"What did you test and what failed?"** Have the honest answer ready.
8. **"Who runs it at each station?"** Station champions (students/RWA/auto-union rep) + operator staff later.

---

## 12. Stretch / future roadmap (for the "vision" slide)

- ONDC buyer-app: one-tap metro QR + auto booking inside the plan
- NCMC / single-payment integrated journey fare
- City-wide wait-time prediction model trained on crowd + sensor data
- Calendar integration (auto-plan for every meeting)
- Group & event mode (Ganeshotsav, cricket matches, concerts)
- Corporate commute product for IT parks (Hinjewadi, BKC, Powai)
- Open "last-mile data API" for other apps and the state's mobility data platform
- Expansion: Mumbai → Pune → Nagpur → Thane/Navi Mumbai → other Indian metros
