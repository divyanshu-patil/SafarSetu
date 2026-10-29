# Research — First- and Last-Mile Connectivity to Metro, Rail and Public Transport

> **Theme:** Infrastructure and Mobility
> **Working idea:** A single platform where a person enters **source, destination, visit type** (tourist, business, student, medical, etc.) and a **time window**. The app suggests the best multimodal route (public and private) and keeps checking real-time disruptions (traffic, blockages, train delays, rain) so the trip still works end to end.
> **Prepared:** October 2026. Prices, APIs and app features change often, so re-check anything marked *verify* before you quote it to judges.

---

## 0. TL;DR — the five things that matter most

1. **Reframe around the actual problem statement.** The topic is *first- and last-mile* connectivity, not trip planning in general. Google Maps and the new **Mumbai One** app already plan metro and train routes. They do the **middle mile** well. What they handle badly is the **door → station** and **station → door** legs: share autos, feeder buses, walking safety, parking, e-rickshaws and their waiting times. Make that the core and treat "visit type + time window" as the personalisation layer on top.
2. **The guide says start from a problem you have seen, not a solution.** Before the pitch, do 20–30 commuter interviews at one or two stations and time the last-mile legs yourself. That data is your strongest asset, and most teams won't have it.
3. **Data is the hardest part, not the code.** Metro and road data are reachable through Google, Mappls, Ola Maps and TomTom. Live **suburban train positions**, **share-auto availability** and **feeder bus ETAs** mostly *are not* available through public APIs. Plan to combine APIs, open GTFS data, crowdsourcing and (for the demo) simulation, and say openly which is which.
4. **Do not build ticketing or ride-hailing yourself.** Use **ONDC / Beckn** (open network for metro tickets and autos, e.g. Namma Yatri) and deep links into Uber, Rapido and Ola. Your value is the **orchestration and the "will I make it on time?" guarantee**.
5. **The department to approach** is the **Urban Development Department**, with the **metro authorities (MMRDA / Maha-Metro / MMRCL)**, the **municipal transport undertakings (BEST / PMPML)** and the **Transport Department** as pilot partners. **MSInS** is the innovation/funding route.

---

## 1. Applying the Problem Solver's Guide to this topic

The workbook has 7 steps. Here is how each one maps onto this project and what you still need to produce.

| Step | What the guide asks | What it means for this project | Status / to-do |
|---|---|---|---|
| 1. Problem | "[Who] loses [what] because [what goes wrong], [how often]" + 2–3 facts | e.g. *"Daily metro commuters at <Station X> lose 15–35 minutes per trip because there is no predictable, affordable way to cover the 1–3 km between the station and home or office, every working day."* | **Need field data.** Time the last-mile legs at 1–2 stations and interview 20–30 commuters. |
| 2. Solution | One line + what it's made of, who uses it, what it replaces. **Say what it is NOT.** | "A last-mile-aware journey planner that picks the best door-to-door combination for your time window and re-plans live when something breaks." **NOT:** a ride-hailing company, a ticketing system or a replacement for Google Maps. | Draft below in Prototype-Ideas.md |
| 3. Methodology | Observation → 5 Whys → ≥3 options (reject 2) → prototype → test & change, **plus one honest failure** | See §2 (5 Whys) and §9 (options considered) | Run a paper or WhatsApp prototype with 5–10 commuters for one week and log what failed. |
| 4. Impact | Baseline → result → per-person meaning → who else | Baseline: minutes lost and ₹ spent on the last mile. Per person: e.g. 20 min/day × 22 days ≈ 7+ hrs/month. Who else: daily ridership of the metro line. | Collect the baseline. If no trial has run yet, **say "not yet tested" and give a trial date**. |
| 5. Government dept | Department + local office + officer designation | See §8 | Identify the specific station-area officer or ward office. |
| 6. Scale | 1 station → 5–10 stations → one line/city → state | See §10 | Write a one-page "how to onboard a new station" sheet. |
| 7. Finance | One-time cost, monthly cost, monthly benefit, who pays | See §11 | Get API quotes and estimate the hosting cost. |

> ⚠️ **Guide warning that applies directly to you:** *"Do not start from a solution you find exciting and hunt for a problem to attach to it."* Right now the pitch begins with the app. Flip the order in the presentation: **problem and evidence first, then the app as the simplest thing that fixes the root cause.**

---

## 2. The problem space

