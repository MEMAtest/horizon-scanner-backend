# Profile-Driven Intelligence & Behavioural Learning

## 1. Context

The Horizon Scanner “AI Intelligence” experience currently provides aggregated regulatory insights without deeply factoring the firm profile of an individual user. Product leadership wants a premium-grade, personalised intelligence layer that recognises the type of financial services organisation, its scale, and the user’s operating personas. The desired outcome is that every daily snapshot, workflow recommendation, and risk pulse reflects what matters most to that specific profile, while still allowing exploration of adjacent sectors.

This document captures the functional intent, data contracts, and service changes required so that any engineer or AI agent can implement the work end-to-end.

## 2. Objectives

- **Profile-driven curation**: Users choose their firm type, footprint, and operational focus once, and the platform tailors intelligence streams automatically.
- **Learning loop**: The system observes user interactions (pins, dismissals, workflow usage) to fine-tune future recommendations.
- **Seamless onboarding**: First-run experience on “Home0” guides users through profile creation and makes the benefit obvious.
- **Persistent control**: Users can see, edit, and pause their profile influence at any time without losing access to broader intelligence.

Success metrics can include increased engagement with tailored updates, reduced time to actionable insight, and higher workflow adoption for profiled users.

## 3. User & Persona Overview

| Profile Attributes | Examples | Usage |
|--------------------|----------|-------|
| Primary Service Type | Payments, Retail Banking, Insurance, Wealth, Fintech, Other | Drives curated hero insight, risk lens, recommended workflows |
| Company Size | Micro (<50), Mid (50-500), Enterprise (>500) | Influences workflow templates and compliance burden assumptions |
| Operating Regions | UK, EU, US, Global | Filters authority emphasis and deadline reminders |
| Regulatory Posture | Authorised, Applying, Multi-jurisdiction | Adjusts urgency of alerts and suggested playbooks |
| Personas of Interest | Executive, Compliance, Operations, Product | Prioritises persona panels and next steps |
| Goals | e.g. “Track enforcement actions”, “Stay ahead of payment mandates” | Seeds recommended saved searches, workflows |

## 4. Feature Overview

1. **Profile onboarding wizard** (Home0) with 3 guided steps (Service, Footprint, Focus) and a preview summary.
2. **Personalised Home0 layout** that lifts profile-relevant insights while maintaining access to other sectors (clearly marked as “outside focus”).
3. **Profile drawer** accessible from header to review, edit, duplicate, or pause profile influence.
4. **Behavioural learning loop** that captures user interactions and boosts relevant entities (authorities, themes, workflows) over time.
5. **Profile reminders** prompting users when behaviour indicates the configured profile is stale or missing.

## 5. System Architecture

```
                +-------------------+
                |  Frontend (Home0) |
                +---------+---------+
                          |
                          v
                 Profile API Layer
                          |
        +-----------------+-----------------+
        |                                   |
  ProfileService                     TelemetryService
        |                                   |
  PostgreSQL (user_profiles)       PostgreSQL (intelligence_events)
        |                                   |
        |                                   v
        |                          FeedbackAggregator Job
        |                                   |
        +-------------------+---------------+
                            |
                       RelevanceService
                            |
                    Intelligent Snapshot
```

### Key services

- **ProfileService**: CRUD for user profiles, caching, and default fallbacks.
- **TelemetryService**: API + backend helper to record behavioural events.
- **FeedbackAggregator**: Scheduled worker computing decayed weights for authorities/themes/personas per profile.
- **RelevanceService**: Combines base relevance scores with behavioural boosts when generating intelligence streams.
- **IntelligenceDashboardService**: Updated to accept profile context, request tuned scores, and annotate outputs with recommendation rationale.

## 6. Data Model Changes

### 6.1 Tables

