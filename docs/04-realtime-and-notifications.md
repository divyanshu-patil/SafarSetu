# 04 — Real-time handling & personalised notifications

## Disruption events

```ts
Disruption {
  id, type: 'delay' | 'cancellation' | 'stop_closed' | 'weather',
  routeId?, tripDeparture?  /* min; omitted = whole route */, stopId?,
  delayMin?, fromMin, untilMin, source: 'operator'|'gtfs-rt'|'crowd'|'simulator', note
}
```

`LiveState` = fold over active disruptions → `{ delayOf(routeId, dep), isCancelled(routeId, dep), closedStops, rain }`. The router and assessor read only `LiveState`. Ingestion of *any* source = insert a row; nothing else changes.

## What happens when something changes

```
event stored ─► for each active plan touching event
                 assessPlan(plan, live, now)
                  ├─ on_track      nothing material → no notification
                  ├─ absorbed      delay fits in slack → "no need to rush"
                  ├─ adjusted      leave time / dwell changes, nothing dropped
                  └─ replanned     cancellation / missed connection / overrun
                                    → replanFrom(position, now, remaining visits)
```

**assess:** re-time every leg of the existing plan with live delays (same trips). A leg *breaks* if its trip is cancelled, the rider can no longer reach the boarding stop in time, or a stop is closed. If nothing breaks, compute the new leave time and the **slack consumed**.

**replan:** start = where the rider will be (inferred from the schedule at `now`; a client-reported location overrides it in production), remaining = visits not yet completed. The same `planDay` runs with live state, so low-priority visits shrink first, then drop; everything is explained in the update (`changes[]`).

Idempotent: assessment is a pure function of (plan, live, now) → re-running after duplicate events yields the same revision.

## Notification policy

| Situation | Kind | Tone | Example |
|---|---|---|---|
| Time to get ready | `prepare` | neutral | "Leave in 30 min for the 09:10 Aqua line from Pune Station." |
| Time to go | `leave` | direct | "Leave now — 6 min walk to Pune Station, train departs 09:10." |
| Delay, user hasn't left, slack ≥ 15 | `relax` | **reassuring** | "No need to rush — your 10:12 local is running 30 min late. Leave at 10:40; you'll still reach Shaniwar Wada with 50 min to explore." |
| Delay, plan shifts | `adjust` | informative | "Your train is 30 min late. We shortened Aga Khan Palace to 45 min so you still make dinner." |
| Delay but connection still OK | `absorbed` | quiet | (in-app only, no push) |
| Cancellation / missed connection | `replan` | **action-first** | "Aqua line 09:10 is cancelled. Take the 09:20 instead — leave in 4 min. Your day still works." |
| Tight, little time | `urgent` | brief | "Leave now. Bus B2 leaves in 7 min; 6 min walk." |
| Stop closed | `replan` | action-first | "Nal Stop is closed. Walk 4 min to Garware College instead." |
| Rain | `heads_up` | calm | "Rain from 15:00 — Parvati Hill moved earlier; carry an umbrella." |

**Rules**
1. **Say what to do, not just what happened.** Every alert carries the new leave time.
2. **Choose tone from slack,** not from delay size: 30 min late with 60 min slack is *good news*.
3. **Never alert for < 3 min shifts.** Group bursts: one alert per plan per 2 min, latest wins.
4. **Supersede, don't stack:** a new revision cancels all pending reminders of the old one.
5. **Quiet hours:** no push 22:00–06:00 unless the user is mid-trip.
6. **Personalisation inputs:** name, pace, "calm|brief" style, language (en now; hi/mr templates next), accessibility needs (mentions step-free alternative / longer walk time).
7. Copy is generated from templates in `@repo/core` (`composeNotification`) — deterministic and testable; an LLM may later *rephrase* but never decides facts.

## Delivery channels

| Channel | When | Key needed |
|---|---|---|
| In-app SSE feed + toast | web demo, foreground | none |
| Browser Notification API | web, permission granted | none |
| Web Push (VAPID) | web, background | VAPID pair (self-generated) |
| Expo/FCM/APNs | mobile | Expo/Apple/Google credentials |
| SMS/WhatsApp | low-tech fallback | provider account (later) |

## Production ingestion sources

| Source | Gives | Approach |
|---|---|---|
| GTFS-Realtime TripUpdates/Alerts (where agencies publish) | delays, cancellations | poll 15–30 s, map `trip_id → (route, departure)`, upsert disruptions |
| Operator alerts (Maha-Metro/PMPML/Railways) | cancellations, closures | structured entry console + parser; human-verified |
| Railways running status (NTES via licensed provider) | train delay | map train no. → route; confidence = `verified` |
| Crowd reports | local closures | needs ≥ 3 confirmations, expires in 30 min |
| Weather (Open-Meteo) | rain/heat | every 15 min per city |

Every disruption carries `source` and `verified`; the UI shows *scheduled / live / reported* labels.

## Demo simulator

`POST /v1/sim/scenario {name}` injects canned events: `train-late-30`, `metro-cancelled`, `stop-closed`, `heavy-rain`, `clear`. `POST /v1/sim/clock` sets/speeds virtual time. Same code path as production ingestion.

## Round-3 additions
- **Deadline-aware alerts** (`late` kind): if a delay would make an appointment late, the alert says so with the new arrival time and the best alternative; a delayed vehicle that has a good alternative gets an action-first "take X instead" message.
- **Languages:** English, हिन्दी, मराठी from one template set (`packages/core/src/i18n.ts`); facts are inserted by code, never by a model.
- **Feed adapter:** `apps/api/src/gtfs-rt.ts` maps GTFS-Realtime TripUpdates to disruptions (see [17](17-security-privacy-ops.md)).
