# 10 — Demo script & judge Q&A

## 5-minute demo (Pune, synthetic data — labelled)

1. **Problem (30 s):** "You have a client meeting at 11:30 in Hinjewadi, a bank before it closes, and a parcel to collect — and you don't drive."
2. **Plan (60 s):** Example *Work errands in Pune*: start Pune Junction 09:00; stops added Google-Maps style with task, time needed and "be there by 11:30". Plan appears: leave 10:2x so you arrive 5 min early, spare time at each stop, confidence. Toggle *Best order*, mark the pick-up optional, add a stop by clicking the map.
3. **Compare (30 s):** switch pace to *relaxed* → timings re-flow; drop a place → time re-allocated.
4. **Go live (30 s):** open trip view, start sim clock at 60×. Reminders fire: "Leave in 30 min…".
5. **Delay (60 s):** simulator → *Local train late 30 min*. Alert: "No need to rush — … leave at 10:40". Plan diff shows nothing lost. Then *same delay with tight slack* → action-first alert.
6. **Cancellation (45 s):** *Aqua line cancelled* → re-plan, Aga Khan Palace shortened, notification explains.
7. **Authority view (30 s):** insights: which connections break most — Track B.
8. **Close (15 s):** city = data pack; mobile app shares the same core.

Backup: pre-recorded GIF; memory store works offline; synthetic map tiles cached.

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
