# Mentorship Offerings & Bookings Setup Guide

Your complete mentorship booking system is ready! Follow this guide to set it up.

---

## 🚀 Quick Setup

### **Step 1: Run the Database Migration**

1. Go to **Supabase Dashboard** → SQL Editor
2. Copy and paste SQL from: `supabase/migrations/add_mentorship_offerings.sql`
3. Click **Run**

This creates:
- ✅ `mentorship_offerings` table
- ✅ `mentorship_bookings` table
- ✅ Indexes for performance
- ✅ Triggers for stats updates

### **Step 2: Make Sure Availability is Set Up**

Also run: `supabase/migrations/add_mentor_availability.sql`

---

## 📊 What's Included

### **For Mentors:**

1. **Create Offerings**
   - Title (e.g., "Resume Review 1:1")
   - Category (resume review, mock interview, etc.)
   - Price (₹ or free)
   - Duration (15/30/45/60/90 min)
   - Availability settings
   - Booking policies

2. **Manage Offerings**
   - View all offerings
   - Activate/Pause/Delete
   - Track bookings & ratings

3. **Handle Bookings**
   - View pending bookings
   - Confirm or decline
   - Add meeting links
   - Mark as completed
   - Track no-shows

### **For Mentees:**

1. **Browse Offerings**
   - Search & filter
   - View mentor profiles
   - See ratings & booking counts

2. **Book Sessions**
   - Select date from availability
   - Pick time slot
   - Add notes for mentor
   - Instant confirmation (free) or pending (paid)

3. **Manage Bookings**
   - View upcoming sessions
   - Join via meeting link
   - Cancel if needed
   - Rate completed sessions

---

## 🗺️ Feature Flow

### **Mentor Flow (< 1 minute to create)**

```
1. Profile → Set Weekly Availability
           ↓
2. Offerings → Create Offering
   - Title: "Resume Review 1:1"
   - Price: ₹500
   - Duration: 30 min
           ↓
3. Click "Publish & Go Live"
           ↓
4. Offering visible to mentees!
           ↓
5. Mentee books → Mentor notified
           ↓
6. Bookings → Confirm + Add Link
           ↓
7. Session happens
           ↓
8. Mark as Completed
           ↓
9. Mentee rates → Rating updates
```

### **Mentee Flow**

```
1. Book Session → Browse offerings
           ↓
2. Click "Book Now" on offering
           ↓
3. Select date (from availability)
           ↓
4. Select time slot
           ↓
5. Add notes (optional)
           ↓
6. Confirm booking
           ↓
7. Wait for mentor confirmation
           ↓
8. Get meeting link
           ↓
9. Join session
           ↓
10. Rate & review
```

---

## 📁 Files Created

### **Database**
| File | Purpose |
|------|---------|
| `supabase/migrations/add_mentorship_offerings.sql` | Main schema |

### **API Routes**
| File | Purpose |
|------|---------|
| `src/app/api/offerings/route.js` | GET/POST offerings |
| `src/app/api/offerings/[id]/route.js` | GET/PATCH/DELETE single offering |
| `src/app/api/bookings/route.js` | GET/POST bookings |
| `src/app/api/bookings/[id]/route.js` | GET/PATCH single booking |

### **Mentor Pages**
| File | Purpose |
|------|---------|
| `src/app/dashboard/offerings/page.jsx` | List all offerings |
| `src/app/dashboard/offerings/new/page.jsx` | Create offering |
| `src/app/dashboard/offerings/[id]/edit/page.jsx` | Edit offering |
| `src/app/dashboard/bookings/page.jsx` | Manage bookings |

### **Mentee Pages**
| File | Purpose |
|------|---------|
| `src/app/dashboard/mentee/book/page.jsx` | Browse & book offerings |
| `src/app/dashboard/mentee/bookings/page.jsx` | View my bookings |

### **Components**
| File | Purpose |
|------|---------|
| `src/components/mentorship/OfferingForm.jsx` | Create/edit offering form |
| `src/components/mentorship/OfferingCard.jsx` | Offering display card |
| `src/components/mentorship/BookingModal.jsx` | Booking flow modal |

---

## 🗄️ Database Schema

