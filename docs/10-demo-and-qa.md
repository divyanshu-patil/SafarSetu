# 10 — Demo script & judge Q&A

## 5-minute demo (Pune, synthetic metro/locals, real buses — labelled)

1. **Problem (30 s):** "You have a client meeting at 11:30 in Hinjewadi, a bank before it closes, and a parcel to collect — and you don't drive."
2. **Plan (60 s):** *Clear all*, then add stops like a maps app (search, or click the map): Hinjewadi (client, 60 min, **be there by 11:30**, must happen), Shivajinagar (bank), Swargate (parcel, optional). *Plan my route*: real PMPML buses, arrive 11:18, leave 10:08 — spare time goes to the previous stop, not the bus stop. Show the cab comparison (`/impact`).
3. **Your choices (30 s):** switch off *Express train / Cab*; set **Gentle** pace; flip the UI to **मराठी** — alerts follow.
4. **Go live (30 s):** *Start live trip → Start demo day* (60×). Reminders fire; open the shared read-only link in a second tab.
5. **Delay (60 s):** simulator → *Train 30 min late*: action-first alert "PMPML 203 is 30 min late. Take PMPML 208 … leave by 10:08. Your day still works." Then a delay that would make the **11:30 meeting late**: "You'll be late for Hinjewadi — arrive 11:48, 18 min after 11:30."
6. **Cancellation (45 s):** *Metro cancelled* → re-plan with explanation.
7. **Citizen → authority (60 s):** *Report a gap* (Hinjewadi → Shivajinagar, no feeder) → sign in as the Pune officer → ranked gaps with adjustable weights, change status → the citizen's tracking page shows it. Show the analyst role being refused a status change.
8. **Close (15 s):** the 4-stage pilot plan; data pack per city; same core on mobile.

Backup: screenshots in `docs/media`; the memory store works offline; synthetic parts are labelled.

## Likely questions

| Q | A |
|---|---|
| Why not Google Maps? | It routes A→B. We plan the *whole day*, allocate time per place, and re-plan with explanation; plus authority insights. |
| Is the data real? | Demo is synthetic and labelled; real path: GTFS (PMPML), operator timetables, GTFS-RT/rail status. Engine unchanged. |
| What if there's no live feed? | Scheduled mode with lower confidence + crowd/operator inputs; feed health is surfaced. |
| Why not just alert "train delayed 30 min"? | That causes anxiety or needless rushing; slack-aware alerts tell you what to *do*. |
| Cost / scale? | ₹0 demo; city pilot ≈ a few thousand ₹/month; new city = data pack. |
| Privacy? | Guest-first, consented location, RLS, aggregated insights (DPDP). |
| Who adopts? | Transport authorities (insights + data quality loop), tourism boards, colleges; open APIs. |
| What's unique technically? | Missed-connection-aware confidence, dwell-time allocation under live disruption, shared core for web+mobile. |
| What failed/limits? | Free geocoder/tiles have fair-use limits; synthetic delay profiles; no payments/ticketing yet. |
