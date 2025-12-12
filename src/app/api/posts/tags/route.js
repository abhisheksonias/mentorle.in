import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

// GET - Fetch all unique tags from posts
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('posts')
      .select('tags')
      .not('tags', 'is', null);

    if (error) {
      console.error('Error fetching tags:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tags' },
        { status: 500 }
      );
    }

    // Extract and deduplicate tags
    const allTags = new Set();
    (data || []).forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          if (tag && typeof tag === 'string') {
            allTags.add(tag.toLowerCase().trim());
          }
        });
      }
    });

    const uniqueTags = Array.from(allTags).sort();

    return NextResponse.json({ data: uniqueTags });
  } catch (error) {
    console.error('Error in tags GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

