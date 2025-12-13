-- Create mentor_availability table for storing weekly availability slots
CREATE TABLE IF NOT EXISTS mentor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure end_time is after start_time
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  
  -- Prevent overlapping slots for same mentor and day
  CONSTRAINT unique_mentor_day_slot UNIQUE (mentor_id, day_of_week, start_time)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_mentor_availability_mentor_id ON mentor_availability(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_availability_day ON mentor_availability(day_of_week);

-- Enable RLS
ALTER TABLE mentor_availability ENABLE ROW LEVEL SECURITY;

-- Policy: Mentors can manage their own availability
CREATE POLICY "Mentors can manage own availability" ON mentor_availability
  FOR ALL
  USING (auth.uid() = mentor_id)
  WITH CHECK (auth.uid() = mentor_id);

-- Policy: Anyone can view availability (for booking)
CREATE POLICY "Anyone can view availability" ON mentor_availability
  FOR SELECT
  USING (true);

-- Grant permissions
GRANT ALL ON mentor_availability TO authenticated;
GRANT SELECT ON mentor_availability TO anon;

