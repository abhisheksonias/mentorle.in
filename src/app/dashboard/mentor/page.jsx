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
  PenTool, Calendar, Briefcase, User, Eye, MessageSquare,
  Plus, ArrowRight, Clock, Star, BookOpen, CheckCircle
} from "lucide-react";
import { format } from "date-fns";

function MentorDashboardContent() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalArticles: 0,
    totalEvents: 0,
    upcomingSessions: 0,
    totalViews: 0,
    totalFeedback: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
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
        .from("mentor_data")
        .select("*")
        .eq("user_id", userId)
        .single();

      setProfile(profileData);

      // Fetch all stats in parallel
      const [
        articlesData,
        eventsData,
        bookingsData,
        viewsData,
        feedbackData,
        activityData
      ] = await Promise.all([
        // Total Articles
        supabase
          .from("posts")
          .select("id", { count: "exact", head: true })
          .eq("author_id", userId)
          .in("status", ["published", "scheduled"]),

        // Total Events
        supabase
          .from("events")
          .select("id", { count: "exact", head: true })
          .eq("created_by", userId),

        // Upcoming Sessions
        supabase
          .from("mentorship_bookings")
          .select("id")
          .eq("mentor_id", userId)
          .in("status", ["pending", "confirmed"])
          .gte("scheduled_at", new Date().toISOString()),

        // Total Views
        supabase
          .from("posts")
          .select("view_count")
          .eq("author_id", userId)
          .in("status", ["published", "scheduled"]),

        // Total Feedback
        fetch(`/api/feedback?mentor_id=${userId}&status=active`).then(r => r.json()),

        // Recent Activity
        fetchRecentActivity(userId)
      ]);

      // Calculate stats
      const totalViews = viewsData.data?.reduce((sum, post) => sum + (post.view_count || 0), 0) || 0;
      const totalFeedback = feedbackData.data?.length || 0;

      setStats({
        totalArticles: articlesData.count || 0,
        totalEvents: eventsData.count || 0,
        upcomingSessions: bookingsData.data?.length || 0,
        totalViews,
        totalFeedback
      });

      setRecentActivity(activityData || []);
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

  const fetchRecentActivity = async (userId) => {
    const activities = [];

    try {
      // Get recent feedback (last 5)
      const feedbackRes = await fetch(`/api/feedback?mentor_id=${userId}&status=active`);
      if (feedbackRes.ok) {
        const { data: feedback } = await feedbackRes.json();
        feedback.slice(0, 5).forEach(fb => {
          activities.push({
            type: "feedback",
            id: fb.id,
            title: `New ${fb.feedback_type} feedback`,
            description: fb.comment || `${fb.rating} star rating`,
            time: fb.created_at,
            icon: MessageSquare,
            color: "text-blue-600",
            link: "/dashboard/feedback"
          });
        });
      }

      // Get recent bookings (last 5)
      const { data: { session } } = await supabase.auth.getSession();
      const bookingsRes = await fetch(`/api/bookings?role=mentor&status=all`, {
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        }
      });
      if (bookingsRes.ok) {
        const { data: bookings } = await bookingsRes.json();
        bookings
          .filter(b => ["pending", "confirmed"].includes(b.status))
          .slice(0, 5)
          .forEach(booking => {
            activities.push({
              type: "booking",
              id: booking.id,
              title: "New booking",
              description: booking.offering?.title || "Session booking",
              time: booking.created_at,
              icon: Calendar,
              color: "text-green-600",
              link: `/dashboard/bookings/${booking.id}`
            });
          });
      }

      // Get recent comments (last 5) - if comments table exists
      try {
        const { data: comments } = await supabase
          .from("post_comments")
          .select("*, post:post_id(id, title, author_id)")
          .order("created_at", { ascending: false })
          .limit(5);

        if (comments) {
          comments
            .filter(c => c.post?.author_id === userId)
            .forEach(comment => {
              activities.push({
                type: "comment",
                id: comment.id,
                title: "New comment",
                description: `On: ${comment.post?.title || "Article"}`,
                time: comment.created_at,
                icon: MessageSquare,
                color: "text-purple-600",
                link: `/blogs/${comment.post?.slug || ""}`
              });
            });
        }
      } catch (error) {
        // Comments table might not exist, skip silently
        console.log("Comments not available:", error);
      }

      // Sort by time and return top 10
      return activities
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 10);
    } catch (error) {
      console.error("Error fetching activity:", error);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile?.name?.split(" ")[0] || "Mentor"}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your content and sessions
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Articles</p>
                  <p className="text-2xl font-bold">{stats.totalArticles}</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-lg">
                  <PenTool className="w-6 h-6 text-gray-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Events</p>
                  <p className="text-2xl font-bold">{stats.totalEvents}</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-gray-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Upcoming</p>
                  <p className="text-2xl font-bold">{stats.upcomingSessions}</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Clock className="w-6 h-6 text-gray-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Views</p>
                  <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Eye className="w-6 h-6 text-gray-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Feedback</p>
                  <p className="text-2xl font-bold">{stats.totalFeedback}</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-gray-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/dashboard/posts/new">
                  <Button variant="outline" className="w-full justify-start" size="lg">
                    <PenTool className="w-4 h-4 mr-2" />
                    Create New Article
                  </Button>
                </Link>
                <Link href="/dashboard/mentor/events">
                  <Button variant="outline" className="w-full justify-start" size="lg">
                    <Calendar className="w-4 h-4 mr-2" />
                    Create New Event
                  </Button>
                </Link>
                <Link href="/dashboard/offerings/new">
                  <Button variant="outline" className="w-full justify-start" size="lg">
                    <Briefcase className="w-4 h-4 mr-2" />
                    Add Offering
                  </Button>
                </Link>
                <Link href="/dashboard/mentor/profile">
                  <Button variant="outline" className="w-full justify-start" size="lg">
                    <User className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Feed */}
          <div className="lg:col-span-2">
            <Card className="border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/feedback">
                      View All
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => {
                      const Icon = activity.icon;
                      return (
                        <Link
                          key={`${activity.type}-${activity.id}`}
                          href={activity.link || "#"}
                          className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                        >
                          <div className={`p-2 rounded-lg bg-gray-100 ${activity.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 group-hover:text-black">
                              {activity.title}
                            </p>
                            <p className="text-sm text-gray-600 truncate">
                              {activity.description}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {format(new Date(activity.time), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MentorDashboard() {
  return (
    <RoleProtected requiredRole={[ROLES.MENTOR, ROLES.PENDING_MENTOR]}>
      <MentorDashboardContent />
    </RoleProtected>
  );
}
