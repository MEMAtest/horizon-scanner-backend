# Site Monitoring (Slack Alerts)

This monitor checks external site status plus key platform health checks (FCA fines scraper + Horizon Scanner system status) and sends Slack alerts.

## Enable Scheduling

Set these environment variables on the long-running server:

```
ENABLE_SITE_MONITOR=true
SITE_MONITOR_CRON="*/30 * * * *"
SITE_MONITOR_DAILY_CRON="0 8 * * *"
SITE_MONITOR_TIMEZONE="Europe/London"
```

## Slack Alerts

Configure the webhook URL (shared with the scraper monitor):

```
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
```

## GitHub Actions Check (FCA fines scraper)

To verify the FCA fines scraper workflow, provide a GitHub token:

```
SITE_MONITOR_GITHUB_TOKEN="ghp_..."
```

## Configure Targets

Default targets live in:

```
config/site-monitor.targets.json
```

Add any additional URLs in that file, or supply a comma-separated list at runtime:

```
SITE_MONITOR_URLS="MEMA Main|https://memaconsultants.com,https://fcafines.memaconsultants.com"
```

## Manual Run

```
npm run monitor:sites
```

Dry run (no Slack alert):

```
node scripts/run-site-monitor.js --dry-run
```