### 2.1 Why first/last mile matters (evidence you can cite)
- **WRI India + Toyota Mobility Foundation (2023), "Improving Metro Access in India: Evidence from Three Cities"**, surveyed 7,200 commuters in Nagpur, Delhi and Bengaluru. Its findings:
  - Poor access to stations limits metro use. Weak last-mile connectivity keeps metros from reaching their potential despite the huge investment in them.
  - **Walking and shared modes make up 75%+ of last-mile trips**, and shared autos are especially popular.
  - **Commuters, especially women, dislike waiting** for last-mile modes, so high-frequency feeders matter.
  - Fare structures tend to disadvantage women, who make shorter trips and pay more per km.
- **Ridership shortfalls:** several Indian metros (Chennai, Hyderabad, Kochi, Lucknow) have historically run well below their projected ridership, and WRI attributes this partly to missing first/last-mile solutions. (These figures date from around 2019, so cite them as historical.)
- **The same intervention behaves differently at different stations.** A Delhi NMT study found bicycle hire worked at one station and failed at another. → **Station-level local analysis matters**, which supports a station-by-station scaling plan.
- **Pune, 2026 (local and very relevant to Maharashtra):** reports describe thin feeder coverage. One report counts PMPML feeders at **11 stations / 23 routes / 85 buses**; another says **15 feeder buses on 7 routes**. Commuters report **30–40 minute queues** for feeders and then give up on them. Maha-Metro sought bids in **April 2026** for its own feeder bus pilot (target frequency 5–10 min), and **auto-rickshaw feeders launched at Pimpri-Chinchwad stations in Aug 2026**. → The government is actively spending on this problem, which makes it a good fit for Step 5.

### 2.2 5-Whys (example root cause, adapt after your interviews)
1. Commuters avoid the metro or arrive late → *why?*
2. The trip from the station to the destination is slow and unpredictable → *why?*
3. They don't know which last-mile option is available right now, how long it will take or what it costs → *why?*
4. Feeder buses, share autos, e-rickshaws, bike rentals and walking routes all sit in separate apps, signboards or word of mouth, and none of them publishes live availability → *why?*
5. **Root cause: no single, live, station-level view of last-mile options joined to the main transit leg and the traveller's deadline.**

That last line is the cause your solution should act on.

### 2.3 Pain points by visit type (the personalisation angle)
| Visit type | What they care about | Last-mile pain |
|---|---|---|
| **Daily commuter** | Reliability, cost, monthly spend | Feeder queues, share-auto availability at peak, parking at stations |
| **Business visitor** | Arriving on time, comfort, a presentable arrival | Doesn't know the city; gets overcharged by autos; unsure whether metro + walk beats a cab |
| **Tourist** | Sightseeing, safety, language, luggage | Language barrier, fare cheating, unknown walking safety, luggage on stairs |
| **Student** | Lowest cost | Concession passes, walking long distances |
| **Medical / elderly / PwD** | Accessibility, minimal transfers | Lifts or escalators broken, no ramps, crowding |
| **Women travelling alone / at night** | Safety | Poorly lit walks, empty feeder stops, unverified autos |
| **Airport / railway-station traveller with luggage** | Buffer time, luggage | Stairs, crowding, unclear drop-off points |

---

## 3. Competitor & existing-solution landscape

