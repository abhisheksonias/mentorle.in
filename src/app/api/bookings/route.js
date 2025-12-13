import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

// GET - Fetch bookings (mentor or mentee view)
export async function GET(request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const role = searchParams.get('role') || 'mentee'; // mentor or mentee
    const status = searchParams.get('status') || 'all';
    const upcoming = searchParams.get('upcoming') === 'true';

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

    // Build query
    let query = supabase
      .from('mentorship_bookings')
      .select(`
        *,
        offering:offering_id (
          id, title, category, duration_minutes
        )
      `)
      .order('scheduled_at', { ascending: true });

    // Filter by role
    if (role === 'mentor') {
      query = query.eq('mentor_id', userId);
    } else {
      query = query.eq('mentee_id', userId);
    }

    // Filter by status
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Filter upcoming only
    if (upcoming) {
      query = query.gte('scheduled_at', new Date().toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    // Enrich with user data
    const enrichedData = await Promise.all(data.map(async (booking) => {
      // Get mentor info
      const { data: mentorData } = await supabase
        .from('mentor_data')
        .select('name, profile_url')
        .eq('user_id', booking.mentor_id)
        .single();

      // Get mentee info - try multiple sources
      let menteeInfo = null;
      
      // Try mentee_data table
      const { data: menteeData } = await supabase
        .from('mentee_data')
        .select('name, profile_url, email')
        .eq('user_id', booking.mentee_id)
        .single();

      if (menteeData?.name) {
        menteeInfo = menteeData;
      } else {
        // Try mentor_data (mentors can also book sessions)
        const { data: mentorAsUser } = await supabase
          .from('mentor_data')
          .select('name, profile_url, email')
          .eq('user_id', booking.mentee_id)
          .single();
        
        if (mentorAsUser?.name) {
          menteeInfo = mentorAsUser;
        } else {
          // Try user_roles table (has name from signup)
          const { data: userRole } = await supabase
            .from('user_roles')
            .select('name')
            .eq('user_id', booking.mentee_id)
            .single();
          
          if (userRole?.name) {
            menteeInfo = { 
              name: userRole.name, 
              profile_url: null, 
              email: menteeData?.email || null 
            };
          } else {
            menteeInfo = { name: 'User', profile_url: null, email: null };
          }
        }
      }

      return {
        ...booking,
        mentor: mentorData || null,
        mentee: menteeInfo || { name: 'Mentee', profile_url: null }
      };
    }));

    return NextResponse.json({ data: enrichedData });
  } catch (error) {
    console.error('Error in bookings GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new booking
export async function POST(request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get authenticated user (mentee)
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

    const body = await request.json();
    const { offering_id, scheduled_at, timezone, meeting_notes } = body;

    // Validate required fields
    if (!offering_id || !scheduled_at) {
      return NextResponse.json({ error: 'Offering and scheduled time are required' }, { status: 400 });
    }

    // Get offering details
    const { data: offering, error: offeringError } = await supabase
      .from('mentorship_offerings')
      .select('*')
      .eq('id', offering_id)
      .single();

    if (offeringError || !offering) {
      return NextResponse.json({ error: 'Offering not found' }, { status: 404 });
    }

    if (offering.status !== 'active') {
      return NextResponse.json({ error: 'Offering is not available for booking' }, { status: 400 });
    }

    // Prevent self-booking
    if (offering.mentor_id === userId) {
      return NextResponse.json({ error: 'Cannot book your own offering' }, { status: 400 });
    }

    // Validate scheduled time
    const scheduledDate = new Date(scheduled_at);
    const now = new Date();
    const minNoticeTime = new Date(now.getTime() + (offering.min_notice_hours * 60 * 60 * 1000));
    
    if (scheduledDate < minNoticeTime) {
      return NextResponse.json({ 
        error: `Bookings require at least ${offering.min_notice_hours} hours notice` 
      }, { status: 400 });
    }

    const maxBookingDate = new Date(now.getTime() + (offering.advance_booking_days * 24 * 60 * 60 * 1000));
    if (scheduledDate > maxBookingDate) {
      return NextResponse.json({ 
        error: `Cannot book more than ${offering.advance_booking_days} days in advance` 
      }, { status: 400 });
    }

    // Check for conflicting bookings (same mentor, overlapping time)
    const sessionEnd = new Date(scheduledDate.getTime() + (offering.duration_minutes * 60 * 1000));
    const bufferStart = new Date(scheduledDate.getTime() - (offering.buffer_before_minutes * 60 * 1000));
    const bufferEnd = new Date(sessionEnd.getTime() + (offering.buffer_after_minutes * 60 * 1000));

    const { data: conflicts } = await supabase
      .from('mentorship_bookings')
      .select('id')
      .eq('mentor_id', offering.mentor_id)
      .in('status', ['pending', 'confirmed'])
      .gte('scheduled_at', bufferStart.toISOString())
      .lte('scheduled_at', bufferEnd.toISOString());

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json({ error: 'This time slot is not available' }, { status: 400 });
    }

    // Check max bookings per day
    const dayStart = new Date(scheduledDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(scheduledDate);
    dayEnd.setHours(23, 59, 59, 999);

    const { count: dayBookings } = await supabase
      .from('mentorship_bookings')
      .select('*', { count: 'exact', head: true })
      .eq('mentor_id', offering.mentor_id)
      .gte('scheduled_at', dayStart.toISOString())
      .lte('scheduled_at', dayEnd.toISOString())
      .in('status', ['pending', 'confirmed']);

    if (dayBookings >= offering.max_bookings_per_day) {
      return NextResponse.json({ error: 'No more slots available for this day' }, { status: 400 });
    }

    // Create booking
    const bookingData = {
      offering_id,
      mentor_id: offering.mentor_id,
      mentee_id: userId,
      scheduled_at: scheduledDate.toISOString(),
      duration_minutes: offering.duration_minutes,
      timezone: timezone || 'UTC',
      meeting_notes: meeting_notes?.trim() || null,
      amount: offering.price,
      currency: offering.currency,
      payment_status: offering.price > 0 ? 'pending' : 'paid',
      status: offering.price > 0 ? 'pending' : 'confirmed',
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('mentorship_bookings')
      .insert(bookingData)
      .select()
      .single();

    if (error) {
      console.error('Error creating booking:', error);
      return NextResponse.json({ 
        error: 'Failed to create booking',
        details: error.message 
      }, { status: 500 });
    }

    // TODO: Send notification to mentor

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error in bookings POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

