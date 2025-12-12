// Supabase Edge Function to auto-publish scheduled posts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const now = new Date().toISOString()

    // Find all scheduled posts where published_at <= now
    const { data: scheduledPosts, error: fetchError } = await supabase
      .from('posts')
      .select('id, title, published_at')
      .eq('status', 'scheduled')
      .lte('published_at', now)

    if (fetchError) {
      throw fetchError
    }

    if (!scheduledPosts || scheduledPosts.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No posts to publish' }),
        { headers: { 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Update them to published
    const { error: updateError } = await supabase
      .from('posts')
      .update({ status: 'published' })
      .eq('status', 'scheduled')
      .lte('published_at', now)

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({ 
        message: `Published ${scheduledPosts.length} posts`,
        posts: scheduledPosts 
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

