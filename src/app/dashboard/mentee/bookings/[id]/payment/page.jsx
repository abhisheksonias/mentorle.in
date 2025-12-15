"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  Calendar, Clock, IndianRupee, User, CheckCircle, 
  Loader2, ArrowLeft, AlertCircle, CreditCard
} from "lucide-react";
import PaymentDialog from "@/app/dashboard/mentee/resources/components/PaymentDialog";

export default function BookingPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const bookingId = params.id;
  const orderIdFromUrl = searchParams.get('order_id');
  const [orderId, setOrderId] = useState(orderIdFromUrl);

  useEffect(() => {
    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const { supabase } = await import("@/lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const response = await fetch(`/api/bookings/${bookingId}`, {
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch booking");
      }

      const { data } = await response.json();
      setBooking(data);

      // If booking has payment_id but no orderId from URL, use booking's payment_id
      if (data.payment_id && !orderId) {
        setOrderId(data.payment_id);
      }

      // If payment already completed, show success
      if (data.payment_status === 'paid') {
        toast({
          title: "Payment Successful",
          description: "Your booking has been confirmed",
        });
      }
    } catch (error) {
      console.error("Error fetching booking:", error);
      toast({
        title: "Error",
        description: "Failed to load booking details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToPayment = async () => {
    if (!booking) {
      toast({
        title: "Error",
        description: "Booking information not available",
        variant: "destructive",
      });
      return;
    }

    // If no orderId exists, create a payment order first
    let currentOrderId = orderId || booking.payment_id;
    
    if (!currentOrderId && booking.amount > 0 && booking.payment_status === 'pending') {
      try {
        setLoading(true);
        const { supabase } = await import("@/lib/supabase");
        const { data: { session } } = await supabase.auth.getSession();

        const paymentResponse = await fetch("/api/payments/create-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            booking_id: booking.id,
            amount: booking.amount,
            currency: booking.currency || 'INR'
          })
        });

        const paymentResult = await paymentResponse.json();

        if (!paymentResponse.ok) {
          throw new Error(paymentResult.error || "Failed to create payment order");
        }

        currentOrderId = paymentResult.order_id;
        setOrderId(currentOrderId);
        
        // Update URL with order_id
        const newUrl = `${window.location.pathname}?order_id=${currentOrderId}`;
        window.history.replaceState({}, '', newUrl);
      } catch (error) {
        console.error("Error creating payment order:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to initialize payment",
          variant: "destructive",
        });
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }

    if (!currentOrderId) {
      toast({
        title: "Error",
        description: "Payment information not available",
        variant: "destructive",
      });
      return;
    }

    setPaymentData({
      bookingId: booking.id,
      orderId: currentOrderId,
      amount: booking.amount,
      currency: booking.currency || 'INR',
      offering: booking.offering
    });
    setShowPaymentDialog(true);
  };

  const handlePaymentSuccess = async () => {
    setVerifying(true);
    
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();

      // Verify payment
      const verifyResponse = await fetch("/api/payments/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          booking_id: bookingId,
          order_id: orderId
        })
      });

      const verifyResult = await verifyResponse.json();

      if (verifyResult.payment_status === 'paid') {
        // Refresh booking
        await fetchBooking();
        
        toast({
          title: "Payment Successful!",
          description: "Your booking has been confirmed",
        });

        // Redirect to booking details after a moment
        setTimeout(() => {
          router.push(`/dashboard/mentee/bookings/${bookingId}`);
        }, 2000);
      } else {
        toast({
          title: "Payment Verification",
          description: "Please wait while we verify your payment...",
        });
        // Retry after a moment
        setTimeout(() => {
          handlePaymentSuccess();
        }, 3000);
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      toast({
        title: "Verification Error",
        description: "Payment may have succeeded. Please check your bookings.",
      });
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Booking Not Found</h3>
            <p className="text-gray-600 mb-4">The booking you're looking for doesn't exist.</p>
            <Button onClick={() => router.push("/dashboard/mentee/bookings")}>
              Back to Bookings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPaid = booking.payment_status === 'paid';
  const isConfirmed = booking.status === 'confirmed';

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/mentee/bookings")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Bookings
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Booking Summary</h1>
        <p className="text-gray-600 mt-1">Review your booking details and complete payment</p>
      </div>

      {/* Booking Summary Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Booking Details</span>
            {isPaid && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-4 h-4 mr-1" />
                Paid
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Session Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Session</p>
                <p className="font-medium">{booking.offering?.title || "Session"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-medium">
                  {format(new Date(booking.scheduled_at), "EEEE, MMM d, yyyy")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Time</p>
                <p className="font-medium">
                  {format(new Date(booking.scheduled_at), "h:mm a")} ({booking.duration_minutes} min)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Amount</p>
                <p className="font-medium text-lg">
                  {booking.amount > 0 ? `₹${booking.amount}` : "Free"}
                </p>
              </div>
            </div>
          </div>

          {/* Meeting Notes */}
          {booking.meeting_notes && (
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-1">Your Notes</p>
              <p className="text-gray-900">{booking.meeting_notes}</p>
            </div>
          )}

          {/* Payment Status */}
          {isPaid && (
            <div className="pt-4 border-t">
              <div className="bg-green-50 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Payment Successful</p>
                  <p className="text-sm text-green-700">Your booking has been confirmed</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Action */}
      {!isPaid && booking.amount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Complete Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Total Amount</span>
                  <span className="text-2xl font-bold">₹{booking.amount}</span>
                </div>
                <p className="text-xs text-gray-500">
                  Secure payment via Cashfree • SSL Encrypted
                </p>
              </div>

              <Button
                className="w-full bg-black text-white hover:bg-gray-800"
                size="lg"
                onClick={handleProceedToPayment}
                disabled={verifying}
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Proceed to Payment
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Dialog */}
      {showPaymentDialog && paymentData && (
        <PaymentDialog
          isOpen={showPaymentDialog}
          onClose={() => {
            setShowPaymentDialog(false);
            setPaymentData(null);
          }}
          onPaymentSuccess={handlePaymentSuccess}
          subscriptionData={{
            channel: {
              name: booking.offering?.title || "Mentorship Session",
              id: booking.offering_id
            },
            subscriptionId: booking.id,
            amount: booking.amount
          }}
        />
      )}
    </div>
  );
}

