# 14 — Pilot plan (the deliverable the judges ask for)

> The guide's judges' lens: *a deliverable pilot plan — what you will deliver, where, by when, and who runs it.* Targets below are **plans, not results**. Nothing has been piloted yet.

## Problem line (guide Step 1)
**People with a day of work to do lose time and trust because the buses, metro and trains they need are not planned around their deadlines — and they learn about delays only at the stop.** Sourced context: [docs/research/seva-research.md](research/seva-research.md) §A. Primary evidence: **baseline interviews are planned, none done** (kit: `/field`, [15](15-field-research-kit.md)).

## Owner in government (Step 5)
| Level | Body | Designation to address | Why they would adopt |
|---|---|---|---|
| State | Urban Development Department (GoM) | Principal Secretary | Parent of the municipal bodies, MMRDA/PMRDA; funds mobility planning |
| City bus | PMPML (Pune) / BEST (Mumbai) | CMD / General Manager | Riders' trip planning and complaint intelligence complement their ITMS and grievance channels |
| Region | MMRDA / PMRDA | Metropolitan Commissioner | Integrated ticketing (Mumbai One) has no day-planning or gap evidence |
| Metro | Maha-Metro | Managing Director | Feeder-gap evidence for station catchments |
| Innovation | MSInS / SEEID Dept | Member Secretary | Runs this challenge; pilot sponsor |
*Status: none approached. No MoU exists.* Local office to physically reach first: PMPML head office (Swargate) or the ward office of Hinjewadi/Shivajinagar corridor.

## Four stages (Step 6) — one number each
| Stage | Scope | Number | Run by | Success = |
|---|---|---|---|---|
| 1 Prove it | **1 corridor** (Hinjewadi ↔ Shivajinagar, Pune), 4 weeks | **30 commuters** | us + 1 college/IT-park **field ambassador** | Baseline vs after: minutes lost/week, ₹/week, missed connections (same questions) |
| 2 Repeat it | **5–10 sites** (colleges, IT parks, ward offices) with a one-page "how to run" sheet | **300 users** | site volunteers (not us) | Result holds when we are not present |
| 3 City level | **1 PMPML depot area** or BEST ward, via Urban Development / PMPML | **3,000 users** | PMPML/BEST nominated nodal officer + our **data steward** | Gap ranking used in a service review |
| 4 State | **3 cities** (Pune, Mumbai, Nashik/Nagpur) | **30,000 users** | agency nodal officers | Another agency copies it unprompted |

Two scaling tests (guide): does cost per site fall or stay flat? (target: flat or falling — a site needs a volunteer, not an engineer); who runs it at each site? (a named volunteer role).

## Measurement (Step 4) — before / after
| Measure | How | Baseline | After |
|---|---|---|---|
| Minutes lost / week to waiting & missed connections | Interview + trip log | **to be collected** | to be collected |
| ₹ spent on cab/auto fallback / week | Interview | to be collected | to be collected |
| Alerts judged useful ("told me what to do") | 1-tap rating on each alert | n/a | to be collected |
| Plans completed on time | App log (consented) | n/a | to be collected |
| Gap reports filed / actioned | Portal | 0 | to be collected |
Report **n and dates with every number**; where untested say "not yet tested".

## Finance (Step 7) — all estimates
Basis: [research §D](research/seva-research.md) (Supabase Pro $25/mo; Vercel $20; SMS ≈ ₹0.11–0.25; WhatsApp utility ≈ ₹0.115 from blogs; ₹90/$ assumed).
| Item | Stage 1–2 | Stage 3 (3,000 users) | Stage 4 (30,000) |
|---|---|---|---|
| Cloud + DB | ₹3,600/mo (Pro + compute) | ₹3,600–7,000/mo | ₹10,000–20,000/mo |
| Alerts (push free; 10 % WhatsApp, 5 % SMS) | ≈ ₹100/mo | ≈ ₹1,000/mo | ≈ ₹10,000/mo |
| Web hosting + maps | ₹0–2,000/mo | ₹2,000–5,000/mo | ₹5,000–15,000/mo |
| People: data steward (part-time), field ambassador | stipend, outside this estimate | ≈ 1 data steward | 1 steward / city |
| **Cost per user / month** | — | **≈ ₹1–3** | **≈ ₹1** |
| Who pays | us / college / prize | agency pilot budget | agency / CSR |
**Fits money governments already spend** (research §C): BEST ITMS ₹112 crore (2018), Pune ATMS ₹133 crore + ₹52 crore O&M, PMPML breakdown losses ₹25–30 crore/yr — SafarSetu **complements** these (rider planning + gap evidence), it does not replace GPS hardware. Benefit side: modelled ₹/day vs all-cab day (`/impact`) — a model, not a measured saving.

## Risks and honest limits
- Bus in-between stop times are modelled by the community feed; metros/locals are synthetic in the demo → Stage 1 must use a corridor with real timetable coverage (PMPML) and verify on the ground.
- No live agency feeds yet; alerts are driven by the disruption simulator in the demo. Pilot needs GTFS-RT/operator alerts (research §G).
- Marathi/Hindi text needs native-speaker review before any pilot.
- DPDP Act duties (consent, grievance contact) apply from Stage 1.

## Timeline
| When | Milestone |
|---|---|
| Month 0–1 | 10+ baseline interviews; approach PMPML / Urban Development; Marathi review |
| Month 1–3 | Stage 1 (30 users, 4 weeks) + write-up |
| Month 3–6 | Stage 2 (300 users, 5–10 sites); agency pilot MoU |
| Month 6–12 | Stage 3 (3,000 users) with PMPML/BEST; second city data pack |
