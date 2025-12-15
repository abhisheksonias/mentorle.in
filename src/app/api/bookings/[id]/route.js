import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

// GET - Fetch single booking
export async function GET(request, { params }) {
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

    const { data, error } = await supabase
      .from('mentorship_bookings')
      .select(`
        *,
        offering:offering_id (*)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check access (only mentor or mentee can view)
    if (data.mentor_id !== userId && data.mentee_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get mentor details
    const { data: mentorData } = await supabase
      .from('mentor_data')
      .select('name, profile_url, email')
      .eq('user_id', data.mentor_id)
      .single();

    // Get mentee details - try mentee_data first, then other sources
    let menteeData = null;
    
    // Try mentee_data table
    const { data: menteeRecord } = await supabase
      .from('mentee_data')
      .select('name, profile_url, email')
      .eq('user_id', data.mentee_id)
      .single();
    
    if (menteeRecord?.name) {
      menteeData = menteeRecord;
    } else {
      // Try mentor_data (mentors can also book sessions)
      const { data: mentorAsUser } = await supabase
        .from('mentor_data')
        .select('name, profile_url, email')
        .eq('user_id', data.mentee_id)
        .single();
      
      if (mentorAsUser?.name) {
        menteeData = mentorAsUser;
      } else {
        // Try user_roles table (has name from signup)
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('name')
          .eq('user_id', data.mentee_id)
          .single();
        
        if (userRole?.name) {
          menteeData = { 
            name: userRole.name, 
            profile_url: null, 
            email: menteeRecord?.email || null 
          };
        }
      }
    }
    
    console.log('Mentee lookup for', data.mentee_id, ':', menteeData);

    return NextResponse.json({ 
      data: {
        ...data,
        mentor: mentorData || null,
        mentee: menteeData || { name: 'Mentee', email: null, profile_url: null }
      }
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update booking (confirm, cancel, complete, add feedback)
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

    // Get existing booking
    const { data: booking, error: fetchError } = await supabase
      .from('mentorship_bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const isMentor = booking.mentor_id === userId;
    const isMentee = booking.mentee_id === userId;

    if (!isMentor && !isMentee) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const updateData = { updated_at: new Date().toISOString() };

    // Handle status changes
    if (body.status) {
      const currentStatus = booking.status;
      const newStatus = body.status;

      // Validate status transitions
      const validTransitions = {
        pending: ['confirmed', 'cancelled'],
        confirmed: ['completed', 'cancelled', 'no_show'],
        completed: [], // Final state
        cancelled: [], // Final state
        no_show: [] // Final state
      };

      if (!validTransitions[currentStatus]?.includes(newStatus)) {
        return NextResponse.json({ 
          error: `Cannot change status from ${currentStatus} to ${newStatus}` 
        }, { status: 400 });
      }

      // Check permissions for status change
      if (newStatus === 'confirmed' && !isMentor) {
        return NextResponse.json({ error: 'Only mentor can confirm bookings' }, { status: 403 });
      }

      if (newStatus === 'completed' && !isMentor) {
        return NextResponse.json({ error: 'Only mentor can mark as completed' }, { status: 403 });
      }

      if (newStatus === 'no_show' && !isMentor) {
        return NextResponse.json({ error: 'Only mentor can mark as no-show' }, { status: 403 });
      }

      updateData.status = newStatus;

      if (newStatus === 'cancelled') {
        updateData.cancelled_by = isMentor ? 'mentor' : 'mentee';
        updateData.cancellation_reason = body.cancellation_reason || null;
      }
    }

    // Handle meeting link (mentor only)
    if (body.meeting_link !== undefined && isMentor) {
      updateData.meeting_link = body.meeting_link;
    }

    // Handle mentor notes (mentor only)
    if (body.mentor_notes !== undefined && isMentor) {
      updateData.mentor_notes = body.mentor_notes;
    }

    // Handle rescheduling (mentee or mentor, only for pending/confirmed bookings)
    if (body.scheduled_at && (isMentee || isMentor)) {
      if (!['pending', 'confirmed'].includes(booking.status)) {
        return NextResponse.json({ 
          error: 'Can only reschedule pending or confirmed bookings' 
        }, { status: 400 });
      }

      const newScheduledAt = new Date(body.scheduled_at);
      const now = new Date();

      // Validate new time is in the future
      if (newScheduledAt <= now) {
        return NextResponse.json({ 
          error: 'New scheduled time must be in the future' 
        }, { status: 400 });
      }

      // Get offering to check constraints
      const { data: offering } = await supabase
        .from('mentorship_offerings')
        .select('*')
        .eq('id', booking.offering_id)
        .single();

      if (offering) {
        // Check minimum notice
        const minNoticeTime = new Date(now.getTime() + (offering.min_notice_hours * 60 * 60 * 1000));
        if (newScheduledAt < minNoticeTime) {
          return NextResponse.json({ 
            error: `Rescheduling requires at least ${offering.min_notice_hours} hours notice` 
          }, { status: 400 });
        }

        // Check for conflicts
        const sessionEnd = new Date(newScheduledAt.getTime() + (offering.duration_minutes * 60 * 1000));
        const bufferStart = new Date(newScheduledAt.getTime() - (offering.buffer_before_minutes * 60 * 1000));
        const bufferEnd = new Date(sessionEnd.getTime() + (offering.buffer_after_minutes * 60 * 1000));

        const { data: conflicts } = await supabase
          .from('mentorship_bookings')
          .select('id')
          .eq('mentor_id', booking.mentor_id)
          .neq('id', id) // Exclude current booking
          .in('status', ['pending', 'confirmed'])
          .gte('scheduled_at', bufferStart.toISOString())
          .lte('scheduled_at', bufferEnd.toISOString());

        if (conflicts && conflicts.length > 0) {
          return NextResponse.json({ error: 'This time slot is not available' }, { status: 400 });
        }
      }

      updateData.scheduled_at = newScheduledAt.toISOString();
      updateData.status = 'pending'; // Reset to pending for mentor approval
    }

    // Handle mentee feedback (mentee only, only for completed bookings)
    if (isMentee && booking.status === 'completed') {
      if (body.mentee_rating !== undefined) {
        if (body.mentee_rating < 1 || body.mentee_rating > 5) {
          return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
        }
        updateData.mentee_rating = body.mentee_rating;
      }
      if (body.mentee_feedback !== undefined) {
        updateData.mentee_feedback = body.mentee_feedback;
      }
    }

    const { data, error } = await supabase
      .from('mentorship_bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating booking:', error);
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }

    // TODO: Send notification for status changes

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in booking PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

