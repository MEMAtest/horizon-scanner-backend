# Intelligence Suite Transformation Blueprint

## Executive Summary
Transform the Intelligence Center, Authority Spotlight, and Sector Intelligence pages from isolated, list-driven views into an integrated decision system. Each page must:

- Enable users to triage, collaborate, and act directly on the page.
- Generate a tailored, export-ready report (e.g., Intelligence Center Alert Pack, Authority Momentum Brief, Sector Risk Sheet).
- Feed structured insights into the Weekly Smart Briefing so Haiku can stitch narrative, change-map, and sector-risk sections automatically.

## Current Pain Points
| Category | Issue | Impact |
| --- | --- | --- |
| Redundant Data | Same updates surface in multiple areas with little context | Users re-read information without clarity on what changed |
| Fragmented Journey | No guidance on which page to use for what scenario | Analysts lack a clear workflow; executives don’t know where to look |
| Static Displays | Metrics and lists don’t suggest next steps | Decisions stall; annotations live in notebooks instead of the platform |
| Weak Integration | Authority & Sector views don’t enrich Weekly Brief | Weekly narrative feels detached from daily intelligence |
| Unclear Value | Each page’s unique purpose is ambiguous | Adoption suffers; stakeholders question why to revisit the pages |

## Guiding Principles
1. **Action First:** Every insight should have an obvious next step (flag, assign, annotate, add to report).
2. **Report on Demand:** Each module must export a concise, audience-ready briefing derived from current filters.
3. **Continuous Storytelling:** Flagged insights, momentum deltas, and pressure signals should flow into Weekly Smart Briefing prompts automatically.
4. **Telemetry & Governance:** Track who flagged, annotated, exported, and ensure auditability for compliance.

## Target Capabilities By Page

### 1. Intelligence Center → Real-Time Triage Dashboard
**Purpose:** Rapidly triage cross-regulator updates, coordinate response, and produce situational summaries.

| Capability | Description | Output |
| --- | --- | --- |
| Persona Filters | Executive, Analyst, Operations profiles that tune relevance scoring | Personalized cards + counters |
| Quick Actions | `Flag for Weekly Brief`, `Add Note`, `Assign`, `Create Task` buttons on each update | Creates annotation + action log |
| Collaboration Pane | Inline notes, status (Reviewing / Assigned / Closed), @mentions | Persists to shared annotation service |
| Heat Strips | Sparkline of daily update velocity and risk intensity | Guides which queue to tackle first |
| Export `Intelligence Center Report` | Picked items compiled into PDF/HTML report with executive summary, open tasks | Delivered via export service; optional email |
| Weekly Brief Feed | Flagged items submitted to Haiku with theme hints for “Week’s Story” | Annotated JSON payload into Smart Briefing |

### 2. Authority Spotlight → Behavioral Prediction Engine
**Purpose:** Understand regulator momentum, anticipate shifts, and brief leadership.

| Capability | Description | Output |
| --- | --- | --- |
| Momentum Indicators | Update velocity, enforcement ratio, coordination scores (cross-authority links) | Trend charts + anomaly badges |
| Topic Shift Radar | NLP clustering that highlights emerging themes vs. trailing ones | Radar / quadrant view |
| Forecast Cards | Haiku-generated “Next 7 Days” & “What Changed” blurbs based on momentum deltas | Cards with confidence scores |
| Alerting | Thresholds for unusual behavior auto-notify relevant teams | Notification + task suggestions |
| Export `Authority Momentum Brief` | One-click report with current stats, Haiku narrative, recommended actions | PDF/HTML ready for leadership |
| Weekly Brief Feed | Momentum changes feed “Change Map” categories + exec summary callouts | Structured payload for Haiku |

### 3. Sector Intelligence → Regulatory Pressure Monitor
**Purpose:** Monitor sector-specific pressure, deadlines, and stakeholder tasks.

| Capability | Description | Output |
| --- | --- | --- |
| Pressure Gauges | Composite score using mentions, consultation density, open deadlines | Gauge with thresholds (Monitor, Elevate, Critical) |
| Timeline View | Rolling 90-day deadline roadmap with ownership status | Interactive timeline |
| Playbook Suggestions | Haiku suggests mitigation steps when pressure crosses threshold | Recommendation cards |
| Alert Rules | Users subscribe to sector watchlists; alerts triggered on pressure spikes | Inbox/email/Slack style alerts |
| Export `Sector Risk Brief` | Custom report summarizing pressure gauges, upcoming deadlines, owners | PDF/HTML ready for committees |
| Weekly Brief Feed | Critical sectors feed One-Pager risk and Team Briefing next steps | Structured data into Smart Briefing |

## Cross-Cutting Services
- **Annotation Service:** Stores notes, assignments, tags, links (already implemented) – extend to capture origin page + report inclusion status.
- **Action Log:** Audit trail for quick actions, exports, and alert acknowledgements.
- **Report Generator:** Template engine that formats data + Haiku narrative into shareable outputs (PDF/HTML/Email).
- **Prompt Orchestration:** Update Haiku prompt library to accept page-specific payloads (triage stories, momentum deltas, pressure gauges) and produce consistent sections.
- **Metrics Dashboard:** Surface run counts, cache hits, tokens (existing) plus page actions (flags, exports, alerts) for adoption tracking.

