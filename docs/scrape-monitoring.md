# Scrape Monitoring Agent

This service monitors scraper health, logs outcomes to PostgreSQL, attempts auto-fixes, and sends Slack alerts plus a daily summary.

## Scheduling

Set these environment variables to enable scheduled runs on a long-running server:

```
ENABLE_SCRAPE_MONITOR=true
SCRAPE_MONITOR_CRON="0 */6 * * *"
SCRAPE_MONITOR_DAILY_CRON="0 8 * * *"
SCRAPE_MONITOR_TIMEZONE="Europe/London"
```

## Slack Alerts

Configure the webhook URL:

```
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
```

Alerts include the issue type, fix attempts, and final outcome.

## Optional Flags

```
SCRAPE_MONITOR_FAST_MODE=true
SCRAPE_MONITOR_DRY_RUN=true
SCRAPE_MONITOR_DAILY_WINDOW_HOURS=24
```

## Database Tables

The monitor uses two tables:

- `scrape_monitor_runs` for each run summary
- `scrape_monitor_checks` for per-source results + fix actions

## Manual Run

```
npm run monitor:scrapes
```

Optional flags:

```
node scripts/run-scrape-monitor.js --dry-run --fast --no-fix
```
