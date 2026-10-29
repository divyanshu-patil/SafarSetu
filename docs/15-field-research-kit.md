# 15 — Field research kit (primary evidence)

The guide: *"Start from a problem you have seen… Talk to the people impacted… invented numbers are always caught."* This kit turns interviews into evidence without inventing any.

## Interview script (10 minutes, one person at a time)
Consent first: *"I'm building a public-transport planner for a competition. May I note your answers anonymously? You can stop any time."* No names, phone numbers or photos of faces.
1. Where do you travel for work/study, and by what?
2. **What exactly goes wrong?** (a missed connection, a delay, not knowing timings, last-mile)
3. **How often** per week?
4. **What does it cost you?** minutes per week; ₹ per week (cab/auto fallback, lost pay)
5. **What do you do today?** (apps, asking people, leaving early, cab)
6. **What have you tried that did not work?**
7. If you knew X (the exact next bus, "no need to rush — leave at 10:40"), would it change what you do?

## Logging (`/field`, API `POST /v1/field/interviews`)
Fields: participant code (P-001, never a name), date, city, role, route, modes, the problem in their words, times/week, minutes lost/week, ₹ lost/week, workaround, what failed, **consent (required)**. Needs the team key in production (`FIELD_KEY`).

## Using it in the deck
`GET /v1/field/summary` returns n, date range, averages and anonymised quotes. Put **n and dates on the problem slide** ("12 commuters interviewed 1–7 Nov 2026: avg 110 min and ₹340 lost per week"). Until n > 0 the deck says *baseline interviews planned*.

## Targets
≥ 10 interviews across ≥ 3 roles (student, office worker, vendor/senior) before submission; 3 photos of the corridor/stop (no faces) for the deck.
