# 13 — Seva First scorecard and improvement loop

Loop run each round: **research → find gaps → find what wins → implement → update README / deck / docs → repeat.** Scores are my **self-assessment** (1–5), not a prediction; evidence links are real.

## Criteria (official) × evidence × honest gaps

| Criterion | Score now | Evidence in the repo | Biggest remaining gap | Next action |
|---|---|---|---|---|
| **Relevance** | 4 | Sourced problem facts (TomTom, PMPML, WRI…) in [research](research/seva-research.md); Marathi/Hindi; Gentle pace; late-walk warning; Urban-development sector fit | **No primary field evidence** (no interviews/photos yet) — the guide's #1 judging item | Run ≥ 10 interviews with the `/field` kit; add photos |
| **Originality** | 4 | Multi-stop plan with *be-there-by*, required stops and conflict reports; slack-aware calm alerts in 3 languages; deadline-aware "you'll be late" alerts; gap reports → ranked authority view. Google Help: no multi-stop directions for public transit | Competitor claims limited to what is verified; "arrive-by" in Google transit unverified | Verify on a phone before claiming either way |
| **Feasibility** | 3.5 | Working prototype: 9,430 stops/2,480 routes, real rail + PMPML + BEST data; 24 core + 7 API tests; load test; deployable stack | Metro/locals synthetic; no live agency feed; no pilot or MoU; Supabase adapter never run live | Stage-1 pilot ([14](14-pilot-plan.md)); GTFS-RT/alerts adapter; run Supabase locally |
| **Cost** | 4 | Demo ₹0; pilot ≈ ₹0.9–3 per user/month (estimate, [14](14-pilot-plan.md)); fits existing spend (ITMS, grievance) as a complement | WhatsApp/SMS INR rates unverified | Get Meta rate card; quote a Marathi reviewer |
| **Impact** | 2.5 | Transparent impact model (`/impact`) with sourced factors; addressable numbers sourced | **Nothing measured** — no baseline, no trial, no testimonials | Baseline interviews → 30-user 4-week trial; report before/after with n |
| **Scalability** | 3.5 | City = data pack (GTFS + places); 3 networks incl. state-wide rail; 4-stage plan with a number each; CSV export for agencies | Single Node thread: p95 ≈ 2.9 s at 10 concurrent plans | Worker threads / horizontal scale; precomputed transfer patterns |
| **Quality of solution** | 4 | Typed monorepo, tests, a11y fixes from audit, error handling (400s), role-scoped security, privacy notice | No public demo URL; no demo video; DPDP not legally reviewed | Deploy (Vercel + API host); record demo; legal read |

## Test log (this round)
| Test | Result |
|---|---|
| Unit/integration | core 24 / API 7 passing (`pnpm test`) |
| Deadline-aware alerts | delay that would make a meeting late now produces an explicit "you'll be late" alert (found and fixed during demo capture) |
| Scale of disruption feed | 2,000+ simultaneous delays: planning < 4 s (was 21 s before indexing by route) |
| API load (`/v1/plans`, Pune/Mumbai/Maharashtra mix) | 1 client: p50 110 ms, p95 271 ms · 10 concurrent: p50 685 ms, p95 2.9 s (single-threaded; expected ceiling) · 0 failures |
| Malformed input | `not json` returned 500 → fixed to 400 `invalid_json` |
| Accessibility (own audit, no external scripts) | Found: two `h1` per page, targets < 24 px, 4.4:1 secondary text, white-on-white label → all fixed; re-audit clean on `/`, `/report`, `/authority` apart from one lime-on-segment contrast (fixed) |
| Deck fidelity | 153 shapes compared with the template: 0 geometry differences; only the guidance box removed |
| Real-data check | CSMT→Pune Deccan Express plan; PMPML 203/208 Hinjewadi plan (₹78 vs ₹340 cab) |

## What wins (from the guide + official criteria) and where we are
1. **Real problem with evidence** → sourced secondary facts ✔, primary interviews ✘ (user action).
2. **Working demo** → ✔ (run locally; GIF/screens in `docs/media`); public URL ✘ (needs hosting account).
3. **Fits money already spent** → ✔ argued with sourced lines (BEST ITMS ₹112 cr, Pune ATMS ₹133 cr + ₹52 cr, PMPML ₹25–30 cr/yr losses); wording is *complement*.
4. **Deliverable pilot plan** → ✔ [14](14-pilot-plan.md): 4 stages, a number each, named roles, finance table.

## Round log
| Round | Research finding | Gap | Implemented |
|---|---|---|---|
| 1 | Maharashtra Zone portal is `sevainnovationchallenge.in`, **deadline 30 Oct**, work order "up to ₹10 lakh" | Docs/deck cited the wrong zone | Corrected docs/01, README, deck kicker; sector = Urban development |
| 1 | Guide's judges' lens: evidence, demo, existing spend, pilot plan | No evidence capture; no pilot plan | `/field` kit + API; [14](14-pilot-plan.md), [15](15-field-research-kit.md) |
| 1 | Inclusion: Marathi regional language, seniors, women's safety | English-only, no safety feature | Hindi/Marathi alerts + UI; Gentle pace; late-walk warning; share-live-trip link |
| 1 | Government wants cost/benefit | No impact model | `/impact` with sourced, conservative factors |
| 1 | Demo scrutiny | Alert hid a late-for-appointment case; 500 on bad JSON; slow big feeds; a11y misses | Fixed all four |
| 2 | No public GTFS-RT for PMPML/BEST/Maha-Metro/Railways; Google arrive-by is single-destination only; **Mumbai One has a planner, alerts and Marathi** (don't claim "no Marathi app"); State Startup Policy 2025: 0.5 % departmental innovation allocation; DPDP Rules 2025 (dates may be compressed to 13 Nov 2026) | Overclaims about competitors; consent/notice on reports; no outreach artefacts; no live-data route | Corrected deck/docs claims; explicit consent + retention/breach/DPDP notes; `docs/16` outreach kit + data-request template; `submission/two-page-note.md`; honest evaluator Q&A (docs/10) |

## Open items that need **you** (cannot be done from here)
1. **Submit on the Maharashtra portal today** (Aadhaar, ID, upload the PDF).
2. Team names/roles/qualifications, mentor, contact (deck slide 6).
3. 10+ interviews and 3 field photos → replace "baseline planned" on slide 2.
4. Native Marathi/Hindi review of every string (`packages/core/src/i18n.ts`, `apps/web/app/lib/i18n.tsx`).
5. Hosting accounts for a public demo link; Supabase CLI/network to test the DB adapter.
6. Send the data-sharing request and two-page note ([16](16-agency-outreach.md)); ask the helpline how a work order is issued and about DPIIT recognition.
7. Legal read of liability/terms and DPDP; a VAPT before any pilot.
