# SafarSetu — Citizen Mobility App and Transport Authority Portal

**Product workflow and feature specification**  
**Focus:** First- and last-mile connectivity to metro, rail and public transport  
**Initial use case:** Planning and completing public-transport journeys across Pune and Mumbai  
**Document purpose:** Explain the product, the user journeys, the screens and actions, the authority workflow, and how reports are generated. This document intentionally focuses on product behaviour and navigation, not technical architecture.

> **Working name:** SafarSetu is a provisional product name. Confirm name availability before public use.

---

## 1. Product vision

SafarSetu helps people make complete public-transport journeys with less confusion and helps transport authorities identify and improve weak connections in the transport network.

The product has two distinct experiences:

1. **Citizen App:** Helps a person plan, understand, navigate and complete a journey from their starting point to their final destination. It also lets them report problems with stops, transfers and feeder connections.
2. **Transport Authority Portal:** Helps authorized transport teams investigate connectivity gaps, review reports from citizens, compare proposed improvements, generate evidence-based reports and track agreed actions.

These are two experiences within one mobility service, not two unrelated products. The citizen experience reveals what people encounter on the ground; the authority experience turns those signals, alongside transport-network data, into decisions that can be investigated and acted upon.

### The problem SafarSetu addresses

A journey can require several separate steps: a local bus or auto to a railway station, an intercity train, a metro or local train after arrival, and another connection to the final destination. The traveller may need to switch between different apps and websites to find schedules, prices, live status, tickets and local directions. Even when each individual service exists, its timing, location or frequency may not make the whole journey convenient.

Transport authorities face a related problem. They need to know which neighbourhoods are poorly connected, which stations lack useful feeder services, where transfers are difficult, and which service changes might improve access. Complaints alone do not necessarily show the full pattern; network data and local context are also needed.

### What SafarSetu is — and is not

**It is:**
- A door-to-door public-transport journey planner.
- A guide that explains each leg of a journey and what to do next.
- A journey companion that helps a traveller respond to a verified disruption.
- A way to record issues with stops, access routes, waiting time and transfers.
- A decision-support tool for analysing first- and last-mile connectivity gaps.
- A report-generation and action-tracking experience for transport authorities.

**It is not intended to be:**
- Merely another map that draws a route between two places.
- A replacement for official railway, metro or bus operations systems.
- A promise that every service has live data or that every estimated connection is guaranteed.
- An automated authority that changes public transport services without human review.
- A general-purpose tourism application as its primary purpose. City exploration can be added after the core mobility problem is addressed.

---

## 2. The two experiences at a glance

| | Citizen App | Transport Authority Portal |
|---|---|---|
| Main user | Commuters, students, workers, visitors and people unfamiliar with a city | Authorized staff at transport agencies, metro/rail bodies, municipal teams and planning partners |
| Main question | “How do I complete this journey reliably?” | “Where is connectivity failing, why might it be failing, and what should we investigate or improve?” |
| Main inputs | Origin, destination, arrival time, budget, travel preferences, optional feedback | Area, station, route, time period, transport data, citizen reports and planning constraints |
| Main outputs | Journey options, step-by-step instructions, status updates, backup routes and report receipts | Connectivity-gap analysis, station/area profiles, scenario comparisons, generated reports and tracked actions |
| Success looks like | People can make a journey with fewer confusing decisions and better information | Authorities can identify, prioritize, investigate and track improvements to first-/last-mile access |
| Important limitation | The app must identify information that is estimated, scheduled or verified live | Findings are decision-support evidence; proposals must be reviewed by authorized staff before operational action |

---

# Part A — Citizen App

## 3. Citizen App: primary user journey

The normal user flow is:

**Open app → Enter destination → Set travel needs → Compare complete journeys → Select a plan → Follow each leg → Recover from disruption if needed → Arrive → Optionally report a problem.**

The user should not need to understand transport-network terminology. The app should present practical directions in plain language and reveal more detail only when requested.

## 4. Citizen App: first-time use and home screen

### 4.1 First launch

On first launch, show a short introduction explaining that SafarSetu helps plan complete public-transport journeys and provides guidance across transfers.

Ask only for information that improves the experience. Avoid making registration mandatory before a person can try journey planning.

Possible choices:
- Continue as a guest.
- Sign in to save journeys, preferences and report history.
- Allow location access while using the app, or enter a starting place manually.
- Set optional preferences, such as walking tolerance, budget sensitivity, preferred transport modes and accessibility needs.

Explain why location is requested. Provide a way to change or remove saved preferences.

### 4.2 Home screen

The home screen should be simple and centred on a clear question: **“Where do you want to go?”**

Suggested elements:
- **From:** Current location, saved place or manually entered address/station.
- **To:** Address, landmark, station, office, college or other destination.
- **Arrive by / Leave at:** The user chooses whether they have a deadline or a preferred departure time.
- **Plan my journey:** Primary action.
- **Saved places:** Home, work, college or frequently visited stations, if the user opts to save them.
- **Recent journeys:** A short list of recently planned trips.
- **Nearby transport:** Optional view of nearby stops and stations when relevant data exists.
- **Report a connectivity problem:** A secondary action that should be easy to find, but must not dominate the travel-planning experience.

