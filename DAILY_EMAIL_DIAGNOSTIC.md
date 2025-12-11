# Daily Email Diagnostic & Fix

**Status:** ❌ Daily emails not sending
**Date:** 2025-12-11
**Issue:** Vercel cron schedule mismatch + potential environment variable issues

---

## 🔧 **FIX APPLIED**

### 1. Corrected Vercel Cron Schedule
✅ Updated `vercel.json` from `"0 6 * * *"` → `"0 8 * * *"`
- This ensures emails send at **8:00 AM UK time (GMT)** via Vercel cron

---

## ✅ **VERIFICATION CHECKLIST**

Before the next deploy, verify these environment variables in your **Vercel Dashboard**:

### Required Environment Variables

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

| Variable | Required Value | Purpose | Status |
|----------|---------------|---------|--------|
| `ENABLE_DAILY_DIGEST` | `"true"` | Enables digest sending | ⚠️ **CHECK** |
| `RESEND_API_KEY` | `re_xxxxx...` | Resend.com API key for email delivery | ⚠️ **CHECK** |
| `DAILY_DIGEST_RECIPIENTS` | `email@example.com,email2@example.com` | Comma-separated recipient emails | ⚠️ **CHECK** |
| `CRON_SECRET` | `your-secret-token` | (Optional) Secures the cron endpoint | ⚠️ **CHECK** |
| `DIGEST_FROM_EMAIL` | `RegCanary <digest@yourdomain.com>` | Sender email (must be verified in Resend) | ⚠️ **CHECK** |
| `DIGEST_PERSONA` | `Executive` | (Optional) Default: Executive | ℹ️ Optional |
| `DIGEST_BRAND_TITLE` | `RegCanary Intelligence` | (Optional) Email branding | ℹ️ Optional |
| `DIGEST_BRAND_FOOTER` | `Your footer text` | (Optional) Email footer | ℹ️ Optional |

---

## 🧪 **TEST THE SYSTEM**

### Option 1: Test Locally (Before Deploy)

```bash
# Load environment variables from Vercel
npm install -g vercel
vercel env pull .env.local

# Run the test script
node scripts/test-daily-digest-cron.js
```

**Expected output:**
```
✅ Test completed in XXXXms
📊 Summary:
   Insights sent: 10+
   Recipients: 1 (or more)

✅ Email sent successfully
```

### Option 2: Manual Trigger (After Deploy)

Once deployed, manually trigger the cron:

```bash
# Get your CRON_SECRET from Vercel environment variables
curl -X POST https://your-app.vercel.app/api/cron/daily-digest \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Or visit: `https://your-app.vercel.app/api/cron/daily-digest`

---

## 🚨 **COMMON FAILURE SCENARIOS**

### Scenario 1: `ENABLE_DAILY_DIGEST !== 'true'`
**Error:** HTTP 409 - "Daily digest scheduling disabled"
**Fix:** Set `ENABLE_DAILY_DIGEST=true` in Vercel environment variables

### Scenario 2: Missing `RESEND_API_KEY`
**Error:** HTTP 500 - "RESEND_API_KEY not configured"
**Fix:** Add your Resend API key from https://resend.com/api-keys

### Scenario 3: No Recipients
**Error:** HTTP 500 - "DAILY_DIGEST_RECIPIENTS not configured"
**Fix:** Set `DAILY_DIGEST_RECIPIENTS=email@example.com`

### Scenario 4: Invalid Sender Email
**Error:** Resend API error - "Sender not verified"
**Fix:** Verify your sender domain/email in Resend dashboard

### Scenario 5: Cron Not Triggering
**Check:**
- Vercel cron jobs page: Settings → Cron Jobs
- Look for failed executions
- Check Vercel Function logs for errors at 8:00 AM GMT

---

## 📅 **NEXT SCHEDULED SEND**

With the fix applied:
- **Schedule:** Daily at **08:00 GMT** (UK time)
- **Next run:** Tomorrow at 8:00 AM
- **Cron expression:** `0 8 * * *` (minute=0, hour=8, every day)

---

## 🔍 **HOW TO CHECK IF IT'S WORKING**

### 1. Check Vercel Function Logs
- Go to: Vercel Dashboard → Your Project → Logs
- Filter by: `/api/cron/daily-digest`
- Look for execution at 08:00 GMT

### 2. Check Resend Dashboard
- Visit: https://resend.com/emails
- Look for sent emails around 8:00 AM

### 3. Check Your Inbox
- Emails should arrive at 08:00 AM GMT
- Subject: "Your Daily Regulatory Intelligence Brief - [Date]"
- From: Your configured `DIGEST_FROM_EMAIL`

---

## 📝 **CODE CHANGES MADE**

### File: `vercel.json:26`
```diff
- "schedule": "0 6 * * *"
+ "schedule": "0 8 * * *"
```

This change aligns with commit `51856f3` which updated the local scheduler.

---

## 🎯 **IMMEDIATE ACTION REQUIRED**

1. ✅ **Commit and push** this fix to your branch
2. ⚠️ **Verify environment variables** in Vercel dashboard
3. ⚠️ **Test locally** using the test script (optional but recommended)
4. ⚠️ **Deploy to production**
5. ⚠️ **Monitor tomorrow at 8am** for email delivery

---

## 📚 **RELATED FILES**

- Cron handler: `api/cron/daily-digest.js`
- Email service: `src/services/dailyDigestService.js`
- Email template: `src/templates/emails/dailyDigestEmail-classic.js`
- Email client: `src/services/email/resendClient.js`
- Test script: `scripts/test-daily-digest-cron.js`
- Vercel config: `vercel.json`

---

## 🆘 **TROUBLESHOOTING**

If emails still don't send after deploy:

1. **Check Vercel Function Logs** for errors at 8:00 AM
2. **Manually trigger** the endpoint to see specific error messages
3. **Run test script locally** to isolate configuration issues
4. **Verify Resend account** isn't over quota/suspended
5. **Check spam folder** (emails might be filtered)

For more details, see:
- `DAILY_DIGEST_SETUP.md`
- `DAILY_DIGEST_DATA_REFRESH.md`
