"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Calendar, Clock, MapPin, Users, Video, BookOpen, Award, Play, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, isAfter, isBefore, parseISO } from "date-fns";

export default function RegisteredEventsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all"); // all, upcoming, ongoing, completed

  useEffect(() => {
    fetchRegisteredEvents();
  }, []);

  const fetchRegisteredEvents = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      // Get all registrations for the current user
      const { data: registrations, error: regError } = await supabase
        .from("event_participants")
        .select("event_id, registered_at, attendance_status, completion_status")
        .eq("user_id", session.user.id);

      if (regError) throw regError;

      if (!registrations || registrations.length === 0) {
        setRegisteredEvents([]);
        setLoading(false);
        return;
      }

      const eventIds = registrations.map(r => r.event_id);

      // Get event details
      const { data: events, error: eventsError } = await supabase
        .from("events_programs")
        .select("*")
        .in("id", eventIds)
        .order("start_date", { ascending: true });

      if (eventsError) throw eventsError;

      // Merge registration data with event data
      const enrichedEvents = (events || []).map(event => {
        const registration = registrations.find(r => r.event_id === event.id);
        const progressData = registration?.progress_data 
          ? (typeof registration.progress_data === 'string' 
              ? JSON.parse(registration.progress_data) 
              : registration.progress_data)
          : null;
        
        return {
          ...event,
          registration_date: registration?.registered_at,
          attendance_status: registration?.attendance_status || "registered",
          completion_status: registration?.completion_status || "in_progress",
          progress_percent: progressData?.progress_percent || 0
        };
      });

      setRegisteredEvents(enrichedEvents);
    } catch (error) {
      console.error("Error fetching registered events:", error);
      toast({
        title: "Error",
        description: "Failed to load registered events",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getEventStatus = (event) => {
    if (!event.start_date) return "upcoming";
    const now = new Date();
    const startDate = parseISO(event.start_date);
    const endDate = event.end_date ? parseISO(event.end_date) : null;

    if (event.is_cancelled) return "cancelled";
    if (isAfter(startDate, now)) return "upcoming";
    if (isBefore(startDate, now) && (!endDate || isAfter(endDate, now))) return "ongoing";
    if (endDate ? isBefore(endDate, now) : isBefore(startDate, now)) return "completed";
    return "upcoming";
  };

  const getEventType = (event) => {
    // Map event_type to categories
    // Check title for hackathon keyword first
    const titleLower = (event.title || "").toLowerCase();
    if (titleLower.includes("hackathon") || titleLower.includes("hack")) {
      return "hackathon";
    }
    
    const typeMap = {
      bootcamp: "course",
      workshop: "event",
      guest_session: "event",
      event: "event",
      hackathon: "hackathon",
      course: "course",
      other: "event"
    };
    return typeMap[event.event_type] || "event";
  };

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: { label: "Upcoming", className: "bg-blue-100 text-blue-800 border-blue-200" },
      ongoing: { label: "Ongoing", className: "bg-green-100 text-green-800 border-green-200" },
      completed: { label: "Completed", className: "bg-gray-100 text-gray-800 border-gray-200" },
      cancelled: { label: "Cancelled", className: "bg-red-100 text-red-800 border-red-200" }
    };
    return badges[status] || badges.upcoming;
  };

  const getTypeBadge = (type) => {
    const badges = {
      event: { label: "Event", icon: "🎉", className: "bg-orange-100 text-orange-800 border-orange-200" },
      hackathon: { label: "Hackathon", icon: "💻", className: "bg-purple-100 text-purple-800 border-purple-200" },
      course: { label: "Course", icon: "📚", className: "bg-indigo-100 text-indigo-800 border-indigo-200" }
    };
    return badges[type] || badges.event;
  };

  const handleJoinSession = (event) => {
    if (event.registration_link) {
      window.open(event.registration_link, "_blank");
    } else if (event.meeting_link) {
      window.open(event.meeting_link, "_blank");
    } else {
      toast({
        title: "No Link Available",
        description: "The event organizer hasn't provided a join link yet.",
        variant: "destructive"
      });
    }
  };

  const handleResumeCourse = (event) => {
    // Navigate to course detail page with progress tracking
    router.push(`/dashboard/mentee/registered-events/${event.id}`);
  };

  const filteredEvents = registeredEvents.filter(event => {
    if (filterStatus === "all") return true;
    const status = getEventStatus(event);
    return status === filterStatus;
  });

  const stats = {
    total: registeredEvents.length,
    upcoming: registeredEvents.filter(e => getEventStatus(e) === "upcoming").length,
    ongoing: registeredEvents.filter(e => getEventStatus(e) === "ongoing").length,
    completed: registeredEvents.filter(e => getEventStatus(e) === "completed").length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your registered events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-4 py-8 mt-10">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-black mb-2">My Registered Events</h1>
          <p className="text-gray-600">View and manage all events, hackathons, and courses you've registered for</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 border-gray-200">
            <div className="text-2xl font-bold text-black">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Registered</div>
          </Card>
          <Card className="p-4 border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{stats.upcoming}</div>
            <div className="text-sm text-gray-600">Upcoming</div>
          </Card>
          <Card className="p-4 border-gray-200">
            <div className="text-2xl font-bold text-green-600">{stats.ongoing}</div>
            <div className="text-sm text-gray-600">Ongoing</div>
          </Card>
          <Card className="p-4 border-gray-200">
            <div className="text-2xl font-bold text-gray-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {["all", "upcoming", "ongoing", "completed"].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              onClick={() => setFilterStatus(status)}
              className={filterStatus === status ? "bg-black text-white" : ""}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        {/* Events List */}
        {filteredEvents.length === 0 ? (
          <Card className="p-12 text-center border-gray-200">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Events Found</h3>
            <p className="text-gray-500 mb-4">
              {filterStatus === "all"
                ? "You haven't registered for any events yet."
                : `You don't have any ${filterStatus} events.`}
            </p>
            <Button onClick={() => router.push("/dashboard/mentee/events")} className="bg-black text-white">
              Browse Events
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const status = getEventStatus(event);
              const type = getEventType(event);
              const statusBadge = getStatusBadge(status);
              const typeBadge = getTypeBadge(type);

              return (
                <Card key={event.id} className="overflow-hidden border-gray-200 hover:shadow-lg transition-shadow">
                  {/* Banner */}
                  {event.banner_image_url && (
                    <div className="h-48 overflow-hidden bg-gray-100">
                      <img
                        src={event.banner_image_url}
                        alt={event.title}
                        className="w-full h-full object-cover"
                        onError={(e) => (e.target.style.display = "none")}
                      />
                    </div>
                  )}

                  <div className="p-6">
                    {/* Badges */}
                    <div className="flex gap-2 mb-4 flex-wrap">
                      <Badge variant="outline" className={statusBadge.className}>{statusBadge.label}</Badge>
                      <Badge variant="outline" className={typeBadge.className}>
                        {typeBadge.icon} {typeBadge.label}
                      </Badge>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-black mb-2 line-clamp-2">{event.title}</h3>

                    {/* Date & Time */}
                    {event.start_date && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Calendar className="w-4 h-4" />
                        <span>{format(parseISO(event.start_date), "MMM dd, yyyy 'at' h:mm a")}</span>
                      </div>
                    )}

                    {/* Location */}
                    {event.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                    )}

                    {/* Course Progress (if course) */}
                    {type === "course" && (
                      <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-indigo-900">Progress</span>
                          <span className="text-sm font-bold text-indigo-700">
                            {event.completion_status === "completed" ? "100%" : "In Progress"}
                          </span>
                        </div>
                        {event.completion_status !== "completed" && (
                          <div className="w-full bg-indigo-200 rounded-full h-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full"
                              style={{ width: "60%" }}
                            ></div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Completion Status */}
                    {status === "completed" && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2">
                          {event.completion_status === "completed" ? (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <span className="text-sm font-semibold text-gray-700">Completed</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-5 h-5 text-orange-600" />
                              <span className="text-sm font-semibold text-gray-700">Not Completed</span>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-2 mt-4">
                      {status === "ongoing" && (type === "event" || type === "hackathon") && (
                        <Button
                          onClick={() => handleJoinSession(event)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Video className="w-4 h-4 mr-2" />
                          Join Live Session
                        </Button>
                      )}

                      {type === "course" && (
                        <Button
                          onClick={() => handleResumeCourse(event)}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          {status === "completed" ? "View Course" : "Resume Course"}
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        onClick={() => router.push(`/dashboard/mentee/registered-events/${event.id}`)}
                        className="w-full border-gray-300"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

