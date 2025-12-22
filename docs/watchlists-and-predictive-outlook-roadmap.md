# Watch Lists + Predictive Outlook Roadmap

This document captures two parallel initiatives:
- **Watch Lists** (start here): matching that is reliable, explainable, and drives workflow (triage → dossier/policy/kanban).
- **Predictive Outlook (12 months)** (next): a next‑year regulatory calendar plus probabilistic “what’s likely next” forecasting.

---

## 1) Watch Lists (Start Here)

### Goals
- Increase match recall without losing precision.
- Make match decisions explainable (“why matched / why not matched”).
- Turn matches into action: create/link dossiers, policies, and change items quickly.
- Make the Watch Lists page feel alive: previews, trends, and triage controls.

### Current Codebase Findings (Why it feels underpowered)
- **Bulk match only scans ~30 days** on creation: `src/services/watchListService.js` (`bulkMatchWatchList`), so older historical matches never appear.
- **Match scoring is capped by criterion type**: keywords contribute up to `0.4`, authority `0.3`, sector `0.3` (`src/services/db/watchLists.js:618`). If a list uses only one criterion type, it may never reach the default threshold (`0.5`).
- **Sector matching only checks a single string field** (`update.sector`) even though updates frequently represent sectors as arrays (e.g., `firm_types_affected`, `primarySectors`).
- **Workflow options exist in the backend** (`autoAddToDossier`, `targetDossierId`) but are not exposed in the Watch List create/edit UI (`src/views/watchLists/components.js`).

### Phase 1 — Reliability (MVP Fixes)
1) **Bulk match window + rescans**
   - Default bulk match scan window from **30d → 90d**.
   - Add UI control per watch list: **Rescan 30/90/180/All** with progress/toast feedback.
   - Avoid false “no matches” by ensuring scan limit is high enough (paginate or raise limit safely).

2) **Rebalanced scoring**
   - Re-normalise weights based on which criteria are configured:
     - Example: if only keywords are configured, keywords become 100% of available score.
   - Keep final score in `[0..1]`.
   - Store score breakdown in `match_reasons` so the UI can explain it.

3) **Better authority + sector matching**
   - Authority aliasing: map common variants (“Financial Conduct Authority” ↔ “FCA”).
   - Sector matching across:
     - `sector` (string)
     - `firm_types_affected` / `primarySectors` / `primary_sectors` (arrays)
     - optionally `sector_relevance_scores` keys

4) **Explainability in the matches modal**
   - Show match breakdown:
     - matched keywords (+ which fields)
     - matched authority/sector (+ alias used)
     - score contribution per dimension
   - Add “near misses” (optional): items with score within e.g. 10% below threshold, to help tuning.

### Phase 2 — Workflow + Triage
1) **Expose workflow settings on watch list**
   - Auto-add match to dossier: enable + select target dossier.
   - Auto-create change item: enable + select workflow template + stage.
   - Notifications: immediate vs daily digest vs weekly digest.

2) **Triage actions in UI**
   - Per-match: “Create change item”, “Bookmark”, “Add to dossier”, “Link policy”.
   - Bulk actions: mark reviewed, dismiss, create change items for selected.
   - Saved triage views: unreviewed only, high-score only, last 7/30/90 days.

3) **Track outcomes**
   - Add status fields on match items (reviewed/dismissed/escalated/linked).
   - Capture “decision notes” for audit trail.

### Phase 3 — Advanced Matching
- Phrase matching (bigrams/trigrams) and regulator document reference detection (PS/CP/FG numbers).
- Exclude keywords / negative filters.
- Optional semantic matching mode (behind a toggle) once taxonomy and explainability are strong.

### Deliverables (Suggested Order)
1) Fix scoring + 90d bulk match + better sector/authority matching.
2) Match explainability UI (score breakdown).
3) Rescan controls + workflow settings (auto dossier/kanban).
4) Triage UI + bulk actions.

---

## 2) Predictive Outlook (12‑Month Calendar + Forecasting)

### Goals
- Produce a **Next‑12‑Months Regulatory Calendar** with:
  - **Known commitments** (explicit deadlines).
  - **Likely windows** (probabilistic forecast) with confidence + evidence.
- Support authority and sector lenses (Authority Spotlight + Sector Intelligence).
- Provide a trust layer: backtesting + calibration.

### Current Data Reality (From the local dataset)
Using `data/updates.json` (432 updates):
- Only **11** updates contain an explicit `compliance_deadline` (6 in the future).
- “Consultation-like” mentions appear in **~17** updates, but `content_type` is frequently missing/`other`.
- Therefore, building a next‑year calendar requires:
  - stronger consultation/content classification
  - deadline extraction from text
  - a dedicated “events ledger” rather than relying on sparse `compliance_deadline`.

### Phase 1 — Build the Regulatory Events Ledger (Calendar Foundation)
1) **Database review + schema inventory**
   - Audit fields available in Postgres/JSON:
     - dates: `published_date`, `compliance_deadline`
     - classification: `content_type`, `category`
     - metadata: `authority`, sectors (`firm_types_affected`, `primarySectors`)
   - Decide canonical event model:
     - `event_type` (consultation_open, consultation_close, policy_statement, implementation_deadline, reporting_deadline, etc.)
     - `event_date` or `event_window_start/end`
     - `authority`, `sectors`, `topic_area`
     - `source_update_id`, `source_url`
     - `confidence` + `extraction_method`

2) **Event extraction (non-AI first)**
   - Parse explicit dates:
     - `compliance_deadline` → event(s) with type inferred by content patterns (consultation response vs implementation).
   - Pattern extraction from headline/summary:
     - “responses by”, “deadline”, “consultation closes”, “by <date>”, etc.
   - Store extracted events in:
     - Postgres table `regulatory_events` (if available), or
     - JSON file `data/regulatory_events.json` as fallback.

3) **Consultation classification upgrade**
   - Improve `content_type` inference:
     - consultation / DP / CP / policy statement / enforcement / speech.
   - Backfill classifications for the last 24 months to support calendar building.

### Phase 2 — Next‑12‑Months Calendar UI
- Calendar views:
  - timeline (month)
  - list (sortable by authority/sector/type/confidence)
  - “consultations closing soon”
- Actions on events:
  - create watch list / dossier / kanban item
  - link policy
- Export:
  - CSV export
  - optional ICS calendar export

### Phase 3 — Probabilistic Forecasting (“Likely Next”)
1) **Lifecycle forecasting**
   - Learn typical lags:
     - consultation → final
     - final → implementation
   - Forecast “expected windows” for current themes/authorities with confidence bands.

2) **Cadence / seasonality forecasting**
   - Build 24‑month monthly baselines per authority/content type.
   - Forecast volume expectations for next 12 months.

3) **Backtesting + calibration**
   - Evaluate: hit rate, calibration of confidence buckets, usefulness of top‑N forecasts.
   - Surface “model performance” on the page.

### Deliverables (Suggested Order)
1) Events ledger + extraction + classification improvements.
2) Next‑12‑months calendar UI + export.
3) Lifecycle + cadence forecasting + backtesting.

---

## Recommended Starting Point
Start with **Watch Lists Phase 1** (reliable matching + explainability) because it immediately improves user trust and provides a clean signal pipeline that the Predictive Outlook can later build on.

