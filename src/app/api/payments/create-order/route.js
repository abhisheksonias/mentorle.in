import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

// Create Cashfree payment order for booking
export async function POST(request) {
  try {
    let supabase = await createServerSupabaseClient();
    
    // Get authenticated user (mentee)
    let userId = null;
    let accessToken = null;
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      userId = session.user.id;
      accessToken = session.access_token;
    } else {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7);
      }

      // When using a bearer token without a Next.js session, rebuild the client with the token
      if (accessToken) {
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

        // Try to get user; if network issues, decode from JWT as fallback
        try {
          const { data: { user }, error } = await supabase.auth.getUser(accessToken);
          if (user && !error) {
            userId = user.id;
          }
        } catch (err) {
          try {
            const [, payload] = accessToken.split('.');
            const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
            if (decoded?.sub) {
              userId = decoded.sub;
            }
          } catch (decodeErr) {
            console.warn('Unable to decode access token for user id in payments create-order', decodeErr);
          }
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { booking_id, amount, currency = 'INR' } = body;

    if (!booking_id || !amount) {
      return NextResponse.json({ 
        error: 'Booking ID and amount are required' 
      }, { status: 400 });
    }

    // Verify booking belongs to user
    const { data: booking, error: bookingError } = await supabase
      .from('mentorship_bookings')
      .select('*, offering:offering_id (title, mentor_id)')
      .eq('id', booking_id)
      .eq('mentee_id', userId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.payment_status === 'paid') {
      return NextResponse.json({ error: 'Booking already paid' }, { status: 400 });
    }

    // Get user email for payment (from profile tables; avoid extra auth calls)
    let userEmail = null;

    // Get user name
    let userName = 'User';
    const { data: menteeData } = await supabase
      .from('mentee_data')
      .select('name, email')
      .eq('user_id', userId)
      .single();
    
    if (menteeData?.name) {
      userName = menteeData.name;
    } else {
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('name')
        .eq('user_id', userId)
        .single();
      if (userRole?.name) userName = userRole.name;
    }

    // Create Cashfree payment order
    // Using exact variable names from .env file
    const cashfreeAppId = process.env.CASHFREE_APP_ID;
    const cashfreeSecretKey = process.env.CASHFREE_SECRET_KEY;
    const cashfreeEnvironment = process.env.CASHFREE_ENVIRONMENT || 'PRODUCTION';
    const cashfreeApiUrl = process.env.CASHFREE_API_URL;

    if (!cashfreeAppId || !cashfreeSecretKey) {
      console.error('Cashfree credentials not configured');
      console.error('Missing CASHFREE_APP_ID or CASHFREE_SECRET_KEY in environment variables');
      return NextResponse.json({ 
        error: 'Payment gateway not configured',
        details: 'Please check your .env file has CASHFREE_APP_ID and CASHFREE_SECRET_KEY variables'
      }, { status: 500 });
    }

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

    // Generate unique order ID
    const orderId = `booking_${booking_id}_${Date.now()}`;
    
    // Build base app URL and enforce https for Cashfree requirement
    const rawAppUrl = process.env.CASHFREE_RETURN_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
    const appUrl = rawAppUrl.startsWith('http://') 
      ? rawAppUrl.replace('http://', 'https://')
      : rawAppUrl;

    // Create order payload
    const orderPayload = {
      order_id: orderId,
      order_amount: parseFloat(amount),
      order_currency: currency,
      order_note: `Booking payment for ${booking.offering?.title || 'Session'}`,
      customer_details: {
        customer_id: userId,
        customer_name: userName,
        customer_email: userEmail || 'user@example.com',
        customer_phone: menteeData?.phone || '9999999999'
      },
      order_meta: {
        return_url: `${appUrl}/dashboard/mentee/bookings/payment/callback?booking_id=${booking_id}`,
        notify_url: `${appUrl}/api/payments/webhook`
      }
    };

    // Create order via Cashfree API
    const cashfreeResponse = await fetch(`${baseUrl}/pg/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': cashfreeAppId,
        'x-client-secret': cashfreeSecretKey,
        'x-api-version': '2023-08-01'
      },
      body: JSON.stringify(orderPayload)
    });

    const cashfreeData = await cashfreeResponse.json();

    if (!cashfreeResponse.ok) {
      console.error('Cashfree API error:', cashfreeData);
      
      // Roll back booking if payment order creation failed
      await supabase
        .from('mentorship_bookings')
        .delete()
        .eq('id', booking_id)
        .eq('payment_status', 'pending');

      return NextResponse.json({ 
        error: 'Failed to create payment order',
        details: cashfreeData.message || 'Payment gateway error'
      }, { status: 500 });
    }

    // Update booking with payment order ID
    await supabase
      .from('mentorship_bookings')
      .update({ 
        payment_id: orderId,
        updated_at: new Date().toISOString()
      })
      .eq('id', booking_id);

    return NextResponse.json({
      order_id: orderId,
      payment_session_id: cashfreeData.payment_session_id,
      payment_url: cashfreeData.payment_link || null,
      order_amount: amount,
      order_currency: currency
    });
  } catch (error) {
    console.error('Error creating payment order:', error);
    // Roll back booking on any unexpected failure
    if (body?.booking_id) {
      await supabase
        .from('mentorship_bookings')
        .delete()
        .eq('id', body.booking_id)
        .eq('payment_status', 'pending');
    }

    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