The home screen must not imply that nearby services are live-tracked unless the relevant data source supports that status.

## 5. Planning a journey

### 5.1 Step 1 — Enter the journey

The user enters:
- Starting location.
- Final destination.
- Departure time or required arrival time.
- Date of travel.

For an unfamiliar city, the user should be able to enter a destination by name rather than knowing the nearest station or stop.

Examples:
- “Kothrud, Pune” to “Bandra Kurla Complex, Mumbai”.
- “Pune railway station” to “Tata Memorial Hospital”.
- A home address to a college or workplace.

The app should ask a follow-up question only if a missing detail prevents useful results. It should not make the user fill out a long form before showing options.

### 5.2 Step 2 — Set preferences (optional)

Offer a compact set of controls:
- Lowest estimated cost.
- Shortest estimated total journey.
- Fewer transfers.
- More reliable / larger transfer buffers.
- Less walking.
- Avoid stairs where accessible route information exists.
- Prefer public transport over taxis.
- Allow an auto or cab for a first-/last-mile segment.
- Avoid very early or late walking segments, where the user can set a preference.

Explain that some choices trade off against one another. For example, the lowest-cost option may take longer, and the shortest option may require more transfers.

Accessibility information must be shown only when it is available and sufficiently reliable. The app must not label a route “fully accessible” merely because a station has some accessibility facilities.

### 5.3 Step 3 — Generate journey options

The app should produce a small number of clearly differentiated options, rather than a long, confusing list.

Recommended option types:
1. **Balanced:** A reasonable combination of duration, cost and transfer effort.
2. **Lowest estimated cost:** Prioritizes affordability, while showing any longer waits or walking requirements.
3. **Fewer transfers / easier journey:** Reduces the number or complexity of changes, where feasible.
4. **More buffer / more robust:** Prefers connections with more time to transfer or less dependence on a fragile interchange.

Each option should show, where data is available:
- Estimated departure and arrival times.
- Total estimated journey time.
- Estimated total cost and which amounts are estimates.
- Number of transfers.
- Walking distance and walking time.
- Wait time between legs.
- Modes used, such as bus, train, metro, walking, auto or cab.
- The station or stop used for every transfer.
- Whether information is scheduled, live-verified or estimated.
- The last update time for live information, where relevant.
- Warnings about a tight connection, long wait or uncertain service.

The app should explain why an option is recommended in plain language, such as: “This route costs a little more but has one fewer transfer and a longer connection buffer.”

It must not invent live train positions, bus arrival times, prices or service availability. When real-time data is unavailable, display scheduled information or a clearly labelled estimate and link to the relevant official source when useful.

### 5.4 Step 4 — Open journey details

When the user selects an option, open a complete itinerary in chronological order.

Each leg should show:
- What the traveller must do next.
- The origin and destination stop/station for that leg.
- Scheduled departure/arrival or estimated time.
- Walking path between a building entrance, stop, platform or interchange when supported.
- Expected walking and waiting time.
- Fare or cost estimate, when available.
- A clear status label: Scheduled, Live-verified, Estimated, or Not available.
- A link to the relevant official service or authorized ticketing provider when the user needs to check or purchase a ticket.

A leg might read:

**08:10 — Leave home**  
Walk 4 minutes to the bus stop. The walking time is estimated.

**08:15 — Take bus**  
Board at [stop name] and get off at [station]. The bus timetable is scheduled data; live arrival is unavailable.

**09:00 — Intercity train**  
Train service and departure information are linked to the relevant verified source. Ticket purchase is completed through an authorized provider, not represented as a SafarSetu booking unless that integration truly exists.

**After arrival — Continue to destination**  
Follow the recommended metro, local train, bus, walking or other supported connection.

The times above are illustrative and must not be shown as a real itinerary unless verified for the selected date.

### 5.5 Step 5 — Save or start the journey

The user can:
- Start journey mode.
- Save the plan.
- Share the itinerary with another person.
- Open official booking or service-information links.
- Change a preference and compare options again.

Sharing a journey should be opt-in. If a user shares a trip, the app should explain what is shared and with whom.

## 6. Active journey mode

Once the user begins the journey, the app should change from a planning screen into a simple “what do I do next?” experience.

### 6.1 Next-step card

Show only the most relevant immediate instruction at the top:
- Current leg.
- Next action.
- Destination stop or station.
- Time until the scheduled departure or expected arrival, if supported.
- Walking direction or transfer instruction.
- A compact overview of the rest of the journey.

The user should be able to open the full itinerary whenever needed.

### 6.2 Transfer guidance

