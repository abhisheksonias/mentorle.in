import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { getUserRole } from '@/lib/auth';
import { ROLES } from '@/lib/roles';

// GET - Fetch post analytics (author/admin/mentor only)
export async function GET(request, { params }) {
  try {
    const supabase = await createServerSupabaseClient();
    const { id } = await params;
    
    // Get user authentication
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

    // Get the post to check ownership
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('author_id, view_count, title, status, published_at, created_at')
      .eq('id', id)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if user is author, admin, or mentor
    const isAuthor = post.author_id === userId;
    const canView = isAuthor || userRole === ROLES.ADMIN || userRole === ROLES.MENTOR;

    if (!canView) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get view statistics
    const { count: totalViews } = await supabase
      .from('post_views')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', id);

    // Get unique viewers (count distinct viewer_id)
    const { data: uniqueViewersData } = await supabase
      .from('post_views')
      .select('viewer_id')
      .eq('post_id', id)
      .not('viewer_id', 'is', null);

    const uniqueViewers = new Set(uniqueViewersData?.map(v => v.viewer_id) || []).size;

    // Get views in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: viewsLast7Days } = await supabase
      .from('post_views')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', id)
      .gte('viewed_at', sevenDaysAgo.toISOString());

    // Get views in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: viewsLast30Days } = await supabase
      .from('post_views')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', id)
      .gte('viewed_at', thirtyDaysAgo.toISOString());

    // Get views by day for last 30 days
    const { data: viewsByDay } = await supabase
      .from('post_views')
      .select('viewed_at')
      .eq('post_id', id)
      .gte('viewed_at', thirtyDaysAgo.toISOString())
      .order('viewed_at', { ascending: true });

    // Group views by day
    const viewsByDayMap = {};
    viewsByDay?.forEach(view => {
      const date = new Date(view.viewed_at).toISOString().split('T')[0];
      viewsByDayMap[date] = (viewsByDayMap[date] || 0) + 1;
    });

    // Get latest view
    const { data: latestView } = await supabase
      .from('post_views')
      .select('viewed_at')
      .eq('post_id', id)
      .order('viewed_at', { ascending: false })
      .limit(1)
      .single();

    // Get comments count (if comments table exists)
    const { count: commentsCount } = await supabase
      .from('post_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', id)
      .eq('status', 'visible');

    // Get likes count (if likes table exists)
    const { count: likesCount } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', id);

    return NextResponse.json({
      post: {
        id: post.id,
        title: post.title,
        status: post.status,
        published_at: post.published_at,
        created_at: post.created_at
      },
      analytics: {
        totalViews: totalViews || 0,
        uniqueViewers: uniqueViewers || 0,
        viewsLast7Days: viewsLast7Days || 0,
        viewsLast30Days: viewsLast30Days || 0,
        latestView: latestView?.viewed_at || null,
        commentsCount: commentsCount || 0,
        likesCount: likesCount || 0,
        viewsByDay: viewsByDayMap
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

