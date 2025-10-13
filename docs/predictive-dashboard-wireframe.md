# Predictive Analytics Dashboard Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Header: Predictive Intelligence Dashboard                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│ Summary Bar                                                                  │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐                  │
│ │ Total      │ │ Act Now    │ │ Horizon    │ │ High-Risk  │                  │
│ │ Insights   │ │ (≤14 days) │ │ (45-90d)   │ │ Sectors    │                  │
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ Filters: [Authority ▾] [Sector ▾] [Confidence ▾] [Reset]                     │
├──────────────────────────────────────────────────────────────────────────────┤
│  ACT NOW (≤14d)  │  PREPARE NEXT (15-45d) │  PLAN HORIZON (45-90d)           │
│  ┌─────────────┐ │  ┌──────────────┐      │  ┌──────────────┐               │
│  │ Card         │ │  │ Card         │     │  │ Card          │              │
│  │ • Title      │ │  │ • Title      │     │  │ • Title       │              │
│  │ • Why line   │ │  │ • Why line   │     │  │ • Why line    │              │
│  │ • Sectors    │ │  │ • Sectors    │     │  │ • Sectors     │              │
│  │ • Buttons    │ │  │ • Buttons    │     │  │ • Buttons     │              │
│  └─────────────┘ │  └──────────────┘      │  └──────────────┘               │
│        ⋮         │         ⋮              │         ⋮                        │
├──────────────────────────────────────────────────────────────────────────────┤
│ Side Drawer (opens when card clicked)                                        │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Header: Prediction title + chips (priority, window, confidence)          │ │
│ │ Why it matters (paragraph)                                               │ │
│ │ Recommended actions                                                      │ │
│ │ Evidence timeline                                                        │ │
│ │ Historical accuracy                                                      │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────┤
│ Hotspots & Momentum Section                                                 │
│ ┌─────────────┬─────────────┬─────────────┐                                 │
│ │ Velocity    │ Sector Heat │ Alerts      │                                 │
│ └─────────────┴─────────────┴─────────────┘                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│ Footer CTA: Download briefing | Subscribe to updates                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Interaction Notes
- Filters re-rank cards and display active pills above columns.
- Cards show `Acknowledge` and `Delegate` buttons; acknowledgement collapses them into a lower "Acknowledged" tray.
- Side drawer slides from right; ESC closes it.
- Hotspots tiles use compact sparklines and severity colour bands.

## Responsive Behaviour
- On tablet (<1024px) columns collapse to stacked accordions in priority order.
- On mobile, summary bar becomes horizontal scroll, filters collapse into sheet, and cards expand to full width with drawer rendering as modal.
