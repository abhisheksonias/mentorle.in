"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, IndianRupee, Star, User, Calendar } from "lucide-react";

const CATEGORY_LABELS = {
  resume_review: "Resume Review",
  portfolio_review: "Portfolio Review",
  career_guidance: "Career Guidance",
  mock_interview: "Mock Interview",
  code_review: "Code Review",
  mentorship: "Mentorship",
  project_guidance: "Project Guidance",
  other: "Other"
};

export default function OfferingCard({ offering, onBook }) {
  return (
    <Card className="hover:shadow-lg transition-all duration-200 overflow-hidden">
      <CardContent className="p-0">
        {/* Header with mentor info */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex items-center gap-3">
            {offering.mentor?.profile_url ? (
              <img
                src={offering.mentor.profile_url}
                alt={offering.mentor.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-white font-bold">
                {offering.mentor?.name?.charAt(0) || "M"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{offering.mentor?.name || "Mentor"}</p>
              <p className="text-sm text-gray-500 truncate">
                {offering.mentor?.current_role || "Professional Mentor"}
              </p>
            </div>
            {offering.average_rating && (
              <div className="flex items-center gap-1 text-yellow-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-medium">{offering.average_rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <Badge variant="outline" className="mb-2 text-xs">
            {CATEGORY_LABELS[offering.category] || offering.category}
          </Badge>
          
          <h3 className="text-lg font-bold mb-2 line-clamp-2">{offering.title}</h3>
          
          {offering.description && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {offering.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{offering.duration_minutes} min</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{offering.total_bookings || 0} booked</span>
            </div>
          </div>

          {/* Price and Book */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-1">
              <IndianRupee className="w-5 h-5" />
              <span className="text-2xl font-bold">
                {offering.price > 0 ? offering.price : "Free"}
              </span>
            </div>
            <Button
              onClick={() => onBook(offering)}
              className="bg-black text-white hover:bg-gray-800"
            >
              Book Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

