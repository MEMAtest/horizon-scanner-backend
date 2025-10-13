# Phase 1 – Experience Mapping Packet

## Purpose & Context
Phase 1 translates the Intelligence Suite transformation blueprint into actionable experience artefacts. The goal is to validate the audiences, journeys, and data needed for downstream delivery. This packet consolidates the agreed personas, the core journeys they must complete inside the platform, the report templates that each page must produce, and the data/API changes required to make those experiences real.

- **Timeline:** Week 0‑1 of the Intelligence Suite roadmap.
- **Leads:** Product (experience owner), UX (journeys, templates), Engineering (data/API audit), Ops SMEs (workflow validation).
- **Success Criteria:** Artefacts signed off by Product, UX, Engineering, Ops; follow-on stories created for Phase 2.

---

## Personas & Jobs-To-Be-Done

| Persona | Description | Primary Goals | Key Pain Points Today | Success Measures |
| --- | --- | --- | --- | --- |
| Executive Sponsor | Chief Compliance / CRO level reviewer consuming high-level trends across regulators and sectors. | Understand where pressure is building, what has changed week-to-week, and which teams own the response. | Needs curated summary across pages; reports currently feel disconnected; no quick way to see accountable owners. | Receives concise weekly briefing with clear risk posture; spends <10 minutes to validate responses; confidence in ownership. |
| Intelligence Analyst | Daily operator monitoring incoming updates, triaging, and preparing talking points for leadership. | Prioritise daily intelligence, flag critical items, collaborate on notes, seed Weekly Smart Briefing content. | Duplicate effort across pages, manual spreadsheet notes, slow handoff to leadership brief. | Completes triage queue each morning; produces Intelligence Center report without leaving the platform; fewer manual notes. |
| Operations Lead | Controls & operations manager coordinating tasks, deadlines, and stakeholder responses. | Track sector deadlines, assign follow-ups, ensure tasks close, and prepare committee packs. | Deadlines scattered, no single place to check assignment status, reporting requires manual cleanup. | Sees clear pressure gauges, has live ownership matrix, exports Sector Risk brief directly for committees. |

### Persona-Specific Needs
- **Executive Sponsor:** macro momentum dashboard, trustable narrative, minimal noise, clear escalation paths.
- **Intelligence Analyst:** granular filters, inline actions (flag, assign, annotate), task backlog visibility, ability to seed Haiku prompts.
- **Operations Lead:** deadline calendar, task ownership, alerting thresholds, integration with action log.

---

## Priority Scenarios

| Scenario | Trigger | Primary Persona(s) | Desired Outcome | Key Platform Capabilities |
| --- | --- | --- | --- | --- |
| Morning Regulatory Sweep | Analyst checks overnight updates. | Intelligence Analyst | Triage critical updates, flag items for exec briefing. | Persona filters, quick actions, heat strips, annotation sync. |
| Executive Weekly Prep | Exec reviews upcoming leadership meeting. | Executive Sponsor | Receive Momentum/Pressure summary, validate priorities, confirm owners. | Report exports, momentum indicators, linked actions. |
| Deadline Readiness Review | Ops lead monitors sector deadlines. | Operations Lead | Confirm upcoming consultations/deadlines and owner status. | Timeline view, pressure gauges, alert rules, task status. |
| Emerging Trend Alert | Spike from specific authority/topic. | Intelligence Analyst & Executive Sponsor | Understand why trend changed, decide on escalation. | Momentum delta visualisation, Haiku forecast cards, alert notifications. |
| Committee Pack Compilation | Regular governance meeting. | Operations Lead | Export Sector Risk Brief tailored to watchlist. | Report template, data filters, ownership mapping. |

---

## End-to-End Journey Maps

### Journey A – Morning Regulatory Sweep (Analyst)
1. **Discover:** Analyst receives notification of new items via dashboard heat strip.
2. **Assess:** Applies persona filter, reviews relevance score, opens quick actions.
3. **Annotate:** Adds note, assigns owner, or flags for Weekly Brief directly from card.
4. **Prioritise:** Moves items through statuses (Reviewing → Assigned → Closed) in collaboration pane.
5. **Report:** Selects key items and exports Intelligence Center Report for distribution.
6. **Propagate:** Flagged items automatically enrich Weekly Smart Briefing payload.

**System Requirements:** Annotation service metadata (`origin_page`, `status`, `assigned_to`); quick action API; export templating; smart briefing webhook.

