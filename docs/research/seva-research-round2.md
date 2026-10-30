# SafarSetu — Seva research, round 2 (gap-closing)

Compiled 2026-10-30. Columns: fact | source (id -> `sources.json`, ids S100+) | date | conf | F/S.
**F** = page fetched and read this session. **S** = seen only as a web-search extract (re-open before putting on a slide).
Confidence: **HIGH** official/primary; **MED** reputable secondary; **LOW** uncertain. "Not found" = searched, not verified.
No personal phone numbers/emails of individuals are recorded. Names of officers are deliberately omitted (address a designation).

---
## 1. Live data: what exists and the legal path

| # | Fact | Src | Date | Conf | F/S |
|---|---|---|---|---|---|
| 1.1 | **No public GTFS-Realtime feed or open live-vehicle API for PMPML, BEST, Maha-Metro, MMRDA or Indian Railways was found.** Searches returned only static GTFS and agency apps. Delhi (Nov 2018) is the Indian example of an official open static+real-time bus feed; Kochi Metro (2018) and Hyderabad opened static GTFS. | S142, S143 | 2018-2019 | MED | S |
| 1.2 | PMPML + Google Cloud (via Niveus Solutions) announced 1 Nov 2022 a system ingesting on-board-unit data, validating it against GTFS and publishing it through the Google Maps Partner Dashboard "Live Transit Updates". PMPML then ran 2,142 buses / 371 routes. No cost disclosed. A pilot of 20 buses/20 routes was reported (Oct 2022). | S105 | 2022-11-01 | HIGH (Google Cloud press page) | F |
| 1.3 | Later local reports say the Google tracking effort hit technical issues and PMPML built its own app instead. I found **no confirmation that PMPML buses went live on Google Maps**. (Search-extract summary of several outlets.) | S107 | 2024-25 | MED/LOW | S |
| 1.4 | Aapli PMPML launched 15 Aug 2024 with live tracking. Joint MD said (1 Oct 2024) tracking was installed on 1,300 buses with 300 more within ten days; commuters said not all buses show and GPS isn't on all buses. 4.76 lakh downloads then. | S106 | 2024-10-01 | MED | F |
| 1.5 | **BEST on Google Maps live**: BEST buses became trackable live on Google Maps, launched by the Chief Minister (article 9 May 2025); data in Marathi, Hindi, English; GTFS format; integrated with Indian Railways and Mumbai Metro timings; BEST worked with Google for ~2 months. Routes/bus count not stated. | S104 | 2025-05-09 | MED | F |
| 1.6 | Google Maps (June 2019): bus travel times from live traffic in 10 cities incl. Mumbai, Pune; live Indian Railways train status. | S113 | 2019-06 | MED | S |
| 1.7 | `croyla/pmpml-gtfs`: MIT-0; repo created 2025-10-27; **last push 2026-10-07**. `croyla/mumbai-gtfs`: MIT-0; created 2026-04-17; **last push 2026-08-19** (updated 2026-10-12). Both are static GTFS. | S100, S101 | 2026-10-30 | HIGH (GitHub API) | F |
| 1.8 | **Provenance of PMPML GTFS**: generated from the Apli-PMPML (Chartr) API at `prod-pmpml-routesapi.chartr.in`, default key "test"; README gives no refresh cadence (each run regenerates in ~5-15 min), no realtime, trip times from an assumed 20 km/h average, outliers removed. README states nothing about the **licence of the underlying PMPML/Chartr data** — MIT-0 covers the script/output, not PMPML's rights. | S102 | 2026-10-30 | HIGH (README) | F |
| 1.9 | crola (the author) logged (25 Aug / 28 Sep 2026) a FOSS United grant plan: "Public GTFS-RT feed infrastructure for Pune and Bengaluru"; Pune feed set up from a "currently closed-source" repo and "needs work"; MSRTC state-wide GTFS: "a complete feed seems unlikely given the current situation". No licence statement. | S111, S112 | 2026-09-28 | MED | F |
| 1.10 | **opendata.pmc.gov.in** (Pune Municipal Corporation): page fetched lists Datasets/Departments/Reports/Open Data Policy; no transport/PMPML/GTFS dataset visible on the landing page; reuse terms not shown (footer: all rights reserved). Contact on page: opendata@punecorporation.org (generic office address). | S103 | 2026-10-30 | HIGH | F |
| 1.11 | Pune is an IUDX (India Urban Data Exchange) city but the Pune dataset in a 2021 deployment deck is Safetipin safe-routes, not transit. IUDX is not GTFS-native (community post). MoHUA/NUDM guideline mandating GTFS from bus operators: **not found**. | S143, S142 | 2021 | LOW-MED | S |
| 1.12 | Maharashtra open-data policy: Round 1 found only the State Data Policy cabinet nod (Feb 2025). No Maharashtra open transit-data policy found again. | S46 (round 1) | 2025-02 | MED | S |
| 1.13 | NTES licence/API terms for third parties: **not found** (CRIS annual report only describes NTES integrations with IRCTC/139). UK precedent exists but is not evidence about India. | S28 | — | — | S |
| 1.14 | Chalo / Mumbai One: no public developer API documentation found. | S110 | — | MED | S |

