# Daily Digest with Automatic Data Refresh

## Overview

The daily digest cron job has been enhanced to **automatically fetch fresh regulatory data** before building and sending the email digest. This ensures that the digest always contains the latest updates without requiring a separate cron job.

## Problem Solved

**Previous Issue**: The daily digest would send stale data unless regulatory updates were fetched separately. Users on Vercel's Hobby plan are limited to one cron job, making it impossible to schedule both data fetching and digest sending.

**Solution**: The cron job now performs both operations sequentially:
1. **First**: Fetches fresh regulatory data from all configured sources
2. **Then**: Builds and sends the digest with the newly fetched data

## Changes Made

### 1. Enhanced Cron Handler (`api/cron/daily-digest.js`)

**Key Features**:
- **Automatic Data Refresh**: Calls `rssFetcher.fetchAllFeeds()` before building the digest
- **Error Handling**: If data refresh fails, the digest still sends with existing data
- **Performance Tracking**: Logs execution time for both data refresh and digest generation
- **Comprehensive Logging**: Provides visibility into the entire process in Vercel logs

**Workflow**:
```
1. Validate configuration (auth, recipients, API keys)
2. Fetch fresh regulatory data
   - Sources: RSS feeds, web scraping, Puppeteer scrapers
   - Authorities: FCA, Bank of England, ESMA, FSB, FATF, etc.
   - Updates database with new regulatory updates
3. Build digest email
   - Pulls latest data from database
   - Applies relevance scoring
   - Generates email HTML/text
4. Send digest via Resend API
5. Return comprehensive results with metrics
```

### 2. Test Script (`scripts/test-daily-digest-cron.js`)

A comprehensive test script that:
- Validates environment configuration
- Simulates the cron job execution
- Reports detailed performance metrics
- Helps troubleshoot issues before deployment

## Configuration

### Required Environment Variables

```bash
# Enable daily digest
ENABLE_DAILY_DIGEST=true

# Email service (Resend)
RESEND_API_KEY=your_resend_api_key

# Recipients (comma-separated)
DAILY_DIGEST_RECIPIENTS=user1@example.com,user2@example.com

# Cron authentication (recommended for security)
CRON_SECRET=your_secret_token

# Optional: Customize persona
DIGEST_PERSONA=Executive

# Optional: Branding
DIGEST_BRAND_TITLE=Your Company Name
DIGEST_BRAND_FOOTER=© 2024 Your Company
```

### Vercel Configuration (`vercel.json`)

Already configured - no changes needed:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-digest",
      "schedule": "0 6 * * *"
    }
  ]
}
```

This runs daily at 6:00 AM UTC with a 30-second function timeout.

## Testing

### Local Testing

1. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Run the test script**:
   ```bash
   node scripts/test-daily-digest-cron.js
   ```

3. **Expected output**:
   ```
   📡 DailyDigest: Starting data refresh before digest generation...
   ✅ DailyDigest: Data refresh completed in 15234ms
      📊 New updates: 42
      📊 Sources processed: 18
   📧 DailyDigest: Building and sending digest email...
   ✅ DailyDigest: Email sent successfully in 2341ms
   ⏱️ DailyDigest: Total execution time: 17575ms
   ```

### Manual Trigger (Production)

Test the cron job manually in production:

```bash
curl -X POST https://your-app.vercel.app/api/cron/daily-digest \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

### Vercel Logs

Monitor the cron job execution in Vercel:

1. Go to Vercel Dashboard → Your Project → Logs
2. Filter by function: `api/cron/daily-digest.js`
3. Look for the data refresh and digest generation logs

Expected log entries:
```
📡 DailyDigest: Starting data refresh before digest generation...
📡 Starting comprehensive regulatory updates fetch...
✅ FCA News RSS: 12 fetched, 3 new
✅ Bank of England News RSS: 8 fetched, 2 new
...
✅ DailyDigest: Data refresh completed in 15234ms
📧 DailyDigest: Building and sending digest email...
✅ DailyDigest: Email sent successfully in 2341ms
```

## Performance Considerations

### Execution Time Budget

- **Vercel Hobby Plan**: 30-second function timeout (configured in `vercel.json`)
- **Typical performance**:
  - Data refresh: 10-20 seconds (varies with number of sources)
  - Digest generation: 2-5 seconds
  - **Total**: 12-25 seconds (well within budget)

### Optimization Strategies

If you encounter timeout issues:

1. **Reduce source count**: Comment out low-priority sources in `src/services/rssFetcher.js`
2. **Adjust recency window**: Reduce `recencyDays` for each source (currently 7-30 days)
3. **Limit items per source**: Adjust the limit in `fetchRSSFeed()` (currently 20 items)
4. **Skip AI analysis**: Set `SKIP_AI_ANALYSIS=true` to skip AI processing during fetch

