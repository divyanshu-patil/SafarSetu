# SafarSetu — two-page note for departments
*(The guide's "two-page note, Steps 1–4". Fill the bracketed items with real data before sending; nothing below is a measured result.)*

**Project:** SafarSetu — plan your work around the buses, metro and trains you can actually catch.
**Team:** [names, roles] · **Contact:** [email / mobile] · **Local office we can physically reach:** [PMPML head office / ward office] · **Officer we will address:** [designation]

## 1 · The problem
**People with a day of work to do lose time and trust because the buses, metro and trains they need are not planned around their deadlines, and they learn about delays only at the stop.**
Context (sourced; see `docs/research/seva-research.md`): Mumbai suburban rail carries ~68 lakh passengers a day; PMPML ~10 lakh a day with ~60 breakdowns a day (reported); TomTom 2025 measures 33 min 20 s per 10 km in Pune. Google Maps allows arrive-by for **one** transit destination only (Google Help).
**What people told us:** [n interviews, dates — from `/field`. If none yet: "Baseline interviews are planned for [dates]."]

## 2 · The solution
A web and phone planner where you add stops as in a maps app, say when you must be there, and get exact leave/board times across buses, metro and trains; it re-plans when something is late or cancelled and tells you what to do, in English, Hindi and Marathi. **It is not** a ticketing app or a replacement for agency GPS/ITMS; it is advisory.
Made of: a planning engine, real railway/PMPML/BEST timetables, an authority portal. Used by: commuters and agency planners. Replaces: guessing, several apps, and a cab as the fallback.

## 3 · How we devised it
Observation → root cause (we asked "why?" five times: missed connection → no one plans around the deadline → each app plans one trip) → options (A: improve a trip planner; B: a day planner with deadlines; C: ticketing integration — rejected: Mumbai One already does it) → prototype (working; screenshots in the deck) → test and change.
**What failed and what we changed:** our first version was a tourist day-planner — wrong problem; we rebuilt it around work and errands. Early alerts said "open the app"; we rewrote them to say what to do. A delay once made a meeting late without any warning; fixed and tested.
Tools used: TypeScript, community GTFS for PMPML/BEST (MIT-0), Datameet railway timetable, OpenStreetMap. Delays in the demo are **simulated**.

## 4 · Impact (not yet measured)
**Baseline:** [minutes and ₹ lost per week, n, dates]. **Trial plan:** 30 commuters, 4 weeks, one corridor, same questions after. **Per-person meaning:** [₹/hours — from the trial]. **Who else:** ~10 lakh PMPML riders a day (addressable, not reached).
Modelled estimate (not measured): a day of errands in Pune costs ₹105 by bus versus ~₹1,086 by cab for every hop (`/impact`).

## The ask
A 4-week pilot with a nodal officer and a delay/cancellation feed (see `docs/16-agency-outreach.md`). We provide anonymised reliability and gap summaries back.
