import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

// Verify payment status for a booking
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
    const { booking_id, order_id } = body;

    if (!booking_id) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
    }

    // Verify booking belongs to user
    const { data: booking, error: bookingError } = await supabase
      .from('mentorship_bookings')
      .select('*')
      .eq('id', booking_id)
      .eq('mentee_id', userId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // If order_id provided, verify with Cashfree
    if (order_id) {
      // Using exact variable names from .env file
      const cashfreeAppId = process.env.CASHFREE_APP_ID;
      const cashfreeSecretKey = process.env.CASHFREE_SECRET_KEY;
      const cashfreeEnvironment = process.env.CASHFREE_ENVIRONMENT || 'PRODUCTION';
      const cashfreeApiUrl = process.env.CASHFREE_API_URL;

      // Use CASHFREE_API_URL if provided, otherwise construct from environment
      let baseUrl;
      if (cashfreeApiUrl) {
        // Remove /pg suffix if present, we'll add it in the fetch call
        baseUrl = cashfreeApiUrl.replace(/\/pg$/, '');
      } else {
        // Fallback: construct URL from environment
        const isProduction = cashfreeEnvironment.toUpperCase() === 'PRODUCTION';
        baseUrl = isProduction 
          ? 'https://api.cashfree.com' 
          : 'https://sandbox.cashfree.com';
      }

      try {
        const cashfreeResponse = await fetch(`${baseUrl}/pg/orders/${order_id}`, {
          method: 'GET',
          headers: {
            'x-client-id': cashfreeAppId,
            'x-client-secret': cashfreeSecretKey,
            'x-api-version': '2023-08-01'
          }
        });

        const cashfreeData = await cashfreeResponse.json();

        if (cashfreeResponse.ok && cashfreeData.order_status === 'PAID') {
          // Update booking if payment confirmed
          if (booking.payment_status !== 'paid') {
            await supabase
              .from('mentorship_bookings')
              .update({
                payment_status: 'paid',
                status: 'confirmed',
                updated_at: new Date().toISOString()
              })
              .eq('id', booking_id);
          }

          return NextResponse.json({
            payment_status: 'paid',
            booking_status: 'confirmed',
            verified: true
          });
        }
      } catch (error) {
        console.error('Error verifying with Cashfree:', error);
      }
    }

    // Return current booking status
    return NextResponse.json({
      payment_status: booking.payment_status,
      booking_status: booking.status,
      verified: false
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

