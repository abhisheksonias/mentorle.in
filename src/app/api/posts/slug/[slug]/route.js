import { NextResponse } from 'next/server';
import { getUserRole } from '@/lib/auth';
import { ROLES } from '@/lib/roles';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

// GET - Fetch a single post by slug
export async function GET(request, { params }) {
  try {
    const supabase = await createServerSupabaseClient();
    const { slug } = params;

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    let userRole = null;

    if (userId) {
      userRole = await getUserRole(userId, supabase);
    }

    let query = supabase
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .single();

    // If not admin/mentor, only show published posts
    if (!userRole || (userRole !== ROLES.ADMIN && userRole !== ROLES.MENTOR)) {
      query = query.eq('status', 'published');
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching post:', error);
      return NextResponse.json(
        { error: 'Failed to fetch post' },
        { status: 500 }
      );
    }

    // Fetch author email
    let author = null;
    try {
      const { data: mentorData } = await supabase
        .from('mentor_data')
        .select('email, name')
        .eq('user_id', data.author_id)
        .maybeSingle();
      
      if (mentorData) {
        author = { id: data.author_id, email: mentorData.email };
      } else {
        const { data: menteeData } = await supabase
          .from('mentee_data')
          .select('email, name')
          .eq('user_id', data.author_id)
          .maybeSingle();
        
        if (menteeData) {
          author = { id: data.author_id, email: menteeData.email };
        }
      }
    } catch (err) {
      console.error('Error fetching author:', err);
    }

    return NextResponse.json({ data: { ...data, author } });
  } catch (error) {
    console.error('Error in post GET by slug:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

