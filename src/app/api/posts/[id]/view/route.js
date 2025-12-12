import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

// POST - Track a post view
export async function POST(request, { params }) {
  try {
    const supabase = await createServerSupabaseClient();
    const { id } = await params;
    
    // Get viewer info
    const { data: { session } } = await supabase.auth.getSession();
    const viewerId = session?.user?.id || null;
    
    // Get IP address from headers
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';

    // Call the function to increment view count
    const { error } = await supabase.rpc('increment_post_view_count', {
      p_post_id: id,
      p_viewer_id: viewerId,
      p_ip_address: ipAddress
    });

    if (error) {
      console.error('Error tracking view:', error);
      return NextResponse.json(
        { error: 'Failed to track view' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in view tracking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

