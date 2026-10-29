# SafarSetu — sourced fact base for the Seva First pitch

Compiled 2026-10-30. Every row: fact | source (id -> `sources.json`) | date | confidence.
Confidence: **HIGH** = official/primary source; **MED** = reputable secondary (news/aggregator of official data); **LOW** = uncertain/conflicting.
"Depth": **F** = page fetched and read this session; **S** = read only as a web-search extract (re-open before quoting a number on a slide). "Not found" means searched, not verified.

---
## 0. URGENT — which challenge portal and which deadline (read first)

| # | Fact | Src | Date | Conf | Depth |
|---|---|---|---|---|---|
| 0.1 | `sevafirst.mic.gov.in` is titled **"Seva First Innovation Challenge (South Zone Edition)"**. Participating regions listed: Andhra Pradesh, Karnataka, Kerala, Tamil Nadu, Telangana, A&N Islands, Lakshadweep, Puducherry. **Maharashtra is NOT listed.** Registration is institution-led (coordinator, UDISE/AISHE ID). Submission window 25 Sep – 6 Nov 2026. | S2 | 2026-10-30 | HIGH | F |
| 0.2 | The **Maharashtra Zone** has its own portal: `sevainnovationchallenge.in` ("Seva First Innovation Challenge, Maharashtra Zone"; zone = Maharashtra, Chhattisgarh, Goa, DNH&DD). Banner: "Application Dates Extended — Last date to apply: **30 October 2026**" (no time of day stated; drafts editable until then, locked after). **That is today (2026-10-30).** | S1 | 2026-10-30 | HIGH | F |
| 0.3 | Maharashtra Zone eligibility is **not student/institution-only**: individuals, students, teams, researchers, startups, MSMEs, companies, social enterprises, institutions. Concept-stage ideas accepted; prototype link optional; no fee. Under-18s need guardian consent. Team up to 5. | S1 | 2026-10-30 | HIGH | F |
| 0.4 | Prize: total allocation **INR 5.00 crore across 10 sectors**; 50 awardees (5 per sector); each winner "eligible for a **work order of up to INR 10 lakh**", subject to evaluation, due diligence, programme approvals; KYC/bank/feasibility checks. Separate ranking for a Women category. Page is internally inconsistent about per-sector split (1 Women+1 Under-18+3 General vs 3 General+3 Women+2 consolation). | S1 | 2026-10-30 | HIGH | F |
| 0.5 | Sectors named on the page: agriculture, home & law, women empowerment, **urban development**, defence, health, energy, emerging technologies, science (10th not named). Pick one primary sector — SafarSetu fits **Urban development**. The Maharashtra portal does not use the "Surakshit Bharat" theme names (that is the South-Zone/national-site taxonomy). | S1, S2 | 2026-10-30 | HIGH | F |
| 0.6 | Submission needs: Aadhaar verification before submit; ID doc (Aadhaar/PAN/passport/DL; PDF/JPG/PNG <=5 MB); **mandatory pitch deck, 6-slide reference template**: (1) title & applicant snapshot, (2) problem, (3) solution & innovation, (4) feasibility & implementation, (5) impact & scalability, (6) team/individual & support required. Required text fields: problem (who is affected, how many), solution, expected impact. | S1 | 2026-10-30 | HIGH | F |
| 0.7 | Evaluation: administrative scrutiny -> two independent online evaluations (technical, impact) -> finalist validation -> final Grand Jury. ~200 exhibition finalists. Selected candidates notified by registered email. | S1 | 2026-10-30 | HIGH | F |
| 0.8 | Contact: support@sevainnovationchallenge.in; helpline +91 91377 78135; office: Ratan Tata Maharashtra State Skills University / Maharashtra State Innovation Society, Elphinstone Technical High School Campus, Fort, Mumbai 400001. Organiser department: Skill Development, Employment, Entrepreneurship & Innovation (per BW Education/FPJ reports; FPJ's 28-Oct piece wrongly says "Union Ministry of Skill Development"). | S1, S3, S5 | 2026-10-30 | HIGH/MED | F/S |
| 0.9 | Scale of competition: >65,000 registrations, 48,680 teams, 7,952 submitted ideas in the Maharashtra zone (FPJ, 28 Oct 2026). | S3 | 2026-10-28 | MED | F |
| 0.10 | Caveat: the registration page showed a "Prototype mode" notice (OTP 123456 works) when fetched — confirm the live portal actually accepts submissions today. The 24 Oct vs 6 Nov discrepancy in the brief is explained by 0.1/0.2 (6 Nov = South Zone site; 30 Oct = Maharashtra Zone, extended; an earlier Oct-17 date appears in aggregators). | S1 | 2026-10-30 | MED | F |
| 0.11 | Repo docs (`docs/01-product-and-seva-alignment.md`, README) cite the **South Zone** site and say registration is institution-led and theme is Surakshit Bharat — **this needs correcting** for a Maharashtra submission. | repo | 2026-10-30 | HIGH | F |

---
## A. Problem evidence (Maharashtra)

### A1. Scale (daily ridership)
| # | Fact | Src | Date | Conf | Depth |
|---|---|---|---|---|---|
| A1 | Mumbai suburban rail, average daily ridership: Central Rly ~38.70 lakh/day and Western Rly ~29.52 lakh/day in FY2025-26 (all-day averages; both below pre-pandemic: CR 43.22 lakh in 2018-19, WR 34.87 lakh). Combined ~68 lakh avg/day. | S6 | 2026 | MED | S |
| A2 | Peak: 5 Jan 2026 — CR 72.18 lakh + WR 52.07 lakh. Jan 2026 monthly total 127.12 million (12.7 crore). | S6, S7 | 2026-01 | MED | S |
| A3 | "93 lakh/day" (62 CR + 31 WR) circulates (Geosquare, Feb 2026) but measures weekday figures, conflicts with A1 — **do not use; say "roughly 70 lakh a day on average, ~1 crore at peak"**. | S8 | 2026-02 | LOW | S |
| A4 | BEST (Mumbai): ~2,594-2,673 buses in 2025, only ~17% BEST-owned (rest wet-leased). Daily ridership reported 20-30 lakh depending on source (May 2025 avg ~2 million/day; ~10% drop after 2025 fare hike). No single authoritative figure found. | S9 | 2025 | MED/LOW | S |
| A5 | MMRDA's **Mumbai One** unified-ticket app: >1.04 crore ticket bookings in ~10 months (Aug 2026 report); Metro ~80% of transactions; integrates 11 operators (metro 1/2A/7/3, Navi Mumbai metro, Western/Central/Harbour rail, BEST, NMMT, MBMT, TMT, monorail). | S10 | 2025-10 / 2026-08 | MED | S |
| A6 | Mumbai Metro + monorail near ~9-10 lakh daily ridership (Feb 2026 reports). Lines 2A/7 record 3.34 lakh/day. | S6, S10 | 2026 | MED | S |
| A7 | PMPML (Pune): fleet 2,049 buses, ~1,600-1,700 on road daily, 381 routes; avg 10.14 lakh passengers/day in May 2025 (about 11.5 lakh in 2024); fell to ~9.99 lakh after June 2025 fare hike; peak 14 lakh+ on 9 Aug 2025. Parisar: ~1 lakh fewer trips per month in 2025 vs 2024. | S11, S12 | 2025 | MED | S |
| A8 | Pune Metro: avg daily ridership 1,87,299 (Mar 2026); FY2025-26 total 7.08 crore journeys, Rs 110 crore revenue; Sept 2026 monthly 93.59 lakh (Ganeshotsav). Single-day peak figures conflict (3.87 / 4.78 / 5.80 lakh) — do not quote a peak. | S13 | 2026 | MED | S |
| A9 | MSRTC: ~50-55 lakh passengers/day in 2025 (60 lakh in Nov 2024 per one report; ~66 lakh pre-COVID); fleet figures conflict (12,000-22,000); daily loss Rs 1.6 crore in FY2025-26. | S14 | 2025-26 | MED/LOW | S |

### A2. Time lost
| # | Fact | Src | Date | Conf | Depth |
|---|---|---|---|---|---|
| A10 | TomTom Traffic Index 2025: **Pune 33 min 20 s per 10 km**, congestion 71.1%, rush-hour speed 15.1 km/h; **Mumbai 28 min 51 s per 10 km**, congestion 63.2%, rush-hour 17.6 km/h. (2024 edition: Pune 33:22, Mumbai 29:26; Pune ranked 4th slowest globally in the 2024 edition.) Note: private-car/road traffic metric, not transit. | S15 | 2025 data | HIGH (primary) | S |
| A11 | Time lost per year (TomTom-derived, cited in Parliament): Pune ~152 h, Mumbai ~126 h. Car-traffic metric. | S16 | 2025-26 | MED | S |
| A12 | One-way commute (older, different methods): Mumbai 17 km in 55 min, Pune 16 km in 50 min (MoveInSync Q1 2019). Dated — use only as context. | S17 | 2019 | MED/LOW | S |

### A3. Reliability pain
| # | Fact | Src | Date | Conf | Depth |
|---|---|---|---|---|---|
| A13 | Official suburban punctuality claims: CR ~92%, WR ~95% (FY2025-26); commuters say peak trains run 10-20 min behind; the metric definition is disputed. WR: on 23 Jun 2025, 1,404 of 1,414 suburban services were recorded as delayed (AC-local era high), per FPJ. | S18 | 2025-26 | MED | S |
| A14 | FPJ analysis: "50% of Mumbai locals do not reach destination at the estimated time of arrival" (headline; method not verified). | S18 | n/d | LOW | S |
| A15 | PMPML breakdowns: 53,243 in 3 years incl. 4,118 in early 2025 (FPJ); ~60/day on average; 18,750 in Jan-Oct 2025; >1,000 scheduled trips cancelled on bad days (Dec 2025 FPJ); FPJ headline: Rs 25-30 crore/yr loss from breakdowns; Rs 13.31 crore spent on repairing breakdown buses in 3 years. Counts differ between FPJ articles (2024: 21,033 vs 21,444). | S19 | 2025 | MED | S |
| A16 | PMPML statistics PDF (3 Jan 2025) lists cancelled km as % of scheduled km: 8.42 / 7.67 for two periods (reporting month unclear). | S19 | 2025-01 | MED/LOW | S |
| A17 | PMPML complaints: 3,561 (body text; headline says 3,211) between 1 Oct 2023 and 28 Mar 2024; complaints via telephone/email — an in-app complaints feature was only announced Sep 2026. | S20 | 2024 / 2026 | MED | S |

### A4. First/last mile and information gaps
| # | Fact | Src | Date | Conf | Depth |
|---|---|---|---|---|---|
| A18 | WRI India + Toyota Mobility Foundation, "Improving Metro Access in India": survey of 7,200 metro riders (Nagpur, Delhi, Bengaluru; 2022-23): walking + shared modes >75% of last-mile share; riders will spend up to ~20 min (incl. wait) to reach a station; women averse to waiting. **No Pune/Mumbai survey numbers found** (they are STAMP programme cities). | S21 | 2023-07 | HIGH | S |
| A19 | Pune: native-planet/press commentary on poor last-mile hitting Pune Metro ridership and calls for feeder buses (opinion/news, no number extracted). | S13 | n/d | LOW | S |
| A20 | Aapli PMPML app: >1.3 million downloads and Rs 70.71 crore digital ticket/pass sales in its first year (Aug 2025); passenger complaints: irregular live tracking, no timetables in app, limited integration of buses into live tracking. Target 50 lakh downloads (Mar 2026). | S22 | 2025-26 | MED | S |
| A21 | Marathi/regional-language coverage and real-time information coverage statistics for Mumbai/Pune: **not found**. | — | — | — | — |

### A5. Safety and accessibility
| # | Fact | Src | Date | Conf | Depth |
|---|---|---|---|---|---|
| A22 | Mumbai suburban rail deaths (GRP data via news): 2,287 in 2025 (-7% from 2,468 in 2024; another outlet says 2,477); 1,063 died crossing tracks; 525 died in falls from moving trains (1,713 fall incidents). 29,970 deaths in 11 years. | S23 | 2025-26 | MED | S |
| A23 | Greenpeace India survey, 504 women at 52 Mumbai bus stops (2024): overcrowding top concern (92%), safety 48%, harassment/discrimination 20%. | S24 | 2024 | MED | S |
| A24 | NARI 2025 index: public transport identified among the least safe public spaces for women; two-thirds of incidents unreported. ITDP: 30% of women reported harassment or theft, 41% said overcrowding made journeys unsafe (Pune among cities studied; no Pune-only number). | S24 | 2025 | MED | S |
| A25 | Divyang/accessibility statistics for Maharashtra transit: **not found**. | — | — | — | — |

**How to frame A for the pitch** (what the evidence supports): reliability is poor and uneven (A13, A15), road time is very high (A10), tens of lakhs rely on a patchwork of operators (A1, A4, A7, A9). The *specific* claim "people lose time and trust because connections and delays are not planned around their work schedule" is **our inference — no study measuring that was found**. Say "we propose to measure it in the pilot".

---
## B. Existing solutions and gaps (verified this session unless noted)

| App | What it does (verified) | What it does NOT do vs SafarSetu | Src | Conf |
|---|---|---|---|---|
| **Google Maps** | Google Help states directions to multiple destinations are **not available for public transport or flights**; Directions API waypoints exclude transit. June 2019 launch: bus travel times from live traffic in 10 Indian cities incl. Mumbai & Pune; live Indian Railways train status. | No multi-stop transit itinerary; no per-stop task/time-needed/must-do logic; no slack-based calm alerts; no authority loop. "Depart at / Arrive by" for transit: **not verified here** — check on a phone before claiming either way. Current (2026) live-transit coverage of PMPML/BEST: not verified. | S25 | MED |
| **Moovit** | Covers Mumbai (metro, BEST, NMMT, TMT, locals, ferries — Feb 2025 update) and Pune (PMPML, Indian Railways, Pune local); live arrivals from GPS where available; crowd-sourced origins; mixed user reviews on stale routes. | Point-to-point trips; no multi-stop deadline planning; no authority reporting loop. | S26 | MED |
| **Chalo** | Launched with BEST in Mumbai: live bus tracking, live crowding indicator, tickets/passes, smart card. Chalo in Pune: **not confirmed**. | Bus-only, A-to-B; no work-day planning; no cross-mode slack alerts. | S22 | MED |
| **Aapli PMPML** (official) | Online tickets/passes, live location, grievance (complaints in-app announced Sep 2026); 1.3M downloads. | PMPML buses only; users report tracking/timetable gaps. | S22 | MED |
| **Mumbai One (MMRDA)** + Metro "OneTicket" on ONDC + Uber metro booking (Mar 2026) | Single ticket across metro/rail/bus; 1.04 crore bookings. Strongest incumbent in Mumbai. | Ticketing/payments, not trip-day planning or delay-aware re-planning. (Whether it exposes delay alerts: not found.) | S10 | MED |
| **m-Indicator** | Mumbai/Pune timetables (Central, Western, Harbour, Pune-Lonavala, metro, mono), crowd-sourced live train location, train chat, A-to-B connected routes, platform/door info, women-safety SMS; 1 crore+ Android downloads per Wikipedia (older/other sources vary; 41.5M installs per AppGoblin). | No multi-stop with deadlines; crowd-sourced not agency-sanctioned; no authority insight loop. | S27 | MED |
| **NTES / Where Is My Train** | NTES = Indian Railways live running status. Official API/licensing terms: **not found** (2015 mailing list says licences existed; anecdotal). | Single-mode (rail); no planning around other legs. | S28 | LOW |
| Namma Yatri-style (open-network mobility), PMPML ITMS | Not researched in depth. | — | — | — |

**Fair positioning:** nobody reviewed offers *(a)* an ordered multi-stop work plan with be-there-by times across bus+metro+rail, *(b)* slack-aware "no need to rush" alerts, and *(c)* an aggregated gap-report loop to the authority — but Mumbai One + Google/Moovit cover routing and ticketing well, so don't claim "nothing exists"; claim "none plan a *day* around deadlines".

---
## C. Government stakeholders and existing spend

Designations are standard official designations; contact pathways are the agency's public websites/RTI/grievance routes. **Designations and websites below were NOT re-fetched this session (MED)** — confirm on each site before printing.

| Body | Role relevant to SafarSetu | Designation to address | Public pathway |
|---|---|---|---|
| Urban Development Dept (GoM) | Parent of MMRDA/PMRDA/municipal bodies; Seva guide maps "Urban development" to UD Dept + ward office | Principal Secretary (UD) | mantralaya; Aaple Sarkar (aaplesarkar.mahaonline.gov.in) |
| Transport & Ports Dept (GoM) | Parent of MSRTC/RTOs; digital bus portal (Apr 2026 reports) | Principal Secretary (Transport) | maharashtra.gov.in |
| MMRDA | Mumbai One app, Mumbai metros, MMR integrated bus committee (report due 15 Jul 2026 per FPJ) | Metropolitan Commissioner | mmrda.maharashtra.gov.in |
| BEST | Mumbai buses; ITMS/passenger information | General Manager | bestundertaking.com |
| BMC | Grievance system "MAARG" launched (FPJ); ward offices | Municipal Commissioner / Ward Officer | portal.mcgm.gov.in |
| PMRDA / PMC | Pune region planning / city roads, bus infrastructure | Metropolitan Commissioner (PMRDA); Municipal Commissioner (PMC) | pmrda.gov.in, pmc.gov.in (PMC open-data portal exists: opendata.pmc.gov.in) |
| PMPML | Pune/PCMC buses; Aapli app | Chairman & Managing Director | pmpml.org |
| Maha-Metro | Pune & Nagpur metro; prepared Pune Metro-region CMP (Rs 1.3 lakh crore plan, Aug 2025) | Managing Director | mahametro.org |
| MSRTC | State buses (no open feed) | Vice Chairman & Managing Director | msrtc.maharashtra.gov.in |
| SEEID Dept + MSInS | Runs this challenge; MSInS = nodal agency, Startup Policy 2018; Startup Week winners historically received work orders up to Rs 15 lakh | Principal Secretary SEEID; Member Secretary/CEO MSInS | MSInS office: see 0.8 |

### Spend lines SafarSetu could reduce/replace (only figures actually found)
| # | Fact | Src | Date | Conf |
|---|---|---|---|---|
| C1 | BEST's **Rs 112-crore ITMS** (GPS + passenger information systems in buses) — Hindustan Times, 24 Nov 2018. | S29 | 2018 | MED |
| C2 | Pune Smart City: Adaptive Traffic Management System for 125 junctions cost ~Rs 133 crore capex + Rs 52 crore maintenance; mobility+water ICT bundle ~Rs 700 crore (capex+5-yr opex); 55 sanctioned projects worth Rs 3,333 crore complete (Jul 2025); Smart City Mission discontinued by Centre in June 2023. **PMPML ITMS rupee value: not found.** | S30 | 2025 | MED |
| C3 | PMPML: Rs 25-30 crore/yr loss attributed to breakdowns; Rs 13.31 crore spent on breakdown repairs over 3 years (FPJ headlines, full text not read). | S19 | 2025 | MED |
| C4 | Grievance handling: PMPML complaints by phone/email (3,561 in ~6 months); Aaple Sarkar is the state portal (no transport-specific volumes found). SafarSetu's gap-report ranking is a *complement* to these, not a replacement — do not claim cost saving without a number. | S20 | 2024 | MED |
| C5 | CMP / transport-survey consultancy fees: **not found** (Nagpur CMP "Rs 25,567 crore" is investment value, not study cost; Maha-Metro prepared Nagpur & Pune CMPs in-house). Check mahatenders.gov.in / CIDCO CMP RFP (Navi Mumbai) for a fee. | S31 | 2025-26 | — |
| C6 | Mumbai One / MMRDA digital ticketing and PMPML app spend: not found. | — | — | — |

---
## D. Pilot cost benchmarks (INR)

| # | Fact | Src | Date | Conf | Depth |
|---|---|---|---|---|---|
| D1 | Supabase: **Pro from $25/month**, **Team from $599/month**; both include $10/month compute credit (one Micro instance), 250 GB egress, 100 GB storage, 100,000 MAU. | S32 | 2026-10-30 | HIGH | F |
| D2 | Vercel: Hobby $0 (1 seat, non-commercial in practice); Pro $20 per developer seat incl. $20 credit, 1 TB transfer. | S33 | 2026-10-30 | HIGH | F |
| D3 | Render / Railway VM prices: **not found** (pricing page returned no figures). | — | — | — | — |
| D4 | WhatsApp Business Platform (Meta): per-delivered-template pricing since 1 Jul 2025; INR billing localisation from 1 Jan 2026 (migrate by 31 Dec 2026); service messages: 1,000 free/month/number, charged from 1 Oct 2026; utility messages inside the 24h service window became chargeable 1 Oct 2026. India INR rates (marketing ~Rs 0.8631; utility/authentication ~Rs 0.115, excl. 18% GST) come from **third-party blogs only** — Meta's INR rate card CSV not read. | S34 | 2026 | HIGH (policy, F) / LOW (INR rates) | F/S |
| D5 | SMS (DLT): published rate cards ~Rs 0.11-0.25/SMS excl. GST + DLT registration; Fast2SMS own page: Rs 0.21 promo, OTP Rs 0.35; MSG91 ~Rs 0.17-0.25. | S35 | 2026 | MED | S |
| D6 | Push notifications (FCM/Expo/Web Push): no per-message fee — standard knowledge, **not sourced this session**. | — | — | LOW | — |
| D7 | Map tiles/geocoding hosted options (MapTiler/Stadia), domain (.in), Marathi translation/QA rate: **not researched / not found**. OSM public tile server is demo-use only per its policy (also in DATA_SOURCES.md). | — | — | — | — |

**ESTIMATE — monthly pilot cost, 1 city, 10,000 users** (assumes USD 1 = Rs 90; verify rate; excl. GST):
- Supabase Pro $25 + one step up in compute ~ $15 = $40 ~ Rs 3,600
- Alerts: 15 alerts/user/month. 85% via free push; 10% via WhatsApp utility (1,000 users x 15 x Rs 0.115 = Rs 1,725); 5% via SMS (500 x 15 x Rs 0.21 = Rs 1,575). Total messaging ~ Rs 3,300
- Web hosting (Vercel Hobby/Pro $20 ~ Rs 1,800) ; maps ~ Rs 0-5,000 (unsourced)
- **Total ~ Rs 8,700-13,700/month (ESTIMATE)** -> **~Rs 0.9-1.4 per user per month**. Dominated by messaging mix; the repo's earlier "Rs 3-8k/month" sketch is of the same order.

---
## E. Impact-model inputs

| # | Fact | Src | Date | Conf | Depth |
|---|---|---|---|---|---|
| E1 | GHG Platform India (consultation v1.0): suburban rail ~0.00795 kg CO2/passenger-km (~8 g/pkm); non-suburban 0.00794. | S36 | ~2015 | HIGH (primary, draft) | S |
| E2 | GHG Platform India road transport paper: bus 0.015161 kg CO2/pax-km (~15 g/pkm; not for BRTS/intercity). Down To Earth estimates CNG bus ~53 g/pkm on its own assumptions — **the two differ ~3.5x; pick one and disclose**. | S36, S37 | n/d | HIGH / MED | S |
| E3 | Car tailpipe 148-192 g CO2/km per vehicle (India Environment Portal); per-passenger value needs an occupancy assumption (not sourced). TERI's Delhi per-passenger table exists but figures not read. ITF/OECD lifecycle study gives e-bus/metro lowest; metro per-pkm factor for India: **not found**. | S37, S38 | n/d | MED | S |
| E4 | Pune autos (from 1 Sep 2026): Rs 30 for first 1.5 km + Rs 20/km, +25% midnight-5am. Pune app cabs (RTA-approved, from 1 May 2025): Rs 37 first 1.5 km then Rs 25/km (one report says Rs 75 first 3 km — conflicting). Mumbai (Sep 2026): auto min Rs 27, Rs 18.22/km; taxi Rs 21.90/km. | S39 | 2025-26 | MED | S |
| E5 | PMPML new fare structure from 1 Jun 2025: 11 stages, base Rs 10. Pune Metro Rs 10-35 (slab list from a blog; Maha-Metro chart not fetched). Mumbai Metro Line 3: Rs 10 (<=3 km) up to Rs 80 cap beyond 42 km. | S40 | 2025 | MED | S |
| E6 | Value of time proxy: regular urban employees average **Rs 25,501/month** (PLFS 2023-24, via Economic Survey 2024-25). ESTIMATE: /(26 days x 8 h = 208 h) = ~Rs 122/hour. FY2024-25 urban PLFS value not found. | S41 | 2025 | MED | S |

---
## F. Challenge and winner patterns
| # | Fact | Src | Conf |
|---|---|---|---|
| F1 | Guide's judges' lens (4): evidence (names/numbers/photos), working demo, fits money government already spends (which department's cost it replaces), deliverable pilot plan (what/where/by when/who). "Address a designation, not a person"; MSInS is "the state's front door". Invented numbers "are always caught" — label baselines honestly. | S4 | HIGH |
| F2 | Maharashtra Startup Week (MSInS): winners got work orders up to Rs 15 lakh to run proofs of concept (24 winners in 2020 edition). Mobility/infrastructure was a category. Named transport winners: **not found**. | S42 | MED |
| F3 | Smart Move Innovative Urban Mobility Challenge (MoHUA): IIT Roorkee won with a public-transport product tested in **Bhubaneswar** (not Maharashtra). | S43 | MED |
| F4 | Mercedes-Benz R&D India mobility challenge named Tummoc and Namma Yatri winners (private-sector challenge). | S43 | MED |
| F5 | SIH 2025 Pune finals (MIT-ADT): winners were hardware teams; no state adoption of a transport entry found. | S43 | MED |
| F6 | Pattern: government-challenge wins with adoption usually carry a **named agency counterpart + a live data feed + a time-boxed pilot**. (Our synthesis, not a sourced fact.) | — | LOW |

---
## G. Data and compliance
| # | Fact | Src | Conf | Depth |
|---|---|---|---|---|
| G1 | DPDP Rules 2025 notified 13 Nov 2025 (G.S.R. 846(E)); phased implementation (Board provisions immediate; consent-manager and core duties later, ~18 months). Rule 10: verifiable parental consent for children; guardian consent for persons with disabilities. | S44 | MED (law-firm analyses) | S |
| G2 | DPDP Act 2023 statute text (recalled; **MeitY PDF returned 403, not read**): notice + consent; child = under 18, no tracking/behavioural monitoring of children; breach notification; penalties up to Rs 250 crore (security safeguards) / Rs 200 crore (children/breach duties); publish contact of a person answering data-principal questions (DPO for significant fiduciaries); Section 17 allows State exemptions. Verify against the Act before quoting sections/amounts. | S45 | LOW-MED | — |
| G3 | Maharashtra State Data Policy: Cabinet approved draft 25 Feb 2025 (data advisory under MITRA; aimed at government schemes). No official Maharashtra open-data/GTFS policy found; MSRTC GTFS mention is a project-log claim only. Kochi (2018) and Hyderabad are open-transit-data precedents. | S46 | MED/LOW | S |
| G4 | MSRTC / BEST: no official open feed (repo's DATA_SOURCES.md); BEST/PMPML GTFS used are community feeds by croyla under **MIT-0**; Datameet railways under **ODbL-1.0**. | repo | HIGH (repo) | F |
| G5 | Indian Railways/NTES data: current licence terms **not found**; treat live running status as requiring CRIS/Railways agreement. | S28 | LOW | S |
| G6 | OSM: ODbL requires attribution "© OpenStreetMap contributors" and share-alike on derived databases (standard licence terms; not re-fetched). Public tile server is not for production use. | repo | MED | — |

---
## H. DO NOT CLAIM
1. "Submission deadline 6 Nov / institution-led / Surakshit Bharat" for Maharashtra — that is the South Zone site (0.1).
2. "93 lakh daily suburban riders" (A3) or any "world's busiest" claims — conflicting measures.
3. "Mumbai locals are X% late" — only disputed official 92-95% punctuality and an unmethodological FPJ headline.
4. Any statement that Google Maps *lacks* "arrive by", or that it has no live transit in Mumbai/Pune — unverified either way.
5. That PMPML ITMS / BEST ITMS "cost Rs X and SafarSetu replaces it" — BEST Rs 112 cr (2018) is a hardware+PIS project; SafarSetu does not replace GPS hardware. Say "complements".
6. CO2 savings in g/pkm for metro or cars — no sourced metro factor; bus factor sources disagree 3.5x.
7. "People lose X hours because of unplanned connections" — no source; TomTom hours are car-traffic.
8. WhatsApp/SMS prices as official — INR rates are from blogs.
9. Pune Metro/PMPML single-day record ridership numbers — conflicting.
10. Time saved/cab trips avoided/pilot results — none measured; the app's impact counters and 56 seeded reports are synthetic (DATA_SOURCES.md).
11. Real-time/live data — demo uses a disruption simulator; PMPML/BEST timetables are community-derived, in-between stop times modelled.
12. Work order "guaranteed Rs 10 lakh" — page says up to, subject to due diligence.

### 12 strongest verified facts for a 6-slide deck
1. (Slide 1/problem) Mumbai suburban rail carries ~68 lakh passengers a day on average, ~1.25 crore on the 5 Jan 2026 peak day — S6 (MED).
2. PMPML runs ~2,049 buses (≈1,650 on road) carrying ~10 lakh passengers/day — S11 (MED).
3. MSRTC carries ~50-55 lakh passengers/day — S14 (MED).
4. TomTom 2025: 33 min 20 s per 10 km in Pune, 28 min 51 s in Mumbai; Pune ~152 h/yr, Mumbai ~126 h/yr in traffic — S15/S16 (HIGH/MED).
5. PMPML logged ~60 breakdowns a day on average, >1,000 scheduled trips cancelled on bad days — S19 (MED).
6. Official suburban punctuality 92-95% is disputed by commuters (10-20 min peak lateness); 1,404 of 1,414 WR services delayed on 23 Jun 2025 — S18 (MED).
7. 2,287 deaths on Mumbai suburban rail in 2025, 525 from falls off trains — S23 (MED).
8. Women: 92% of 504 surveyed Mumbai bus-stop users cite overcrowding, 48% safety — S24 (MED).
9. WRI India: walking + shared modes >75% of last-mile share; riders tolerate ~20 min access — S21 (HIGH).
10. Mumbai One (MMRDA) proves integration appetite: 1.04 crore tickets in ~10 months across 11 operators — but it is ticketing, not day-planning — S10 (MED).
11. Google Maps does not support multi-stop directions for public transit — S25 (MED, Google Help).
12. Government already spends: BEST ITMS Rs 112 crore (2018); Pune ATMS Rs 133 crore + Rs 52 crore O&M; PMPML Rs 25-30 crore/yr breakdown losses — S29/S30/S19 (MED).
(Challenge facts for the *application* slide: 0.2-0.7, HIGH.)

---
## Gaps not verified
Marathi/real-time coverage stats; divyang accessibility data; Pune-specific first/last-mile data; PMPML ITMS and CMP consultancy rupee values; MSRTC open feed status; NTES licence terms; Render/Railway/map-tile/domain/translation prices; Meta INR rate card; metro and car g/pkm; FY24-25 PLFS urban wage; Maharashtra open-data policy text; named Maharashtra transport challenge winners; live Google Maps "arrive by" and 2026 transit coverage; official designations/URLs not re-fetched.
