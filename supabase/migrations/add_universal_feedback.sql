-- ============================================
-- UNIVERSAL FEEDBACK SYSTEM
-- ============================================

-- 1. Feedback Table
-- Stores feedback for events, bookings, and articles
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who left the feedback
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- What the feedback is for (polymorphic relationship)
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('event', 'booking', 'article')),
  reference_id UUID NOT NULL, -- ID of the event/booking/article
  
  -- Feedback content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5), -- Star rating (1-5)
  comment TEXT, -- Optional text feedback
  status TEXT NOT NULL DEFAULT 'active', -- active, archived, hidden
  
  -- Response from mentor (if applicable)
  mentor_response TEXT,
  mentor_response_at TIMESTAMP WITH TIME ZONE,
  responded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_reference_id ON feedback(reference_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type_reference ON feedback(feedback_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- 3. Disable RLS for simplicity (server handles auth)
ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;

-- 4. Grant permissions
GRANT ALL ON feedback TO authenticated;
GRANT SELECT ON feedback TO anon;

-- 5. Function to update mentor average rating from bookings feedback
CREATE OR REPLACE FUNCTION update_mentor_rating_from_feedback()
RETURNS TRIGGER AS $$
DECLARE
  mentor_user_id UUID;
BEGIN
  -- Only process booking feedback
  IF NEW.feedback_type = 'booking' THEN
    -- Get mentor_id from the booking
    SELECT mentor_id INTO mentor_user_id
    FROM mentorship_bookings
    WHERE id = NEW.reference_id;
    
    IF mentor_user_id IS NOT NULL THEN
      -- Update mentor_data with average rating from all booking feedback
      UPDATE mentor_data
      SET 
        average_rating = (
          SELECT AVG(f.rating)::DECIMAL(3,2)
          FROM feedback f
          INNER JOIN mentorship_bookings b ON b.id = f.reference_id
          WHERE b.mentor_id = mentor_user_id
          AND f.feedback_type = 'booking'
          AND f.status = 'active'
        ),
        updated_at = NOW()
      WHERE user_id = mentor_user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger to update mentor rating when feedback is added/updated
DROP TRIGGER IF EXISTS trigger_update_mentor_rating_feedback ON feedback;
CREATE TRIGGER trigger_update_mentor_rating_feedback
  AFTER INSERT OR UPDATE ON feedback
  FOR EACH ROW
  WHEN (NEW.feedback_type = 'booking')
  EXECUTE FUNCTION update_mentor_rating_from_feedback();

-- 7. Function to prevent duplicate feedback per user per item
CREATE OR REPLACE FUNCTION check_duplicate_feedback()
RETURNS TRIGGER AS $$
DECLARE
  existing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO existing_count
  FROM feedback
  WHERE user_id = NEW.user_id
  AND feedback_type = NEW.feedback_type
  AND reference_id = NEW.reference_id
  AND status = 'active';
  
  IF existing_count > 0 THEN
    RAISE EXCEPTION 'User has already provided feedback for this item';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger to prevent duplicates
DROP TRIGGER IF EXISTS trigger_check_duplicate_feedback ON feedback;
CREATE TRIGGER trigger_check_duplicate_feedback
  BEFORE INSERT ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION check_duplicate_feedback();

