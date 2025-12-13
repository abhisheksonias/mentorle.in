"use client";

import { useState, useEffect } from "react";
import RoleProtected from "@/components/RoleProtected";
import { ROLES } from "@/lib/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  MessageSquare, Star, Send, Calendar, BookOpen, Briefcase,
  User, Check, X, Filter
} from "lucide-react";
import { useRouter } from "next/navigation";

function FeedbackInboxContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [responseText, setResponseText] = useState("");
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    fetchFeedback();
  }, [typeFilter, statusFilter]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const { supabase } = await import("@/lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`
      };

      const params = new URLSearchParams({
        mentor_id: session.user.id,
        status: statusFilter
      });

      if (typeFilter !== "all") {
        params.append("type", typeFilter);
      }

      const response = await fetch(`/api/feedback?${params}`, { headers });

      if (response.ok) {
        const { data } = await response.json();
        setFeedback(data || []);
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
      toast({
        title: "Error",
        description: "Failed to load feedback",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (feedbackId) => {
    if (!responseText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a response",
        variant: "destructive",
      });
      return;
    }

    setResponding(true);
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`/api/feedback/${feedbackId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          mentor_response: responseText.trim()
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Response sent",
        });
        setSelectedFeedback(null);
        setResponseText("");
        fetchFeedback();
      } else {
        const data = await response.json();
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error responding to feedback:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send response",
        variant: "destructive",
      });
    } finally {
      setResponding(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "event":
        return <Calendar className="w-4 h-4" />;
      case "article":
        return <BookOpen className="w-4 h-4" />;
      case "booking":
        return <Briefcase className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "event":
        return "Event";
      case "article":
        return "Article";
      case "booking":
        return "Booking";
      default:
        return type;
    }
  };

  const unrespondedCount = feedback.filter(fb => !fb.mentor_response).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-8 h-8" />
          Feedback Inbox
        </h1>
        <p className="text-gray-600 mt-1">
          View and respond to feedback on your content
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{feedback.length}</div>
            <p className="text-sm text-gray-500">Total Feedback</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{unrespondedCount}</div>
            <p className="text-sm text-gray-500">Needs Response</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {feedback.filter(fb => fb.mentor_response).length}
            </div>
            <p className="text-sm text-gray-500">Responded</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {feedback.length > 0 
                ? (feedback.reduce((sum, fb) => sum + fb.rating, 0) / feedback.length).toFixed(1)
                : "0.0"}
            </div>
            <p className="text-sm text-gray-500">Average Rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          >
            <option value="all">All Types</option>
            <option value="event">Events</option>
            <option value="booking">Bookings</option>
            <option value="article">Articles</option>
          </select>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
        >
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading feedback...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && feedback.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback yet</h3>
            <p className="text-gray-600">Feedback from users will appear here</p>
          </CardContent>
        </Card>
      )}

      {/* Feedback List */}
      {!loading && feedback.length > 0 && (
        <div className="space-y-4">
          {feedback.map((fb) => (
            <Card 
              key={fb.id} 
              className={`hover:shadow-md transition-shadow ${
                !fb.mentor_response ? "border-l-4 border-l-yellow-500" : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Left: Feedback Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getTypeIcon(fb.feedback_type)}
                        {getTypeLabel(fb.feedback_type)}
                      </Badge>
                      {fb.offering && (
                        <Badge variant="outline" className="text-xs">
                          {fb.offering.title}
                        </Badge>
                      )}
                      {!fb.mentor_response && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          Needs Response
                        </Badge>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex items-center gap-3 mb-3">
                      {fb.user?.profile_url ? (
                        <img
                          src={fb.user.profile_url}
                          alt={fb.user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-bold">
                          {fb.user?.name?.charAt(0) || "U"}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{fb.user?.name || "User"}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(fb.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= fb.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-600">{fb.rating}/5</span>
                    </div>

                    {/* Comment */}
                    {fb.comment && (
                      <div className="p-3 bg-gray-50 rounded-lg mb-3">
                        <p className="text-sm text-gray-700">{fb.comment}</p>
                      </div>
                    )}

                    {/* Mentor Response */}
                    {fb.mentor_response && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-2 border-blue-500">
                        <p className="text-xs font-medium text-blue-800 mb-1">Your Response</p>
                        <p className="text-sm text-blue-900">{fb.mentor_response}</p>
                        <p className="text-xs text-blue-600 mt-1">
                          {format(new Date(fb.mentor_response_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  {!fb.mentor_response && (
                    <div className="md:w-80">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedFeedback(fb)}
                        className="w-full mb-2"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Respond
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Response Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Respond to Feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">From: {selectedFeedback.user?.name || "User"}</p>
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3 h-3 ${
                        star <= selectedFeedback.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                {selectedFeedback.comment && (
                  <p className="text-sm text-gray-700">{selectedFeedback.comment}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Your Response
                </label>
                <Textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Thank the user for their feedback..."
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setSelectedFeedback(null);
                    setResponseText("");
                  }}
                  disabled={responding}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-black text-white hover:bg-gray-800"
                  onClick={() => handleRespond(selectedFeedback.id)}
                  disabled={responding || !responseText.trim()}
                >
                  {responding ? "Sending..." : "Send Response"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function FeedbackInboxPage() {
  return (
    <RoleProtected requiredRole={[ROLES.MENTOR, ROLES.ADMIN]}>
      <FeedbackInboxContent />
    </RoleProtected>
  );
}

