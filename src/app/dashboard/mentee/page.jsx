"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import RoleProtected from "@/components/RoleProtected";
import { ROLES } from "@/lib/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, Clock, User, Search, BookOpen, PenTool,
  Bell, CheckCircle, TrendingUp, AlertCircle, ArrowRight,
  Briefcase, Play, Settings
} from "lucide-react";
import { format, formatDistanceToNow, isAfter, isBefore } from "date-fns";

function MenteeDashboardContent() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [progress, setProgress] = useState({
    sessionsCompleted: 0,
    totalSessions: 0,
    eventsAttended: 0,
    totalEvents: 0
  });
  const [notifications, setNotifications] = useState([]);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const userId = session.user.id;

      // Fetch profile
      const { data: profileData } = await supabase
        .from("mentee_data")
        .select("*")
        .eq("user_id", userId)
        .single();

      setProfile(profileData || { user_id: userId });

      // Fetch all data in parallel
      const [
        bookingsData,
        eventsData,
        progressData,
        notificationsData
      ] = await Promise.all([
        fetchUpcomingSessions(userId),
        fetchUpcomingEvents(userId),
        fetchProgress(userId),
        fetchNotifications(userId)
      ]);

      setUpcomingSessions(bookingsData || []);
      setUpcomingEvents(eventsData || []);
      setProgress(progressData);
      setNotifications(notificationsData || []);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const fetchUpcomingSessions = async (userId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = {
        "Content-Type": "application/json",
      };

      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const params = new URLSearchParams({
        role: "mentee",
        status: "all",
        upcoming: "true"
      });

      const response = await fetch(`/api/bookings?${params}`, { headers });

      if (response.ok) {
        const { data } = await response.json();
        // Filter to only confirmed/pending and upcoming
        const now = new Date();
        return (data || []).filter(booking => {
          const scheduledAt = new Date(booking.scheduled_at);
          return isAfter(scheduledAt, now) && 
                 ["pending", "confirmed"].includes(booking.status);
        }).slice(0, 5); // Top 5 upcoming
      }
      return [];
    } catch (error) {
      console.error("Error fetching sessions:", error);
      return [];
    }
  };

  const fetchUpcomingEvents = async (userId) => {
    try {
      // Get registered events
      const { data: registrations } = await supabase
        .from("event_participants")
        .select("event_id, registered_at")
        .eq("user_id", userId);

      if (!registrations || registrations.length === 0) return [];

      const eventIds = registrations.map(r => r.event_id);

      // Get event details
      const { data: events } = await supabase
        .from("events")
        .select("*")
        .in("id", eventIds)
        .gte("start_date", new Date().toISOString())
        .order("start_date", { ascending: true })
        .limit(5);

      return events || [];
    } catch (error) {
      console.error("Error fetching events:", error);
      return [];
    }
  };

  const fetchProgress = async (userId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = {
        "Content-Type": "application/json",
      };

      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      // Get all bookings
      const bookingsRes = await fetch(`/api/bookings?role=mentee&status=all`, { headers });
      let totalSessions = 0;
      let sessionsCompleted = 0;

      if (bookingsRes.ok) {
        const { data: bookings } = await bookingsRes.json();
        totalSessions = bookings.length;
        sessionsCompleted = bookings.filter(b => b.status === "completed").length;
      }

      // Get event registrations
      const { data: registrations } = await supabase
        .from("event_participants")
        .select("event_id, attendance_status")
        .eq("user_id", userId);

      const totalEvents = registrations?.length || 0;
      const eventsAttended = registrations?.filter(r => r.attendance_status === "attended").length || 0;

      return {
        sessionsCompleted,
        totalSessions,
        eventsAttended,
        totalEvents
      };
    } catch (error) {
      console.error("Error fetching progress:", error);
      return {
        sessionsCompleted: 0,
        totalSessions: 0,
        eventsAttended: 0,
        totalEvents: 0
      };
    }
  };

  const fetchNotifications = async (userId) => {
    const notifications = [];
    const now = new Date();

    try {
      // Get upcoming sessions in next 24 hours
      const { data: { session } } = await supabase.auth.getSession();
      const headers = {
        "Content-Type": "application/json",
      };

      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const bookingsRes = await fetch(`/api/bookings?role=mentee&status=all&upcoming=true`, { headers });
      
      if (bookingsRes.ok) {
        const { data: bookings } = await bookingsRes.json();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        bookings.forEach(booking => {
          const scheduledAt = new Date(booking.scheduled_at);
          if (isAfter(scheduledAt, now) && isBefore(scheduledAt, tomorrow)) {
            notifications.push({
              type: "session_reminder",
              title: "Upcoming Session",
              message: `${booking.offering?.title || "Session"} in ${formatDistanceToNow(scheduledAt, { addSuffix: true })}`,
              time: scheduledAt,
              link: `/dashboard/bookings/${booking.id}`,
              priority: "high"
            });
          }
        });
      }

      // Get upcoming events in next 7 days
      const { data: registrations } = await supabase
        .from("event_participants")
        .select("event_id")
        .eq("user_id", userId);

      if (registrations && registrations.length > 0) {
        const eventIds = registrations.map(r => r.event_id);
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const { data: events } = await supabase
          .from("events")
          .select("id, title, start_date")
          .in("id", eventIds)
          .gte("start_date", now.toISOString())
          .lte("start_date", nextWeek.toISOString());

        events?.forEach(event => {
          const startDate = new Date(event.start_date);
          notifications.push({
            type: "event_reminder",
            title: "Upcoming Event",
            message: `${event.title} starts ${formatDistanceToNow(startDate, { addSuffix: true })}`,
            time: startDate,
            link: `/event/${event.id}`,
            priority: "medium"
          });
        });
      }

      // Sort by time
      return notifications.sort((a, b) => new Date(a.time) - new Date(b.time));
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  const progressPercentage = progress.totalSessions > 0 
    ? Math.round((progress.sessionsCompleted / progress.totalSessions) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile?.name?.split(" ")[0] || profile?.first_name || "there"}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's your learning journey overview
          </p>
        </div>

        {/* Notifications & Alerts */}
        {notifications.length > 0 && (
          <div className="mb-6">
            <Card className="border-gray-200 bg-gray-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-gray-700 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Upcoming Reminders</h3>
                    <div className="space-y-2">
                      {notifications.slice(0, 3).map((notif, idx) => (
                        <Link
                          key={idx}
                          href={notif.link}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-white transition-colors group"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                            <p className="text-xs text-gray-600">{notif.message}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Progress Snapshot */}
          <div className="lg:col-span-1">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Progress Snapshot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Sessions</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {progress.sessionsCompleted} / {progress.totalSessions}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gray-900 h-2 rounded-full transition-all"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Events Attended</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {progress.eventsAttended} / {progress.totalEvents}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gray-900 h-2 rounded-full transition-all"
                      style={{ 
                        width: progress.totalEvents > 0 
                          ? `${Math.round((progress.eventsAttended / progress.totalEvents) * 100)}%` 
                          : "0%" 
                      }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>{progress.sessionsCompleted} sessions completed</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <Link href="/dashboard/mentee/findmentor">
                    <Button variant="outline" className="w-full justify-start h-auto py-3" size="lg">
                      <Search className="w-4 h-4 mr-2" />
                      <div className="text-left">
                        <div className="font-medium">Find Mentor</div>
                        <div className="text-xs text-gray-500">Discover mentors</div>
                      </div>
                    </Button>
                  </Link>
                  <Link href="/dashboard/mentee/book">
                    <Button variant="outline" className="w-full justify-start h-auto py-3" size="lg">
                      <Briefcase className="w-4 h-4 mr-2" />
                      <div className="text-left">
                        <div className="font-medium">Book Session</div>
                        <div className="text-xs text-gray-500">Schedule now</div>
                      </div>
                    </Button>
                  </Link>
                  <Link href="/dashboard/mentee/events">
                    <Button variant="outline" className="w-full justify-start h-auto py-3" size="lg">
                      <Calendar className="w-4 h-4 mr-2" />
                      <div className="text-left">
                        <div className="font-medium">Browse Events</div>
                        <div className="text-xs text-gray-500">Find events</div>
                      </div>
                    </Button>
                  </Link>
                  <Link href="/dashboard/mentee/resources">
                    <Button variant="outline" className="w-full justify-start h-auto py-3" size="lg">
                      <Play className="w-4 h-4 mr-2" />
                      <div className="text-left">
                        <div className="font-medium">Continue Course</div>
                        <div className="text-xs text-gray-500">Resume learning</div>
                      </div>
                    </Button>
                  </Link>
                  <Link href="/dashboard/mentee/profile">
                    <Button variant="outline" className="w-full justify-start h-auto py-3" size="lg">
                      <Settings className="w-4 h-4 mr-2" />
                      <div className="text-left">
                        <div className="font-medium">Edit Profile</div>
                        <div className="text-xs text-gray-500">Update info</div>
                      </div>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Sessions */}
          <Card className="border-gray-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Upcoming Sessions
                </CardTitle>
                <Link href="/dashboard/mentee/bookings">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">No upcoming sessions</p>
                  <Link href="/dashboard/mentee/book">
                    <Button variant="outline" size="sm">
                      Book a Session
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingSessions.map((session) => (
                    <Link
                      key={session.id}
                      href={`/dashboard/bookings/${session.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 group-hover:text-black">
                            {session.offering?.title || "Mentorship Session"}
                          </h4>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(session.scheduled_at), "MMM d, yyyy")}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {format(new Date(session.scheduled_at), "h:mm a")}
                            </div>
                          </div>
                          {session.mentor && (
                            <div className="flex items-center gap-2 mt-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{session.mentor.name || "Mentor"}</span>
                            </div>
                          )}
                        </div>
                        <Badge 
                          variant={session.status === "confirmed" ? "default" : "secondary"}
                          className="ml-2"
                        >
                          {session.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card className="border-gray-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Registered Events
                </CardTitle>
                <Link href="/dashboard/mentee/events">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">No registered events</p>
                  <Link href="/dashboard/mentee/events">
                    <Button variant="outline" size="sm">
                      Browse Events
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={`/event/${event.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 group-hover:text-black">
                            {event.title}
                          </h4>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(event.start_date), "MMM d, yyyy")}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {format(new Date(event.start_date), "h:mm a")}
                            </div>
                          </div>
                          {event.event_type && (
                            <Badge variant="outline" className="mt-2">
                              {event.event_type}
                            </Badge>
                          )}
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function MenteeDashboard() {
  return (
    <RoleProtected requiredRole={ROLES.MENTEE}>
      <MenteeDashboardContent />
    </RoleProtected>
  );
}
