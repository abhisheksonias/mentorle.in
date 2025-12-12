# Scheduled Posts Auto-Publishing Setup

Your scheduled posts feature is now ready! However, posts won't automatically publish until you set up one of these automation methods.

## How It Works

When you schedule a post:
- Status: `scheduled`
- Published_at: Future date (e.g., "2025-12-15 14:30:00")

A background job checks every minute:
- Finds posts where `status = 'scheduled'` AND `published_at <= NOW()`
- Updates their status to `published`

---

## Choose ONE Option:

### ⭐ **Option 1: Database Function (EASIEST)**

**Best for:** Supabase projects (you're already using Supabase!)

**Steps:**
1. Go to your Supabase Dashboard → SQL Editor
2. Run the SQL from: `supabase/migrations/auto_publish_scheduled_posts.sql`
3. Done! Posts will auto-publish every minute

**Pros:**
- ✅ No external services needed
- ✅ Runs directly in your database
- ✅ Most reliable
- ✅ Free on Supabase

**Cons:**
- ⚠️ Requires Supabase paid plan for pg_cron (Free tier may not support it)

---

### ⚡ **Option 2: Vercel Cron (RECOMMENDED IF ON VERCEL)**

**Best for:** Projects deployed on Vercel

**Steps:**
1. Add to `.env.local`:
   ```bash
   CRON_SECRET=your-super-secret-key-change-this
   ```

2. Deploy to Vercel (the `vercel.json` is already created)

3. In Vercel Dashboard → Project Settings → Environment Variables:
   - Add `CRON_SECRET` with the same value

4. Redeploy your app

**Pros:**
- ✅ Works on Vercel's free tier
- ✅ Easy to monitor in Vercel dashboard
- ✅ API route already created

**Cons:**
- ⚠️ Only works on Vercel
- ⚠️ Cron jobs may have cold starts

**Test it:**
```bash
curl -H "Authorization: Bearer your-super-secret-key" \
  https://your-app.vercel.app/api/cron/publish-scheduled-posts
```

---

### 🔧 **Option 3: Supabase Edge Function**

**Best for:** Advanced setups, more control

**Steps:**
1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Deploy the edge function:
   ```bash
   supabase functions deploy publish-scheduled-posts
   ```

3. Set up pg_cron (run SQL from `supabase/migrations/create_publish_scheduled_posts_cron.sql`)
   - Replace `YOUR_SUPABASE_FUNCTION_URL` with your function URL
   - Replace `YOUR_ANON_KEY` with your Supabase anon key

**Pros:**
- ✅ Full control
- ✅ TypeScript support
- ✅ Runs on Supabase edge

**Cons:**
- ⚠️ More setup required
- ⚠️ Requires Supabase CLI

---

### 🌐 **Option 4: External Cron Service (FALLBACK)**

**Best for:** Quick testing or non-Vercel/Supabase hosting

**Services:**
- [cron-job.org](https://cron-job.org) (Free)
- [EasyCron](https://www.easycron.com) (Free tier)
- [UptimeRobot](https://uptimerobot.com) (Free monitoring)

**Steps:**
1. Create the API endpoint (already done: `/api/cron/publish-scheduled-posts`)
2. Add `CRON_SECRET` to your environment variables
3. Set up the cron service to call:
   ```
   GET https://your-domain.com/api/cron/publish-scheduled-posts
   Header: Authorization: Bearer your-secret-key
   ```
4. Schedule it to run every minute: `* * * * *`

---

## Testing Your Setup

### Manual Test:
1. Create a scheduled post for 1 minute in the future
2. Wait 1-2 minutes
3. Refresh the posts page
4. The post should now show as "published"

### API Test:
```bash
# Test the cron endpoint manually
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/publish-scheduled-posts
```

---

## Monitoring

### Check if posts are publishing:
```sql
-- In Supabase SQL Editor
SELECT id, title, status, published_at 
FROM posts 
WHERE status = 'scheduled' 
  AND published_at <= NOW();
```

### View cron job history (if using pg_cron):
```sql
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

---

## Troubleshooting

**Posts not publishing?**
1. Check if cron is running: `SELECT * FROM cron.job;`
2. Check for errors: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC;`
3. Verify scheduled posts exist: `SELECT * FROM posts WHERE status = 'scheduled';`

**Rate limits?**
- Running every minute should be fine for most cases
- If you have thousands of posts, consider running every 5 minutes instead

---

## Recommendation

**For your setup, I recommend Option 1 (Database Function)** because:
- ✅ You're already using Supabase
- ✅ Simplest setup (just run one SQL query)
- ✅ Most reliable (runs in database)
- ✅ No external dependencies

If you're on Vercel, **Option 2** is also excellent!

---

## Current Status

✅ UI implemented - can create/schedule posts
✅ API routes ready - handle scheduled status
✅ Validation updated - accepts "scheduled" status
❌ Auto-publishing - **choose and implement one option above**

Once you set up auto-publishing, your scheduled posts feature will be 100% complete! 🎉

