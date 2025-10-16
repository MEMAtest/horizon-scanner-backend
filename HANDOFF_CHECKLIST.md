# Daily Digest - Handoff Checklist

## Current Status
✅ Code deployed to Vercel (commit: 12b0458)
✅ Cron schedule updated to 6am & 10pm GMT
✅ Sender email configured to use Resend's verified domain
⚠️ **NEXT STEP**: Update Vercel environment variables

---

## Immediate Actions Required

### 1. Update Vercel Environment Variable (CRITICAL)

**Why**: The production environment still uses `contact@memaconsultants.com` which causes 403 errors. Must change to verified sender.

**Steps**:
1. Go to https://vercel.com → Your Project → Settings → Environment Variables
2. Find `DIGEST_FROM_EMAIL`
3. Change value from `contact@memaconsultants.com` to `onboarding@resend.dev`
4. Click Save
5. Trigger a new deployment:
   - Option A: Push any commit to main branch
   - Option B: Go to Deployments → Latest → ⋯ Menu → Redeploy

**Estimated Time**: 2 minutes

---

### 2. Test the Configuration

**Method 1: Use Vercel Dashboard (Easiest)**
1. Go to Vercel → Your Project → Deployments
2. Click on the latest deployment
3. Navigate to "Cron Jobs" tab
4. Find `/api/cron/daily-digest`
5. Click "Run Now"
6. Wait 30-60 seconds
7. Check recipient inbox for email

**Method 2: API Call**
```bash
curl -X POST https://horizon-scanner-backend.vercel.app/api/cron/daily-digest \
  -H "Content-Type: application/json"
```

**Expected Result**:
- Status: 200 OK
- Email arrives in inbox from `onboarding@resend.dev`
- Subject: "Regulatory Digest: [Date]"

**If it fails**:
- Check Vercel function logs for errors
- Verify `RESEND_API_KEY` is set correctly
- Confirm `ENABLE_DAILY_DIGEST=true`

**Estimated Time**: 5 minutes

---

### 3. Verify Cron Schedule

**Check**:
1. Vercel → Project → Cron Jobs
2. Confirm schedule shows: `0 6,22 * * *`
3. Status should be "Active"

**Meaning**: Digest will auto-send at:
- 06:00 UTC (6:00 AM GMT in winter, 7:00 AM BST in summer)
- 22:00 UTC (10:00 PM GMT in winter, 11:00 PM BST in summer)

**Note**: UTC doesn't change for daylight saving time, so emails will arrive one hour later during British Summer Time.

**Estimated Time**: 1 minute

---

## Environment Variables Checklist

Login to Vercel and verify these are all set correctly:

| Variable | Current Value | Status | Action |
|----------|--------------|--------|--------|
| `ENABLE_DAILY_DIGEST` | `true` | ✅ | Keep as-is |
| `RESEND_API_KEY` | `re_H2dJHTUj_...` | ✅ | Keep as-is |
| `DAILY_DIGEST_RECIPIENTS` | `contact@memaconsultants.com` | ✅ | Keep or add more (comma-separated) |
| `DIGEST_FROM_EMAIL` | ❌ Needs update | ⚠️ | **Change to `onboarding@resend.dev`** |
| `DIGEST_PERSONA` | `Executive` | ✅ | Optional |
| `DIGEST_BRAND_TITLE` | `Regulatory Horizon Scanner` | ✅ | Optional |
| `DIGEST_BRAND_FOOTER` | `Sent for QA – not for redistribution.` | ✅ | Optional |

---

## Optional: Verify Custom Domain (For Production)

If you want to use `contact@memaconsultants.com` as the sender instead of `onboarding@resend.dev`:

### Steps:
1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Enter `memaconsultants.com`
4. Add the DNS records shown to your domain registrar:
   - SPF record
   - DKIM record
   - DMARC record (optional but recommended)
5. Wait for verification (usually 15 minutes - 24 hours)
6. Once verified, update `DIGEST_FROM_EMAIL` to `contact@memaconsultants.com` on Vercel
7. Redeploy

**Estimated Time**: 30 minutes (plus DNS propagation time)

---

## Monitoring & Maintenance

### Daily Check (First Week)
- [ ] Check recipient inbox at 6:15am for morning digest
- [ ] Check recipient inbox at 10:15pm for evening digest
- [ ] If missing, check Vercel logs for errors

### Weekly Check
- [ ] Review Vercel cron execution logs (Dashboard → Cron Jobs → History)
- [ ] Review Resend email delivery logs (resend.com/emails)
- [ ] Confirm no 403 or 500 errors

### Monthly Check
- [ ] Review email content quality
- [ ] Adjust recipient list if needed
- [ ] Consider custom domain setup if still using `onboarding@resend.dev`

---

## Troubleshooting Guide

### Problem: No email received after "Run Now"

**Check**:
1. Vercel function logs for errors
2. Resend dashboard for delivery status
3. Spam/junk folders
4. Recipient email address is correct in env vars

**Common causes**:
- `DIGEST_FROM_EMAIL` still using unverified domain
- `RESEND_API_KEY` invalid or expired
- `DAILY_DIGEST_RECIPIENTS` misconfigured

### Problem: 403 Error in logs

**Cause**: Sender email not verified in Resend

**Fix**: Set `DIGEST_FROM_EMAIL=onboarding@resend.dev`

### Problem: Cron not triggering automatically

**Check**:
1. Deployment is on main branch
2. Cron schedule syntax is valid
3. `ENABLE_DAILY_DIGEST=true`

**Fix**: Redeploy from main branch

### Problem: Empty digest (no content)

**Cause**: Database may not have recent data

**Check**: Run data refresh:
```bash
npm start  # Locally
# Or trigger data ingestion endpoint
```

---

## Quick Commands

```bash
# View current environment variables
vercel env ls

# Add new environment variable
vercel env add DIGEST_FROM_EMAIL

# Check deployment status
vercel ls

# View recent logs
vercel logs --follow

# Manual deployment
vercel --prod
```

---

## Contact & Resources

- **Full Setup Guide**: `DAILY_DIGEST_SETUP.md`
- **Vercel Dashboard**: https://vercel.com
- **Resend Dashboard**: https://resend.com
- **Cron Expression Tester**: https://crontab.guru
- **Support**: Check function logs first, then Resend dashboard

---

## Success Criteria

✅ Environment variable `DIGEST_FROM_EMAIL` updated to `onboarding@resend.dev`
✅ Test send successful via "Run Now" in Vercel
✅ Email received in inbox from `onboarding@resend.dev`
✅ Cron schedule shows `0 6,22 * * *` and status is "Active"
✅ No errors in Vercel function logs

**Once all checked**: System is operational and will send digests at 6am and 10pm GMT daily.

---

**Created**: 2025-10-16
**Author**: Claude Code
**Status**: Ready for handoff
