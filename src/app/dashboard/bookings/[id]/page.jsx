"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import RoleProtected from "@/components/RoleProtected";
import { ROLES } from "@/lib/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  ArrowLeft, Calendar, Clock, User, Video, IndianRupee,
  Check, X, MessageSquare, Star
} from "lucide-react";

function BookingDetailContent() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [meetingLink, setMeetingLink] = useState("");
  const [mentorNotes, setMentorNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBooking();
  }, [params.id]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const { supabase } = await import("@/lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();

      const headers = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/bookings/${params.id}`, { headers });

      if (response.ok) {
        const { data } = await response.json();
        setBooking(data);
        setMeetingLink(data.meeting_link || "");
        setMentorNotes(data.mentor_notes || "");
      } else {
        toast({
          title: "Error",
          description: "Booking not found",
          variant: "destructive",
        });
        router.push("/dashboard/bookings");
      }
    } catch (error) {
      console.error("Error fetching booking:", error);
      toast({
        title: "Error",
        description: "Failed to load booking",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (updates) => {
    try {
      setSaving(true);
      const { supabase } = await import("@/lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`/api/bookings/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Booking updated",
        });
        fetchBooking();
      } else {
        const data = await response.json();
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update booking",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/bookings")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Bookings
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
          <Badge className={getStatusBadge(booking.status)}>
            {booking.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Session Info */}
        <Card>
          <CardHeader>
            <CardTitle>Session Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Offering</p>
              <p className="font-medium">{booking.offering?.title || "Session"}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(booking.scheduled_at), "MMM d, yyyy")}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Time</p>
                <p className="font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {format(new Date(booking.scheduled_at), "h:mm a")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium">{booking.duration_minutes} minutes</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-medium flex items-center gap-1">
                  <IndianRupee className="w-4 h-4" />
                  {booking.amount > 0 ? booking.amount : "Free"}
                </p>
              </div>
            </div>

            {booking.mentee_rating && (
              <div>
                <p className="text-sm text-gray-500">Rating</p>
                <div className="flex items-center gap-1 text-yellow-500">
                  {"★".repeat(booking.mentee_rating)}
                  {"☆".repeat(5 - booking.mentee_rating)}
                </div>
                {booking.mentee_feedback && (
                  <p className="text-sm text-gray-600 mt-1">{booking.mentee_feedback}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Participant Info */}
        <Card>
          <CardHeader>
            <CardTitle>Participants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              {booking.mentee?.profile_url ? (
                <img 
                  src={booking.mentee.profile_url} 
                  alt={booking.mentee?.name || "Mentee"}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-white font-bold">
                  {booking.mentee?.name?.charAt(0) || booking.mentee?.email?.charAt(0)?.toUpperCase() || "M"}
                </div>
              )}
              <div>
                <p className="font-medium">
                  {booking.mentee?.name || booking.mentee?.email?.split('@')[0] || "Mentee"}
                </p>
                {booking.mentee?.email && (
                  <p className="text-sm text-gray-500">{booking.mentee.email}</p>
                )}
              </div>
            </div>

            {booking.meeting_notes && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Notes from mentee</p>
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  {booking.meeting_notes}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meeting Link */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Meeting Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/..."
              />
              <Button
                size="sm"
                onClick={() => handleUpdate({ meeting_link: meetingLink })}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Link"}
              </Button>
            </div>

            {booking.meeting_link && (
              <a
                href={booking.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:underline"
              >
                <Video className="w-4 h-4" />
                Open Meeting
              </a>
            )}
          </CardContent>
        </Card>

        {/* Mentor Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Private Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Textarea
                value={mentorNotes}
                onChange={(e) => setMentorNotes(e.target.value)}
                placeholder="Add private notes about this session..."
                rows={3}
              />
              <Button
                size="sm"
                onClick={() => handleUpdate({ mentor_notes: mentorNotes })}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Notes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-wrap gap-3">
        {booking.status === "pending" && (
          <>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleUpdate({ status: "confirmed" })}
              disabled={saving}
            >
              <Check className="w-4 h-4 mr-2" />
              Confirm Booking
            </Button>
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => handleUpdate({ status: "cancelled" })}
              disabled={saving}
            >
              <X className="w-4 h-4 mr-2" />
              Decline
            </Button>
          </>
        )}

        {booking.status === "confirmed" && (
          <>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => handleUpdate({ status: "completed" })}
              disabled={saving}
            >
              <Check className="w-4 h-4 mr-2" />
              Mark as Completed
            </Button>
            <Button
              variant="outline"
              onClick={() => handleUpdate({ status: "no_show" })}
              disabled={saving}
            >
              Mark as No-Show
            </Button>
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => handleUpdate({ status: "cancelled" })}
              disabled={saving}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function BookingDetailPage() {
  return (
    <RoleProtected requiredRole={[ROLES.MENTOR, ROLES.ADMIN]}>
      <BookingDetailContent />
    </RoleProtected>
  );
}