| Product | What it does well | Gap you can exploit |
|---|---|---|
| **Google Maps** | Best traffic data, transit directions in major Indian cities, metro ticket purchase via ONDC in some cities | No station-level last-mile options (share autos, feeder queues); generic, no visit-type intent; no "time window guarantee" or proactive re-planning across modes |
| **Mumbai One** (MMRDA, launched Oct 2025) | **Single QR ticket across 11 operators**: suburban rail, Metro Lines 1/2A/3/7, Navi Mumbai Metro, Monorail, BEST and other bus operators. Journey planner, real-time updates, SOS; Hindi/Marathi/English | Mumbai only; at launch it didn't support suburban **season** or return tickets; focused on ticketing, not door-to-door last-mile orchestration. **Treat it as a possible integration partner, not a rival.** |
| **m-Indicator** | Hugely popular in Mumbai; timetables, crowdsourced train tracking | Crowdsourced location; dated UX; not personalised; little last-mile coverage |
| **Yatri** (Mumbai) | GPS-based live tracking of Mumbai locals, integrated with railway control rooms; data flowing into Google Maps | No public API (needs partnership); train-focused |
| **Where Is My Train** (Google) | Offline train tracking, long-distance focus | Not multimodal |
| **Chalo** | Live bus tracking and digital bus passes for partner city operators | Bus-only, depends on operator partnership |
| **Uber / Ola / Rapido** | On-demand cab/auto/bike taxi; Uber sells Delhi and Mumbai metro tickets via ONDC | Push private rides; no unbiased public-vs-private comparison; surge pricing |
| **Namma Yatri / Yatri Sathi** | Open-source, zero-commission autos on Beckn/ONDC | City coverage is limited |
| **Yulu / Bounce / station bike rentals** | Micro-mobility at stations | Fragmented, separate apps |
| **Moovit / Citymapper / Transit** (global) | Gold standard for multimodal UX and disruption alerts | Thin or no India coverage (Citymapper isn't in India) |
| **Operator apps** (Pune Metro, MMRDA, BEST Chalo, DMRC Momentum) | Official data | One operator each |

**Positioning statement:** *"Google tells you which train to take. We make sure you actually get from your door to theirs within your time window, using the cheapest and safest last-mile options that exist around that specific station today."*

---

## 4. Data & API research (the core technical question)

### 4.1 Maps, routing & traffic
| Provider | Strengths | Free tier / cost (verify) | Notes |
|---|---|---|---|
| **Google Maps Platform**: Routes API (`computeRoutes`, `computeRouteMatrix`), Places, Geocoding | Best traffic-aware ETAs; `TRANSIT` travel mode where Google has transit data (major Indian metros) | Since **March 2025** the $200 monthly credit is gone, replaced by **per-SKU free monthly caps** (roughly **10,000** for Essentials SKUs like basic Compute Routes / Route Matrix and **5,000** for Pro SKUs). Traffic-aware routing falls in a higher SKU. | Google also cut some India prices in 2024 after Ola Maps launched. **Check the India pricing page.** Terms restrict caching/storing results. |
| **Mappls (MapmyIndia)** | Indian company, strong Indian address/POI data, traffic, **real-time Delhi Metro data on Mappls** | "Start for free"; commercial pricing is via sales | Good "Made in India / data sovereignty" story for a government pitch. |
| **Ola Maps (Krutrim)** | Launched with **5 million free calls/month per API** (2024), two-wheeler routing, distance matrix, India-specific | Launch terms may have changed, **verify** | MapmyIndia sent a legal notice in 2024 alleging data misuse, which is a platform risk to mention if you depend on it. |
| **TomTom Traffic API** | **Traffic Incidents** updated about every minute (closures, accidents, jams) inside a bounding box; Traffic Flow | Free monthly tier; new pricing from **1 Jul 2026** | A good source for "blockages and disruptions" alerts. |
| **HERE** | Traffic incidents, flow, public transit API | Freemium | An alternative to TomTom. |
| **OpenStreetMap + OSRM / Valhalla / GraphHopper** | Free, self-hostable routing for walk/cycle/drive | Free (hosting cost only) | Use OSM for walking routes and station entrances. No live traffic. |
| **OpenTripPlanner (OTP2)** | Open-source multimodal planner using **GTFS + OSM** | Free | The best way to build your *own* multimodal engine without paying per request. |

### 4.2 Public-transport data
| Need | Source | Reality check |
|---|---|---|
| Metro schedules & ticketing | **ONDC metro network** (metro ticketing live on several metros; DMRC, BMRCL, Mumbai lines on apps such as Google Maps, Uber, Rapido, Namma Yatri, Redbus); operator websites | ONDC is the legitimate route to sell or embed tickets. You'd become a buyer app (BAP), which needs onboarding. **For the prototype, deep-link instead.** |
| Mumbai integrated ticketing | **Mumbai One** (MMRDA) | No public API known; potential partner/integration. |
| Bus GTFS (static) | **Delhi** (official OTD portal, includes realtime); **Pune PMPML** and **Mumbai BEST/TMT/KDMT/VVMT**: *community-built* GTFS (e.g. datameet-pune, independent MIT-0 projects); BEST stops/depots on data.opencity.in | Pune & Mumbai feeds are **unofficial**, so validate them. PMPML announced a Google Cloud ITMS (2022) aiming at GTFS, but no confirmed public feed. |
| Bus live positions | PMPML ITMS, BEST/Chalo internal systems | Not public. Needs a data-sharing MoU (a good Step-5 ask). |
| Suburban train live positions | **Yatri** (GPS + railway control rooms), **m-Indicator** (crowdsourced), Railways **NTES** (no official public API) | **No public real-time API.** Use timetable + crowdsourced delay reports + simulation for the demo, and propose a partnership. |
| Long-distance trains | Third-party IRCTC/NTES wrappers (unofficial) | Legal grey area; avoid in production. |
| Autos / bike taxis / cabs | **Namma Yatri / Beckn-ONDC** (open protocol); Uber/Ola/Rapido **deep links** for fare estimates | Uber/Ola don't offer open booking APIs to small apps. Deep links + ONDC are realistic. |
| Micro-mobility | Yulu, station e-bike/e-scooter schemes | Partnership or manual station listing. |
| Share autos & e-rickshaws | **No data anywhere** | **This is your unique dataset**: crowdsource it plus a station-level survey (routes, typical fare, wait time by hour). |
| Station infrastructure (lifts, exits, parking) | Operator sites, OSM, field survey | Field-survey your pilot stations. |

### 4.3 Disruption & context signals
- **Traffic incidents:** TomTom/HERE incidents API, Google traffic ETAs.
- **Weather / monsoon flooding:** IMD (public bulletins), OpenWeather/Open-Meteo (free). Mumbai and Pune flooding is a *huge* disruption source, and waterlogging hotspot lists exist from municipal corporations.
- **Official alerts:** operator X/Twitter handles (Central & Western Railway, MMRDA, Pune Metro, traffic police). Parse them with an LLM into structured alerts. Note that the X API is paid; RSS/press pages are alternatives.
- **Events:** Ganeshotsav, cricket matches, VIP movement and rallies cause closures. Maintain a manual events calendar plus traffic police advisories.
- **Crowdsourced reports:** "share autos unavailable at Exit 2", "lift not working", "waterlogging here", with reputation and expiry timers.

---

## 5. Main problems you'll face and possible solutions

| # | Problem | Why it's hard | Possible solution |
|---|---|---|---|
| 1 | **No open real-time data** for trains, buses, share autos | Agencies don't publish feeds; scraping is fragile and possibly illegal | Layered approach: official APIs → open GTFS → crowdsourcing → **historical averages by hour**. Be explicit about confidence ("live", "scheduled", "estimated"). Ask the department for data access as part of the pilot. |
| 2 | **API cost explodes** with re-planning every few minutes | Route-matrix and traffic SKUs charge per element | Cache by station pair and time bucket; re-plan only when a disruption touches the route (event-driven, not polling); use self-hosted OTP/OSRM for most calls and Google only for traffic ETA spot checks. |
| 3 | **Licensing & terms of service** | Google forbids storing or mixing its data with other maps; scraping IRCTC/NTES is risky | Read ToS early. Prefer open data (OSM/GTFS) for the core engine; use paid APIs only per their terms. |
| 4 | **Cold start for crowdsourcing** | No users means no reports | Seed with your own station survey; recruit auto stands, college groups and RWA groups; gamify (points, "Station Champion"). |
| 5 | **Fake or stale crowd reports** | Spam, pranks | Auto-expiry (e.g. 30 min), upvote/confirm, reporter reputation, GPS proximity check. |
| 6 | **"Optimal" means different things** | Fastest vs cheapest vs safest vs least walking | Multi-objective scoring weighted by **visit type** and user sliders; show 3 options (Fastest / Cheapest / Comfort-Safe). |
| 7 | **Time-window promise is risky** | Can't guarantee Indian traffic | Show **probability of on-time arrival** ("92% on time") using historical variance, plus a "leave by" time and a buffer. Never promise 100%. |
| 8 | **Booking across many providers** | No unified API | Phase 1: deep links. Phase 2: ONDC buyer-app integration for metro and autos. Phase 3: payment wallet / NCMC. |
| 9 | **Language & digital literacy** | Many users prefer Marathi/Hindi; some aren't app-comfortable | Marathi/Hindi/English UI, voice input, a **WhatsApp bot** and SMS fallback, big-button "simple mode". |
| 10 | **Connectivity underground / in trains** | Metro tunnels and crowded trains drop the network | Offline-cached itinerary, SMS alerts, pre-downloaded station maps. |
| 11 | **Privacy (DPDP Act 2023)** | Location and trip history are personal data | Consent screens, data minimisation, anonymised aggregation, a delete-my-data option, India-region hosting. |
| 12 | **Battery drain from live tracking** | Continuous GPS | Geofence-based updates near transfer points only. |
| 13 | **Competing with Google / Mumbai One** | Judges will ask "why not just Google Maps?" | Answer: last-mile data they don't have, visit-type intent, time-window guarantee, station-level government dashboard. Offer to **feed your last-mile data into** existing apps (a B2G angle). |
| 14 | **Scope creep** | Too many cities and modes | Pilot **one metro line / 2–3 stations** in one city (e.g. a Pune Metro or Mumbai Metro Line 3 station). |

---

## 6. Things to look out for (risks & compliance)

- **Honesty in claims:** the guide says *"Claiming more than you did collapses in the first question."* Label simulated data as simulated in the demo.
- **Name every tool you used** (Google API, an LLM, OTP, etc.) and say exactly what it did.
- **DPDP Act 2023**: consent, purpose limitation, children's data, breach reporting.
- **Motor Vehicles Act / aggregator guidelines (2020, updated 2025)**: if you ever *book* rides yourself, you may need an aggregator licence. Deep-linking avoids this.
- **Payments:** if you collect money, RBI PA/PPI rules apply. Use ONDC/UPI flows through licensed partners.
- **Accessibility:** follow RPwD Act 2016 / GIGW guidelines if pitching to government.
- **Women's safety features** must be real (e.g. share trip, SOS to 112 via the ERSS integration), not cosmetic.
- **Map display**: show India's official boundaries correctly (Survey of India rules) if you render national maps.
- **Bias:** don't always push paid private rides. Government partners will value a **public-transport-first** default.

---

## 7. Additional feature ideas (beyond the core)

**Traveller-side**
- **"Leave-by" alarm** that re-calculates with live traffic and nudges you ("Leave 6 min earlier: Andheri flyover jam").
- **Live re-routing with a reason**: "Line 1 delayed 15 min → switch to bus 340 from Exit B, still on time".
- **Last-mile options card per station exit**: share-auto routes and fares, feeder bus, e-bike, walk time, auto stand location, **current wait estimate**.
- **Fair-fare checker** for autos/taxis (meter tariff calculator, RTO-approved fare chart) to stop overcharging tourists.
- **Women & night-safety mode**: well-lit walking routes, verified autos, share live trip, SOS.
- **Accessibility mode**: lift/escalator status, step-free routes, wheelchair-friendly exits.
- **Luggage mode**: avoid stairs and crowded trains, suggest a cab for the last km.
- **Tourist mode**: suggested itinerary within a time window ("4 hours near CSMT"), attraction timings, multilingual phrase cards for auto drivers.
- **Business mode**: arrival buffer, "arrive presentable" (AC options, avoid long walks in heat or rain), calendar integration (pull meeting location and time automatically).
- **Carbon & money saved** tracker vs. a cab-only trip.
- **Group trip planning**: meet at the station, split cost of a shared auto/cab.
- **Monsoon mode**: flood-prone underpass avoidance, waterlogging reports.
- **Voice / WhatsApp / SMS** interfaces for low-literacy or offline users.
- **Season-pass and NCMC wallet** helper; cheapest pass recommendation.
- **Parking availability** at station parking lots (park-and-ride).

**Operator / government side (B2G, often the winning angle in govt challenges)**
- **Last-mile gap heat-map dashboard**: where searches fail, wait times are high or reports pile up → evidence for where to add feeder buses, auto stands or footpaths.
- **Demand forecasting** for feeder routes (origin-destination clusters from anonymised searches).
- **Disruption broadcast** console: operators push alerts to affected travellers only.
- **Station accessibility audit** tool (crowdsourced checklist).

**Driver / local-supply side**
- **Auto-stand / share-auto driver app** (super simple, Marathi): "At Station Exit 2, 3 seats free, going to Hinjewadi Phase 1". Creates the live last-mile supply data nobody has.

---

## 8. Government stakeholders (Step 5)

| Department / body | Why they care | What you'd ask for |
|---|---|---|
| **Urban Development Department, GoM** (owner of urban transport policy, metros via its agencies) | Metro ridership, urban mobility plans | Policy sponsorship, pilot approval |
| **MMRDA** (Mumbai Metro lines, Mumbai One) / **MMRCL** (Line 3) / **Maha-Metro** (Pune & Nagpur Metro) | Low last-mile ⇒ lower ridership ⇒ revenue gap | Station data, feeder data, pilot at 2–3 stations, integration with Mumbai One / Pune Metro app |
| **BEST** (Mumbai) / **PMPML** (Pune) / **NMMT, TMT** | Feeder bus planning | GTFS + live bus location feed (MoU), feeder route redesign using your heat-map |
| **Transport Department / RTO** | Auto-rickshaw fares, aggregator rules, permits | Fare chart data, share-auto stand regularisation |
| **Municipal Corporation (ward office)** | Footpaths, lighting, waterlogging | Fix walking-route issues your data surfaces |
| **Traffic Police (Mumbai/Pune)** | Congestion, closures | Advisory feed, event closures |
| **Maharashtra State Innovation Society (MSInS)** / **EIT & AI Department** | Funding & pilots of tech in govt services | Innovation-challenge grant, pilot facilitation |
| **Central Railway / Western Railway (Mumbai Division)** | Suburban commuters | Station exit info, delay feeds (via partnerships like Yatri) |
| **Smart City SPVs** (Pune Smart City, etc.) | ITMS, command centres | Data integration, dashboard hosting |

**Who to physically approach first (as the guide suggests):** the **station manager / public relations office of Maha-Metro or MMRCL at your pilot station**, plus the **ward officer** of that area's municipal ward. Address the note to e.g. *"General Manager (Operations), Maha-Metro Pune"* or *"Assistant Municipal Commissioner, <Ward>"* with your two-page Steps 1–4 note.

---

## 9. Solution options considered (Step 3: "list three, reject two")

| Option | Description | Verdict |
|---|---|---|
| A. Physical signage / QR boards at station exits | Boards listing last-mile options and fares | Cheap but static, no live info, no time-window planning. **Keep as a low-tech companion** (QR → app/WhatsApp). |
| B. Build our own feeder shuttle service | Run vans from stations | Capital-heavy, licensing, doesn't scale through existing people. **Rejected.** |
| C. Generic all-India trip planner | Compete with Google Maps on everything | Too broad; no data advantage. **Rejected.** |
| D. **Last-mile-aware, time-window journey orchestrator + station last-mile data layer** (crowd + operator + APIs) + **government gap dashboard** | Focused on the root cause | **Chosen.** |

---

## 10. Scaling path (Step 6)

| Stage | Scope | Target metric | Who runs it at each site |
|---|---|---|---|
| 1. Prove | 1–2 stations (one metro line) | Average last-mile time ↓ and on-time arrival % ↑ for 30–50 trial users over 2 weeks | Your team + 1 auto-stand leader + 1 college club |
| 2. Repeat | 5–10 stations on the same line | Same result without the team present; station onboarding sheet works | Station "champions" (students, RWA volunteers, auto-union reps) |
| 3. City | Whole metro line or city with Maha-Metro/MMRDA | Feeder ridership ↑, search-failure hot-spots fixed | Operator staff + municipal ward office |
| 4. State | Pune, Mumbai, Nagpur, Thane, Navi Mumbai | Adoption via operator apps / Mumbai One / ONDC | Operators; your platform as a data/API layer |

Cost per new station must stay flat: onboarding a station = 1 survey day + data entry + 1 local champion.

---

## 11. Finance sketch (Step 7, *estimated*, verify quotes)

| Item | Estimate |
|---|---|
| One-time: app/prototype development | ₹0 (team time) to ~₹20k (domain, design assets, test devices) |
| One-time per station: survey + signage QR boards | ~₹2,000–5,000 (printing, travel) |
| Monthly: cloud hosting (small VM + managed DB) | ~₹1,500–5,000 at pilot scale |
| Monthly: maps APIs | ₹0 inside free tiers at pilot scale (heavy caching + self-hosted OTP/OSRM); scales with users |
| Monthly: SMS/WhatsApp notifications | ~₹0.15–0.80 per message (*verify provider*) |
| Team time | e.g. 4 people × 10 hrs/week; count it, as the guide says |

**Benefit side:** time saved per commuter (e.g. 15 min/day ≈ 5.5 hrs/month), money saved by choosing shared/public options over cabs (e.g. ₹50–150/day for some users), and for the operator, **extra metro ridership** (each extra daily rider ≈ ₹30–60/day of fare revenue).

**Who pays:** Stage 1–2: team / college / hackathon prize. Stage 3–4: operator pilot budget (metro authorities already fund feeder studies, and Maha-Metro tendered a feeder study in 2026), CSR, MSInS grants. Later: B2G licence for the dashboard, affiliate fees from ONDC/ride partners, sponsored listings for local services (clearly marked).

---

## 12. Hardware integration possibilities

| Hardware | Purpose | Prototype feasibility |
|---|---|---|
| **ESP32 + GPS (NEO-6M) + GSM/4G module** on a few share autos / feeder vans | Live location of last-mile vehicles where no data exists. (AIS-140 tracking devices are already mandated for many public-service vehicles, so data could come from those in production.) | ✅ ~₹2,000–3,500 per unit; great live demo |
| **Smart "last-mile board"** at station exit: ESP32 + e-ink/LED display | Shows next feeder bus, share-auto queue length, walk times; fed by your backend | ✅ Strong physical demo piece |
| **IR / ToF people counter or camera with on-device CV** (Raspberry Pi + small model) at auto stand / feeder stop | Estimate queue length and wait time automatically | ✅ Demoable with a webcam |
| **BLE beacons** at station exits | Indoor positioning: "you're at Exit B, walk left for share autos"; triggers last-mile card | ✅ Cheap (~₹500–1,000/beacon) |
| **NFC / NCMC card reader** | Tap-in at feeder bus / auto stand for integrated fare; proof-of-ride for rewards | ⚠️ Demo only with NFC tags; real NCMC needs bank/acquirer partnership |
| **Parking occupancy sensors** (ultrasonic/magnetometer) at station parking | Park-and-ride availability | ✅ Small demo |
| **Waterlogging sensor** (ultrasonic level sensor at underpass) | Monsoon re-routing | ✅ Easy demo, very relevant to Mumbai/Pune |
| **Self-service kiosk / QR standees** | For tourists or users without the app | ✅ Low-cost |

Production note: prefer **existing** hardware (bus ITMS GPS, AIS-140 devices, CCTV) through data-sharing agreements over deploying new devices. That keeps cost per site flat, which is what the guide's scaling test asks for.

---

## 13. Suggested technology stack

- **Mobile/web:** Flutter or React Native (one codebase), or a PWA for speed of demo
- **Backend:** Node.js/NestJS or Python/FastAPI; **PostgreSQL + PostGIS** for geo queries; **Redis** for caching routes and live state
- **Routing engine:** **OpenTripPlanner 2** (GTFS + OSM) for multimodal; OSRM/Valhalla for walking/driving; Google Routes / Mappls / Ola Maps for live traffic ETAs
- **Real-time pipeline:** WebSockets / Firebase Cloud Messaging for push; a scheduler that polls incident APIs per active route corridor; MQTT for IoT devices
- **AI/ML:** wait-time prediction (gradient boosting on hour, day, weather, station); LLM to parse unstructured advisories (tweets/press notes) into structured alerts; natural-language trip input ("Reach Hinjewadi by 10 for a client meeting")
- **Maps UI:** MapLibre GL (open) or Google Maps SDK
- **Messaging:** WhatsApp Business API / Twilio / Gupshup; SMS fallback
- **Open protocols:** GTFS / GTFS-Realtime, Beckn/ONDC

---

## 14. Field research plan (do this before the pitch)

1. **Pick 2 stations** you can physically visit repeatedly (one busy, one under-used).
2. **Count & time:** at the morning and evening peaks, record last-mile modes available, wait times, fares, queue lengths. Take photos (the guide asks for evidence).
3. **Interview 20–30 commuters** using the guide's questions: *What exactly goes wrong? How often? What do you do today? What does it cost you? What have you tried?*
4. **Talk to 3–5 auto drivers / feeder staff** about their side (empty trips, waiting, fare disputes).
5. **Talk to one official** (station manager or ward officer).
6. **Record your baseline:** average door-to-door time, last-mile share of total time, ₹ spent, % of times late.
7. **Run a one-week "WhatsApp concierge" trial** (a human answers last-mile questions using your station sheet) before or alongside the app. This is a legitimate first prototype under the guide's "simplest thing that works" rule.

---

## Sources

- WRI India & Toyota Mobility Foundation, metro access study: [Toyota Mobility Foundation press release](https://toyotamobilityfoundation.org/en/press-room/pressrelease07172023/), [AutocarPro coverage](https://www.autocarpro.in/news/tmf-and-wri-india-release-study-that-offers-key-insights-into-metro-usage-patterns-across-india-115905?amp=1), [Outlook Business on metro ridership shortfall](https://www.outlookbusiness.com/imagenation/nothing-much-to-talk-about-6106), [IJBES Delhi NMT study](https://ijbes.utm.my/index.php/ijbes/article/download/141/80)
- Pune last-mile situation 2026: [Swarajya: Pune Metro own bus network](https://swarajyamag.com/amp/story/news-brief/pune-metro-plans-own-bus-network-to-tackle-low-ridership-and-last-mile-gap), [NativePlanet: feeder gaps 2026](https://www.nativeplanet.com/news/pune-metro-last-mile-connectivity-issues-feeder-bus-gaps-2026-011-23973.html), [Punekar News: auto-rickshaw feeder at PCMC](https://www.punekarnews.in/?p=242429), [Indian Infrastructure interview](https://indianinfrastructure.com/?p=191865), [India Infra Hub: PMC feeder buses](https://indiainfrahub.com/metrorail/pune-metros-success-drives-pmc-to-introduce-feeder-bus-services-to-bridge-last-mile-connectivity/)
- Mumbai One: [The Week](https://www.theweek.in/wire-updates/national/2025/10/08/bes22-mh-app-mumbai-one.html), [Free Press Journal](https://www.freepressjournal.in/amp/mumbai/mumbai-one-app-launches-today-indias-first-unified-mobility-platform-goes-live-at-5-am-heres-what-it-offers), [Curly Tales explainer](https://curlytales.com/india/trending/mumbai-one-app-how-to-use-features-prices-everything-to-know-about-indias-integrated-mobility-app/amp/), [FPJ: Mumbai Metro + Uber via ONDC](https://www.freepressjournal.in/amp/mumbai/mumbai-metro-strengthens-last-mile-connectivity-with-uber-integration-via-ondc)
- ONDC / Beckn / Namma Yatri: [ONDC public transport](https://ondc.org/pages/public-transport.html), [Uber metro tickets via ONDC](https://www.uber.com/en-IN/newsroom/now-buy-metro-tickets-on-uber-powered-by-ondc-b2b-logistics-next), [DMRC on ONDC apps](https://www.theweek.in/wire-updates/national/2025/05/15/des59-dl-dmrc-ondc.html), [BMRCL ONDC](https://www.theweek.in/wire-updates/national/2025/07/08/srg8-ka-metro-tickets.html), [YourStory: ONDC onboards Namma Yatri](https://yourstory.com/2023/03/ondc-onboards-auto-booking-app-namma-yatri), [Autocar Pro: Namma Yatri zero-commission](https://autocarpro.in/news/namma-yatri-app-launches-lifetime-zero-commission-cab-rides-on-ondc-network--121972), [NASSCOM: open mobility](https://community.nasscom.in/communities/engineering-research-design/curious-case-open-mobility-how-local-public-transport)
- Maps APIs: [Woosmap: Is Google Maps API free in 2026](https://www.woosmap.com/blog/is-google-maps-api-free), [Google Maps Platform pricing](https://developers.google.com/maps/billing-and-pricing/pricing?hl=de), [Google Maps Platform India](https://mapsplatform.google.com/intl/fr_fr/india), [Inc42: Google cuts India prices](https://inc42.com/?p=468248), [Inc42: Mappls real-time Delhi Metro](https://inc42.com/buzz/mapmyindia-to-offer-real-time-delhi-metro-data-on-mappls/), [NextBillion: Indian alternatives to Google Maps](https://nextbillion.ai/feeds/blog/indian-alternative-google-maps), [Ola Maps pricing blog](https://tech.olakrutrim.com/ola-maps-made-for-india-priced-for-india/), [YourStory: free Ola Maps APIs](https://yourstory.com/2024/07/bhavish-aggarwal-responds-google-launches-free-ola-maps-apis-developers-startups), [TomTom pricing](https://docs.tomtom.com/pricing/price-announcement), [TomTom Traffic Incidents](https://developer.tomtom.com/traffic-api/documentation/traffic-incidents/traffic-incidents-service)
- Transit data: [PMPML & Google Cloud ITMS](https://www.googlecloudpresscorner.com/2022-11-01-PMPML-and-Google-Cloud-Join-Hands-to-Build-an-Intelligent-Transit-Management-System-for-Live-Tracking-of-Buses), [datameet-pune PMPML wiki](https://github-wiki-see.page/m/datameet-pune/datameet-pune.github.io/wiki/PMPML), [FOSS United: crola (Pune/Mumbai GTFS)](https://fossunited.org/grants/directory/crola), [OpenCity: BEST stops & depots](https://data.opencity.in/dataset/mumbai-best-bus-stops-and-depots-data), [OpenCity: PMPML annual data](https://data.opencity.in/dataset/pune-pmpml-annual-data), [OSM list of GTFS feeds](https://wiki.openstreetmap.org/wiki/List_of_GTFS_feeds)
- Mumbai trains: [NITI Frontier Tech: Yatri](https://frontiertech.niti.gov.in/story/how-yatri-is-transforming-mumbais-public-transport-through-data-and-ai/), [FPJ: Yatri for WR locals](https://www.freepressjournal.in/mumbai/mumbai-now-track-western-railway-locals-with-yatri-app), [Digital Terminal: Google Maps + Yatri](https://digitalterminal.in/amp/story/tech-companies/google-maps-and-yatri-join-hands-to-improve-mumbai-local-train-commuting), [GitHub Track-and-Forecast (simulated data note)](https://github.com/Mini-Project2024-API/Track-and-Forecast)
- NCMC: [The Week: Aqua Line NCMC](https://www.theweek.in/wire-updates/national/2025/06/10/bes22-mh-metro-card.html), [Global Mass Transit: MSRTC NCMC](https://globalmasstransit.net/msrtc-to-roll-out-ncmc-based-cashless-ticketing-across-state-bus-network-india/), [Swarajya: NCMC deadline for ST buses](https://swarajyamag.com/news-brief/maharashtra-extends-deadline-for-mandatory-ncmc-smart-card-on-st-buses-to-1-september-to-ensure-travel-concessions-continue), [NavBharat Live: Metro 1 NCMC](https://navbharatlive.com/maharashtra/mumbai/mumbai-metro-line-1-completes-12-years-unveils-ncmc-card-for-seamless-travel-1783433.html)