Before a transfer, show:
- Where the user should get off.
- Which station, platform or stop they need to reach, if known.
- Estimated walking distance and transfer time.
- Whether the available transfer buffer appears comfortable or tight.
- Any known accessibility constraint or service warning.

Do not promise exact platform or exit information unless it is supplied by a reliable source.

### 6.3 Disruption and replanning

When a verified delay, cancellation or service change affects the itinerary:
1. Identify which leg has changed and when the information was updated.
2. Explain which later connection may be affected.
3. Recalculate feasible alternatives for the remaining journey, if the necessary data exists.
4. Compare the revised options by arrival time, cost, walking, transfers and confidence in the underlying information.
5. Explain the trade-off in simple language.
6. Let the user choose whether to switch to the alternative.

Never silently change the user's selected journey when the change affects cost, safety, destination or a booked service. Ask the user to confirm before taking them to a materially different option.

If there is no verified live information, do not fabricate a disruption alert. The app can provide a manual “My service has changed” action that lets the user request a refreshed plan.

### 6.4 Journey completion

When the user reaches the destination, show a simple completion screen. Ask whether the journey worked as expected, without forcing a survey.

Optional feedback:
- Was the itinerary useful?
- Was any transfer confusing or too short?
- Was a service missing or different from the information shown?
- Would the user like to report a connectivity issue?

The app should not treat an estimated journey time as proof of actual travel time. Use user-confirmed feedback and verified events separately from estimates.

## 7. Citizen reporting: report a connectivity problem

Citizen reports are an important bridge between the two experiences. Reporting must be fast and safe; users should understand that a report contributes evidence but does not automatically guarantee immediate service changes.

### 7.1 When can a person report an issue?

The user can report from:
- A journey leg or transfer card.
- A station or stop details page.
- The home screen's “Report a problem” action.
- The completed-journey screen.

When a report is started from a specific leg, pre-fill the stop, station, route or approximate time where the app can identify them. Allow the user to correct any pre-filled details.

### 7.2 Report categories

Use simple categories, for example:
- No useful feeder service available.
- Bus or feeder service is too infrequent.
- Connection or transfer is poorly timed.
- Excessive waiting time.
- Stop or station is difficult to reach on foot.
- Footpath, crossing or access route is obstructed.
- Accessibility difficulty.
- Service information appears incorrect.
- Stop, station entrance or route information is missing.
- Other connectivity issue.

Avoid categories that imply serious wrongdoing unless the product has an appropriate process for that type of report. This is a public-transport feedback tool, not an emergency-response service.

### 7.3 Report submission flow

1. **Choose the issue:** The user selects the category.
2. **Confirm the location:** Use the relevant stop/station or let the user select a location on a map or search for it.
3. **Add details:** The user can add a short description, approximate time and optional supporting image.
4. **Review privacy:** Tell the user which details are included. Location and contact details should not be collected unless needed for the chosen workflow.
5. **Submit:** The app confirms that the report has been received.
6. **Receipt:** Show a reference number, report summary, submitted time and the next expected status.
7. **Track status:** Where a participating authority supports case handling, the user can see statuses such as Received, Under Review, More Information Needed, Referred to Agency, Action Planned, Resolved or Closed.

If there is no participating authority or case-management process for that area, label the item as **Feedback recorded for connectivity analysis** rather than implying that a government officer has been assigned to it.

### 7.4 What happens to a submitted report?

A report should be screened for incomplete information, duplicate submissions, relevance and potential sensitivity. Similar reports may be grouped for analysis, but individual reports must remain traceable to authorized reviewers where a formal case workflow exists.

Possible processing outcomes:
- Accepted for analysis.
- Linked to a similar report.
- More details requested.
- Referred to a relevant participating authority.
- Not actionable, with an explanation where appropriate.
- Closed after a recorded review or action.

Duplicate detection must not erase the fact that multiple people experienced the same problem. Repeated independent reports can be evidence that a connection needs attention.

### 7.5 The user must receive a clear promise

The app should say what it actually does with the report. For example:

“Your report has been recorded and will contribute to the connectivity analysis for this location. If an authorized transport agency is connected to this reporting workflow, the status will show whether it has been referred for review. Submission does not guarantee a service change.”

This prevents a misleading impression that every report is already an official complaint or that a service problem will be fixed automatically.

---

# Part B — Transport Authority Portal

## 8. Authority Portal: purpose and user journey

The authority portal is for authorized people who need to assess, prioritize, plan or monitor transport-connectivity improvements. It should support decisions, not simply display a map full of markers.

The normal workflow is:

**Sign in → Select jurisdiction and period → Review connectivity overview → Investigate an area, route or station → Review evidence → Compare possible interventions → Generate a report → Assign/record an action → Monitor the outcome.**

Different roles may use the portal differently. For example, an analyst may explore data and build a report, a supervisor may review and approve a recommendation, and an operations officer may update the status of an assigned action.

The portal should show which datasets and time periods are included in each finding. A report based on an outdated schedule feed or a small number of citizen reports must not be presented as definitive evidence.

