import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { getUserRole } from '@/lib/auth';
import { ROLES } from '@/lib/roles';

// GET - Fetch single offering
export async function GET(request, { params }) {
  try {
    const supabase = await createServerSupabaseClient();
    const { id } = await params;

    const { data, error } = await supabase
      .from('mentorship_offerings')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Offering not found' }, { status: 404 });
    }

    // Get mentor details
    const { data: mentorData } = await supabase
      .from('mentor_data')
      .select('name, profile_url, current_role, expertise_area, bio')
      .eq('user_id', data.mentor_id)
      .single();

    return NextResponse.json({ 
      data: {
        ...data,
        mentor: mentorData || null
      }
    });
  } catch (error) {
    console.error('Error fetching offering:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update offering
export async function PATCH(request, { params }) {
  try {
    const supabase = await createServerSupabaseClient();
    const { id } = await params;

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

    // Check if offering exists and belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from('mentorship_offerings')
      .select('mentor_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Offering not found' }, { status: 404 });
    }

    // Check ownership (or admin)
    const userRole = await getUserRole(userId, supabase);
    if (existing.mentor_id !== userId && userRole !== ROLES.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const updateData = { updated_at: new Date().toISOString() };

    // Update allowed fields
    const allowedFields = [
      'title', 'description', 'category', 'price', 'currency',
      'duration_minutes', 'use_profile_availability', 'custom_availability',
      'buffer_before_minutes', 'buffer_after_minutes', 'max_bookings_per_day',
      'advance_booking_days', 'min_notice_hours', 'cancellation_policy',
      'preparation_notes', 'status', 'featured'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    const { data, error } = await supabase
      .from('mentorship_offerings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating offering:', error);
      return NextResponse.json({ error: 'Failed to update offering' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in offering PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete offering
export async function DELETE(request, { params }) {
  try {
    const supabase = await createServerSupabaseClient();
    const { id } = await params;

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

    // Check ownership
    const { data: existing } = await supabase
      .from('mentorship_offerings')
      .select('mentor_id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Offering not found' }, { status: 404 });
    }

    const userRole = await getUserRole(userId, supabase);
    if (existing.mentor_id !== userId && userRole !== ROLES.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check for active bookings
    const { count } = await supabase
      .from('mentorship_bookings')
      .select('*', { count: 'exact', head: true })
      .eq('offering_id', id)
      .in('status', ['pending', 'confirmed']);

    if (count > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete offering with active bookings',
        activeBookings: count 
      }, { status: 400 });
    }

    const { error } = await supabase
      .from('mentorship_offerings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting offering:', error);
      return NextResponse.json({ error: 'Failed to delete offering' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in offering DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

