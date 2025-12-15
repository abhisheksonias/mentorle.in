-- ============================================
-- ADD MISSING FIELDS TO MENTEE_DATA TABLE
-- ============================================
-- This migration adds the missing fields from the mentee profile form
-- to match the enhanced profile features

-- Add languages field (array of text)
ALTER TABLE public.mentee_data
ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}';

-- Add skills field (array of text)
ALTER TABLE public.mentee_data
ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';

-- Add work_background field (JSONB for flexible work experience data)
ALTER TABLE public.mentee_data
ADD COLUMN IF NOT EXISTS work_background JSONB DEFAULT '{}';

-- Add preferences field (JSONB for mentorship preferences)
ALTER TABLE public.mentee_data
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{
  "mentor_qualities": [],
  "session_type": [],
  "preferred_time_windows": {
    "morning": false,
    "afternoon": false,
    "evening": false,
    "weekend": false
  }
}';

-- Add portfolio_url field (text for portfolio website)
ALTER TABLE public.mentee_data
ADD COLUMN IF NOT EXISTS portfolio_url TEXT;

-- Add profile_url field (text for profile picture URL)
ALTER TABLE public.mentee_data
ADD COLUMN IF NOT EXISTS profile_url TEXT;

-- Add resume_url field (text for resume file URL)
ALTER TABLE public.mentee_data
ADD COLUMN IF NOT EXISTS resume_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.mentee_data.languages IS 'Array of languages spoken by the mentee';
COMMENT ON COLUMN public.mentee_data.skills IS 'Array of technical and professional skills';
COMMENT ON COLUMN public.mentee_data.work_background IS 'JSONB object containing work experience: company, position, start_date, end_date, description';
COMMENT ON COLUMN public.mentee_data.preferences IS 'JSONB object containing mentorship preferences: mentor_qualities (array), session_type (array), preferred_time_windows (object)';
COMMENT ON COLUMN public.mentee_data.portfolio_url IS 'URL to mentee portfolio website';
COMMENT ON COLUMN public.mentee_data.profile_url IS 'URL to mentee profile picture stored in Supabase storage';
COMMENT ON COLUMN public.mentee_data.resume_url IS 'URL to mentee resume file stored in Supabase storage';

