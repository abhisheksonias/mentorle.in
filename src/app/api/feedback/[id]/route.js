import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { getUserRole } from '@/lib/auth';
import { ROLES } from '@/lib/roles';

// PATCH - Update feedback (mainly for mentor responses)
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

    // Get existing feedback
    const { data: existingFeedback, error: fetchError } = await supabase
      .from('feedback')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingFeedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }

    const body = await request.json();
    const updateData = { updated_at: new Date().toISOString() };

    // Check if user is mentor and can respond
    const userRole = await getUserRole(userId, supabase);
    const isMentor = userRole === ROLES.MENTOR || userRole === ROLES.ADMIN;

    // Only mentors can add responses
    if (body.mentor_response !== undefined) {
      if (!isMentor) {
        return NextResponse.json({ error: 'Only mentors can respond to feedback' }, { status: 403 });
      }

      // Verify mentor owns the content
      let ownsContent = false;
      
      if (existingFeedback.feedback_type === 'booking') {
        const { data: booking } = await supabase
          .from('mentorship_bookings')
          .select('mentor_id')
          .eq('id', existingFeedback.reference_id)
          .single();
        ownsContent = booking?.mentor_id === userId;
      } else if (existingFeedback.feedback_type === 'article') {
        const { data: article } = await supabase
          .from('posts')
          .select('author_id')
          .eq('id', existingFeedback.reference_id)
          .single();
        ownsContent = article?.author_id === userId;
      } else if (existingFeedback.feedback_type === 'event') {
        const { data: event } = await supabase
          .from('events')
          .select('created_by')
          .eq('id', existingFeedback.reference_id)
          .single();
        ownsContent = event?.created_by === userId;
      }

      if (!ownsContent && userRole !== ROLES.ADMIN) {
        return NextResponse.json({ error: 'You can only respond to feedback on your own content' }, { status: 403 });
      }

      updateData.mentor_response = body.mentor_response?.trim() || null;
      updateData.mentor_response_at = body.mentor_response ? new Date().toISOString() : null;
      updateData.responded_by = body.mentor_response ? userId : null;
    }

    // Only original user can update their own feedback (rating/comment)
    if (body.rating !== undefined || body.comment !== undefined) {
      if (existingFeedback.user_id !== userId) {
        return NextResponse.json({ error: 'You can only update your own feedback' }, { status: 403 });
      }

      if (body.rating !== undefined) {
        if (body.rating < 1 || body.rating > 5) {
          return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
        }
        updateData.rating = parseInt(body.rating);
      }

      if (body.comment !== undefined) {
        updateData.comment = body.comment?.trim() || null;
      }
    }

    // Status updates (admin/mentor only)
    if (body.status !== undefined && isMentor) {
      updateData.status = body.status;
    }

    const { data, error } = await supabase
      .from('feedback')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating feedback:', error);
      return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in feedback PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete feedback (only by original user or admin)
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

    // Get existing feedback
    const { data: existingFeedback } = await supabase
      .from('feedback')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existingFeedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }

    // Check permissions
    const userRole = await getUserRole(userId, supabase);
    if (existingFeedback.user_id !== userId && userRole !== ROLES.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete by setting status to archived
    const { error } = await supabase
      .from('feedback')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error deleting feedback:', error);
      return NextResponse.json({ error: 'Failed to delete feedback' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in feedback DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

