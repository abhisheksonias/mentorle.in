"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Star, Send, X } from "lucide-react";

export default function FeedbackForm({ 
  feedbackType, 
  referenceId, 
  onSuccess, 
  onCancel,
  existingFeedback = null 
}) {
  const { toast } = useToast();
  const [rating, setRating] = useState(existingFeedback?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState(existingFeedback?.comment || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: "Error",
          description: "Please log in to leave feedback",
          variant: "destructive",
        });
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`
      };

      const url = existingFeedback 
        ? `/api/feedback/${existingFeedback.id}`
        : "/api/feedback";
      
      const method = existingFeedback ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          feedback_type: feedbackType,
          reference_id: referenceId,
          rating,
          comment: comment.trim() || null
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit feedback");
      }

      toast({
        title: "Thank you!",
        description: existingFeedback ? "Feedback updated" : "Your feedback has been submitted",
      });

      if (onSuccess) {
        onSuccess(result.data);
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Star Rating */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Rating *
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-colors"
            >
              <Star
                className={`w-6 h-6 ${
                  star <= (hoveredRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-gray-600">
              {rating} {rating === 1 ? "star" : "stars"}
            </span>
          )}
        </div>
      </div>

      {/* Comment */}
      <div>
        <label htmlFor="comment" className="text-sm font-medium text-gray-700 mb-2 block">
          Comment (Optional)
        </label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your thoughts..."
          rows={3}
          className="resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          type="submit"
          disabled={loading || rating === 0}
          className="bg-black text-white hover:bg-gray-800"
        >
          <Send className="w-4 h-4 mr-2" />
          {loading ? "Submitting..." : existingFeedback ? "Update Feedback" : "Submit Feedback"}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

