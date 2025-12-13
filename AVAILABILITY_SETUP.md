# Mentor Availability Setup Guide

Your mentor availability system is ready! This enables mentors to set their weekly availability for 1:1 sessions.

---

## 🚀 Quick Setup

### **Run the Database Migration**

1. Go to your **Supabase Dashboard** → SQL Editor
2. Copy and paste the SQL from: `supabase/migrations/add_mentor_availability.sql`
3. Click **Run**

This creates:
- ✅ `mentor_availability` table
- ✅ Row Level Security policies
- ✅ Proper indexes

---

## 📊 What's Included

### **1. Visual Availability Grid**

Mentors can click time slots on an interactive grid:

```
         Sun  Mon  Tue  Wed  Thu  Fri  Sat
 6 AM    [ ]  [■]  [■]  [■]  [■]  [■]  [ ]
 7 AM    [ ]  [■]  [■]  [■]  [■]  [■]  [ ]
 8 AM    [ ]  [■]  [■]  [■]  [■]  [■]  [ ]
 9 AM    [ ]  [■]  [■]  [■]  [■]  [■]  [ ]
10 AM    [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]
...
```

- **Black** = Available
- **Gray** = Unavailable
- **Click day header** = Toggle entire day
- **Click slot** = Toggle single hour

### **2. Features**

| Feature | Status |
|---------|--------|
| Click-to-select grid | ✅ |
| Toggle full days | ✅ |
| Clear all button | ✅ |
| Save button | ✅ |
| Unsaved changes indicator | ✅ |
| Hours/week summary | ✅ |
| Timezone support | ✅ |
| Black/white theme | ✅ |

---

## 🎨 Design (Black & White Theme)

The grid follows your app's minimal black/white aesthetic:

- **Selected slots**: Black background with white checkmark
- **Unselected slots**: Light gray with subtle border
- **Day headers**: Black when all slots selected
- **Typography**: Clean, minimal, monospace time labels

---

## 📁 Files Created

| File | Purpose |
|------|---------|
| `supabase/migrations/add_mentor_availability.sql` | Database schema |
| `src/app/api/availability/route.js` | API endpoints (GET/POST) |
| `src/app/dashboard/mentor/profile/components/AvailabilityGrid.jsx` | UI component |

---

## 🔌 API Endpoints

### **GET /api/availability**

Fetch availability slots.

```javascript
// Get current user's availability
const response = await fetch('/api/availability', {
  headers: { 'Authorization': 'Bearer TOKEN' }
});

// Get specific mentor's availability (public)
const response = await fetch('/api/availability?mentor_id=UUID');
```

### **POST /api/availability**

Save/replace all availability slots.

```javascript
await fetch('/api/availability', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    slots: [
      { day_of_week: 1, start_time: '09:00', end_time: '10:00' },
      { day_of_week: 1, start_time: '10:00', end_time: '11:00' },
      // ...
    ],
    timezone: 'America/New_York'
  })
});
```

---

## 🗄️ Database Schema

### **mentor_availability table**

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| mentor_id | UUID | References auth.users |
| day_of_week | INTEGER | 0=Sunday, 6=Saturday |
| start_time | TIME | Slot start (e.g., '09:00') |
| end_time | TIME | Slot end (e.g., '10:00') |
| timezone | TEXT | User's timezone |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update |

### **Row Level Security**

- ✅ Mentors can only manage their own availability
- ✅ Anyone can view availability (for booking)

---

## 🎯 How It Works

### **For Mentors**

1. Go to **Profile** page
2. Scroll to **Weekly Availability** section
3. Click slots to mark available times
4. Click **Save** button
5. Done! Availability syncs with offerings

### **For Booking Flow (Later)**

1. Mentee views mentor profile
2. Mentee sees available time slots
3. Mentee books a slot
4. Mentor receives notification

---

## 🔗 Integration with Mentorship Offerings

When you create offerings later, they can:

1. **Use profile availability** → Auto-sync from this grid
2. **Override availability** → Set custom times per offering

This saves time — mentors set availability once, use everywhere!

---

## 📱 Responsive Design

- **Desktop**: Full 7-column grid
- **Tablet**: Horizontal scroll if needed
- **Mobile**: Horizontal scroll with touch support

---

## ✅ Checklist

1. [ ] Run SQL migration in Supabase
2. [ ] Test the availability grid in mentor profile
3. [ ] Save and verify slots persist
4. [ ] Ready for mentorship offerings!

---

## 🔧 Troubleshooting

**Grid not loading?**
- Check if migration ran successfully
- Verify `mentor_availability` table exists

**Save not working?**
- Check browser console for errors
- Verify user is authenticated as mentor

**Slots not persisting?**
- Check RLS policies are enabled
- Verify mentor_id matches auth.uid()

---

**Next Step:** Run the SQL migration, then test the availability grid! 🚀