## 9. Authority Portal: main navigation

Recommended main sections:

1. **Overview** — Current high-level picture of connectivity.
2. **Connectivity Map** — Explore underserved locations, stops, stations and walking connections.
3. **Stations and Routes** — Inspect a specific station, route or transport corridor.
4. **Citizen Reports** — Review, group, filter and track submitted issues.
5. **Scenario Planner** — Compare possible feeder-route, stop or frequency changes.
6. **Reports and Insights** — Generate, review, export and revisit analysis reports.
7. **Actions and Follow-up** — Record owners, target dates, status and results for agreed interventions.
8. **Data and Coverage** — Review the freshness, completeness and geographic coverage of input information.

The portal should allow users to reach a relevant report or location from more than one path. For example, clicking a high-risk location on the overview map should open the same detailed area view as selecting that location through search.

## 10. Authority Portal overview screen

The overview should answer:
- Which areas appear least connected?
- Which stations or routes have the most reported first-/last-mile difficulties?
- Where are there long walking distances, poor frequency or difficult transfers?
- Which issues have been newly reported or have recurred?
- What actions are open, overdue or awaiting review?
- How complete and recent is the underlying information?

### Suggested overview components

- A map with filters for geography, transport mode, time period and issue type.
- A ranked list of connectivity gaps requiring investigation.
- A station/area summary showing the indicators behind each ranking.
- A trend of submitted and reviewed reports over time.
- An action tracker for proposed and approved interventions.
- A data-quality panel showing the latest update and known gaps in each dataset.

Avoid presenting a single opaque “connectivity score” without explaining how it was calculated. Where scores are used, show their component factors and let the reviewer inspect the underlying evidence.

## 11. Connectivity Map and area investigation

### 11.1 Map interaction

An authorized user can:
- Search for a city, ward, neighbourhood, station, stop or route.
- Zoom from a citywide view to a local area.
- Toggle relevant layers such as stops, stations, walking access, routes, service frequency and citizen-reported issues.
- Filter results by time of day or date, where suitable data exists.
- Compare the current connectivity picture with a selected proposal or planning scenario.

### 11.2 Selecting a location

When the user selects an area or station, open a details panel showing:
- Available public-transport modes.
- Stops and stations within defined walking or network-travel thresholds.
- Service frequency by time period, if reliable timetable data exists.
- Walking/access-route barriers, when recorded.
- Transfers and likely access paths.
- Number and types of citizen reports, with duplicates and unique reporters distinguished where possible.
- The reporting period and data freshness.
- Existing actions, investigations or proposed changes associated with the location.

A nearby stop should not automatically be treated as accessible. Where route-network information is available, distinguish straight-line distance from a realistic walking route. Where no usable footpath or accessibility data exists, say so rather than assuming the route is safe or accessible.

### 11.3 Ranked connectivity gaps

The portal can rank places for investigation based on transparent criteria, such as:
- Population or important destinations potentially affected, where credible data exists.
- Walking or network travel time to the nearest useful service.
- Frequency and operating hours of available public transport.
- Number and severity of reported connection difficulties.
- Transfer time and reliability concerns.
- Accessibility constraints.
- Whether similar problems recur over time.

The ranking is a prioritization aid, not a definitive judgement. The reviewer should be able to change the weights or see how the order changes when assumptions change.

## 12. Station and route detail

When an authority user opens a station or route, show a focused operational view.

### Station view
- Nearby residential areas and important destinations.
- Available feeder services and their schedules, where data exists.
- Estimated walking access routes and known access constraints.
- Transfer paths between modes.
- Reports about waits, missed connections or access barriers.
- Busy time periods or demand indicators, where data exists.
- Potential areas for field verification.

### Route view
- Route path and stops.
- Operating hours and service frequency, where known.
- Key interchange points.
- Locations with repeated complaints or poor access.
- Areas that might be poorly served by the existing path or timing.
- Changes previously proposed or tested.

Each view should indicate whether its data is scheduled, observed, user-reported, estimated or otherwise derived. These types of evidence must not be quietly mixed together.

## 13. Citizen Reports inbox

This is the authority-facing side of the reporting workflow.

### 13.1 Inbox functions

Authorized reviewers can:
- Filter reports by location, category, time period, route, station, severity or status.
- Group related reports while retaining access to each original report.
- Identify repeated reports about the same connection or time period.
- See whether a report has enough location and time information to investigate.
- Ask for more information when a formal reply channel is available.
- Record that a report was reviewed, referred, accepted for analysis or closed.
- Assign a report or issue group to an authorized team when the participating agency supports this process.

### 13.2 From individual complaints to an operational issue

A single report may describe one person's experience. Several reports about the same stop, route and time period may indicate a recurring problem. The portal should allow reviewers to create an **issue group** from related reports.

An issue group should show:
- The pattern being investigated.
- The included reports and the period covered.
- The evidence supporting the grouping.
- Any conflicting reports or missing information.
- The next suggested investigation step.
- Whether the group has been reviewed and accepted by a human reviewer.