**Realistic path to live delays, legally (our synthesis; no source says this is the route):**
1. **Now (demo/pilot Stage 1):** keep the delay simulator + crowd/user-reported disruptions (already how the demo works). Label as such. Do not claim live data.
2. **Stage 1 ask:** a one-page data-sharing letter to the agency's designated officer (PMPML CMD for GTFS-RT from its ITMS; BEST General Manager for the feed that already goes to Google; MMRDA for Mumbai One's data) — request *read-only GTFS-RT + written permission to display*, no money. BEST already publishes to Google in GTFS (1.5) and PMPML already ingests OBU data in GTFS-validated form (1.2), so the *technical* ask is small; the *permission* is the gap.
3. **Do not** scrape the Chartr/Apli-PMPML API with the "test" key for production — its terms are unknown (1.8). Keep using the MIT-0 static GTFS for schedules but disclose provenance.
4. Seva framing: the work order's first deliverable can be "an MoU/data-sharing note + a GTFS-RT adapter"; the adapter is the cheap part.

---
## 2. Competitor feature verification (fair and precise)

| # | Fact | Src | Date | Conf | F/S |
|---|---|---|---|---|---|
| 2.1 | **Google Maps does offer "Depart at / Arrive by" for transit** — Google Help: "This feature is only available for Driving and Transit" and "This feature is only available if you have one destination." So scheduling exists but **only for a single destination**. (Supersedes round-1 "unverified".) | S108 | 2026-10-30 (help page current) | HIGH | F |
| 2.2 | Round-1 S25 (Google Help): multi-destination directions are not available for public transport. Together with 2.1 the precise safe claim: "Google Maps lets you set arrive-by for one transit destination; it does not plan a multi-stop transit day." I did not re-fetch the multi-stop help page this round (2839911 did not contain it). | S25, S108 | — | MED/HIGH | S/F |
| 2.3 | Google Maps live transit in Mumbai/Pune: 2019 launch (1.6); BEST live on Google Maps May 2025 (1.5); PMPML on Google Maps live **not confirmed** (1.3). | S113, S104, S107 | 2019-2025 | MED | S/F |
| 2.4 | **Mumbai One (MMRDA)** — launched 9 Oct 2025; **Hindi, Marathi and English interfaces**; 11 operators; multimodal journey planner ("fastest and most cost-effective routes"); real-time updates incl. "service advisories, route changes and traffic alerts". Other outlets describe delay/disruption/crowding alerts and alternate routes. Launch-time descriptions; no 2026 feature notes found. Not on iOS at launch. | S109, S110 | 2025-10 | MED | F (FPJ) / S |
| 2.5 | Moovit: real-time arrivals from GPS where available; launched Mumbai 2016. **Marathi UI in Moovit: not found. PMPML coverage in Moovit: not confirmed here** (round 1 said Pune covered, MED). Multi-stop: none found. | S114, S26 | 2016/2025 | MED | S |
| 2.6 | Yatri (third-party app): English/Hindi/Marathi UI; BEST, PMPML, TMT etc. **timetables** (not live PMPML). | S114 | n/d | LOW-MED | S |
| 2.7 | Aapli PMPML: commuters said (Oct 2024) it lacked Marathi ("language barrier is a major issue", seniors prefer Marathi). Current language support not re-checked. | S106 | 2024-10-01 | MED | F |
| 2.8 | Chalo in Pune/PCMC: **not found** (searched; only PMPML's own app). Chalo does live tracking + crowding in Mumbai (round 1). | S22 | — | MED | S |
| 2.9 | m-Indicator Marathi UI / delay-aware replanning / multi-stop: **not verified** (no evidence either way). | S27 | — | — | — |
| 2.10 | Is any app doing "work-day / multi-appointment planning on Indian public transit"? Searched news/app listings: found tools for A-to-B (TellMyRoute, Mappls, MetroMarg, DistancesBetween). **None found that orders several appointments with deadlines**. Absence of evidence from one broad search, not proof; the app stores themselves (Play/App Store) were not searched. | S110/S142 | 2026 | LOW-MED | S |

**Safe originality sentence:** "Google Maps lets you arrive by a time at *one* transit destination; Mumbai One plans single multimodal journeys and shows advisories. We found no Indian app that plans a *day of several stops* with be-there-by times and slack-aware alerts in Marathi — we searched and did not find one, but did not audit the app stores." **Do not** say "no Marathi transit app exists" (Mumbai One and Yatri have Marathi).

---
## 3. Marathi/Hindi language evidence

| # | Fact | Src | Date | Conf | F/S |
|---|---|---|---|---|---|
| 3.1 | Census 2011 mother-tongue counts for Maharashtra (secondary table): Marathi 77,461,172; Hindi 14,481,513; Urdu 7,540,324 of ~112.3 million -> **about 69% Marathi, ~13% Hindi, ~6.7% Urdu** (shares are our division). Exact official table C-16 not fetched; another source lists Hindi 9.7%, so quote "about two-thirds Marathi". | S115 | 2011 | MED | S |
| 3.2 | Mumbai city: Hindi speakers grew >40% while Marathi speakers fell 2.64% (45.23 -> 44.04 lakh) in 2011 census coverage; Marathi still the largest group. | S115 | 2011 | MED | S |
| 3.3 | IAMAI-Kantar "Internet in India 2024": 886 million active users (+8% y/y); 98% accessed content in Indic languages; rural 55% share (488 m); ~57% of urban users prefer regional language (single outlet reading). **No Maharashtra-specific split found.** | S116 | 2025-01-16 | MED | S |
| 3.4 | Public-transport apps lacking Marathi: Aapli PMPML in Oct 2024 (3.2/2.7). Mumbai One, BEST-on-Google do offer Marathi (1.5, 2.4) — so the gap is **Pune bus/regional** more than Mumbai. | S106, S104, S109 | 2024-25 | MED | F |
| 3.5 | Marathi/Hindi share of *smartphone* users or of transit-app users in Maharashtra: **not found** (no Pew/Kantar state split). | — | — | — | — |
| 3.6 | Bhashini (Digital India BHASHINI Division) — govt translation/speech APIs for Indian languages; free-access claim comes from third-party pages; official pricing/limits and Marathi quality **not verified**. Useful as a *reviewer aid* not a replacement for human review. | S141 | 2024-26 | LOW-MED | S |

---
## 4. Government offices (designations + official URLs only)

| Body | Designation confirmed | Official page / pathway (as found) | Conf | F/S |
|---|---|---|---|---|
| PMPML | **Chairman & Managing Director (CMD)** per reports (23rd CMD since 2007, Mar 2026 — extreme churn: 22 CMDs in 17 years per an FPJ headline). Note: pmpml.org press-release link mentions a "Chief Executive Officer" post — **re-check the live title before printing**. | https://pmpml.org ; grievances page https://pmpml.org/grievances ; media contact https://pmpml.org/media_contact ; helpline shown on site (two different numbers on the page; verify) | MED | F (site) / S (news) |
| BEST Undertaking | **General Manager** (listed under "Key Person") | https://bestundertaking.com ; contact https://bestundertaking.com/contact.asp ; toll-free listed on homepage; no open-data/GTFS mention | HIGH | F |
| MMRDA | **Metropolitan Commissioner** (news calls the head "Commissioner, MMRDA"); site fetch failed (certificate error) | https://mmrda.maharashtra.gov.in ; 24x7 Safety & Response Co-ordination Centre reported; grievances route to state portal (third-party forum, not official) | MED | S |
| Maha-Metro | **Managing Director** | https://www.mahametro.org (contact.html, about.html#directors; tenders link to punemetrorail.org/tenders) | MED | F (nav only) |
| MSRTC | **Vice Chairman & Managing Director**; Chairman = Transport Minister | https://msrtc.maharashtra.gov.in : Complaints_and_Redressal.aspx, Grievance.aspx, Suggestions.aspx, RTI_Act.aspx, CentralOffice_contact.aspx; toll-free 1800 22 1250 (on site) | HIGH | F |
| Urban Development Dept | Department has **Principal Secretary (UD-1 / UD-2)** posts (2023 report); current holders and official site **not fetched** (udd.maharashtra.gov.in failed) | State portal: grievances.maharashtra.gov.in (named by a third-party forum); Aaple Sarkar (round 1) | LOW-MED | S |
| Skills, Employment, Entrepreneurship & Innovation (SEEID) Dept / MSInS | MSInS = "nodal agency under the Department of Skills, Employment, Entrepreneurship and Innovation" (2026 recruitment listing); society registered 18 Aug 2017. Member Secretary / Principal Secretary names **not found**. | Challenge office: support@sevainnovationchallenge.in (generic), Fort, Mumbai (S1 from round 1) | MED | S |

---
## 5. Existing spend lines (verified rupee figures)

| # | Fact | Src | Date | Conf | F/S |
|---|---|---|---|---|---|
| 5.1 | **BEST ITMS: Rs 112 crore** project (stop announcements in three languages, LED boards, real-time tracking app); tracking on 1,246 of ~3,300 buses, PIS planned on 1,899. (Round 1 cited HT Nov 2018; FPJ confirms with date.) | S126 | 2019-05-29 | MED | F |
| 5.2 | **PMPML tracking devices (VLTD + panic button): Rs 15,063.50 per unit** incl. GST, registration, 2-year warranty, 7-year maintenance, bought through **GeM**; activist alleges total ~Rs 64 lakh and market price ~Rs 6,000/unit; PMPML denies wrongdoing. Count of units not stated. *This is hardware, not a passenger-information system.* | S125 | 2025-04-01 | MED | F |
| 5.3 | **PMPML ITMS / passenger-info software total: not found.** Google Cloud MoU: no value disclosed. Aapli PMPML build cost/vendor: not found. | S105 | 2022 | HIGH | F |
| 5.4 | Peer benchmark (not Maharashtra): BMTC GPS Rs 79 crore over 5 years BOT; Chennai ITMS Rs 650 crore (search extracts). | S127 | n/d | LOW-MED | S |
| 5.5 | **CMP / transport-survey consultancy fee in Maharashtra: not found.** Only: MMRDA CTS-update RFP bid processing fee Rs 1,00,000 (a bidder fee, not contract value); Nagpur Rs 25,567 crore and BMC Rs 1.68 lakh crore are plan investment values, not fees. | S128 | 2021 | MED | S |
| 5.6 | **Annual grievance / call-centre cost for PMPML/BEST: not found.** | — | — | — | — |
| 5.7 | **Maharashtra Startup, Entrepreneurship & Innovation Policy 2025** (cabinet-approved; article 6 Aug 2025): Startup Week winners get **pilot work orders up to Rs 25 lakh** (older editions: up to Rs 15 lakh); **each state department to allocate 0.5% of annual funds to innovation/entrepreneurship**; executed through MSInS. This is the strongest "fits money the government already earmarks" line; **the Seva page's "up to Rs 10 lakh" is a separate figure**. Total of 0.5% not computed. | S137 | 2025-08-06 | MED (secondary) | F |

---
## 6. DPDP Act 2023 + Rules 2025 (primary text partly unreadable; law-firm/PRS summaries)

| # | Fact | Src | Date | Conf | F/S |
|---|---|---|---|---|---|
| 6.1 | Act: lawful purpose + consent after notice; consent withdrawable any time; "legitimate uses" without consent exist (e.g., State benefits/services, medical emergency, employment, voluntary sharing). | S129 | 2023-08 | HIGH-MED (PRS) | F |
| 6.2 | Child = under 18; parental/guardian consent; no processing detrimental to well-being; penalty up to Rs 200 crore for children's obligations; up to Rs 250 crore for failing security safeguards; Rs 10,000 for a principal's duty violation. Data principal rights: information, correction, erasure, nominate, grievance redressal; appeals to TDSAT. | S129 | 2023-08 | HIGH-MED | F |
| 6.3 | Rules notified **13 Nov 2025** (gazette dates 13/14 Nov vary by source; G.S.R. 846(E) cited). Phasing: Board/definitions immediate; consent-manager provisions ~12 months (Nov 2026); notice, consent, security, breach intimation, children's duties, rights ~**18 months (~13/14 May 2027)**. | S130 | 2025-11 | MED | S |
| 6.4 | Breach: notify Board and affected principals; Rule 7 widely summarised as ~72 hours (detailed report to Board). | S130 | 2025-11 | MED | S |
| 6.5 | **2026 timeline change proposed, not confirmed final:** MeitY consulted (23 Jan 2026; comments to 4 Feb) on cutting the general window 18 -> 12 months (to **13 Nov 2026**), notifying SDFs sooner, enforcing s.17(2) State exemptions and Rule 8(3) retention within 90 days. Latest source 15 Apr 2026 still calls it a plan. **Check the MeitY gazette before assuming May 2027.** | S131 | 2026-02-13 | MED | F |
| 6.6 | PIB primary PDF (17 Nov 2025) was fetched but is compressed; contents not readable. MeitY Act PDF 403 in round 1. So rule numbers are from secondary summaries. | S130 | 2025-11-17 | — | F (unreadable) |
| 6.7 | CERT-In Directions (28 Apr 2022, effective 27 Jun 2022, under s.70B(6) IT Act): report specified cyber incidents within **6 hours**; keep ICT logs **180 days** rolling; covers body corporates and govt orgs. Law-firm summaries only. | S140 | 2022 | MED | S |

**10-line practical checklist (prototype that stores anonymous reports + optional location)**
1. Collect the minimum: report category, free text, stop/route id; location **optional and coarsened** (e.g., stop or ~100 m grid), off by default.
2. Show a short **notice before** collection (what, why, retention, who to contact) in English/Hindi/Marathi; consent as an explicit, unticked action; easy "withdraw/delete".
3. Make anonymity real: no account, no phone/email, no device ID in the report row; do not combine with traces from the planner.
4. **Under-18s:** the Seva form says under-18 needs guardian consent; for the app either block child profiles or require verifiable parental consent; no tracking or targeted behaviour for children.
5. Name a **grievance contact** (a designation mailbox) and a response SLA; keep a log (Rules: answer principals' requests).
6. Retention: define a deletion period (e.g., raw reports 12 months, aggregates indefinitely) and implement it as a scheduled job.
7. Security basics: TLS, hashed/rotated tokens, role-scoped authority access, audit log; keep logs 180 days (CERT-In) without personal data in them.
8. Breach runbook: who decides, 6-hour CERT-In report, 72-hour Board/principal notice; test it once.
9. Processors/vendors (hosting, SMS/WhatsApp): written processing terms; note cross-border hosting.
10. Treat 13 Nov 2026 vs May 2027 as unsettled; comply now as if the earlier date applies, and have a lawyer read it before any pilot with real users. Not legal advice.

---
## 7. Women-safety and accessibility evidence

| # | Fact | Src | Date | Conf | F/S |
|---|---|---|---|---|---|
| 7.1 | Safetipin + Akshara Mumbai audit (2017): city rated 56% safe; **only 31% of streets adequately lit; only 22% walkable**; audited sunset-10 pm. | S132 | 2017 | MED | S |
| 7.2 | Safetipin Pune safety audit 2019: 650 km, 6,632 audits (no lighting % in extract). | S132 | 2019 | MED | S |
| 7.3 | She Shakti Suraksha Survey 2025 (8,000 women, 20 cities): 82% feel secure by day vs **48% at night**; 70% comfortable travelling alone by day vs **36% at night**; only **44% think public transport is safe**. National, not Maharashtra-only. | S133 | 2025 | MED | S |
| 7.4 | Greenpeace India (Mumbai bus stops, 504 women): 92% overcrowding, 48% safety (round 1, S24). | S24 | 2024 | MED | S |
| 7.5 | RPwD Act 2016 s.41: appropriate government to take measures for accessible facilities at bus stops, stations and transport; Supreme Court 2017 *Rajive Raturi* read it as requiring accessibility across modes (secondary descriptions). | S134 | 2016/2017 | MED | S |
| 7.6 | Accessible India Campaign (PIB): of 1,47,368 buses of 62 STUs, **42,169 (28.61%) partially and 10,175 (6.90%) fully accessible**; a Mar 2025 parliamentary answer cites target 25% of govt buses fully accessible. National; no Maharashtra split found. | S134 | 2021/2025 | HIGH-MED | S |
| 7.7 | Maharashtra Census 2011: 60+ share ~9.3% (one study; Economic Survey says ~10%; national 8.6%). Disabled population number for Maharashtra: **not found** this round. | S135 | 2011 | MED | S |

Use for "late-walk after dark warning" (7.1, 7.3) and "Gentle pace" for older/slower walkers (7.5-7.7). Say "national survey" where it is national.

---
## 8. Challenge intel (re-read of sevainnovationchallenge.in, 2026-10-30)

| # | Fact | Src | Conf | F/S |
|---|---|---|---|---|
| 8.1 | "Last date to apply: 30 October 2026" (extended). Time of day not stated. | S136 | HIGH | F |
| 8.2 | Evaluation: administrative scrutiny -> two independent online evaluations (technical, impact) -> finalist validation -> Grand Jury; evaluators declare conflicts. | S136 | HIGH | F |
| 8.3 | No "what makes a good submission" section; the FAQ lists: problem (who/how many), solution + innovation, technology, expected impact, evidence of prototypes/pilots/users; concept-stage accepted if stated accurately. | S136 | HIGH | F |
| 8.4 | **Prototype/demo link accepted** ("Yes. You can provide a prototype/demo link or website/product link"). Demo **video** not mentioned. | S136 | HIGH | F |
| 8.5 | Pitch deck: **no size limit stated** — "follow the file format and size limit displayed on the application portal at the time of upload"; the 5 MB limit applies to ID docs. Six-slide structure confirmed. Keep deck well under ~5 MB to be safe (our inference). | S136 | HIGH | F |
| 8.6 | Timeline after 30 Oct (shortlisting, exhibition dates): **not stated**; selected candidates get registered-email notice; online/offline presentation details later. | S136 | HIGH | F |
| 8.7 | Maharashtra Startup Week (MSInS) history: 24 winners per edition with work orders (Rs 15 lakh) to pilot in govt departments; 2020 had a "Smart infra & mobility" category; 2019 mobility-adjacent winner ScoutMyTrip (travel planner). **No clearly transport-operator winners and no 2024/2025 winner lists found.** Pilot outcomes/scale-up rates: **not found**. | S138, S137 | LOW-MED | S |
| 8.8 | What past winners had in common: **not evidenced**. The only sourced mechanism is: work order = proof-of-concept inside a govt department + up to 12 months of govt hand-holding (2018-era description) + loan assistance if a public agency confirms a work order (2025 policy). Treat "named agency counterpart + live feed + time-boxed pilot" as our synthesis. | S137 | LOW | S |

---
## 9. Eight hardest questions a government evaluator may ask

| # | Question | Honest answer (sourced where possible) |
|---|---|---|
| 1 | **Is your data accurate?** | Schedules come from community GTFS (MIT-0) generated from the Apli-PMPML/Chartr API with speed-based in-between times and outlier removal (1.8); metro/locals partly synthetic; delays in the demo are simulated. Not live. State exactly that; pilot Stage 1 measures predicted-vs-actual on a sample. (S102) |
| 2 | **Who is liable if a plan is wrong and someone misses a meeting?** | No source found on liability for journey planners in India. Honest position: advisory only, shows data source + timestamp, no guarantee; consult counsel on terms of use. Mitigation = slack buffers and "you'll be late" alerts. **Unknown — needs legal review.** |
| 3 | **Who maintains the data after the pilot?** | Proposed: agency publishes GTFS (+GTFS-RT) as the source of record; SafarSetu keeps an importer. Reality today: PMPML/BEST feeds are community-maintained (last push 2026-10-07 / 2026-08-19) — a single-maintainer dependency (S100, S101, S111). |
| 4 | **How would a work order be placed — tender, GeM, nomination?** | Seva page: "eligible for a work order of up to Rs 10 lakh", subject to evaluation/due diligence (S1/S136). Mechanism (direct work order by MSInS vs GeM) **not documented**; Startup Week precedent is MSInS-issued pilot work orders (S137). Ask the helpline in writing. |
| 5 | **GeM / tender rules for a small vendor?** | Central rules: DPIIT-recognised startups are relaxed on prior experience, turnover and EMD (GFR 2017 rules 170(i), 173(i)); GeM Startup Runway exists; **states may differ** (Startup India page, S139). Maharashtra's own relaxations **not found** (the 2025 policy summary lists none). Practical: DPIIT recognition + GeM seller registration take time — start now. PMPML itself bought VLTDs through GeM (S125). |
| 6 | **Security?** | CERT-In 6-hour reporting + 180-day logs apply to body corporates (S140); DPDP obligations (S130/S131); we have role-scoped access, input validation, tests (scorecard) but **no external security audit, no VAPT** — say so; budget a VAPT in the pilot. |
| 7 | **Marathi quality?** | UI strings are machine-assisted and **not natively reviewed** (scorecard open item 4). Marathi is ~69% mother tongue in Maharashtra (S115), and Aapli PMPML was criticised for lacking Marathi in 2024 (S106). Plan: paid native review + Bhashini as reviewer aid (S141 unverified). |
| 8 | **Duplication with Mumbai One / Chalo / Google?** | Mumbai One: ticketing + single-journey planner + advisories, trilingual (S109, S110). Google: arrive-by for one transit destination only (S108). Chalo: bus-only live/tickets. Our wedge: ordered multi-stop day, deadline/slack logic, citizen gap report -> authority view. Be ready to say we **complement and could consume** Mumbai One/Google feeds, and that we found no multi-stop work-day app but did not audit the app stores. |

---
## (a) Updates to round 1
1. **A. B Google Maps "arrive by"**: now verified — available for Driving and Transit, **single destination only** (S108). Remove "unverified"; README/deck may say Google offers arrive-by for one stop but not multi-stop transit days.
2. **B Mumbai One**: round 1 said ticketing only; launch coverage says it also has a multimodal journey planner and advisories/delay alerts, and **Marathi/Hindi/English UI** (S109, S110). Do not claim "no Marathi transit app" or "no delay alerts in Mumbai". Mumbai One date is **9 Oct 2025** (round 1 gave a 10-month stat from Aug 2026).
3. **C PMPML designation**: reports say CMD (23rd CMD, Mar 2026), but pmpml.org press release lists a "Chief Executive Officer"; verify before print. BEST head = General Manager (confirmed on site, F). MSRTC head = VC&MD (confirmed, F).
4. **C1 BEST ITMS Rs 112 crore**: source is FPJ 29 May 2019 (fetched), not only HT 2018; scope = announcements, LED boards, tracking app. Round 1 **C2 "PMPML ITMS value not found"** still true; new verified hardware figure Rs 15,063.50/VLTD unit (S125).
5. **C4/C5/C6**: still not found (CMP fee, grievance cost).
6. **G1/G2 DPDP**: 18-month phase (to ~May 2027) is **under a proposal to cut to 12 months (Nov 2026)**, not confirmed final (S131). G2 "recalled" statute points now cross-checked against PRS (S129).
7. **G3**: crola's MSRTC GTFS "unlikely"; PMPML data origin is the Apli-PMPML/Chartr API with undefined licence for the underlying data (S102, S111).
8. **F2 work-order size**: Maharashtra Startup Policy 2025 raises Startup Week pilot work orders to **up to Rs 25 lakh** (older Rs 15 lakh); the Seva page's Rs 10 lakh is separate. Department 0.5% earmark is new.
9. **0.4/0.11** unaffected; challenge deadline still shows 30 Oct 2026 on the portal.

## (b) Top 10 new facts for the deck/docs
1. Google Maps: arrive-by/depart-at works for transit but **"only available if you have one destination"** — Google Help (HIGH, F).
2. BEST buses went live on Google Maps in May 2025, with Marathi/Hindi/English data (MED, F).
3. Mumbai One (9 Oct 2025): 11 operators, trilingual, multimodal planner and advisories — so position as "plans the *day*", not "first multilingual".
4. Aapli PMPML users said in Oct 2024 it lacked Marathi; tracking on ~1,300 buses then (MED, F).
5. BEST ITMS Rs 112 crore; tracking on 1,246 of ~3,300 buses at May 2019 (MED, F).
6. PMPML tracking devices Rs 15,063.50/unit incl. panic button + 7-yr maintenance, bought via GeM, April 2025 (MED, F).
7. Maharashtra Startup Policy 2025: pilot work orders up to Rs 25 lakh; each department earmarks 0.5% of annual funds for innovation (MED, F).
8. Marathi is about 69% mother tongue in Maharashtra (77.46 m of ~112.3 m), Hindi ~13% (census counts via secondary table, MED).
9. She Shakti Suraksha Survey 2025: 48% of women feel secure at night vs 82% by day; only 44% think public transport is safe (MED, S); Mumbai: only 31% of streets adequately lit (Safetipin, MED, S).
10. Seva portal accepts a prototype/demo link; no deck size stated (follow portal at upload); DPDP core duties due ~May 2027, possibly Nov 2026 (HIGH/MED).

## (c) Remaining unknowns
- Any legal route to live PMPML/BEST/Maha-Metro feeds (no GTFS-RT published; permission is the gap); NTES licence terms; whether PMPML is live on Google Maps.
- Underlying licence of PMPML data behind the Chartr API.
- Whether Moovit/m-Indicator/Chalo have Marathi UI, multi-stop or delay-aware replanning; app-store audit for "work-day planners".
- PMPML ITMS total, CMP consultancy fee, grievance/call-centre annual cost.
- Current holders/titles for UD Dept, SEEID, MSInS, MMRDA (site fetch failed), Maha-Metro MD; PMPML CMD vs CEO title.
- How a Seva work order is actually issued (direct vs GeM) and Maharashtra's startup relaxations in procurement; shortlisting/exhibition dates; any past transport winners and outcomes.
- Final status of the DPDP timeline compression; unreadable PIB primary PDF; official Census C-16 percentages; Maharashtra disability count; liability norms for journey planners; Bhashini terms.
