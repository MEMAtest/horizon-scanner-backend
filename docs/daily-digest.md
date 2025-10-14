# Daily Intelligence Digest

The daily digest email summarises the most relevant insights (max 8) with an executive-friendly overview. Delivery is handled by Resend and can be triggered on a schedule (`node-cron`) or manually.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ENABLE_DAILY_DIGEST` | Optional | Set to `true` to allow automatic scheduling from the long-running node process. |
| `RESEND_API_KEY` | **Required** | API key from [Resend](https://resend.com/). |
| `DAILY_DIGEST_RECIPIENTS` | **Required** | Comma-separated list of recipient email addresses. |
| `DAILY_DIGEST_CRON` | Optional | Cron expression for automatic delivery (default `0 6 * * *`). |
| `DAILY_DIGEST_TIMEZONE` | Optional | Timezone for the cron schedule (default `Europe/London`). |
| `DIGEST_FROM_EMAIL` | Optional | Custom `from` address for Resend (default `Reg Intelligence <digest@regulator.example>`). |
| `DIGEST_PERSONA` | Optional | Persona label shown in the digest (default `Executive`). |
| `DIGEST_BRAND_TITLE` | Optional | Branding title used in the header (defaults to `Regulatory Horizon Scanner`). |
| `DIGEST_BRAND_FOOTER` | Optional | Footer copy appended to the email. |

## Manual Send

```
RESEND_API_KEY=... \
DAILY_DIGEST_RECIPIENTS="alice@example.com,bob@example.com" \
node scripts/send-daily-digest.js
```

The script outputs a JSON payload describing the dispatch (recipient count, insight count, timestamp).

## Automatic Scheduling

1. Set `ENABLE_DAILY_DIGEST=true`.
2. Configure the recipients and cron window (`DAILY_DIGEST_RECIPIENTS`, `DAILY_DIGEST_CRON`, `DAILY_DIGEST_TIMEZONE`).
3. When the server boots (non-Vercel environments) the scheduler runs in-process. On Vercel the job is registered via `vercel.json` (see `"crons"` entry) which invokes the `POST /api/cron/daily-digest` serverless function daily; if `CRON_SECRET` is configured, Vercel automatically injects the `Authorization: Bearer ${CRON_SECRET}` header.

Logs appear as:

```
DailyDigest: scheduled with cron "0 6 * * *" (Europe/London) for 2 recipient(s)
DailyDigest: dispatch triggered (2024-09-30T06:00:00.000Z)
DailyDigest: dispatch completed
```

## Email Template

`src/templates/emails/dailyDigestEmail.js` renders both HTML and plaintext. The digest includes:

- Executive summary paragraph.
- Metric cards (high/medium counts, active authorities, upcoming deadlines).
- Up to eight insight cards with authority/sector badges and priority reasons.
- Workspace CTA encouraging pin/annotation management.

Update the template as branding evolves, keeping inline styles for compatibility with email clients.

## Extending the Digest

- Tailor by persona: fetch persona-specific pins or saved searches in `buildDigestPayload`.
- Watchlists: store user-defined sectors/keywords and filter the ranked list accordingly.
- Engagement telemetry: wrap insight links with tracking params or log dispatch metadata to a `sent_digests` table.
