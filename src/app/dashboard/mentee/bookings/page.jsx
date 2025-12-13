"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import RoleProtected from "@/components/RoleProtected";
import { ROLES } from "@/lib/roles";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  Calendar, Clock, User, Video, MessageSquare, Star,
  X, ChevronRight
} from "lucide-react";

function MenteeBookingsContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [feedbackBooking, setFeedbackBooking] = useState(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { supabase } = await import("@/lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();

      const headers = {
        "Content-Type": "application/json",
      };

      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const params = new URLSearchParams({
        role: "mentee",
        status: statusFilter
      });

      const response = await fetch(`/api/bookings?${params}`, { headers });

      if (response.ok) {
        const { data } = await response.json();
        setBookings(data || []);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          status: "cancelled",
          cancellation_reason: "Cancelled by mentee"
        })
      });

      if (response.ok) {
        toast({
          title: "Cancelled",
          description: "Your booking has been cancelled",
        });
        fetchBookings();
      } else {
        const data = await response.json();
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel booking",
        variant: "destructive",
      });
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackBooking || rating === 0) return;

    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`/api/bookings/${feedbackBooking.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          mentee_rating: rating,
          mentee_feedback: feedback
        })
      });

      if (response.ok) {
        toast({
          title: "Thanks!",
          description: "Your feedback has been submitted",
        });
        setFeedbackBooking(null);
        setRating(0);
        setFeedback("");
        fetchBookings();
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-green-100 text-green-800",
      completed: "bg-blue-100 text-blue-800",
      cancelled: "bg-red-100 text-red-800",
      no_show: "bg-gray-100 text-gray-800"
    };
    return styles[status] || styles.pending;
  };

  const upcomingBookings = bookings.filter(b => 
    ["pending", "confirmed"].includes(b.status) && 
    new Date(b.scheduled_at) > new Date()
  );

  const pastBookings = bookings.filter(b => 
    b.status === "completed" || 
    new Date(b.scheduled_at) < new Date()
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
        <p className="text-gray-600 mt-1">View and manage your mentorship session bookings</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{upcomingBookings.length}</div>
            <p className="text-sm text-gray-500">Upcoming</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {bookings.filter(b => b.status === "confirmed").length}
            </div>
            <p className="text-sm text-gray-500">Confirmed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {bookings.filter(b => b.status === "completed").length}
            </div>
            <p className="text-sm text-gray-500">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {bookings.filter(b => b.status === "pending").length}
            </div>
            <p className="text-sm text-gray-500">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
        >
          <option value="all">All Bookings</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading bookings...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && bookings.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
            <p className="text-gray-600 mb-6">Book your first mentorship session</p>
            <Button
              onClick={() => router.push("/dashboard/mentee/book")}
              className="bg-black text-white hover:bg-gray-800"
            >
              Browse Sessions
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Bookings List */}
      {!loading && bookings.length > 0 && (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={getStatusBadge(booking.status)}>
                        {booking.status}
                      </Badge>
                      <span className="text-lg font-medium">
                        {booking.offering?.title || "Session"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(booking.scheduled_at), "MMM d, yyyy")}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {format(new Date(booking.scheduled_at), "h:mm a")} ({booking.duration_minutes} min)
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {booking.mentor?.name || "Mentor"}
                      </div>
                    </div>

                    {booking.meeting_link && booking.status === "confirmed" && (
                      <div className="mt-3 flex items-center gap-2">
                        <Video className="w-4 h-4 text-blue-600" />
                        <a 
                          href={booking.meeting_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Join Meeting
                        </a>
                      </div>
                    )}

                    {booking.mentee_rating && (
                      <div className="mt-3 flex items-center gap-1 text-yellow-500">
                        {"★".repeat(booking.mentee_rating)}
                        {"☆".repeat(5 - booking.mentee_rating)}
                        <span className="text-gray-500 text-sm ml-2">Your rating</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap gap-2">
                    {["pending", "confirmed"].includes(booking.status) && 
                     new Date(booking.scheduled_at) > new Date() && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleCancel(booking.id)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    )}

                    {booking.status === "completed" && !booking.mentee_rating && (
                      <Button
                        size="sm"
                        className="bg-yellow-500 hover:bg-yellow-600 text-white"
                        onClick={() => setFeedbackBooking(booking)}
                      >
                        <Star className="w-4 h-4 mr-1" />
                        Rate Session
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Rate Your Session</h2>
            <p className="text-gray-600 mb-4">
              How was your session with {feedbackBooking.mentor?.name}?
            </p>

            {/* Star Rating */}
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-3xl transition-colors ${
                    star <= rating ? "text-yellow-500" : "text-gray-300"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>

            {/* Feedback Text */}
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share your experience (optional)"
              className="w-full p-3 border rounded-lg mb-4"
              rows={3}
            />

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setFeedbackBooking(null);
                  setRating(0);
                  setFeedback("");
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-black text-white hover:bg-gray-800"
                onClick={handleSubmitFeedback}
                disabled={rating === 0}
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MenteeBookingsPage() {
  return (
    <RoleProtected requiredRole={[ROLES.MENTEE, ROLES.ADMIN]}>
      <MenteeBookingsContent />
    </RoleProtected>
  );
}

