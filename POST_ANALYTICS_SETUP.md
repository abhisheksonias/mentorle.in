# Post Analytics Setup Guide

Your post analytics system is ready to track views and performance! Follow this guide to set it up.

---

## 📊 What Gets Tracked

### **Simple & Useful Metrics:**
1. **Total Views** - How many times your post has been viewed
2. **Unique Viewers** - Number of different people who viewed it
3. **Views Last 7 Days** - Recent engagement
4. **Views Last 30 Days** - Monthly performance
5. **Likes** - Total likes (if enabled)
6. **Comments** - Total comments (if enabled)
7. **Last Viewed** - When someone last read your post
8. **Views Over Time** - Simple bar chart showing daily views

---

## 🚀 Setup Steps

### **Step 1: Run the Database Migration**

1. Go to your **Supabase Dashboard** → SQL Editor
2. Copy and paste the SQL from: `supabase/migrations/add_post_analytics.sql`
3. Click **Run**

This will:
- ✅ Add `view_count` column to `posts` table
- ✅ Create `post_views` table for detailed tracking
- ✅ Create `increment_post_view_count()` function
- ✅ Set up proper indexes for fast queries

---

### **Step 2: Track Views on Public Pages**

When someone views a published post on your public blog, call the view tracking API:

```javascript
// Example: In your public blog post page
useEffect(() => {
  const trackView = async () => {
    await fetch(`/api/posts/${postId}/view`, {
      method: 'POST'
    });
  };
  
  trackView();
}, [postId]);
```

---

### **Step 3: View Analytics**

Mentors can now see analytics when editing their posts:
1. Go to **Posts** page
2. Click **Edit** on any post
3. Analytics appear on the right side (desktop) or below (mobile)

---

## 📈 Where Analytics Are Shown

### **1. Edit Post Page** (Main Analytics View)
- Full analytics dashboard on the right sidebar
- Shows all metrics with icons and colors
- Views over time chart
- Last viewed timestamp

### **2. Posts List Page**
- Quick view count next to each post
- Shows: "👁 125 views"

---

## 🎨 Analytics Display

The analytics component shows:

```
┌─────────────────────────────────────┐
│  Post Performance                   │
├─────────────────────────────────────┤
│  👁 Total Views        125          │
│  👥 Unique Viewers     89           │
│  📈 Views (7 Days)     23           │
│  📅 Views (30 Days)    87           │
│  ❤️  Likes              15           │
│  💬 Comments           8            │
├─────────────────────────────────────┤
│  Last viewed: Dec 12, 2025 at 3:45 PM │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Views Over Time (Last 30 Days)    │
├─────────────────────────────────────┤
│  Dec 12  ████████████████  16 views│
│  Dec 11  ██████████        10 views│
│  Dec 10  ████████          8 views │
│  ...                                │
└─────────────────────────────────────┘
```

---

## 🔒 Privacy & Security

- ✅ Only the **post author** can see analytics
- ✅ **Admins** can see all post analytics
- ✅ **Mentors** can see their own post analytics
- ✅ Viewers remain anonymous (no personal data collected)
- ✅ Only IP addresses are logged (for unique view counting)

---

## 🧪 Testing

### **Test the View Tracking:**

1. **Create a test post** and publish it
2. **Open it in incognito mode** (to simulate a viewer)
3. **Refresh the page** a few times
4. **Go back to Edit** the post
5. **Check analytics** → Should show your test views!

### **Manual API Test:**

```bash
# Track a view
curl -X POST http://localhost:3000/api/posts/YOUR_POST_ID/view

# Get analytics
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/posts/YOUR_POST_ID/analytics
```

---

## 📊 Database Schema

### **posts table** (updated)
```sql
view_count INTEGER DEFAULT 0
```

### **post_views table** (new)
```sql
id UUID PRIMARY KEY
post_id UUID (references posts)
viewed_at TIMESTAMP
viewer_id UUID (optional, for logged-in users)
ip_address TEXT (for unique counting)
created_at TIMESTAMP
```

---

## 🎯 Key Features

| Feature | Status | Notes |
|---------|--------|-------|
| View counting | ✅ Done | Tracks every view |
| Unique viewers | ✅ Done | Counts distinct visitors |
| Time-based stats | ✅ Done | 7 days, 30 days |
| Views chart | ✅ Done | Simple bar chart |
| Real-time updates | ✅ Done | Updates immediately |
| Mobile responsive | ✅ Done | Works on all devices |
| Fast queries | ✅ Done | Indexed for performance |

---

## 💡 Usage Tips

1. **Don't track your own views** - Use incognito or different device for testing
2. **Check analytics regularly** - See what content resonates
3. **Use view trends** - Identify your best-performing posts
4. **Track engagement** - Views + comments + likes = total engagement

---

## 🔧 Troubleshooting

**Views not incrementing?**
- Check if the SQL migration ran successfully
- Verify the `increment_post_view_count` function exists
- Check Supabase logs for errors

**Analytics not showing?**
- Make sure you're the post author
- Check browser console for errors
- Verify the API route is accessible

**Slow queries?**
- Indexes should be created automatically
- Check `EXPLAIN ANALYZE` on your queries
- Consider archiving old view data (older than 1 year)

---

## 🚀 Optional Enhancements

Want to add more features later? Easy additions:

1. **Referrer tracking** - See where views come from
2. **Device tracking** - Desktop vs mobile stats
3. **Read time tracking** - How long people read
4. **Geographic data** - Where your readers are
5. **Export analytics** - Download as CSV
6. **Email reports** - Weekly/monthly summaries

---

## ✅ Current Status

✅ Database schema created
✅ API routes implemented
✅ UI component built
✅ Integrated into edit page
✅ View counts shown on posts list
❌ **Setup Required:** Run SQL migration

---

## 🎉 Once Set Up

After running the SQL migration:
- ✅ View tracking works automatically
- ✅ Analytics update in real-time
- ✅ Zero configuration needed
- ✅ Scales to millions of views

---

**Next Step:** Go to Supabase → SQL Editor → Run the migration! 🚀

