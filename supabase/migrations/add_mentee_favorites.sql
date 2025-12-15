-- ============================================
-- MENTEE FAVORITES TABLE
-- ============================================
-- Allows mentees to save/favorite mentors

CREATE TABLE IF NOT EXISTS mentee_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one favorite per mentee-mentor pair
  CONSTRAINT unique_favorite UNIQUE (mentee_id, mentor_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_favorites_mentee_id ON mentee_favorites(mentee_id);
CREATE INDEX IF NOT EXISTS idx_favorites_mentor_id ON mentee_favorites(mentor_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON mentee_favorites(created_at DESC);

-- RLS Policies
ALTER TABLE mentee_favorites ENABLE ROW LEVEL SECURITY;

-- Mentees can view their own favorites
CREATE POLICY "Mentees can view their own favorites"
  ON mentee_favorites
  FOR SELECT
  USING (auth.uid() = mentee_id);

-- Mentees can add their own favorites
CREATE POLICY "Mentees can add their own favorites"
  ON mentee_favorites
  FOR INSERT
  WITH CHECK (auth.uid() = mentee_id);

-- Mentees can delete their own favorites
CREATE POLICY "Mentees can delete their own favorites"
  ON mentee_favorites
  FOR DELETE
  USING (auth.uid() = mentee_id);

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON mentee_favorites TO authenticated;

COMMENT ON TABLE mentee_favorites IS 'Stores mentees favorite/saved mentors';
COMMENT ON COLUMN mentee_favorites.mentee_id IS 'User ID of the mentee';
COMMENT ON COLUMN mentee_favorites.mentor_id IS 'User ID of the mentor being favorited';

