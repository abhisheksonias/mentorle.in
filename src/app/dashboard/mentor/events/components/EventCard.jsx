"use client";

import { Calendar, MapPin, Edit, Trash2, Users, Video, ExternalLink, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatIndianDateTime } from "../utils/timezone";

export default function EventCard({ event, onEdit, onDelete, onViewParticipants }) {
  const getStatusColor = (status) => {
    const colors = {
      upcoming: "bg-blue-100 text-blue-800",
      ongoing: "bg-green-100 text-green-800",
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
      draft: "bg-yellow-100 text-yellow-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getTypeColor = (type) => {
    const colors = {
      bootcamp: "bg-purple-100 text-purple-800",
      workshop: "bg-indigo-100 text-indigo-800",
      guest_session: "bg-pink-100 text-pink-800",
      event: "bg-orange-100 text-orange-800",
      other: "bg-gray-100 text-gray-800"
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const formatEventType = (type) => {
    return type?.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase()) || "Event";
  };

  // Check if event has multiple sessions
  const hasMultipleSessions = event.sessions && event.sessions.length > 0;
  const sessionCount = hasMultipleSessions ? event.sessions.length : 1;

  // Format session date for display
  const formatSessionDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short"
      });
    } catch {
      return dateStr;
    }
  };

  // Get date range for multi-session events
  const getDateRange = () => {
    if (!hasMultipleSessions) return null;
    
    const sortedSessions = [...event.sessions].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    const firstDate = formatSessionDate(sortedSessions[0]?.date);
    const lastDate = formatSessionDate(sortedSessions[sortedSessions.length - 1]?.date);
    
    if (firstDate === lastDate) return firstDate;
    return `${firstDate} - ${lastDate}`;
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 border border-gray-200">
      {/* Banner Image */}
      {event.banner_image_url ? (
        <div className="h-40 overflow-hidden bg-gray-100 relative">
          <img
            src={event.banner_image_url}
            alt={event.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
          {/* Multi-session badge overlay */}
          {hasMultipleSessions && (
            <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <Layers className="h-3 w-3" />
              {sessionCount} Sessions
            </div>
          )}
        </div>
      ) : (
        <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
          <Video className="h-12 w-12 text-gray-400" />
          {/* Multi-session badge overlay */}
          {hasMultipleSessions && (
            <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <Layers className="h-3 w-3" />
              {sessionCount} Sessions
            </div>
          )}
        </div>
      )}

      <div className="p-5">
        {/* Status and Type Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(event.status)}`}>
            {event.status?.toUpperCase()}
          </span>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getTypeColor(event.event_type)}`}>
            {formatEventType(event.event_type)}
          </span>
          {hasMultipleSessions && (
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-black text-white">
              Series
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {event.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {event.description}
        </p>

        {/* Event Details */}
        <div className="space-y-2 mb-4">
          {event.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}

          {/* Date display - different for single vs multi-session */}
          {hasMultipleSessions ? (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span>{getDateRange()} • {sessionCount} sessions</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span>{formatIndianDateTime(event.start_date)}</span>
            </div>
          )}

          {/* Meeting link for single session events */}
          {!hasMultipleSessions && event.meeting_link && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Video className="h-4 w-4 flex-shrink-0" />
              <a 
                href={event.meeting_link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="truncate hover:underline flex items-center gap-1"
              >
                Join Link <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {/* Show if any session has a meeting link */}
          {hasMultipleSessions && event.sessions.some(s => s.meeting_link) && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Video className="h-4 w-4 flex-shrink-0" />
              <span>Meeting links available</span>
            </div>
          )}

          {/* Participant Count */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="font-medium">{event.participant_count || 0} Registered</span>
          </div>
        </div>

        {/* Session Preview for multi-session events */}
        {hasMultipleSessions && event.sessions.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-500 mb-2">Sessions:</p>
            <div className="space-y-1">
              {event.sessions.slice(0, 3).map((session, idx) => (
                <div key={session.id || idx} className="text-xs text-gray-600 flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-medium">
                    {idx + 1}
                  </span>
                  <span className="truncate">{session.title || `Session ${idx + 1}`}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-400">{formatSessionDate(session.date)}</span>
                </div>
              ))}
              {event.sessions.length > 3 && (
                <p className="text-xs text-gray-400 ml-6">
                  +{event.sessions.length - 3} more sessions
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t border-gray-100">
          <Button
            onClick={() => onViewParticipants(event)}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Users className="h-4 w-4 mr-1" />
            Participants
          </Button>
          <Button
            onClick={() => onEdit(event)}
            variant="outline"
            size="sm"
            className="px-3"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => onDelete(event)}
            variant="outline"
            size="sm"
            className="px-3 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
