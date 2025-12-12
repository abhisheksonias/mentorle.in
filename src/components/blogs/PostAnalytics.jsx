"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Users, TrendingUp, Calendar, Heart, MessageSquare } from "lucide-react";
import { format } from "date-fns";

export default function PostAnalytics({ postId }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (postId) {
      fetchAnalytics();
    }
  }, [postId]);

  const fetchAnalytics = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers = {
        "Content-Type": "application/json",
      };
      
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/posts/${postId}/analytics`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-pulse text-gray-500">Loading analytics...</div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return null;
  }

  const stats = [
    {
      label: "Total Views",
      value: analytics.totalViews.toLocaleString(),
      icon: Eye,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      label: "Unique Viewers",
      value: analytics.uniqueViewers.toLocaleString(),
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      label: "Views (7 Days)",
      value: analytics.viewsLast7Days.toLocaleString(),
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      label: "Views (30 Days)",
      value: analytics.viewsLast30Days.toLocaleString(),
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      label: "Likes",
      value: analytics.likesCount.toLocaleString(),
      icon: Heart,
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      label: "Comments",
      value: analytics.commentsCount.toLocaleString(),
      icon: MessageSquare,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50"
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Post Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`${stat.bgColor} rounded-lg p-4 transition-transform hover:scale-105`}
              >
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  <span className={`text-2xl font-bold ${stat.color}`}>
                    {stat.value}
                  </span>
                </div>
                <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>

          {analytics.latestView && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-500">
                <span className="font-medium">Last viewed:</span>{" "}
                {format(new Date(analytics.latestView), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Simple Chart of Views Over Time */}
      {Object.keys(analytics.viewsByDay || {}).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Views Over Time (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(analytics.viewsByDay)
                .sort(([a], [b]) => new Date(b) - new Date(a))
                .slice(0, 10)
                .map(([date, count]) => (
                  <div key={date} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-24">
                      {format(new Date(date), "MMM d")}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            (count / Math.max(...Object.values(analytics.viewsByDay))) * 100,
                            100
                          )}%`
                        }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                        {count} views
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

