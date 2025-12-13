import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { getUserRole } from '@/lib/auth';
import { ROLES } from '@/lib/roles';

// GET - Fetch offerings (public or mentor's own)
export async function GET(request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const mentorId = searchParams.get('mentor_id');
    const status = searchParams.get('status') || 'all';
    const category = searchParams.get('category');
    const ownOnly = searchParams.get('own') === 'true';

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

    // Build query
    let query = supabase
      .from('mentorship_offerings')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by mentor
    if (ownOnly && userId) {
      query = query.eq('mentor_id', userId);
    } else if (mentorId) {
      query = query.eq('mentor_id', mentorId);
    }

    // Filter by status
    if (status !== 'all') {
      query = query.eq('status', status);
    } else if (!ownOnly) {
      // Public view only shows active offerings
      query = query.eq('status', 'active');
    }

    // Filter by category
    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching offerings:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch offerings', 
        details: error.message,
        hint: error.hint 
      }, { status: 500 });
    }

    console.log(`Fetched ${data?.length || 0} offerings for user ${userId}, ownOnly: ${ownOnly}, status: ${status}`);

    // Get mentor details from mentor_data
    const enrichedData = await Promise.all(data.map(async (offering) => {
      const { data: mentorData } = await supabase
        .from('mentor_data')
        .select('name, profile_url, current_role, expertise_area')
        .eq('user_id', offering.mentor_id)
        .single();
      
      return {
        ...offering,
        mentor: mentorData || null
      };
    }));

    return NextResponse.json({ data: enrichedData });
  } catch (error) {
    console.error('Error in offerings GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new offering
export async function POST(request) {
  try {
    const supabase = await createServerSupabaseClient();
    
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

    // Check if user is mentor
    const userRole = await getUserRole(userId, supabase);
    if (userRole !== ROLES.MENTOR && userRole !== ROLES.ADMIN) {
      return NextResponse.json({ error: 'Only mentors can create offerings' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      category,
      price,
      currency,
      duration_minutes,
      use_profile_availability,
      custom_availability,
      buffer_before_minutes,
      buffer_after_minutes,
      max_bookings_per_day,
      advance_booking_days,
      min_notice_hours,
      cancellation_policy,
      preparation_notes,
      status
    } = body;

    // Validate required fields
    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!duration_minutes || duration_minutes < 15) {
      return NextResponse.json({ error: 'Duration must be at least 15 minutes' }, { status: 400 });
    }

    const offeringData = {
      mentor_id: userId,
      title: title.trim(),
      description: description?.trim() || null,
      category: category || 'general',
      price: parseFloat(price) || 0,
      currency: currency || 'INR',
      duration_minutes: parseInt(duration_minutes),
      use_profile_availability: use_profile_availability !== false,
      custom_availability: custom_availability || null,
      buffer_before_minutes: parseInt(buffer_before_minutes) || 5,
      buffer_after_minutes: parseInt(buffer_after_minutes) || 5,
      max_bookings_per_day: parseInt(max_bookings_per_day) || 5,
      advance_booking_days: parseInt(advance_booking_days) || 30,
      min_notice_hours: parseInt(min_notice_hours) || 24,
      cancellation_policy: cancellation_policy?.trim() || null,
      preparation_notes: preparation_notes?.trim() || null,
      status: status || 'draft',
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('mentorship_offerings')
      .insert(offeringData)
      .select()
      .single();

    if (error) {
      console.error('Error creating offering:', error);
      return NextResponse.json({ 
        error: 'Failed to create offering',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error in offerings POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