### Journey B – Executive Weekly Prep (Executive Sponsor)
1. **Contextualise:** Opens Authority Spotlight to review momentum indicators and forecast cards.
2. **Compare:** Uses topic shift radar to identify new themes and cross-authority links.
3. **Decide:** Reviews recommended actions / owners surfaced in forecast cards.
4. **Summarise:** Exports Authority Momentum Brief for leadership deck inclusion.
5. **Follow Through:** Checks action log to ensure tasks created during brief are in progress.

**System Requirements:** Aggregated momentum stats, forecast narrative prompts, export-ready template, action log visibility filtered for exec.

### Journey C – Deadline Readiness Review (Operations Lead)
1. **Monitor:** Opens Sector Intelligence page; reviews pressure gauges with threshold flags.
2. **Plan:** Switches to timeline view for 90-day horizon and confirms owners per deadline.
3. **Escalate:** Subscribes to alerts for sectors crossing “Elevate” or “Critical” thresholds.
4. **Collaborate:** Uses playbook suggestions to align actions with responsible teams.
5. **Report:** Generates Sector Risk Brief for governance forum.

**System Requirements:** Pressure scoring pipeline, deadline metadata with owner attribution, alert subscription settings, playbook prompt outputs, export pipeline.

---

## Report Template Definitions

### Intelligence Center Report
- **Audience:** Intelligence analysts, senior managers needing situational awareness.
- **Sections:**
  - Executive Summary (auto-generated via Haiku prompt seeded with flagged items + notes).
  - Critical Updates (table with authority, topic, action taken, owner, status).
  - Emerging Risks (cards with risk description, confidence score, recommended follow-up).
  - Action Log Summary (recent assignments, outstanding tasks).
- **Data Inputs:** Flagged update metadata, annotations, action log entries, risk scores.
- **Export Formats:** PDF (default), HTML (for intranet embedding), optional email digest.
- **Prompt Stub:** “Summarise the flagged items into three bullet points, call out unresolved owners, highlight notable patterns.”

### Authority Momentum Brief
- **Audience:** Executive sponsor, leadership committee.
- **Sections:**
  - Momentum Overview (velocity trend, enforcement ratio, coordination score).
  - What Changed This Week (Haiku narrative comparing deltas vs. prior week).
  - Forecast Outlook (Next 7 Days, Watch Items, Confidence level).
  - Recommended Actions (auto-suggested assignments + open items).
- **Data Inputs:** Momentum stats, anomaly detection outputs, annotated notes, forecast prompts.
- **Export Formats:** PDF slide, HTML summary, optional JSON for downstream dashboard.
- **Prompt Stub:** “Describe notable momentum shifts, explain likely drivers, propose executive questions.”

### Sector Risk Brief
- **Audience:** Operations lead, risk committees, frontline teams.
- **Sections:**
  - Sector Pressure Gauges (per sector status with rationale).
  - Deadline Roadmap (timeline of upcoming consultations, compliance dates).
  - Ownership Matrix (sector → owner → current action status).
  - Mitigation Playbook (Haiku-generated recommendations triggered by thresholds).
- **Data Inputs:** Pressure scores, deadline metadata, assignments, playbook prompts.
- **Export Formats:** PDF pack, HTML page, CSV attachment for task tracking.
- **Prompt Stub:** “Summarise the top three sectors requiring attention, include next actions and owners.”

---

## Data Contract & API Audit

| Data Object / Endpoint | Required Fields | Current Status | Gap / Action | Owner | Notes |
| --- | --- | --- | --- | --- | --- |
| `GET /updates` (Intelligence Center feed) | `persona_relevance`, `risk_score`, `quick_actions`, `origin_page` | `persona_relevance` missing; others partial. | Add field derivation in scoring pipeline; annotate origin on creation. | Engineering (Data) | Align scoring weights with persona definitions. |
| Annotation Service (`POST /annotations`) | `assigned_to`, `status`, `report_included`, `page_context` | `assigned_to` present; `status` limited; others missing. | Extend schema and migrations; update UI clients to send context. | Engineering (Backend) | Ensure audit history records changes. |
| Report Export Service (`POST /reports`) | `report_type`, `filters`, `payload_id`, async `export_url` callback | MVP exists for generic exports. | Add templates per report type; implement callback contract. | Engineering (Platform) | Consider queue worker for PDF generation. |
| Weekly Smart Briefing Feed | Structured JSON payload for flagged items, momentum deltas, pressure gauges | Current integration only ingests flagged items. | Expand payload schema; version prompts; add tests. | ML/Prompt Ops | Coordinate with Haiku prompt library. |
| Alert Subscription (`POST /alerts`) | `scope` (sector/authority), `threshold`, `channel`, `owner` | Endpoint not yet available. | Design API, integrate with notification service. | Engineering (Platform) | Align with existing notification preferences. |
| Metrics Endpoint (`GET /metrics/actions`) | `flag_counts`, `exports`, `alerts_acknowledged`, persona filters | Basic ingestion metrics only. | Extend instrumentation; add persona tag. | Engineering (Data) | Feed adoption dashboard in Phase 5. |
| Smart Briefing Dataset | `annotations[]` with persona/origin/action metadata, `annotationInsights` summary payload | Normalised during dataset build. | Keep prompts/versioning aligned to new schema; add regression smoke covering summaries. | ML/Prompt Ops | Enables narrative stitching from triage actions. |