Automated grouping is a suggestion for review; it must not automatically become an official finding or trigger an operational penalty.

### 13.3 Closing the feedback loop

When the participating agency supports citizen case status, authorized staff can update the status and provide a suitable public-facing note. The citizen should see the state of their own report and any permitted explanation.

Do not expose staff-only notes, personal information or sensitive operational details to the reporting public. If no agency has accepted responsibility, the portal must not imply that the issue is being resolved by an authority.

---

# Part C — Report generation and decision support

## 14. What reports should SafarSetu generate?

Reports are one of the most valuable authority features. They should convert raw schedules, maps and citizen feedback into a clear decision document, with enough evidence that an analyst or transport planner can review the conclusions.

The portal should support several report types rather than generate one generic AI summary for every purpose.

### Report Type A — First- and Last-Mile Connectivity Gap Report

**Purpose:** Identify places where people may have difficulty reaching or leaving public transport and explain the main reasons for prioritization.

Include:
1. Executive summary.
2. Geographic area and time period covered.
3. Transport modes and datasets included.
4. A map and ranked list of potential connectivity gaps.
5. Walking/network access, service frequency and interchange findings.
6. Relevant citizen-report patterns.
7. Potentially affected populations or destinations, only where supporting data is available.
8. Data limitations and confidence levels.
9. Suggested locations for field verification.
10. Candidate interventions for further investigation.

### Report Type B — Station Feeder Connectivity Report

**Purpose:** Assess the first- and last-mile connections around one metro, rail or public-transport station.

Include:
- Station overview and surrounding service area.
- Existing feeder routes, stops and service frequency, where available.
- Walking access routes and recorded barriers.
- Transfer time and connection issues.
- Citizen reports grouped by issue type and period.
- Underserved directions or neighbourhoods.
- Potential improvements to investigate, such as a feeder route, stop location or timetable change.
- Evidence required before implementation.

### Report Type C — Citizen Issue and Grievance Summary

**Purpose:** Help an agency understand the problems being reported and the status of the response.

Include:
- Number of reports received in the selected period.
- Number of unique issues and number of reports associated with each issue group.
- Distribution by category, area, station and route.
- New, under-review, referred, resolved and overdue cases, where these states exist in the participating workflow.
- Recurring issues and their frequency over time.
- Cases awaiting more information or an assigned owner.
- Response and closure times, if the relevant timestamps exist.
- Privacy-preserving presentation of citizen information.

Do not infer that a higher count necessarily means worse service without considering exposure, reporting participation and duplicate patterns.

### Report Type D — Feeder-Service Improvement Scenario Report

**Purpose:** Compare several possible service changes and explain the trade-offs.

Possible scenarios:
- Add or move a feeder stop.
- Change a feeder route.
- Adjust departure frequency or service hours.
- Improve the transfer connection between two services.
- Change the recommended interchange.
- Prioritize a pedestrian access improvement.

Include:
- Description of the existing scenario.
- The proposed change and assumptions.
- Areas and destinations affected.
- Estimated change in walking access, wait time, transfer time or population served, where the data supports calculation.
- Potential cost or operational resource implications, only when reliable inputs exist.
- Comparison with alternatives.
- Risks, constraints and missing information.
- A clear statement that outputs are modelled estimates, not promised real-world results.

### Report Type E — Monthly Mobility Performance Report

**Purpose:** Track whether connectivity conditions and agreed actions are improving over time.

Include:
- Overview of the reporting month and comparison period.
- Changes in the number and type of reports.
- Recurring station/route problem areas.
- Status of planned actions.
- Changes in service availability or connectivity indicators, where comparable data exists.
- Follow-up items, overdue actions and outstanding evidence.
- Notes on differences in data coverage that may affect month-to-month comparison.

---

## 15. How the report-generation workflow should work

The report builder should make the report scope explicit before generating content. A user should be able to understand exactly which area, period, sources and assumptions the report covers.

### Step 1 — Choose a report type

The authority user opens **Reports and Insights** and selects one of the supported report templates:
- Connectivity Gap Report.
- Station Feeder Connectivity Report.
- Citizen Issue Summary.
- Feeder-Service Scenario Comparison.
- Monthly Mobility Performance Report.

### Step 2 — Define the report scope

Ask the user to select only the inputs relevant to that report:
- City, municipality, ward, neighbourhood, corridor, station or route.
- Date or reporting period.
- Relevant transport modes.
- Time period, if service frequency varies significantly by time of day.
- The question the report should answer.
- Optional thresholds, such as a maximum desired walking time or minimum service frequency, if they are meaningful for the task.

For example:

“Identify residential areas around Station X where walking access is difficult or feeder service frequency is low during weekday morning peak hours. Compare three candidate improvements.”

### Step 3 — Review data coverage before generation

