import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

// POST - Toggle like on a post
export async function POST(request, { params }) {
  try {
    const supabase = await createServerSupabaseClient();
    const { id: postId } = params;
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Check if post exists
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if user already liked this post
    const { data: existingLike, error: likeCheckError } = await supabase
      .from('post_likes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (likeCheckError) {
      console.error('Error checking like:', likeCheckError);
      return NextResponse.json(
        { error: 'Failed to check like status' },
        { status: 500 }
      );
    }

    if (existingLike) {
      // Unlike: remove the like
      const { error: deleteError } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error removing like:', deleteError);
        return NextResponse.json(
          { error: 'Failed to remove like' },
          { status: 500 }
        );
      }

      // Get updated like count
      const { count } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      return NextResponse.json({
        message: 'Like removed',
        liked: false,
        count: count || 0
      });
    } else {
      // Like: add the like
      const { error: insertError } = await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: userId,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error adding like:', insertError);
        return NextResponse.json(
          { error: 'Failed to add like' },
          { status: 500 }
        );
      }

      // Get updated like count
      const { count } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      return NextResponse.json({
        message: 'Like added',
        liked: true,
        count: count || 0
      });
    }
  } catch (error) {
    console.error('Error in post like POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

