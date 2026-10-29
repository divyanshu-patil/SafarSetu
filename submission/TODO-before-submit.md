# Before you submit — Maharashtra Zone, last date **30 Oct 2026**

Portal: <https://sevainnovationchallenge.in> · helpline +91 91377 78135 · support@sevainnovationchallenge.in
Sector: **Urban development** · Upload: `submission/SafarSetu-Seva-First-Pitch.pdf` (1.5 MB; the portal states the limit at upload) · Needs: Aadhaar verification + ID file (≤ 5 MB).
The registration page showed a **"Prototype mode"** notice — ask the helpline to confirm real submissions are accepted.

## Must fill (cannot be done for you)
**Slide 6 — team** (everything in `[Add: …]`):
- Your role and qualification (Name 1 is *Divyanshu Patil*, from git) · names/roles/qualifications of members 2–4 (up to 5 core members allowed) · mentor/faculty guide and designation · contact email/mobile (last line).
- The template has no photo slot; the circles say "Photo".
- Ticks currently: Mentorship · Pilot with a government department · Funding. Edit `ticks` in `scripts/ppt/deck.json` if different.

## Strongly recommended (raises the score; guide's judging item #1 is evidence)
- **Slide 2 — evidence:** it cites sourced secondary facts and says *"Baseline interviews planned"*. After you run ≥ 10 interviews (`/field`, script in `docs/15-field-research-kit.md`), replace that line with the real n, dates and averages from `GET /v1/field/summary` (e.g. "12 commuters, 1–7 Nov: avg 110 min and ₹340 lost per week"). Never write numbers you did not collect.
- Add 2–3 field photos (no faces) of the corridor/stop if the form allows attachments.

## Check (numbers on the slides)
- Slide 4: pilot cost "₹8.7–13.7k per month for 10,000 users ≈ ₹0.9–1.4 per user" is an **estimate** (₹90/$, SMS/WhatsApp rates from secondary sources). Partners are "to approach" — no agreements exist; don't say otherwise.
- Slide 5: "3,000" is a **year-1 pilot target**, "~₹980" is a **modelled saving vs an all-cab day** (`/impact`), "2 per city" is a plan — none is a measured result. The slide labels say so; keep the labels.
- Re-export the PDF on a machine with PowerPoint or LibreOffice if you can: the PDF here was exported through Keynote (fonts render slightly differently). Rebuild with `python3 scripts/ppt/build_deck.py` after editing `scripts/ppt/deck.json`.

## Not claimed anywhere (keep it that way)
"Guaranteed ₹10 lakh", "93 lakh riders", "X % of locals are late", "replaces ITMS", measured time saved, pilot results, MoUs.
