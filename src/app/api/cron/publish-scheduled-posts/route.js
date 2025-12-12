import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

// This API route will be called by a cron job to publish scheduled posts
export async function GET(request) {
  try {
    // Verify the request is coming from a cron job (optional security)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const now = new Date().toISOString();

    // Find all scheduled posts where published_at <= now
    const { data: scheduledPosts, error: fetchError } = await supabase
      .from('posts')
      .select('id, title, published_at')
      .eq('status', 'scheduled')
      .lte('published_at', now);

    if (fetchError) {
      console.error('Error fetching scheduled posts:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch scheduled posts' },
        { status: 500 }
      );
    }

    if (!scheduledPosts || scheduledPosts.length === 0) {
      return NextResponse.json({
        message: 'No posts to publish',
        count: 0
      });
    }

    // Update them to published
    const { error: updateError } = await supabase
      .from('posts')
      .update({ status: 'published' })
      .eq('status', 'scheduled')
      .lte('published_at', now);

    if (updateError) {
      console.error('Error updating posts:', updateError);
      return NextResponse.json(
        { error: 'Failed to update posts' },
        { status: 500 }
      );
    }

    console.log(`✅ Published ${scheduledPosts.length} scheduled posts`);

    return NextResponse.json({
      message: `Successfully published ${scheduledPosts.length} posts`,
      count: scheduledPosts.length,
      posts: scheduledPosts.map(p => ({
        id: p.id,
        title: p.title,
        published_at: p.published_at
      }))
    });
  } catch (error) {
    console.error('Error in publish scheduled posts cron:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

