import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { getUserRole } from '@/lib/auth';
import { ROLES } from '@/lib/roles';

// GET - Fetch feedback (with filters)
export async function GET(request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const feedbackType = searchParams.get('type'); // event, booking, article
    const referenceId = searchParams.get('reference_id');
    const mentorId = searchParams.get('mentor_id'); // For mentor inbox - get all feedback for their content
    const status = searchParams.get('status') || 'active';

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
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by type
    if (feedbackType) {
      query = query.eq('feedback_type', feedbackType);
    }

    // Filter by reference ID
    if (referenceId) {
      query = query.eq('reference_id', referenceId);
    }

    // Filter by status
    if (status) {
      query = query.eq('status', status);
    }

    // If mentor_id provided, get feedback for their content
    if (mentorId) {
      // For bookings: get feedback where booking's mentor_id matches
      // For articles: get feedback where article's author_id matches
      // For events: get feedback where event's creator_id matches
      
      // This requires a more complex query - we'll handle it after fetching
      const { data: allFeedback, error } = await query;
      
      if (error) {
        console.error('Error fetching feedback:', error);
        return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
      }

      // Filter feedback based on mentor ownership
      const filteredFeedback = await Promise.all(
        allFeedback.map(async (fb) => {
          let isMentorContent = false;

          if (fb.feedback_type === 'booking') {
            const { data: booking } = await supabase
              .from('mentorship_bookings')
              .select('mentor_id')
              .eq('id', fb.reference_id)
              .single();
            isMentorContent = booking?.mentor_id === mentorId;
          } else if (fb.feedback_type === 'article') {
            const { data: article } = await supabase
              .from('posts')
              .select('author_id')
              .eq('id', fb.reference_id)
              .single();
            isMentorContent = article?.author_id === mentorId;
          } else if (fb.feedback_type === 'event') {
            const { data: event } = await supabase
              .from('events')
              .select('created_by')
              .eq('id', fb.reference_id)
              .single();
            isMentorContent = event?.created_by === mentorId;
          }

          return isMentorContent ? fb : null;
        })
      );

      let mentorFeedback = filteredFeedback.filter(fb => fb !== null);

      // Also get booking ratings from bookings table (legacy ratings)
      // These are ratings that were given directly on bookings before the feedback system
      const { data: bookingRatings } = await supabase
        .from('mentorship_bookings')
        .select('id, mentee_id, mentee_rating, mentee_feedback, created_at, updated_at, offering_id')
        .eq('mentor_id', mentorId)
        .not('mentee_rating', 'is', null)
        .eq('status', 'completed');

      // Convert booking ratings to feedback format
      if (bookingRatings && bookingRatings.length > 0) {
        // Get feedback IDs that already exist for these bookings
        const bookingIds = bookingRatings.map(b => b.id);
        const { data: existingFeedback } = await supabase
          .from('feedback')
          .select('reference_id')
          .eq('feedback_type', 'booking')
          .in('reference_id', bookingIds);

        const existingFeedbackIds = new Set(existingFeedback?.map(f => f.reference_id) || []);

        // Add booking ratings that don't have feedback entries yet
        const legacyRatings = bookingRatings
          .filter(b => !existingFeedbackIds.has(b.id))
          .map(booking => ({
            id: `legacy-${booking.id}`,
            user_id: booking.mentee_id,
            feedback_type: 'booking',
            reference_id: booking.id,
            rating: booking.mentee_rating,
            comment: booking.mentee_feedback,
            status: 'active',
            mentor_response: null,
            mentor_response_at: null,
            responded_by: null,
            created_at: booking.updated_at || booking.created_at,
            updated_at: booking.updated_at || booking.created_at
          }));

        mentorFeedback = [...mentorFeedback, ...legacyRatings];
      }

      // Enrich with user data and offering info
      const enrichedData = await Promise.all(mentorFeedback.map(async (fb) => {
        // Try mentee_data first
        const { data: userData } = await supabase
          .from('mentee_data')
          .select('name, profile_url, email')
          .eq('user_id', fb.user_id)
          .single();

        let user = { name: 'User', profile_url: null };
        
        if (userData?.name) {
          user = { name: userData.name, profile_url: userData.profile_url || null };
        } else {
          // Try mentor_data
          const { data: mentorData } = await supabase
            .from('mentor_data')
            .select('name, profile_url, email')
            .eq('user_id', fb.user_id)
            .single();
          
          if (mentorData?.name) {
            user = { name: mentorData.name, profile_url: mentorData.profile_url || null };
          } else {
            // Fallback: try user_roles table (has name from signup)
            const { data: userRole } = await supabase
              .from('user_roles')
              .select('name')
              .eq('user_id', fb.user_id)
              .single();
            
            if (userRole?.name) {
              user = { 
                name: userRole.name, 
                profile_url: userData?.profile_url || mentorData?.profile_url || null 
              };
            } else {
              // Last resort: use email from user data tables
              const email = userData?.email || mentorData?.email;
              if (email) {
                user = { 
                  name: email.split('@')[0],
                  profile_url: userData?.profile_url || mentorData?.profile_url || null
                };
              }
            }
          }
        }
        
        console.log(`User lookup for ${fb.user_id}:`, user);

        // For booking feedback, get offering info
        let offering = null;
        if (fb.feedback_type === 'booking') {
          let offeringId = fb.offering_id;
          if (!offeringId) {
            // Get offering_id from booking
            const { data: booking } = await supabase
              .from('mentorship_bookings')
              .select('offering_id')
              .eq('id', fb.reference_id)
              .single();
            offeringId = booking?.offering_id;
          }
          
          if (offeringId) {
            const { data: offeringData } = await supabase
              .from('mentorship_offerings')
              .select('id, title')
              .eq('id', offeringId)
              .single();
            offering = offeringData;
          }
        }

        return {
          ...fb,
          user,
          offering
        };
      }));

      return NextResponse.json({ data: enrichedData });
    }

    // Regular query (not mentor inbox)
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching feedback:', error);
      return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
    }

    // Enrich with user data
    const enrichedData = await Promise.all(data.map(async (fb) => {
      const { data: userData } = await supabase
        .from('mentee_data')
        .select('name, profile_url')
        .eq('user_id', fb.user_id)
        .single();

      if (!userData) {
        const { data: mentorData } = await supabase
          .from('mentor_data')
          .select('name, profile_url')
          .eq('user_id', fb.user_id)
          .single();
        return {
          ...fb,
          user: mentorData || { name: 'User', profile_url: null }
        };
      }

      return {
        ...fb,
        user: userData || { name: 'User', profile_url: null }
      };
    }));

    return NextResponse.json({ data: enrichedData });
  } catch (error) {
    console.error('Error in feedback GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new feedback
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
    const { feedback_type, reference_id, rating, comment } = body;

    // Validate required fields
    if (!feedback_type || !['event', 'booking', 'article'].includes(feedback_type)) {
      return NextResponse.json({ error: 'Invalid feedback type' }, { status: 400 });
    }

    if (!reference_id) {
      return NextResponse.json({ error: 'Reference ID is required' }, { status: 400 });
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Check if reference exists
    let referenceExists = false;
    if (feedback_type === 'booking') {
      const { data } = await supabase
        .from('mentorship_bookings')
        .select('id')
        .eq('id', reference_id)
        .single();
      referenceExists = !!data;
    } else if (feedback_type === 'article') {
      const { data } = await supabase
        .from('posts')
        .select('id')
        .eq('id', reference_id)
        .single();
      referenceExists = !!data;
    } else if (feedback_type === 'event') {
      const { data } = await supabase
        .from('events')
        .select('id')
        .eq('id', reference_id)
        .single();
      referenceExists = !!data;
    }

    if (!referenceExists) {
      return NextResponse.json({ error: 'Reference item not found' }, { status: 404 });
    }

    // Create feedback
    const feedbackData = {
      user_id: userId,
      feedback_type,
      reference_id,
      rating: parseInt(rating),
      comment: comment?.trim() || null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('feedback')
      .insert(feedbackData)
      .select()
      .single();

    if (error) {
      console.error('Error creating feedback:', error);
      if (error.message.includes('already provided feedback')) {
        return NextResponse.json({ 
          error: 'You have already provided feedback for this item',
          details: error.message 
        }, { status: 400 });
      }
      return NextResponse.json({ 
        error: 'Failed to create feedback',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error in feedback POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

