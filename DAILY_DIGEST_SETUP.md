# Daily Digest Email Automation - Setup Guide

## Overview
The Horizon Scanner backend automatically sends regulatory digest emails twice daily at **6:00 AM** and **10:00 PM GMT** via Vercel Cron Jobs and Resend email service.

## Current Configuration

### Email Delivery
- **Service**: Resend (https://resend.com)
- **API Key**: Configured in Vercel environment variables as `RESEND_API_KEY`
- **Sender Email**: `onboarding@resend.dev` (Resend's verified testing domain)
- **Recipients**: Configured via `DAILY_DIGEST_RECIPIENTS` environment variable

### Schedule
- **Frequency**: Twice daily
- **Times**: 06:00 UTC and 22:00 UTC (GMT)
- **Cron Expression**: `0 6,22 * * *`
- **Configuration File**: `vercel.json`

### Architecture
```
┌─────────────────┐
│  Vercel Cron    │ ──► Triggers at 06:00 & 22:00 UTC
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  api/cron/daily-digest.js       │ ──► Validates auth & config
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ src/services/dailyDigestService │ ──► Fetches data & builds email
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ src/services/email/resendClient │ ──► Sends via Resend API
└─────────────────────────────────┘
```

## Required Environment Variables on Vercel

Navigate to your Vercel project → Settings → Environment Variables and ensure these are set:

| Variable | Value | Description |
|----------|-------|-------------|
| `ENABLE_DAILY_DIGEST` | `true` | Master switch for digest automation |
| `RESEND_API_KEY` | `re_H2dJHTUj_...` | Your Resend API key |
| `DAILY_DIGEST_RECIPIENTS` | `contact@memaconsultants.com` | Comma-separated email list |
| `DIGEST_FROM_EMAIL` | `onboarding@resend.dev` | Sender email (must be verified in Resend) |
| `DIGEST_PERSONA` | `Executive` | Optional: Tone/audience for digest |
| `DIGEST_BRAND_TITLE` | `Regulatory Horizon Scanner` | Optional: Brand name in emails |
| `DIGEST_BRAND_FOOTER` | `Sent for QA – not for redistribution.` | Optional: Footer text |
| `CRON_SECRET` | (generate a random string) | Optional: Secures cron endpoint |

### Important Notes on Sender Email

**Current Setup**: Uses `onboarding@resend.dev` which is pre-verified by Resend for testing.

**For Production**:
1. Add and verify your custom domain in Resend dashboard
2. Update `DIGEST_FROM_EMAIL` to use your domain (e.g., `noreply@memaconsultants.com`)
3. Redeploy or update the environment variable on Vercel

**Why it failed before**: `contact@memaconsultants.com` was not verified in Resend, causing 403 errors.

## Testing the Digest

### Method 1: Vercel Dashboard (Recommended)
1. Go to Vercel project → Deployments
2. Select your latest deployment
3. Navigate to the "Cron Jobs" tab
4. Find `/api/cron/daily-digest`
5. Click "Run Now" to trigger immediately
6. Check the logs to verify email was sent

### Method 2: Manual API Call
```bash
# If CRON_SECRET is set
curl -X POST https://horizon-scanner-backend.vercel.app/api/cron/daily-digest \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"

# If no CRON_SECRET (less secure)
curl -X POST https://horizon-scanner-backend.vercel.app/api/cron/daily-digest \
  -H "Content-Type: application/json"
```

### Method 3: Local Testing
```bash
# Set environment variables
export RESEND_API_KEY="re_H2dJHTUj_..."
export DAILY_DIGEST_RECIPIENTS="your-test-email@example.com"
export DIGEST_FROM_EMAIL="onboarding@resend.dev"
export ENABLE_DAILY_DIGEST="true"

# Run the digest script directly
node scripts/send-daily-digest.js
```

## Troubleshooting

### Emails Not Sending

**Check 1**: Verify environment variables are set on Vercel
```bash
vercel env ls
```

**Check 2**: Check Vercel function logs
- Go to Vercel Dashboard → Deployments → [Your deployment] → Functions
- Look for errors in `/api/cron/daily-digest` logs

**Check 3**: Verify Resend API key is valid
- Log into Resend dashboard
- Check API Keys section
- Ensure key has not expired

**Check 4**: Confirm cron job is active
- Vercel Dashboard → Cron Jobs tab
- Should show status as "Active"

### 403 Forbidden Error from Resend

**Problem**: Sender email domain is not verified in Resend

**Solution**:
1. Use `onboarding@resend.dev` for testing (already verified)
2. For production, verify your domain in Resend:
   - Go to Resend Dashboard → Domains
   - Add your domain
   - Add DNS records as instructed
   - Wait for verification (usually < 24 hours)
3. Update `DIGEST_FROM_EMAIL` environment variable
4. Trigger a new deployment or update env var on Vercel

### Cron Not Triggering

**Check 1**: Ensure deployment is on `main` branch
- Vercel cron jobs only run on production branch
- Check vercel.json specifies correct branch

**Check 2**: Verify cron schedule syntax
- Current: `0 6,22 * * *` (6am and 10pm UTC)
- Use https://crontab.guru to validate expressions

**Check 3**: Check Vercel cron logs
- Dashboard → Project → Cron Jobs → View Logs

## Changing the Schedule

### To Change Send Times

Edit `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/daily-digest",
      "schedule": "0 6,22 * * *"  // ← Modify this line
    }
  ]
}
```

**Common Schedules**:
- Once daily at 6am: `0 6 * * *`
- Twice daily at 6am & 10pm: `0 6,22 * * *`
- Three times daily at 6am, 2pm, 10pm: `0 6,14,22 * * *`
- Every hour: `0 * * * *`

After editing:
1. Commit changes: `git commit -am "Update cron schedule"`
2. Push to main: `git push origin main`
3. Vercel will auto-deploy and update the cron

### Temporary Schedule Change for Testing

**To test at specific time** (e.g., 5:00 PM today):

1. Change schedule to `0 17 * * *` in vercel.json
2. Push to main
3. Wait for deployment
4. Check at 5pm if email arrives
5. Change back to `0 6,22 * * *`
6. Push again

**Or use "Run Now"** in Vercel Dashboard (faster, no code changes needed)

## Adding More Recipients

Update the `DAILY_DIGEST_RECIPIENTS` environment variable on Vercel:

**Single recipient**:
```
contact@memaconsultants.com
```

**Multiple recipients** (comma-separated):
```
contact@memaconsultants.com,adeomosanya@gmail.com,team@example.com
```

Changes take effect immediately - no redeployment needed for env var changes.

## Email Content Customization

The digest pulls the latest regulatory updates and categorizes them by relevance:

- **High Priority** (score ≥ 80): Critical alerts requiring immediate attention
- **Medium Priority** (70-79): Important updates for review
- **Low Priority** (< 70): Notable developments for awareness

### Customizing Content

Edit these files:
- **Email Template**: `src/templates/emails/dailyDigestEmail-classic.js`
- **Content Logic**: `src/services/dailyDigestService.js`
- **Relevance Scoring**: `src/services/relevanceService.js`

After changes:
1. Commit and push
2. Vercel auto-deploys
3. Test with "Run Now" in dashboard

## Security Best Practices

1. **Set CRON_SECRET**: Prevents unauthorized cron triggers
   ```bash
   # Generate random secret
   openssl rand -base64 32

   # Add to Vercel env vars as CRON_SECRET
   ```

2. **Rotate API Keys**: Periodically refresh Resend API key

3. **Monitor Logs**: Regularly check Vercel function logs for anomalies

4. **Limit Recipients**: Use role-based distribution lists instead of individual emails

## Support & Monitoring

### Check Digest Status
- **Vercel Dashboard**: Project → Cron Jobs → View execution history
- **Resend Dashboard**: https://resend.com/emails → View sent emails

### Monitoring Checklist
- [ ] Cron executions succeed (Vercel logs)
- [ ] Emails delivered (Resend dashboard)
- [ ] No 403/500 errors (Vercel function logs)
- [ ] Recipients receiving emails (manual check)

### Getting Help
- **Vercel Docs**: https://vercel.com/docs/cron-jobs
- **Resend Docs**: https://resend.com/docs
- **Cron Syntax**: https://crontab.guru

## Quick Reference Commands

```bash
# Check Vercel deployment status
vercel ls

# View environment variables
vercel env ls

# Tail Vercel logs
vercel logs

# Test locally
npm start
# Then call: curl -X POST http://localhost:3000/api/cron/daily-digest

# Deploy manually
vercel --prod
```

---

**Last Updated**: 2025-10-16
**Configuration Version**: v1.2
**Deployment**: Automated via Vercel + GitHub integration
