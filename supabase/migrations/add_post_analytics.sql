-- Add view_count to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create post_views table for detailed tracking
CREATE TABLE IF NOT EXISTS post_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_post_views_viewed_at ON post_views(viewed_at);

-- Create a function to increment view count
CREATE OR REPLACE FUNCTION increment_post_view_count(p_post_id UUID, p_viewer_id UUID DEFAULT NULL, p_ip_address TEXT DEFAULT NULL)
RETURNS void AS $$
BEGIN
  -- Increment the view count on posts table
  UPDATE posts 
  SET view_count = COALESCE(view_count, 0) + 1 
  WHERE id = p_post_id;
  
  -- Insert into post_views for detailed tracking
  INSERT INTO post_views (post_id, viewer_id, ip_address)
  VALUES (p_post_id, p_viewer_id, p_ip_address);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION increment_post_view_count TO authenticated, anon;