Before producing the report, show a **Data Coverage Check** with:
- Available sources and what each one contributes.
- Most recent update for each source.
- Missing geography, time periods or modes.
- Whether the information is official, community-sourced, user-reported, observed or estimated.
- Important fields that are missing.
- Any calculation that cannot safely be made because the inputs are insufficient.

Let the user continue with explicit limitations, or adjust the report scope. Do not manufacture missing numbers to complete the report.

### Step 4 — Generate findings

The system should prepare the report from the selected data and show:
- Findings with supporting evidence.
- Maps or tables relevant to the selected question.
- Trends and comparisons where periods are comparable.
- Potential causes or contributing factors, clearly labelled as hypotheses when not directly established.
- Candidate interventions for review.
- Uncertainty, data gaps and limitations.

AI can help summarize findings and explain trade-offs in plain language. Every important factual statement should be traceable to a displayed source, data field, calculation or report record. AI-generated explanations must not be treated as verified evidence simply because they sound plausible.

### Step 5 — Review and edit

The report opens in a review screen. The user can:
- Inspect the evidence behind each finding.
- Open a map or record referenced by a section.
- Remove irrelevant sections.
- Add reviewer comments.
- Change the scope or assumptions and regenerate affected sections.
- Mark a finding as accepted, needs verification or rejected.
- Add field-verification notes.

Any manual edit should be clearly distinguished from automatically generated analysis. Keep a version history so users can see what changed and when.

### Step 6 — Choose report outputs

The portal can offer:
- **Interactive report:** A portal page with filters, charts, maps and links to underlying records.
- **PDF report:** A document suitable for review meetings or sharing with authorized stakeholders.
- **CSV export:** Tables of permitted data for further analysis.
- **Action list:** A separate list of recommended investigations or interventions with location, rationale, proposed owner and due date fields.

Export options must respect the user's permissions and the privacy of citizen reports. Personal data should be omitted or aggregated unless there is an explicit authorized need to include it.

### Step 7 — Approve, share or assign follow-up

A report may be:
- Saved as a draft.
- Submitted for a supervisor's review.
- Approved for internal use.
- Shared with authorized stakeholders.
- Converted into one or more tracked actions.

Generating a report should not automatically mean the proposal has been officially approved or that a route change has been authorized.

### Step 8 — Track what happened afterward

If an intervention is approved, record:
- The problem being addressed.
- The selected action.
- The responsible team or named role.
- Target date and current status.
- Evidence required to verify completion.
- The metrics that should be checked after implementation.

When new data becomes available, compare observed changes with the original baseline. State whether the evidence supports, contradicts or is insufficient to evaluate the expected benefit.

---

## 16. What a generated report should look like

A sample **First- and Last-Mile Connectivity Gap Report** could contain the following sections.

### Cover and scope

- Report title.
- Jurisdiction and selected area.
- Reporting period.
- Prepared date and reviewer.
- Question being investigated.

### Executive summary

A short, plain-language summary of the main findings, why they matter and what should be investigated next. It should avoid unsupported claims such as “this will reduce commute time by 30%” unless a defensible evaluation supports the number.

### 1. Area overview

A map showing the selected stations, stops, service routes and analysis boundary. Include the data date and any missing modes or locations.

### 2. Connectivity findings

A ranked set of locations with an explanation of the factors behind each ranking, such as long access paths, poor service frequency, high transfer burden or repeated citizen reports.

### 3. Citizen feedback

Summarize issue categories and recurring patterns, distinguishing individual submissions from grouped issues. Provide period and location filters in the interactive version.

### 4. Candidate interventions

For each potential improvement, specify:
- What could change.
- Which location or journey problem it addresses.
- Which evidence supports considering it.
- What additional information is needed.
- Expected benefits and trade-offs, if they can be estimated.

### 5. Scenario comparison

Compare alternatives using the same assumptions and metrics. If one proposal appears better, explain why and list what remains uncertain.

### 6. Recommendation for review

Offer a concise shortlist of actions for the authority to investigate, not an automatic command to implement a change. For instance:
- Conduct a site inspection at the identified access point.
- Verify the service schedule with the operator.
- Evaluate an additional feeder departure during a specified period.
- Consult affected commuters.
- Re-run the scenario after receiving missing data.

### 7. Limitations and data quality

Include data freshness, missing routes or time periods, assumptions, uncertainty and any restrictions that affect interpretation.

### 8. Action tracker

List each accepted action, responsible team/role, due date, status and the evidence required for closure.

### Appendices

Include permitted source details, definitions of metrics and supporting tables. Keep personally identifiable citizen information out of broad exports by default.

---

## 17. How potential interventions should be compared

The scenario planner should help an authority compare options using consistent criteria. It must allow the reviewer to understand why an option ranks higher and what assumptions drive the result.