#### `user_profiles`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | |
| `user_id` | uuid | Foreign key to users |
| `service_type` | text | enum: payments, retail_banking, insurance, wealth, fintech, other |
| `secondary_service_types` | text[] | Optional multi-select |
| `company_size` | text | enum: micro, mid, enterprise |
| `regions` | text[] | e.g. `['UK','EU']` |
| `regulatory_posture` | text | e.g. authorised, applying, multi |
| `personas` | text[] | persona tags |
| `goals` | text[] | high-level objectives |
| `preferences` | jsonb | cadence toggles, email digests, etc. |
| `is_active` | boolean | Active profile toggle |
| `created_at` / `updated_at` | timestamptz | |

#### `intelligence_events`

| Column | Type | Notes |
|--------|------|-------|
| `id` | bigserial | PK |
| `user_id` | uuid | |
| `profile_id` | uuid | nullable (for unprofiled events) |
| `event_type` | text | enum: pin, unpin, dismiss, workflow_start, workflow_complete, persona_switch, alert_click |
| `update_id` | text | references update record/UUID |
| `workflow_template_id` | uuid | optional |
| `payload` | jsonb | authority, theme, urgency, etc. |
| `created_at` | timestamptz | |

#### `profile_feedback_scores`

| Column | Type | Notes |
|--------|------|-------|
| `id` | bigserial | PK |
| `profile_id` | uuid | |
| `entity_type` | text | enum: authority, theme, persona, workflow_template |
| `entity_id` | text | authority slug, theme tag, etc. |
| `weight` | numeric | Rolling decayed score |
| `last_event_at` | timestamptz | |
| `window_counts` | jsonb | e.g. `{ "7": 3, "30": 9 }` |
| `updated_at` | timestamptz | |

### 6.2 Optional Support Tables

- `intelligence_event_queue`: implements outbox pattern for async processing.
- `profile_change_log`: audit trail for profile edits (timestamp, user, delta).

## 7. API & Service Contracts

### 7.1 Profile API

- `GET /api/profile/current` → returns active profile data with derived metrics.
- `POST /api/profile` → create or update profile.
- `PATCH /api/profile/:id` → partial update of sections.
- `POST /api/profile/:id/pause` / `resume`.

Responses include metadata: `applied_at`, `influence_status`, `recommended_streams`.

### 7.2 Telemetry API

- `POST /api/intelligence/events`

Request body:
```json
{
  "eventType": "pin",
  "updateId": "update-123",
  "profileId": "profile-abc",
  "meta": {
    "authority": "PSR",
    "theme": "payments_innovation",
    "urgency": "High",
    "bucket": "high"
  }
}
```

### 7.3 Relevance Service

- `calculateRelevanceScore(update, firmProfile, behaviourContext?)`
  - Returns `{ score, contributions: { base, profile, behaviour }, tags }`.
  - Called from `ensureUpdatesContainer` and persona briefing builder.

### 7.4 Snapshot Generation

- `getDailySnapshot({ profileId, now })` extends existing service: injects profile ID, includes `recommendationMeta` to express why updates were surfaced (e.g., `boostedBy: ['authority:PSR', 'theme:payments']`).

## 8. Pages & UX Flow

### 8.1 Onboarding (Home0 First Launch)

1. **Hero Panel**: “Tailor intelligence to your firm” with quick description.
2. **Step Layout**:
   - Step 1 (Service Type): pill selection cards with sample regulators and recommended workflows.
   - Step 2 (Firm Footprint): segmented controls for company size, region toggles, regulatory posture checkboxes.
   - Step 3 (Operational Focus): persona toggles + goal chips + cadence slider.
3. **Summary Screen**: composite card with icons per decision, edit links, CTA “Save & Personalise Feed”.
4. **Preview Area**: snapshot of tailored hero, risk pulse, recommended workflows.

UI components should be captured in Figma with states for desktop/tablet. Provide accessibility copy for each step.

### 8.2 Personalised Home0

Layout adjustments (post onboarding):

