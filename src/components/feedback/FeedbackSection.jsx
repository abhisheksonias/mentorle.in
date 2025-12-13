"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Star, X } from "lucide-react";
import FeedbackForm from "./FeedbackForm";
import { format } from "date-fns";

export default function FeedbackSection({ feedbackType, referenceId }) {
  const [feedback, setFeedback] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasFeedback, setHasFeedback] = useState(false);

  useEffect(() => {
    fetchFeedback();
  }, [feedbackType, referenceId]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: feedbackType,
        reference_id: referenceId,
        status: "active"
      });

      const response = await fetch(`/api/feedback?${params}`);
      
      if (response.ok) {
        const { data } = await response.json();
        setFeedback(data || []);
        
        // Check if current user has already left feedback
        const { supabase } = await import("@/lib/supabase");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const userFeedback = data?.find(fb => fb.user_id === session.user.id);
          setHasFeedback(!!userFeedback);
        }
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (newFeedback) => {
    setHasFeedback(true);
    setShowForm(false);
    fetchFeedback();
  };

  const averageRating = feedback.length > 0
    ? (feedback.reduce((sum, fb) => sum + fb.rating, 0) / feedback.length).toFixed(1)
    : 0;

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Feedback
          </CardTitle>
          {!hasFeedback && !showForm && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowForm(true)}
            >
              Leave Feedback
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        {feedback.length > 0 && (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{averageRating}</span>
              <span className="text-gray-500">({feedback.length} {feedback.length === 1 ? "review" : "reviews"})</span>
            </div>
          </div>
        )}

        {/* Feedback Form */}
        {showForm && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Your Feedback</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowForm(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <FeedbackForm
              feedbackType={feedbackType}
              referenceId={referenceId}
              onSuccess={handleSuccess}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {/* Feedback List */}
        {feedback.length > 0 && (
          <div className="space-y-3">
            {feedback.slice(0, 5).map((fb) => (
              <div key={fb.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {fb.user?.profile_url ? (
                      <img
                        src={fb.user.profile_url}
                        alt={fb.user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white text-xs font-bold">
                        {fb.user?.name?.charAt(0) || "U"}
                      </div>
                    )}
                    <span className="font-medium text-sm">{fb.user?.name || "User"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= fb.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {fb.comment && (
                  <p className="text-sm text-gray-700 mb-2">{fb.comment}</p>
                )}
                {fb.mentor_response && (
                  <div className="mt-2 p-2 bg-blue-50 rounded border-l-2 border-blue-500">
                    <p className="text-xs font-medium text-blue-800 mb-1">Mentor Response</p>
                    <p className="text-sm text-blue-900">{fb.mentor_response}</p>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {format(new Date(fb.created_at), "MMM d, yyyy")}
                </p>
              </div>
            ))}
            {feedback.length > 5 && (
              <p className="text-sm text-gray-500 text-center">
                +{feedback.length - 5} more {feedback.length - 5 === 1 ? "review" : "reviews"}
              </p>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && feedback.length === 0 && !showForm && (
          <p className="text-sm text-gray-500 text-center py-4">
            No feedback yet. Be the first to leave a review!
          </p>
        )}
      </CardContent>
    </Card>
  );
}

