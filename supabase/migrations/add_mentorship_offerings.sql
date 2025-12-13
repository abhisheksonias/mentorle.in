-- ============================================
-- MENTORSHIP OFFERINGS & BOOKINGS SCHEMA
-- ============================================

-- 1. Mentorship Offerings Table
-- Stores the services mentors offer (1:1 sessions, reviews, etc.)
CREATE TABLE IF NOT EXISTS mentorship_offerings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Info
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general', -- resume_review, portfolio_review, career_guidance, mock_interview, etc.
  
  -- Pricing & Duration
  price DECIMAL(10, 2) NOT NULL DEFAULT 0, -- 0 = free
  currency TEXT NOT NULL DEFAULT 'INR',
  duration_minutes INTEGER NOT NULL DEFAULT 30, -- 15, 30, 45, 60, 90
  
  -- Availability Settings
  use_profile_availability BOOLEAN NOT NULL DEFAULT true, -- Use mentor's profile availability
  custom_availability JSONB, -- Override availability if use_profile_availability is false
  buffer_before_minutes INTEGER DEFAULT 5, -- Buffer time before session
  buffer_after_minutes INTEGER DEFAULT 5, -- Buffer time after session
  max_bookings_per_day INTEGER DEFAULT 5, -- Limit daily bookings
  
  -- Booking Settings
  advance_booking_days INTEGER DEFAULT 30, -- How far in advance can book
  min_notice_hours INTEGER DEFAULT 24, -- Minimum notice for booking
  
  -- Policies
  cancellation_policy TEXT, -- e.g., "Free cancellation up to 24 hours before"
  preparation_notes TEXT, -- What mentee should prepare
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft', -- draft, active, paused, archived
  featured BOOLEAN DEFAULT false,
  
  -- Metadata
  total_bookings INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Mentorship Bookings Table
-- Stores all bookings made by mentees
CREATE TABLE IF NOT EXISTS mentorship_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_id UUID NOT NULL REFERENCES mentorship_offerings(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Schedule
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  
  -- Meeting Details
  meeting_link TEXT,
  meeting_notes TEXT, -- Notes from mentee about what they want to discuss
  
  -- Payment
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  payment_status TEXT DEFAULT 'pending', -- pending, paid, refunded, failed
  payment_id TEXT, -- External payment reference
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, completed, cancelled, no_show
  cancelled_by TEXT, -- mentor, mentee, system
  cancellation_reason TEXT,
  
  -- Feedback
  mentee_rating INTEGER CHECK (mentee_rating >= 1 AND mentee_rating <= 5),
  mentee_feedback TEXT,
  mentor_notes TEXT, -- Private notes from mentor
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_offerings_mentor_id ON mentorship_offerings(mentor_id);
CREATE INDEX IF NOT EXISTS idx_offerings_status ON mentorship_offerings(status);
CREATE INDEX IF NOT EXISTS idx_offerings_category ON mentorship_offerings(category);

CREATE INDEX IF NOT EXISTS idx_bookings_offering_id ON mentorship_bookings(offering_id);
CREATE INDEX IF NOT EXISTS idx_bookings_mentor_id ON mentorship_bookings(mentor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_mentee_id ON mentorship_bookings(mentee_id);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_at ON mentorship_bookings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON mentorship_bookings(status);

-- 4. Disable RLS for simplicity (server handles auth)
ALTER TABLE mentorship_offerings DISABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_bookings DISABLE ROW LEVEL SECURITY;

-- 5. Grant permissions
GRANT ALL ON mentorship_offerings TO authenticated;
GRANT SELECT ON mentorship_offerings TO anon;

GRANT ALL ON mentorship_bookings TO authenticated;

-- 6. Function to update offering stats after booking
CREATE OR REPLACE FUNCTION update_offering_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE mentorship_offerings 
    SET total_bookings = total_bookings + 1,
        updated_at = NOW()
    WHERE id = NEW.offering_id;
  END IF;
  
  IF TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE mentorship_offerings 
    SET total_completed = total_completed + 1,
        updated_at = NOW()
    WHERE id = NEW.offering_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger for stats update
DROP TRIGGER IF EXISTS trigger_update_offering_stats ON mentorship_bookings;
CREATE TRIGGER trigger_update_offering_stats
  AFTER INSERT OR UPDATE ON mentorship_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_offering_stats();

-- 8. Function to update average rating
CREATE OR REPLACE FUNCTION update_offering_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.mentee_rating IS NOT NULL THEN
    UPDATE mentorship_offerings 
    SET average_rating = (
      SELECT AVG(mentee_rating)::DECIMAL(3,2)
      FROM mentorship_bookings
      WHERE offering_id = NEW.offering_id
      AND mentee_rating IS NOT NULL
    ),
    updated_at = NOW()
    WHERE id = NEW.offering_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger for rating update
DROP TRIGGER IF EXISTS trigger_update_offering_rating ON mentorship_bookings;
CREATE TRIGGER trigger_update_offering_rating
  AFTER UPDATE ON mentorship_bookings
  FOR EACH ROW
  WHEN (NEW.mentee_rating IS DISTINCT FROM OLD.mentee_rating)
  EXECUTE FUNCTION update_offering_rating();