- **Welcome Banner**: `<ProfileName> insights for <region>` with quick link “Adjust profile”.
- **Hero Insight**: uses profile-specific hero content; includes “Because you focus on Payments” tag.
- **Risk Pulse**: filtered view referencing boosts.
- **Priority Streams**: high column emphasises matches; other streams appear with “Outside profile” badges and muted styling.
- **Profile Highlights Widget**: summarises authorities/themes driving recommendations, with CTA to view learning activity.
- **Workflow Spotlight**: recommended templates (prefiltered).
- **Empty States**: if no profile yet, show mini wizard callout.

### 8.3 Profile Control Drawer

- Access via header “Profile” button.
- Sections:
  - Overview (service type, regions, personas, last updated).
  - Influence toggle (“Pause profile personalisation”).
  - Behaviour summary (top boosted authorities/themes).
  - Buttons: Edit, Duplicate, Reset.
- Include deep link to “Profile Activity” page (optional future).

### 8.4 Reminder Prompts

- Toast or inline banner when user interacts heavily outside current profile.
- Suggest expanding profile to new service type or region.

## 9. Behavioural Learning Loop Details

1. Frontend emits telemetry events on:
   - Pin/Unpin
   - Dismiss update
   - Workflow creation/completion
   - Persona switches (for context)
   - Alert click-throughs
2. TelemetryService writes to `intelligence_events`, ensures basic validation.
3. FeedbackAggregator job (e.g., every 10 minutes):
   - Selects new events since last run.
   - For each, calculates weight increment (base weight per event type, decayed by time).
   - Updates `profile_feedback_scores` with atomic upserts.
   - Optionally writes to analytics log (for dashboards).
4. RelevanceService pulls weights when scoring:
   - `behaviourBoost = sum(weight[entity] * factor)` per authority/theme.
   - Combines with base relevance (70%) and profile match weight (20%).
   - Caps total influence to avoid overfitting (e.g., max +15% of total score).
5. Snapshot builder includes `recommendationMeta` used by UI to show “Recommended because you pinned HM Treasury updates last week.”

## 10. Non-Functional Requirements

- **Performance**: profile lookups must be cached (Redis) to avoid adding latency to snapshot generation (<100 ms impact).
- **Scalability**: telemetry events expected to be high-volume; ensure batching and indexes on `profile_id`, `created_at`.
- **Security**: profile data may be sensitive; restrict access to owning user/organisation. Ensure telemetry does not leak personal data in `payload`.
- **Auditability**: log profile changes and boosts for compliance teams; store at least 90 days of changes.
- **Accessibility**: onboarding wizard must be keyboard navigable; include aria-live updates for step changes.

## 11. Rollout Plan

1. **Phase 0**: Create data structures, backfill default profiles (maybe “Unspecified”), implement basic profile CRUD.
2. **Phase 1**: Build onboarding UI gated behind feature flag; store profile data, but do not yet influence relevance.
3. **Phase 2**: Implement behavioural telemetry collection and aggregator; start logging boost contributions (shadow mode).
4. **Phase 3**: Enable personalised scoring for beta cohort; monitor metrics (engagement, latency).
5. **Phase 4**: Launch to all users, add reminder prompts and profile activity insights.

## 12. Open Questions / Decisions Needed

- Do we allow multiple profiles per user (e.g., for consultants)? If yes, how to switch?
- Should behavioural boosts be shared across organisation or kept per user?
- What is the retention period for telemetry events (privacy considerations)?
- How do we expose the recommendation rationale in UI (tooltips, dedicated panel)?
- Any dependency on segmenting saved searches/alerts by profile?

## 13. Next Steps

- Capture Figma wireframes for onboarding flow, profile drawer, and personalised Home0.
- Define feature flags (`profiles.onboarding`, `profiles.behaviourLearning`).
- Draft API contracts in OpenAPI for Profile and Telemetry endpoints.
- Implement migrations and seed script for `integrations_catalog` (when integrations resume).
- Plan unit/integration tests (services, aggregator, telemetry, UI state management).

This document should be the single source of truth for the profile personalisation initiative. Update it as implementation details evolve or new decisions are made.
