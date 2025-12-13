"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import RoleProtected from "@/components/RoleProtected";
import { ROLES } from "@/lib/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  ArrowLeft, Calendar, Clock, User, Check, X, Video
} from "lucide-react";

function OfferingBookingsContent() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [offering, setOffering] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
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

      // Fetch offering details
      const offeringRes = await fetch(`/api/offerings/${params.id}`, { headers });
      if (offeringRes.ok) {
        const { data } = await offeringRes.json();
        setOffering(data);
      }

      // Fetch bookings for this offering
      const bookingsRes = await fetch(`/api/bookings?role=mentor`, { headers });
      if (bookingsRes.ok) {
        const { data } = await bookingsRes.json();
        // Filter bookings for this offering
        const filtered = data.filter(b => b.offering_id === params.id);
        setBookings(filtered);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
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
        fetchData();
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      toast({
        title: "Error",
        description: "Failed to update booking",
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/offerings")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Offerings
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">
          Bookings for: {offering?.title || "Offering"}
        </h1>
        <p className="text-gray-600 mt-1">
          {bookings.length} total bookings
        </p>
      </div>

      {/* Empty State */}
      {bookings.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
            <p className="text-gray-600">Bookings will appear here when mentees book this offering</p>
          </CardContent>
        </Card>
      )}

      {/* Bookings List */}
      {bookings.length > 0 && (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={getStatusBadge(booking.status)}>
                        {booking.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(booking.scheduled_at), "MMM d, yyyy")}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {format(new Date(booking.scheduled_at), "h:mm a")}
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {booking.mentee?.name || "Mentee"}
                      </div>
                    </div>

                    {booking.meeting_notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                        <p className="text-gray-600">{booking.meeting_notes}</p>
                      </div>
                    )}
                  </div>

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
                          className="text-red-600"
                          onClick={() => handleStatusChange(booking.id, "cancelled")}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Decline
                        </Button>
                      </>
                    )}

                    {booking.status === "confirmed" && (
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleStatusChange(booking.id, "completed")}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Complete
                      </Button>
                    )}
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

export default function OfferingBookingsPage() {
  return (
    <RoleProtected requiredRole={[ROLES.MENTOR, ROLES.ADMIN]}>
      <OfferingBookingsContent />
    </RoleProtected>
  );
}