## Implementation Phases
| Phase | Timeline | Objectives | Deliverables | Status |
| --- | --- | --- | --- | --- |
| **1. Experience Mapping** | Week 0‑1 | Align personas, journeys, report templates, data contracts | Unified UX flows, report outlines, API schema updates | 🔄 In Progress |
| **2. Foundational Wiring** | Week 1‑3 | Shared annotation enhancements, action log, report scaffolding, Smart Briefing hook upgrades | Annotation metadata (page + status), action logging service, report generation MVP, updated Haiku prompts | ⏳ Pending |
| **3. Intelligence Center Launch** | Week 3‑5 | Deliver triage dashboard, quick actions, report export, Weekly Brief integration | New UI, persona filters, Intelligence Center Report, flagged-items API feeding Smart Briefing, user enablement pack | ⏳ Pending |
| **4. Authority & Sector Upgrades** | Week 5‑8 | Momentum engine, pressure monitor, report exports, alerting, Weekly Brief feeds | Authority Momentum Brief, Sector Risk Brief, automation rules, Smart Briefing Change Map/Risk feeds | ⏳ Pending |
| **5. Optimize & Govern** | Week 8+ | Prompt tuning, threshold calibration, performance, metrics, governance | Adoption dashboards, playbooks, SLA doc, security review, training updates | ⏳ Pending |

### Phase 1 Execution Plan (Week 0‑1)
_Detailed artefacts are captured in `docs/phase-1-experience-mapping.md`._
**Objectives**
- Validate the personas, journey flows, and data stories that will anchor the Intelligence Center, Authority Spotlight, and Sector Intelligence experiences.
- Produce share-ready report templates and confirm the API contracts required to populate them.

**Workstreams**

| Workstream | Key Activities | Primary Owner(s) | Outputs |
| --- | --- | --- | --- |
| Persona & Scenario Alignment | Confirm primary personas, clarify their core jobs-to-be-done, finalize triage vs. insight consumption scenarios. | Product + UX | Persona brief, prioritized scenarios with success metrics. |
| Journey Mapping | Map end-to-end flows (ingest → triage → action → reporting) for each persona, including cross-page handoffs. | UX + Ops SMEs | Annotated journey maps, gap list for Phase 2 user stories. |
| Report Template Definition | Draft Intelligence Center Report, Authority Momentum Brief, Sector Risk Brief templates with data slots and narrative prompts. | Product Marketing + Data | Low-fidelity templates, content checklists, prompt stub library. |
| Data Contract & API Audit | Inventory current data availability, identify missing fields (e.g., `persona_relevance`, `report_included`), document required schema changes. | Engineering + Data | Updated API contract, backlog tickets for schema updates. |

**Timeline & Ceremonies**
- Day 0: Kickoff workshop (120 mins) aligning objectives and reviewing existing assets.
- Day 1-2: Parallel workstream sessions; daily 30-minute stand-up to surface blockers.
- Day 3: Draft readouts circulated asynchronously for feedback.
- Day 4: Playback session to ratify personas, journeys, and template structures.
- Day 5: Finalize consolidated Phase 1 packet; log tickets for Phase 2 dependencies.

**Inputs Needed**
- Latest persona research, engagement analytics, and qualitative feedback.
- Current annotation service schema and report generation capabilities.
- Haiku prompt catalog and any existing triage or reporting prompts.

**Exit Criteria**
- Shared persona and journey artefacts signed off by Product, UX, Ops, and Engineering leads.
- Approved report templates with mapped data fields and prompt placeholders.
- API/data contract updates captured as backlog items with sizing and ownership.
- Risks, assumptions, and open questions recorded for Phase 2 discovery.

**Risks & Mitigations**
- Misalignment on audience expectations → mitigate with joint kickoff and midweek playback.
- Gaps in data availability → flag in audit doc and prioritize schema tickets before Phase 2.
- Limited stakeholder availability → schedule ceremonies in advance and enable async reviews.

## Data & Tech Requirements
- **Data Pipelines:**
  - Momentum calculations (rolling counts, topic NLP clustering, coordination links).
  - Sector pressure scoring (frequency, consultation metadata, deadlines, weighted by impact).
  - Annotation/action metadata fields (`origin_page`, `report_included`, `assigned_to`).
- **APIs:**
  - Flag/Assign endpoints to update annotation service.
  - Report export endpoints (async job returning URL/PDF).
  - Alerts subscription endpoints (sector/authority watch).
  - Metrics endpoint expansion for action counts.
- **Prompt Updates:**
  - Week’s Story prompt to accept flagged item clusters + manual notes.
  - Change Map prompt to ingest momentum data, output structured change categories.
  - Team Briefing prompt to include pressure thresholds + assignments.
  - Page-specific report prompts (center/authority/sector) for on-demand outputs.

## Success Metrics
- **Adoption:**
  - Weekly flag count per persona.
  - Reports generated per page per week.
  - Alert acknowledgements within SLA.
- **Narrative Quality:**
  - % of Weekly Brief sections sourced from page actions.
  - Exec satisfaction scores from report recipients.
- **Operational Velocity:**
  - Time from update ingestion to triage flag/assignment.
  - Time from pressure spike to alert acknowledgement.
- **Governance:**
  - Audit log completeness (who flagged/exported/acknowledged).
  - Prompt output QA (manual review pass rate).

## Open Questions for Implementation AI
1. What weighting schema should be used for sector pressure gauges (mentions vs. deadlines vs. consultations)?
2. Which visualization library aligns with existing stack for gauges and radars?
3. Preferred report formats (PDF vs. HTML vs. email) and delivery channels?
4. Do we need role-based access controls for annotations/actions beyond current auth?
5. How to integrate alerting (email, Slack, in-app) within existing infrastructure?

## Next Steps
1. Validate this blueprint with product/UX stakeholders.
2. Green-light Phase 1 tasks (journey mapping, template drafting).
3. Lock prompt versioning strategy before coding Phase 2 work.
4. Prepare data samples for momentum/pressure calculations to test Haiku outputs.

---
This markdown file is designed for a handoff to an implementation-focused AI: it captures the “why,” the target state, dependencies, and phased roadmap so engineering + UX workstreams can execute cohesively.
