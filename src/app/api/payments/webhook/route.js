import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

// Cashfree payment webhook handler
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Verify webhook signature (implement based on Cashfree docs)
    // For now, we'll process the webhook
    
    const { order_id, order_amount, payment_status, payment_message } = body;

    if (!order_id) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    // Extract booking_id from order_id (format: booking_{booking_id}_{timestamp})
    const bookingIdMatch = order_id.match(/^booking_(.+?)_\d+$/);
    if (!bookingIdMatch) {
      return NextResponse.json({ error: 'Invalid order ID format' }, { status: 400 });
    }

    const bookingId = bookingIdMatch[1];

    const supabase = await createServerSupabaseClient();

    // Update booking payment status
    const updateData = {
      payment_status: payment_status === 'SUCCESS' ? 'paid' : 
                     payment_status === 'FAILED' ? 'failed' : 'pending',
      updated_at: new Date().toISOString()
    };

    // If payment successful, confirm booking
    if (payment_status === 'SUCCESS') {
      updateData.status = 'confirmed';
    }

    const { error } = await supabase
      .from('mentorship_bookings')
      .update(updateData)
      .eq('id', bookingId);

    if (error) {
      console.error('Error updating booking payment status:', error);
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }

    // TODO: Send notification to mentor and mentee

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

