import { NextResponse } from 'next/server';
import { calculateReadingTime, validatePostData } from '@/lib/blogUtils';
import { getUserRole } from '@/lib/auth';
import { ROLES } from '@/lib/roles';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function GET(request, { params }) {
  try {
    const supabase = await createServerSupabaseClient();
    const { id } = await params;
    
    // Try to get user from cookies or Bearer token
    let userId = null;
    let userRole = null;
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      userId = session.user.id;
    } else {
      // Fallback: Try Authorization header
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (user && !error) {
          userId = user.id;
        }
      }
    }
    
    if (userId) {
      userRole = await getUserRole(userId, supabase);
    }
    
    let query = supabase.from('posts').select('*').eq('id', id).single();
    
    // If not admin/mentor, only show published posts
    if (!userRole || (userRole !== ROLES.ADMIN && userRole !== ROLES.MENTOR)) {
      query = query.eq('status', 'published');
    }
    
    const { data, error } = await query;
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
    }
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in GET single post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const supabase = await createServerSupabaseClient();
    const { id } = await params;
    let userId = null;
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      userId = session.user.id;
    } else {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (user && !error) userId = user.id;
      }
    }
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userRole = await getUserRole(userId, supabase);
    const { data: existingPost, error: fetchError } = await supabase
      .from('posts').select('author_id, status, content, title').eq('id', id).single();
    if (fetchError || !existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    const isAuthor = existingPost.author_id === userId;
    const canEdit = isAuthor || userRole === ROLES.ADMIN || userRole === ROLES.MENTOR;
    if (!canEdit) {
      return NextResponse.json({ error: 'You do not have permission to edit this post' }, { status: 403 });
    }
    const body = await request.json();
    const { title, summary, content, content_json, tags, status, featured, cover_url } = body;
    const validation = validatePostData({ 
      title: title || existingPost.title, 
      content: content !== undefined ? content : existingPost.content, 
      status: status || existingPost.status 
    });
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 });
    }
    const updateData = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = title.trim();
    if (summary !== undefined) updateData.summary = summary?.trim() || null;
    if (content !== undefined) {
      updateData.content = content?.trim() || "";
      updateData.reading_time_minutes = calculateReadingTime(content);
    }
    if (content_json !== undefined) updateData.content_json = content_json;
    if (tags !== undefined) updateData.tags = tags;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'published' && !existingPost.published_at) {
        updateData.published_at = new Date().toISOString();
      }
    }
    if (featured !== undefined) updateData.featured = featured;
    if (cover_url !== undefined) updateData.cover_url = cover_url || null;
    const { data, error } = await supabase.from('posts').update(updateData).eq('id', id).select().single();
    if (error) {
      return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
    }
    return NextResponse.json({ message: 'Post updated successfully', data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = await createServerSupabaseClient();
    const { id } = await params;
    let userId = null;
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      userId = session.user.id;
    } else {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (user && !error) userId = user.id;
      }
    }
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userRole = await getUserRole(userId, supabase);
    const { data: existingPost, error: fetchError } = await supabase
      .from('posts').select('author_id').eq('id', id).single();
    if (fetchError || !existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    const isAuthor = existingPost.author_id === userId;
    const canDelete = isAuthor || userRole === ROLES.ADMIN || userRole === ROLES.MENTOR;
    if (!canDelete) {
      return NextResponse.json({ error: 'You do not have permission to delete this post' }, { status: 403 });
    }
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }
    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
