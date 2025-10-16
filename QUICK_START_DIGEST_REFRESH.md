# Quick Start: Daily Digest with Data Refresh

## What Changed?

The daily digest cron job now **automatically fetches fresh regulatory data** before sending the email. No second cron job needed!

## Testing Locally

1. **Set environment variables** in `.env`:
   ```bash
   ENABLE_DAILY_DIGEST=true
   RESEND_API_KEY=your_api_key
   DAILY_DIGEST_RECIPIENTS=you@example.com
   CRON_SECRET=your_secret_token
   ```

2. **Run test script**:
   ```bash
   node scripts/test-daily-digest-cron.js
   ```

3. **Expected output**:
   ```
   📡 DailyDigest: Starting data refresh...
   ✅ DailyDigest: Data refresh completed
      📊 New updates: 42
      📊 Sources processed: 18
   📧 DailyDigest: Building digest...
   ✅ Email sent successfully
   ```

## Deploying to Vercel

1. **Add environment variables** in Vercel Dashboard:
   - `ENABLE_DAILY_DIGEST=true`
   - `RESEND_API_KEY=your_api_key`
   - `DAILY_DIGEST_RECIPIENTS=email1@example.com,email2@example.com`
   - `CRON_SECRET=your_secret_token`

2. **Deploy**:
   ```bash
   git add .
   git commit -m "Add automatic data refresh to daily digest"
   git push
   ```

3. **Verify** in Vercel Dashboard → Logs (look for data refresh messages)

## Manual Testing in Production

```bash
curl -X POST https://your-app.vercel.app/api/cron/daily-digest \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## How It Works

```
Cron Trigger (6am UTC)
    ↓
1. Fetch fresh data from all sources (~15s)
    - RSS feeds (FCA, BoE, ESMA, etc.)
    - Web scraping (TPR, SFO, ICO, etc.)
    - Puppeteer (FATF, Aquis, LSE)
    ↓
2. Save new updates to database
    ↓
3. Build digest email from latest data (~3s)
    ↓
4. Send email via Resend
    ↓
Done! (~18s total, well under 30s limit)
```

## Key Benefits

✅ **Always Fresh Data**: Digest contains updates from the last few hours
✅ **Single Cron Job**: No Hobby plan limitations
✅ **Error Resilient**: If fetch fails, digest sends with existing data
✅ **Performance Tracked**: Logs show timing for each step
✅ **No Code Changes**: Existing digest logic unchanged

## Monitoring

Check Vercel logs for these messages:

**Success**:
```
📡 DailyDigest: Starting data refresh...
✅ DailyDigest: Data refresh completed in 15234ms
   📊 New updates: 42
📧 DailyDigest: Building digest...
✅ DailyDigest: Email sent successfully in 2341ms
⏱️ DailyDigest: Total execution time: 17575ms
```

**Partial Failure** (still sends digest):
```
📡 DailyDigest: Starting data refresh...
⚠️ DailyDigest: Data refresh failed, proceeding with existing data
   Error: Network timeout
📧 DailyDigest: Building digest...
✅ Email sent successfully (with existing data)
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No email received | Check `RESEND_API_KEY` and `DAILY_DIGEST_RECIPIENTS` |
| "Scheduling disabled" error | Set `ENABLE_DAILY_DIGEST=true` |
| Timeout (>30s) | Reduce sources in `src/services/rssFetcher.js` |
| Empty digest | Check database has updates: `node scripts/check-db.js` |

## Files Modified

- **`api/cron/daily-digest.js`**: Enhanced with data refresh logic
- **`scripts/test-daily-digest-cron.js`**: New test script (NEW)
- **`DAILY_DIGEST_DATA_REFRESH.md`**: Comprehensive documentation (NEW)
- **`vercel.json`**: No changes (already configured)

## Next Steps

1. ✅ Test locally with test script
2. ✅ Deploy to Vercel
3. ✅ Verify environment variables in Vercel Dashboard
4. ✅ Monitor logs for first cron execution (6am UTC)
5. ✅ Check your email for the digest

---

**Questions?** See `DAILY_DIGEST_DATA_REFRESH.md` for full documentation.