### **mentorship_offerings**

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| mentor_id | UUID | References auth.users |
| title | TEXT | Offering title |
| description | TEXT | Details |
| category | TEXT | Type of service |
| price | DECIMAL | Price in INR (0 = free) |
| duration_minutes | INTEGER | Session duration |
| use_profile_availability | BOOLEAN | Sync with profile |
| buffer_before_minutes | INTEGER | Buffer before session |
| buffer_after_minutes | INTEGER | Buffer after session |
| max_bookings_per_day | INTEGER | Daily limit |
| advance_booking_days | INTEGER | How far ahead can book |
| min_notice_hours | INTEGER | Minimum notice required |
| cancellation_policy | TEXT | Policy text |
| preparation_notes | TEXT | What to prepare |
| status | TEXT | draft/active/paused/archived |
| total_bookings | INTEGER | Auto-updated count |
| total_completed | INTEGER | Auto-updated count |
| average_rating | DECIMAL | Auto-calculated |

### **mentorship_bookings**

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| offering_id | UUID | References mentorship_offerings |
| mentor_id | UUID | References auth.users |
| mentee_id | UUID | References auth.users |
| scheduled_at | TIMESTAMP | Session date/time |
| duration_minutes | INTEGER | Duration |
| timezone | TEXT | User's timezone |
| meeting_link | TEXT | Video call link |
| meeting_notes | TEXT | Mentee's notes |
| amount | DECIMAL | Price charged |
| payment_status | TEXT | pending/paid/refunded |
| status | TEXT | pending/confirmed/completed/cancelled/no_show |
| cancelled_by | TEXT | mentor/mentee/system |
| cancellation_reason | TEXT | Why cancelled |
| mentee_rating | INTEGER | 1-5 stars |
| mentee_feedback | TEXT | Written feedback |
| mentor_notes | TEXT | Private mentor notes |

---

## 🎨 UI/UX Features

### **Offering Form**
- Clean card-based sections
- Intuitive pricing input
- Duration dropdown
- Toggle for profile availability sync
- Buffer time configuration
- Policy text areas

### **Booking Modal**
- 3-step flow: Date → Time → Confirm
- Visual date picker from availability
- Time slot grid
- Summary before booking
- Notes input for context

### **Bookings Dashboard**
- Quick stats cards
- Status filters
- Action buttons (Confirm/Decline/Complete)
- Meeting link integration
- Rating display

---

## 🔒 Security

✅ **Authentication** - All routes require auth
✅ **Authorization** - Mentors can only manage their offerings
✅ **Booking validation** - Checks availability, conflicts, limits
✅ **Self-booking prevention** - Can't book your own offering
✅ **Status transitions** - Only valid status changes allowed

---

## 📍 Sidebar Navigation

### **Mentor Sidebar**
- Profile
- **Offerings** ← NEW
- **Bookings** ← NEW
- My Events
- Posts

### **Mentee Sidebar**
- Find Mentor
- **Book Session** ← NEW
- **My Bookings** ← NEW
- My Sessions
- Events
- Resources

---

## ⚡ Booking Rules

| Rule | Value | Configurable |
|------|-------|--------------|
| Minimum notice | 24 hours | Yes |
| Advance booking | 30 days | Yes |
| Max per day | 5 bookings | Yes |
| Buffer before | 5 minutes | Yes |
| Buffer after | 5 minutes | Yes |

---

## 📈 Auto-Updated Stats

The system automatically updates:

1. **total_bookings** - Incremented on new booking
2. **total_completed** - Incremented when completed
3. **average_rating** - Recalculated on new rating

These use database triggers for accuracy.

---

## 🔧 Future Enhancements

Ready to add later:

1. **Payment Integration** - Razorpay/Stripe
2. **Email Notifications** - Booking confirmations
3. **Calendar Sync** - Google/Outlook
4. **Recurring Sessions** - Weekly bookings
5. **Group Sessions** - Multiple mentees
6. **Rescheduling** - Change booking time

---

## ✅ Setup Checklist

1. [ ] Run `add_mentor_availability.sql` migration
2. [ ] Run `add_mentorship_offerings.sql` migration
3. [ ] Test mentor creates offering
4. [ ] Test mentor sets availability
5. [ ] Test mentee browses offerings
6. [ ] Test mentee books session
7. [ ] Test mentor confirms booking
8. [ ] Test mentor adds meeting link
9. [ ] Test mentor marks completed
10. [ ] Test mentee rates session

---

## 🎉 You're Ready!

After running the migrations:

✅ Mentors can create offerings in under 1 minute
✅ Mentees can browse and book instantly
✅ Availability syncs automatically
✅ Bookings are tracked and managed
✅ Ratings build mentor reputation

**Start creating your first offering!** 🚀

