import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

// GET - Fetch comments for a post
export async function GET(request, { params }) {
  try {
    const supabase = await createServerSupabaseClient();
    const { id: postId } = params;

    const { data, error } = await supabase
      .from('post_comments')
      .select('*')
      .eq('post_id', postId)
      .eq('status', 'visible')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    // Fetch user emails for comments
    const commentsWithUsers = await Promise.all(
      (data || []).map(async (comment) => {
        try {
          const { data: mentorData } = await supabase
            .from('mentor_data')
            .select('email, name')
            .eq('user_id', comment.user_id)
            .maybeSingle();
          
          if (mentorData) {
            return {
              ...comment,
              user: { id: comment.user_id, email: mentorData.email }
            };
          }

          const { data: menteeData } = await supabase
            .from('mentee_data')
            .select('email, name')
            .eq('user_id', comment.user_id)
            .maybeSingle();
          
          if (menteeData) {
            return {
              ...comment,
              user: { id: comment.user_id, email: menteeData.email }
            };
          }

          return { ...comment, user: null };
        } catch {
          return { ...comment, user: null };
        }
      })
    );

    // Organize comments into threaded structure
    const commentsMap = new Map();
    const rootComments = [];

    commentsWithUsers.forEach(comment => {
      commentsMap.set(comment.id, { ...comment, replies: [] });
    });

    commentsWithUsers.forEach(comment => {
      if (comment.parent_id) {
        const parent = commentsMap.get(comment.parent_id);
        if (parent) {
          parent.replies.push(commentsMap.get(comment.id));
        }
      } else {
        rootComments.push(commentsMap.get(comment.id));
      }
    });

    return NextResponse.json({ data: rootComments });
  } catch (error) {
    console.error('Error in comments GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new comment
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
    const body = await request.json();
    const { content, parent_id } = body;

    if (!content || content.trim().length < 1) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    // Verify post exists
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, status')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Only allow comments on published posts
    if (post.status !== 'published') {
      return NextResponse.json(
        { error: 'Comments are only allowed on published posts' },
        { status: 403 }
      );
    }

    // If parent_id is provided, verify it exists and belongs to the same post
    if (parent_id) {
      const { data: parentComment, error: parentError } = await supabase
        .from('post_comments')
        .select('id, post_id')
        .eq('id', parent_id)
        .single();

      if (parentError || !parentComment || parentComment.post_id !== postId) {
        return NextResponse.json(
          { error: 'Invalid parent comment' },
          { status: 400 }
        );
      }
    }

    const commentData = {
      post_id: postId,
      user_id: userId,
      content: content.trim(),
      parent_id: parent_id || null,
      status: 'visible',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newComment, error } = await supabase
      .from('post_comments')
      .insert(commentData)
      .select('*')
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      );
    }

    // Fetch user email
    let user = null;
    try {
      const { data: mentorData } = await supabase
        .from('mentor_data')
        .select('email, name')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (mentorData) {
        user = { id: userId, email: mentorData.email };
      } else {
        const { data: menteeData } = await supabase
          .from('mentee_data')
          .select('email, name')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (menteeData) {
          user = { id: userId, email: menteeData.email };
        }
      }
    } catch (err) {
      console.error('Error fetching user:', err);
    }

    return NextResponse.json({
      message: 'Comment created successfully',
      data: { ...newComment, user }
    }, { status: 201 });
  } catch (error) {
    console.error('Error in comments POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

