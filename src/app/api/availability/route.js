import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

// GET - Fetch mentor availability
export async function GET(request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const mentorId = searchParams.get('mentor_id');

    // Get user for authentication check
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

    // If mentor_id provided, fetch that mentor's availability (public)
    // Otherwise, fetch current user's availability (requires auth)
    const targetMentorId = mentorId || userId;

    if (!targetMentorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('mentor_availability')
      .select('*')
      .eq('mentor_id', targetMentorId)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching availability:', error);
      return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in availability GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Save/Update mentor availability (replaces all slots)
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

    const body = await request.json();
    const { slots, timezone = 'UTC' } = body;

    if (!Array.isArray(slots)) {
      return NextResponse.json({ error: 'Slots must be an array' }, { status: 400 });
    }

    // Validate each slot
    for (const slot of slots) {
      if (slot.day_of_week < 0 || slot.day_of_week > 6) {
        return NextResponse.json({ error: 'Invalid day_of_week' }, { status: 400 });
      }
      if (!slot.start_time || !slot.end_time) {
        return NextResponse.json({ error: 'start_time and end_time are required' }, { status: 400 });
      }
    }

    // Delete existing availability for this mentor
    const { error: deleteError } = await supabase
      .from('mentor_availability')
      .delete()
      .eq('mentor_id', userId);

    if (deleteError) {
      console.error('Error deleting old availability:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to update availability', 
        details: deleteError.message,
        hint: deleteError.hint || 'Make sure the mentor_availability table exists'
      }, { status: 500 });
    }

    // Insert new slots if any
    if (slots.length > 0) {
      const slotsToInsert = slots.map(slot => ({
        mentor_id: userId,
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
        end_time: slot.end_time,
        timezone: timezone,
        updated_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('mentor_availability')
        .insert(slotsToInsert);

      if (insertError) {
        console.error('Error inserting availability:', insertError);
        return NextResponse.json({ 
          error: 'Failed to save availability', 
          details: insertError.message,
          hint: insertError.hint || 'Check RLS policies or table constraints'
        }, { status: 500 });
      }
    }

    // Fetch and return updated availability
    const { data, error } = await supabase
      .from('mentor_availability')
      .select('*')
      .eq('mentor_id', userId)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching updated availability:', error);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Availability updated',
      data 
    });
  } catch (error) {
    console.error('Error in availability POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

