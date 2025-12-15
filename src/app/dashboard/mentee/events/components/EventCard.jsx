"use client";

import { Calendar, MapPin, Users, Clock, ExternalLink, Star, Tag, GraduationCap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Link from "next/link";
import { nameToSlug } from "@/lib/slugUtils";

export default function EventCard({ event, user }) {
  const [isRegistering, setIsRegistering] = useState(false);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatTime = (dateString) =>
    new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const getEventStatus = () => {
    if (!event.start_date) return "upcoming";
    const now = new Date();
    const startDate = new Date(event.start_date);
    const endDate = event.end_date ? new Date(event.end_date) : null;

    if (event.is_cancelled) return "cancelled";
    if (startDate > now) return "upcoming";
    if (startDate <= now && (!endDate || endDate >= now)) return "ongoing";
    if (endDate ? endDate < now : startDate < now) return "completed";
    return "upcoming";
  };

  const getEventTypeColor = (type) => {
    const colors = {
      bootcamp: "bg-purple-500/10 text-purple-700 border-purple-200",
      workshop: "bg-blue-500/10 text-blue-700 border-blue-200", 
      guest_session: "bg-green-500/10 text-green-700 border-green-200",
      event: "bg-orange-500/10 text-orange-700 border-orange-200",
      other: "bg-gray-500/10 text-gray-700 border-gray-200"
    };
    return colors[type] || colors.other;
  };

  const getEventTypeIcon = (type) => {
    const icons = {
      bootcamp: "🚀",
      workshop: "🛠️",
      guest_session: "👨‍🏫",
      event: "🎉",
      other: "📅"
    };
    return icons[type] || icons.other;
  };

  const getDaysUntilEvent = () => {
    if (!event.start_date) return null;
    const now = new Date();
    const startDate = new Date(event.start_date);
    const diffTime = startDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isRegistrationOpen = () => {
    if (!event) return false;
    
    const now = new Date();
    
    // Check if event is completed
    if (event.end_date) {
      const endDate = new Date(event.end_date);
      if (endDate < now) return false;
    } else if (event.start_date) {
      const startDate = new Date(event.start_date);
      // If no end date, consider it completed if start date has passed significantly (more than 1 day)
      const oneDayAfter = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
      if (oneDayAfter < now) return false;
    }
    
    // Check if registration deadline has passed
    if (event.registration_deadline) {
      const deadline = new Date(event.registration_deadline);
      if (deadline < now) return false;
    }
    
    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if registration is closed
    if (!isRegistrationOpen()) {
      alert("Registrations are closed. The registration deadline has passed or the event has been completed.");
      return;
    }
    
    if (!user) {
      window.location.href = "/login";
      return;
    }
    
    if (event.registration_link) {
      if (eventStatus === "ongoing") {
        window.open(event.registration_link, "_blank");
      } else {
        setIsRegistering(true);
        setTimeout(() => {
          window.open(event.registration_link, "_blank");
          setIsRegistering(false);
        }, 1000);
      }
    }
  };

  const daysUntil = getDaysUntilEvent();
  const eventStatus = getEventStatus();
  const registrationOpen = isRegistrationOpen();

  // Debug: Log the banner image URL
  console.log('Event:', event.title);
  console.log('Banner URL from DB:', event.banner_image_url);

  return (
    <div className="group relative bg-white rounded-xl border border-gray-200/80 hover:border-purple-200 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col h-full">
      
      {/* Event Banner */}
      <div className="relative h-56 overflow-hidden flex-shrink-0">
        {event.banner_image_url ? (
          <div className="relative w-full h-full">
            <img 
              src={event.banner_image_url} 
              alt={event.title}
              className="w-full h-full object-cover bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 group-hover:scale-105 transition-transform duration-700"
              crossOrigin="anonymous"
              onError={(e) => {
                console.error('❌ Image failed to load:', event.banner_image_url);
                console.error('Possible reasons: 1) Supabase storage bucket not public, 2) File does not exist, 3) CORS issue');
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
              onLoad={(e) => {
                console.log('✅ Image loaded successfully:', event.banner_image_url);
              }}
            />
            <div className="hidden w-full h-full items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
              <div className="text-center">
                <div className="text-5xl mb-2">{getEventTypeIcon(event.event_type)}</div>
                <GraduationCap className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="text-xs text-gray-500 mt-2">Image unavailable</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
            <div className="text-center">
              <div className="text-5xl mb-2">{getEventTypeIcon(event.event_type)}</div>
              <GraduationCap className="w-10 h-10 text-gray-300 mx-auto" />
            </div>
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        {/* Status Badges Container */}
        <div className="absolute inset-0 p-3 flex flex-col justify-between">
          
          {/* Top Badges */}
          <div className="flex items-start justify-between gap-2">
            {/* Featured Badge */}
            {event.is_featured && (
              <div className="backdrop-blur-md bg-yellow-500/95 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                <Star className="w-3 h-3 fill-current" />
                FEATURED
              </div>
            )}
            
            {/* Event Type Badge */}
            <div className="ml-auto">
              <span className={`backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold border shadow-lg ${getEventTypeColor(event.event_type)}`}>
                {getEventTypeIcon(event.event_type)} {event.event_type ? event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1).replace('_', ' ') : 'Event'}
              </span>
            </div>
          </div>
          
          {/* Bottom Badges */}
          <div className="flex items-end justify-between">
            {/* Countdown/Live Badge */}
            {eventStatus === 'upcoming' && daysUntil !== null && daysUntil > 0 && (
              <div className="backdrop-blur-md bg-white/95 text-gray-900 px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-lg">
                {daysUntil === 1 ? '🔥 Tomorrow' : `⏰ ${daysUntil} days`}
              </div>
            )}
            
            {eventStatus === 'ongoing' && (
              <div className="backdrop-blur-md bg-red-500/95 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                LIVE NOW
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="p-4 space-y-3 flex flex-col flex-grow">
        
        {/* Title and College */}
        <div className="space-y-2 flex-shrink-0">
          <h3 className="font-bold text-lg text-gray-900 leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors duration-300 min-h-[3.5rem]">
            {event.title}
          </h3>
          {event.college_name && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 rounded-lg px-2.5 py-1.5 w-fit">
              <GraduationCap className="w-3.5 h-3.5 text-purple-500" />
              <span className="font-medium">{event.college_name}</span>
            </div>
          )}
        </div>

        {/* Key Details */}
        <div className="space-y-2 flex-shrink-0">
          {/* Date */}
          <div className="flex items-center gap-2.5 text-sm">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded-lg flex-shrink-0">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-gray-900 text-xs">{formatDate(event.start_date)}</span>
              <span className="text-xs text-gray-500">{formatTime(event.start_date)}</span>
            </div>
          </div>
          
          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-2.5 text-sm">
              <div className="flex items-center justify-center w-8 h-8 bg-red-50 rounded-lg flex-shrink-0">
                <MapPin className="w-4 h-4 text-red-600" />
              </div>
              <span className="font-medium text-gray-700 truncate flex-1 text-xs">{event.location}</span>
            </div>
          )}
          
          {/* Registration Deadline */}
          {event.registration_deadline && registrationOpen && (
            <div className="flex items-center gap-2 text-sm p-2 bg-orange-50 rounded-lg border border-orange-100">
              <Clock className="w-4 h-4 text-orange-600 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-orange-700">Register by {formatDate(event.registration_deadline)}</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Spacer to push buttons to bottom */}
        <div className="flex-grow"></div>
        
        {/* Action Buttons */}
        <div className="pt-2 space-y-2 border-t border-gray-100 flex-shrink-0">
          {eventStatus === 'completed' ? (
            <div className="text-center py-2.5 px-3 bg-gray-50 rounded-lg">
              <span className="text-xs text-gray-600 font-semibold">✓ Event Completed</span>
            </div>
          ) : eventStatus === 'cancelled' ? (
            <div className="text-center py-2.5 px-3 bg-red-50 rounded-lg border border-red-100">
              <span className="text-xs text-red-600 font-semibold">✕ Event Cancelled</span>
            </div>
          ) : !event.registration_link ? (
            <div className="text-center py-2.5 px-3 bg-blue-50 rounded-lg">
              <span className="text-xs text-blue-600 font-semibold">📢 Register now</span>
            </div>
          ) : !registrationOpen ? (
            <div className="text-center py-2.5 px-3 bg-orange-50 rounded-lg border border-orange-100">
              <span className="text-xs text-orange-600 font-semibold">⏱️ Registration Closed</span>
            </div>
          ) : (
            <Button 
              onClick={handleRegister}
              disabled={isRegistering}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2.5 rounded-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 text-sm"
            >
              {isRegistering ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Registering...</span>
                </div>
              ) : !user ? (
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Login to Register</span>
                </div>
              ) : eventStatus === 'ongoing' ? (
                <div className="flex items-center justify-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  <span>Join Live Event</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Register Now</span>
                </div>
              )}
            </Button>
          )}
          
          {/* View Details Link */}
          <Link 
            href={`/event/${nameToSlug(event.title)}`}
            className="group/link flex items-center justify-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold py-1.5 transition-colors"
          >
            <span>View Full Details</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