### Known Dependencies
- Access to current scoring heuristics and annotation schema.
- Existing PDF export infrastructure (wkhtmltopdf or Puppeteer pipeline).
- Notification service capability (email, Slack webhook, in-app).

---

## Outstanding Questions & Assumptions
- **Assumption:** Personas validated with product stakeholders last quarter remain accurate; any updates will be captured during Day 0 workshop.
- **Question:** Does Groq/Haiku support multi-report prompt versioning concurrently, or do we need staged rollout?
- **Assumption:** Current authentication model suffices; RBAC review deferred to Phase 2 unless flagged in Day 4 playback.
- **Question:** Do operations teams require integration with external task systems (e.g., JIRA, ServiceNow) for action follow-up?

---

## Next Actions
1. **Day 0 Kickoff:** Review this packet, capture adjustments, confirm owners for each gap action.
2. **Create Backlog Items:** For every gap above, log stories/epics with estimates and link to relevant teams.
3. **Template Prototyping:** UX to produce low-fidelity examples for each report by Day 3.
4. **Data Validation Sessions:** Engineering/Data to confirm availability and complexity for new fields.
5. **Playback & Sign-off:** Consolidate artefacts, capture decisions/risks, and lock handoff for Phase 2 (Foundational Wiring).

---

## Draft Backlog Stories

| ID | Title | Description | Owner | Dependencies | Target Day |
| --- | --- | --- | --- | --- | --- |
| P1-001 | Validate Personas & Scenarios | Run Day 0 workshop; confirm persona briefs and JTBD, document updates. | Product / UX | Stakeholder availability | Day 0 |
| P1-002 | Morning Sweep Journey Map | Produce annotated journey map for analyst flow and capture pain points/gaps. | UX | Output from P1-001 | Day 1 |
| P1-003 | Executive Prep Journey Map | Document executive journey with required data touchpoints. | UX | Output from P1-001 | Day 1 |
| P1-004 | Deadline Review Journey Map | Capture operations lead journey, including alerts and ownership checks. | UX | Output from P1-001 | Day 1 |
| P1-005 | Intelligence Center Report Template | Draft structure, data slots, prompt stub, review with Product Marketing. | UX / Product Marketing | P1-002 | Day 2 |
| P1-006 | Authority Momentum Brief Template | Create template with required visual elements and narrative cues. | UX / Product Marketing | P1-003 | Day 2 |
| P1-007 | Sector Risk Brief Template | Define template with gauges, timeline, ownership matrix placeholders. | UX / Product Marketing | P1-004 | Day 2 |
| P1-008 | Data Field Gap Analysis | Confirm availability of `persona_relevance`, `report_included`, `page_context`. | Engineering (Data) | Existing schemas | Day 2 |
| P1-009 | Annotation Schema Extension Design | Draft migration plan for annotation service additions. | Engineering (Backend) | P1-008 | Day 3 |
| P1-010 | Report Export Contract Update | Specify payload, callback, and template identifiers per report type. | Engineering (Platform) | P1-005–P1-007 | Day 3 |
| P1-011 | Weekly Brief Schema Draft | Extend payload spec to include momentum deltas, pressure gauges. | ML / Prompt Ops | P1-002–P1-004 | Day 3 |
| P1-012 | Alert Subscription API Outline | Capture requirements for sector/authority thresholds and channels. | Engineering (Platform) | P1-004 | Day 3 |
| P1-013 | Metrics Instrumentation Plan | Define events and tags for flags, exports, alerts acknowledgements. | Engineering (Data) | P1-002–P1-004 | Day 4 |
| P1-014 | Risk & Assumption Register | Consolidate risks, mitigations, and outstanding questions. | Product | Inputs from all workstreams | Day 4 |
| P1-015 | Playback Readout & Sign-off | Assemble deliverable packet, host playback, capture approvals. | Product / UX | Completion of P1-001–P1-014 | Day 5 |

Use these story IDs when creating tickets in the delivery tracker; link artefact outputs from this packet for traceability.

---

Prepared as part of Phase 1 Experience Mapping to operationalise the Intelligence Suite transformation blueprint.