Possible comparison criteria:
- Number of people or important destinations estimated to gain better access, where suitable data exists.
- Change in walking or network travel time to a useful public-transport service.
- Change in waiting time or service frequency, if timetable data is available.
- Change in number of transfers or transfer difficulty.
- Operating hours and whether the proposed service matches the times people need to travel.
- Estimated operational cost, only when suitable cost information is supplied.
- Accessibility implications.
- Implementation constraints and missing evidence.

For each scenario, show a side-by-side comparison with the current situation. Make assumptions editable so a planner can test alternatives. The model should not pretend to know passenger demand or vehicle operating cost when that information has not been supplied.

For the first prototype, it is reasonable to compare small, clearly defined scenarios rather than optimize an entire city. Example: compare three candidate feeder connections for one station during the morning peak and show the assumptions and expected network-access differences.

---

## 18. From report to real-world action

A generated report is not the finish line. It should lead to a review and, when accepted by an authority, a trackable action.

Recommended action workflow:

1. **Finding created:** An analyst identifies a potential gap or problem.
2. **Evidence checked:** A reviewer checks data quality and supporting records.
3. **Field verification requested:** If needed, a team confirms the situation on the ground.
4. **Intervention proposed:** The analyst records one or more possible changes.
5. **Review and decision:** The authorized body accepts, rejects, defers or requests changes.
6. **Action assigned:** Accepted work has a responsible team/role and a target date.
7. **Progress updated:** The responsible person records progress and evidence.
8. **Outcome checked:** After a suitable period, the authority compares the situation with the baseline.
9. **Action closed or reopened:** Close the action if the agreed criteria are met, or reopen it if the issue persists.

The app should distinguish **reported**, **analysed**, **proposed**, **approved**, **implemented** and **verified**. These states must not be conflated. For example, a proposed feeder route is not a service that is currently operating.

---

# Part D — Shared rules and trust

## 19. Data transparency and confidence labels

Every time, fare, status or recommendation should be labelled according to the evidence behind it.

Recommended labels:
- **Live-verified:** Received from a verified source with a known recent update.
- **Scheduled:** Based on a published timetable or schedule.
- **Estimated:** Calculated from available information and assumptions.
- **User-reported:** Submitted by a commuter and not independently verified unless stated otherwise.
- **Needs verification:** A potential issue or pattern that requires further confirmation.
- **Not available:** Required information cannot currently be obtained.

Use timestamps and source descriptions where relevant. Do not present an estimated or community-sourced value as an official live measurement.

## 20. Privacy and safe handling of reports

The product should collect only the information needed for the task. A citizen must understand whether their name, contact details, location, trip history or attachment is being submitted and how it will be used.

Key rules:
- Do not require an account for ordinary journey planning.
- Make location permission optional when a user can enter places manually.
- Ask for consent before sharing a journey or sending ongoing location updates.
- Let the user review the contents of a report before submitting it.
- Avoid publishing precise personal travel histories.
- Aggregate citizen feedback for planning where individual identity is unnecessary.
- Restrict access to sensitive reports to authorized reviewers.
- Record important review and status changes in the formal reporting workflow.
- Make clear that the app is not an emergency service.

## 21. Accessibility and inclusive mobility

Where reliable information exists, the citizen app should make it possible to consider:
- Shorter walking distance.
- Step-free connections.
- Lifts and ramps.
- Time needed for a slower walking pace.
- Difficulty crossing major roads or reaching a stop.
- Transfer distance between modes.
- Areas where accessibility information is unknown.

A route with missing accessibility information should be labelled as unknown, not automatically accessible. The authority portal should make accessibility data gaps visible and allow authorized staff to record verified barriers.

## 22. Failure states and edge cases

The product must handle imperfect information gracefully.

### No complete route found

Explain which leg could not be planned. Show available partial routes, suggest expanding the departure window or changing preferences, and provide relevant official information links. Do not invent a connection to make the itinerary look complete.

### Real-time status unavailable

Keep the scheduled itinerary visible, state that live status could not be verified and link to the official source if appropriate.

### Connection appears too tight

Explain why the transfer may be risky and show alternatives with more buffer. Avoid claiming a transfer is guaranteed solely because its scheduled times do not overlap.

### Uncertain fare

Show a clearly labelled estimate or omit the amount. Do not combine unrelated fares into a falsely precise total.

### Citizen report lacks detail

Ask for the minimum missing information or allow the user to submit it as a lower-confidence observation. Show what information would help an authority investigate.

### Conflicting citizen reports

Display the discrepancy and its context. Do not automatically declare one person correct or treat the majority view as conclusive.

### Data is too old

Display the last update and reduce the confidence of time-sensitive recommendations. If the data is too stale to produce a meaningful answer, say so.

---

# Part E — Scope and success criteria

## 23. Minimum viable product for a hackathon

The first version should prove the core idea without requiring a partnership with every transport operator.

