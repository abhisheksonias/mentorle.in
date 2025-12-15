import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

// GET - Fetch mentee's favorite mentors
export async function GET(request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const menteeId = searchParams.get('mentee_id');

    // Get authenticated user
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

    // Use provided menteeId or current user
    const targetMenteeId = menteeId || userId;

    // For RLS to work with Bearer tokens, ensure we have proper authentication
    let authenticatedSupabase = supabase;
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ') && !session) {
      const token = authHeader.substring(7);
      const { createClient } = require('@supabase/supabase-js');
      authenticatedSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          },
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
          }
        }
      );
      // Set session for RLS
      try {
        await authenticatedSupabase.auth.setSession({
          access_token: token,
          refresh_token: ''
        });
      } catch (sessionError) {
        console.warn('Could not set session for GET:', sessionError);
      }
    }

    // Fetch favorites
    const { data: favorites, error } = await authenticatedSupabase
      .from('mentee_favorites')
      .select('mentor_id, created_at')
      .eq('mentee_id', targetMenteeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching favorites:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json({ 
        error: 'Failed to fetch favorites',
        details: error.message 
      }, { status: 500 });
    }

    // Handle empty favorites
    if (!favorites || favorites.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Get mentor details
    const mentorIds = favorites.map(f => f.mentor_id).filter(Boolean);
    
    if (mentorIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const { data: mentors, error: mentorsError } = await authenticatedSupabase
      .from('mentor_data')
      .select('user_id, name, profile_url, current_role, expertise_area, Industry')
      .in('user_id', mentorIds)
      .eq('status', 'approved');

    if (mentorsError) {
      console.error('Error fetching mentor details:', mentorsError);
      // Return favorites without mentor details rather than failing
      return NextResponse.json({ data: favorites });
    }

    const enrichedData = favorites.map(fav => {
      const mentor = mentors?.find(m => m.user_id === fav.mentor_id);
      return {
        ...fav,
        mentor: mentor || null
      };
    });

    return NextResponse.json({ data: enrichedData });
  } catch (error) {
    console.error('Error in favorites GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add mentor to favorites
export async function POST(request) {
  try {
    const body = await request.json();
    const { mentor_id } = body;

    // Get authenticated user first
    let userId = null;
    let accessToken = null;
    let supabase = await createServerSupabaseClient();
    
    // Try to get session from cookies first
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      userId = session.user.id;
      accessToken = session.access_token;
    } else {
      // Fallback to Bearer token
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7);
        const { data: { user }, error } = await supabase.auth.getUser(accessToken);
        if (user && !error) {
          userId = user.id;
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!mentor_id) {
      return NextResponse.json({ error: 'Mentor ID is required' }, { status: 400 });
    }

    // For RLS to work with Bearer tokens, create a client that uses the token
    // The server client from cookies works fine, but for Bearer tokens we need a different setup
    if (accessToken && !session) {
      const { createClient } = require('@supabase/supabase-js');
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          },
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
          }
        }
      );
      // Set session for RLS to recognize the user
      try {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: ''
        });
      } catch (sessionError) {
        console.warn('Could not set session, but continuing with token in headers:', sessionError);
      }
    }

    // Check if already favorited (with better error handling)
    // Use .maybeSingle() to handle "not found" gracefully
    const { data: existing, error: checkError } = await supabase
      .from('mentee_favorites')
      .select('id, mentor_id, mentee_id')
      .eq('mentee_id', userId)
      .eq('mentor_id', mentor_id)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is fine - we can proceed
      console.error('Error checking existing favorite:', checkError);
      return NextResponse.json({ 
        error: 'Failed to check favorite status',
        details: checkError.message 
      }, { status: 500 });
    }

    // If already exists, return success with existing data (idempotent)
    if (existing) {
      return NextResponse.json({ 
        data: existing, 
        message: 'Mentor already in favorites' 
      }, { status: 200 });
    }

    // Add to favorites (database unique constraint will prevent duplicates)
    const { data, error } = await supabase
      .from('mentee_favorites')
      .insert({
        mentee_id: userId,
        mentor_id: mentor_id
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding favorite:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        userId,
        mentor_id
      });
      
      // Handle specific error cases
      if (error.code === '23505') {
        // Unique constraint violation - already exists (race condition)
        // Fetch the existing favorite
        const { data: existingFavorite } = await supabase
          .from('mentee_favorites')
          .select('*')
          .eq('mentee_id', userId)
          .eq('mentor_id', mentor_id)
          .single();
        
        return NextResponse.json({ 
          data: existingFavorite, 
          message: 'Mentor already in favorites' 
        }, { status: 200 });
      }
      
      if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
        return NextResponse.json({ 
          error: 'Permission denied. RLS policy violation. Please ensure you are logged in as a mentee.' 
        }, { status: 403 });
      }
      
      return NextResponse.json({ 
        error: error.message || 'Failed to add favorite',
        details: error.details || error.hint,
        code: error.code
      }, { status: 500 });
    }

    return NextResponse.json({ data, message: 'Mentor added to favorites' });
  } catch (error) {
    console.error('Error in favorites POST:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove mentor from favorites
export async function DELETE(request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const mentor_id = searchParams.get('mentor_id');

    // Get authenticated user
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

    if (!mentor_id) {
      return NextResponse.json({ error: 'Mentor ID is required' }, { status: 400 });
    }

    // For RLS to work with Bearer tokens, ensure we have proper authentication
    let authenticatedSupabase = supabase;
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ') && !session) {
      const token = authHeader.substring(7);
      const { createClient } = require('@supabase/supabase-js');
      authenticatedSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          },
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
          }
        }
      );
      // Set session for RLS
      try {
        await authenticatedSupabase.auth.setSession({
          access_token: token,
          refresh_token: ''
        });
      } catch (sessionError) {
        console.warn('Could not set session for DELETE:', sessionError);
      }
    }

    // Remove from favorites
    const { data, error } = await authenticatedSupabase
      .from('mentee_favorites')
      .delete()
      .eq('mentee_id', userId)
      .eq('mentor_id', mentor_id)
      .select();

    if (error) {
      console.error('Error removing favorite:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        userId,
        mentor_id
      });
      
      if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
        return NextResponse.json({ 
          error: 'Permission denied. RLS policy violation. Please ensure you are logged in as a mentee.' 
        }, { status: 403 });
      }
      
      return NextResponse.json({ 
        error: error.message || 'Failed to remove favorite',
        details: error.details || error.hint,
        code: error.code
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Mentor removed from favorites',
      deleted: data 
    });
  } catch (error) {
    console.error('Error in favorites DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