### Error Handling

**If data refresh fails**:
- The cron job logs the error but continues
- The digest is sent with existing data from the database
- The response includes error details for debugging

**If digest generation fails**:
- The cron job returns a 500 error
- Vercel logs contain the full error stack trace
- No email is sent (prevents sending broken digests)

## Data Sources

The data refresh fetches from these sources:

### RSS Feeds (Fast)
- FCA News RSS
- Bank of England News RSS
- ESMA All News
- FSB Publications
- HMRC Updates RSS
- Gov.UK Financial Services

### Web Scraping (Medium)
- The Pensions Regulator (TPR)
- Serious Fraud Office (SFO)
- Information Commissioner's Office (ICO)
- Financial Reporting Council (FRC)
- Financial Ombudsman Service (FOS)
- Joint Money Laundering Steering Group (JMLSG)

### Puppeteer Scraping (Slower)
- FATF News & Publications
- Aquis Exchange Announcements
- London Stock Exchange News

**Note**: Puppeteer sources are slower but necessary for JavaScript-rendered content. They're configured with appropriate rate limits.

## Response Format

### Success Response

```json
{
  "success": true,
  "dispatchedAt": "2024-01-15T06:00:00.000Z",
  "insightCount": 10,
  "recipients": ["user1@example.com", "user2@example.com"],
  "dataRefresh": {
    "attempted": true,
    "success": true,
    "newUpdates": 42,
    "totalProcessed": 18,
    "duration": 15234,
    "error": null
  },
  "performance": {
    "dataRefreshMs": 15234,
    "digestBuildMs": 2341,
    "totalMs": 17575
  }
}
```

### Error Response (Data Refresh Failed)

```json
{
  "success": true,
  "dispatchedAt": "2024-01-15T06:00:00.000Z",
  "insightCount": 10,
  "recipients": ["user1@example.com"],
  "dataRefresh": {
    "attempted": true,
    "success": false,
    "newUpdates": 0,
    "totalProcessed": 0,
    "duration": 5432,
    "error": "Network timeout"
  },
  "performance": {
    "dataRefreshMs": 5432,
    "digestBuildMs": 2341,
    "totalMs": 7773
  }
}
```

## Troubleshooting

### Issue: "Daily digest scheduling disabled"

**Solution**: Set `ENABLE_DAILY_DIGEST=true` in Vercel environment variables

### Issue: "RESEND_API_KEY not configured"

**Solution**: Add your Resend API key to Vercel environment variables

### Issue: "No recipients configured"

**Solution**: Set `DAILY_DIGEST_RECIPIENTS=email1@example.com,email2@example.com`

### Issue: Function timeout (30 seconds exceeded)

**Solution**:
1. Check Vercel logs to see which step is slow
2. Reduce the number of data sources
3. Adjust `recencyDays` to fetch fewer items
4. Consider setting `SKIP_AI_ANALYSIS=true` during the fetch

### Issue: Data refresh succeeds but digest is empty

**Possible causes**:
1. All fetched updates are duplicates (already in database)
2. Quality filtering is removing all updates
3. Relevance scoring is filtering out all items

**Solution**: Check database and logs to see what's being fetched and filtered

### Issue: Unauthorized error (401)

**Solution**: Ensure the `Authorization` header matches your `CRON_SECRET`:
```bash
Authorization: Bearer YOUR_CRON_SECRET
```

## Best Practices

1. **Monitor Vercel Logs**: Check logs after each cron execution to ensure data refresh is working
2. **Test Before Deploying**: Run `node scripts/test-daily-digest-cron.js` locally
3. **Set Up Alerts**: Configure Vercel notifications for cron job failures
4. **Review Digest Content**: Subscribe yourself as a recipient to review the digest quality
5. **Adjust Timing**: The 6:00 AM UTC schedule can be changed in `vercel.json` if needed

## Future Enhancements

Potential improvements for future iterations:

1. **Incremental Fetching**: Only fetch from sources that haven't been updated recently
2. **Caching**: Cache RSS feeds to reduce external API calls
3. **Parallel Processing**: Fetch sources in parallel with Promise.all() for faster execution
4. **Smart Source Selection**: Prioritize high-value sources based on historical data quality
5. **Fallback Strategies**: If timeout is imminent, skip remaining sources and send digest

## Support

For issues or questions:
- Check Vercel logs for detailed error messages
- Run the test script locally: `node scripts/test-daily-digest-cron.js`
- Review `src/services/rssFetcher.js` for source configuration
- Check `src/services/dailyDigestService.js` for digest generation logic

---

**Last Updated**: January 2025
**Vercel Plan**: Hobby (single cron job, 30s timeout)
**Node Version**: 18.x or higher