### Citizen App — MVP
- Enter origin, destination and arrival/departure time.
- Plan a complete journey for one defined corridor or limited set of supported areas.
- Show the first-mile, intercity or trunk journey, transfer and last-mile legs where the data supports them.
- Compare a small number of journey options.
- Clearly label scheduled versus live-verified versus estimated information.
- Explain transfer time, walking and cost assumptions.
- Provide official booking/status handoffs instead of pretending unsupported booking is integrated.
- Support a simple report-a-connectivity-issue flow.
- Show a report receipt and status only where a real status workflow exists.

### Authority Portal — MVP
- Show a map of stops, stations and routes for the chosen study area.
- Identify candidate connectivity gaps using transparent rules.
- Display citizen reports and allow reviewers to group similar issues.
- Show station/area details and data freshness.
- Generate a Connectivity Gap Report with sources, assumptions and limitations.
- Compare two or three possible improvements for one selected location.
- Let a reviewer save a recommendation and track it as proposed, accepted, rejected or requiring more evidence.

### Leave for a later phase
- Nationwide coverage.
- Guaranteed real-time feeds from every operator.
- Direct reserved-train ticket booking.
- Full taxi booking and fare guarantees.
- Automatic changes to public-transport services.
- Large-scale sightseeing, hotel and restaurant booking.
- Automated declarations that a commuter's report proves an operational failure.

## 24. How to measure success

Measure both citizen experience and public-sector value. Do not rely on downloads, number of screens or amount of AI output as the primary evidence of impact.

### Citizen measures
- Time required to plan a complete journey.
- Percentage of test journeys for which a complete, feasible itinerary can be generated.
- Accuracy of displayed schedules and fares against the stated sources.
- Number of planned transfers that have sufficient, explainable buffers under the selected criteria.
- Whether users understand the next step without additional manual searching.
- User-reported difficulty, cost and usefulness after a journey.
- Percentage of reports with sufficient detail for review.

### Authority measures
- Number of potential gaps identified and independently reviewed.
- Time needed to prepare a connectivity analysis before and after using the portal.
- Percentage of generated findings traceable to supporting data.
- Number of recommendations that receive a formal review.
- Time to triage and assign an accepted issue, where a real workflow exists.
- Number of actions with recorded completion evidence.
- Change in the selected connectivity indicator after a real intervention, when comparable follow-up data becomes available.

For a hackathon, use a clearly documented test set and record the baseline before comparing the result. Separate simulated outcomes from field-validated outcomes.

## 25. Example end-to-end demonstration for judges

The following is an illustrative demo scenario. Times, services, routes and data must be verified for the selected travel date before using this as a real itinerary.

1. A traveller enters a home location in Pune, a meeting location in Mumbai and an arrival deadline.
2. SafarSetu presents three complete travel options with cost estimates, transfers, walking and the source status of each leg.
3. The traveller selects the option with a comfortable connection buffer and follows the step-by-step plan.
4. The demo introduces a verified or simulated disruption, clearly labelled as such.
5. SafarSetu shows why the disruption affects the original plan and presents alternative ways to complete the remaining journey.
6. The traveller reports that an important feeder connection is too infrequent or poorly timed.
7. In the authority portal, an analyst sees that report alongside relevant existing service information and related reports, if any.
8. The analyst opens the station or area profile and examines the evidence and data freshness.
9. The analyst creates a Connectivity Gap Report and compares a small set of possible feeder-service adjustments.
10. The portal shows the assumptions and estimated differences between the scenarios.
11. The analyst saves a recommendation for review and records what evidence or field inspection is needed next.
12. The demonstration ends by showing how the citizen experience and authority workflow connect without implying that a proposed intervention has already been approved or implemented.

This single scenario demonstrates the entire concept: a person receives practical journey guidance, a real-world problem is recorded, an authority can investigate a potential pattern and the system produces a reviewable recommendation.

---

## 26. Product principles to preserve throughout development

1. **Plan the complete journey.** Show the traveller how the legs fit together instead of presenting disconnected search results.
2. **Be honest about uncertainty.** Distinguish official, scheduled, live-verified, estimated and user-reported information.
3. **Use AI to explain, not fabricate.** Times, fares, routes and findings must come from actual data or transparent calculations.
4. **Turn complaints into evidence, not automatic conclusions.** Grouping and prioritization can help reviewers, but human validation remains essential.
5. **Make authority outputs actionable.** Every important finding should identify its evidence, limitations and a sensible next step.
6. **Measure what improves.** Use baseline comparisons and clearly separate modeled impacts from observed outcomes.
7. **Protect the traveller.** Make reporting, location sharing and saved journeys transparent and opt-in where appropriate.
8. **Start with one useful corridor.** Demonstrate quality and reliability in a bounded area before claiming citywide or nationwide coverage.

## Final product definition

**SafarSetu is a two-experience mobility service:** the Citizen App helps people plan and complete public-transport journeys from origin to destination, while the Transport Authority Portal helps authorized teams discover connectivity gaps, analyse reports, compare improvements and track actions. Its distinguishing value is the connection between reliable end-to-end journey guidance for citizens and evidence-based first-/last-mile planning for authorities.
