"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import RoleProtected from "@/components/RoleProtected";
import { ROLES } from "@/lib/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  Calendar, Clock, User, Check, X, Video, MessageSquare,
  ChevronRight, AlertCircle
} from "lucide-react";

function BookingsContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("upcoming"); // upcoming, all

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, viewMode]);

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
        role: "mentor",
        status: statusFilter,
        upcoming: viewMode === "upcoming" ? "true" : "false"
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

  const handleStatusChange = async (id, newStatus, reason = null) => {
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();

      const body = { status: newStatus };
      if (reason) body.cancellation_reason = reason;

      const response = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Booking ${newStatus}`,
        });
        fetchBookings();
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
    }
  };

  const handleAddMeetingLink = async (id) => {
    const link = prompt("Enter meeting link (Google Meet, Zoom, etc.):");
    if (!link) return;

    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ meeting_link: link })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Meeting link added",
        });
        fetchBookings();
      }
    } catch (error) {
      console.error("Error adding meeting link:", error);
      toast({
        title: "Error",
        description: "Failed to add meeting link",
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

  const needsAction = bookings.filter(b => b.status === "pending");

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
        <p className="text-gray-600 mt-1">Manage your mentorship session bookings</p>
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
            <div className="text-2xl font-bold text-yellow-600">{needsAction.length}</div>
            <p className="text-sm text-gray-500">Needs Action</p>
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
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex gap-2">
          <Button
            variant={viewMode === "upcoming" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("upcoming")}
          >
            Upcoming
          </Button>
          <Button
            variant={viewMode === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("all")}
          >
            All
          </Button>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No Show</option>
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
            <p className="text-gray-600">Bookings will appear here when mentees book your offerings</p>
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
                        {booking.mentee?.name || "Mentee"}
                      </div>
                    </div>

                    {booking.meeting_notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                        <p className="font-medium text-gray-700 mb-1">Notes from mentee:</p>
                        <p className="text-gray-600">{booking.meeting_notes}</p>
                      </div>
                    )}

                    {booking.meeting_link && (
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
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap gap-2">
                    {booking.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleStatusChange(booking.id, "confirmed")}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => {
                            const reason = prompt("Reason for declining (optional):");
                            handleStatusChange(booking.id, "cancelled", reason);
                          }}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Decline
                        </Button>
                      </>
                    )}

                    {booking.status === "confirmed" && (
                      <>
                        {!booking.meeting_link && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddMeetingLink(booking.id)}
                          >
                            <Video className="w-4 h-4 mr-1" />
                            Add Link
                          </Button>
                        )}
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleStatusChange(booking.id, "completed")}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Mark Complete
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-gray-600"
                          onClick={() => handleStatusChange(booking.id, "no_show")}
                        >
                          No Show
                        </Button>
                      </>
                    )}

                    {booking.status === "completed" && booking.mentee_rating && (
                      <div className="flex items-center gap-1 text-yellow-500">
                        {"★".repeat(booking.mentee_rating)}
                        {"☆".repeat(5 - booking.mentee_rating)}
                      </div>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BookingsPage() {
  return (
    <RoleProtected requiredRole={[ROLES.MENTOR, ROLES.ADMIN]}>
      <BookingsContent />
    </RoleProtected>
  );
}

