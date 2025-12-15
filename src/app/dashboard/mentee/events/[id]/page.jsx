"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  ExternalLink, 
  Share2, 
  ArrowLeft,
  GraduationCap,
  Tag,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BookOpen,
  Trophy,
  Target
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MenteeEventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id;

  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (eventId) fetchEventDetails(eventId);

    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [eventId]);

  const fetchEventDetails = async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      const { data: eventData, error: eventError } = await supabase
        .from("events_programs")
        .select("*")
        .eq("id", id)
        .single();
      if (eventError) throw eventError;
      setEvent(eventData);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load event details");
    } finally {
      setIsLoading(false);
    }
  };

  // Utility functions
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", { 
      weekday: "long",
      month: "long", 
      day: "numeric", 
      year: "numeric" 
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", { 
      hour: "2-digit", 
      minute: "2-digit",
      hour12: true 
    });
  };

  const getEventStatus = () => {
    if (!event?.start_date) return "upcoming";
    const now = new Date();
    const startDate = new Date(event.start_date);
    const endDate = event.end_date ? new Date(event.end_date) : null;

    if (event.is_cancelled) return "cancelled";
    if (startDate > now) return "upcoming";
    if (startDate <= now && (!endDate || endDate >= now)) return "ongoing";
    if (endDate ? endDate < now : startDate < now) return "completed";
    return "upcoming";
  };

  const getDaysUntilEvent = () => {
    if (!event?.start_date) return null;
    const now = new Date();
    const startDate = new Date(event.start_date);
    const diffTime = startDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : null;
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

  const getEventTypeColor = (type) => {
    const colors = {
      bootcamp: "bg-purple-100 text-purple-800 border-purple-300",
      workshop: "bg-blue-100 text-blue-800 border-blue-300", 
      guest_session: "bg-green-100 text-green-800 border-green-300",
      event: "bg-orange-100 text-orange-800 border-orange-300",
      other: "bg-gray-100 text-gray-800 border-gray-300"
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

  const handleRegisterClick = () => {
    // Check if registration is closed
    if (!isRegistrationOpen()) {
      alert("Registrations are closed. The registration deadline has passed or the event has been completed.");
      return;
    }

    if (!user) {
      router.push("/login");
    } else if (event.registration_link) {
      window.open(event.registration_link, "_blank");
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/event/${event.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description,
          url: shareUrl,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("Link copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Event</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-4">The event you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/dashboard/mentee/events")}>Browse All Events</Button>
        </div>
      </div>
    );
  }

  const eventStatus = getEventStatus();
  const daysUntil = getDaysUntilEvent();
  const registrationOpen = isRegistrationOpen();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      
      {/* Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 backdrop-blur-sm bg-white/95">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline font-medium">Back to Events</span>
            </button>
            
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-medium">Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Event Banner */}
      <div className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[500px] bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
        {event.banner_image_url ? (
          <>
            <img
              src={event.banner_image_url}
              alt={event.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Banner image failed to load:', event.banner_image_url);
                e.target.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <GraduationCap className="w-24 h-24 text-gray-400 mx-auto mb-4" />
              <div className="text-6xl">{getEventTypeIcon(event.event_type)}</div>
            </div>
          </div>
        )}
        
        {/* Overlay Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 md:p-8 lg:p-12">
          <div className="container mx-auto max-w-6xl">
            
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {/* Event Type Badge */}
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold border backdrop-blur-md ${getEventTypeColor(event.event_type)} shadow-lg`}>
                {getEventTypeIcon(event.event_type)} {event.event_type ? event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1).replace('_', ' ') : 'Event'}
              </span>
              
              {/* Status Badges */}
              {eventStatus === 'ongoing' && (
                <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-red-500 text-white backdrop-blur-md flex items-center gap-1.5 shadow-lg">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  LIVE NOW
                </span>
              )}
              
              {eventStatus === 'upcoming' && daysUntil && daysUntil > 0 && (
                <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/95 text-gray-900 backdrop-blur-md shadow-lg">
                  {daysUntil === 1 ? '🔥 Tomorrow' : `⏰ ${daysUntil} days left`}
                </span>
              )}
              
              {event.is_featured && (
                <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-yellow-500 text-white backdrop-blur-md shadow-lg">
                  ⭐ FEATURED
                </span>
              )}
            </div>
            
            {/* Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 drop-shadow-lg leading-tight">
              {event.title}
            </h1>
            
            {/* College Name */}
            {event.college_name && (
              <div className="flex items-center gap-2 text-white/90 mb-2">
                <GraduationCap className="w-5 h-5" />
                <span className="text-base sm:text-lg font-medium">{event.college_name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Same as public page */}
      <div className="container mx-auto max-w-6xl px-4 py-6 sm:py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Quick Info Cards - Mobile Optimized */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date & Time Card */}
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 mb-1">Date & Time</p>
                    <p className="text-sm font-semibold text-gray-900 break-words">{formatDate(event.start_date)}</p>
                    <p className="text-sm text-gray-600">{formatTime(event.start_date)}</p>
                  </div>
                </div>
              </div>
              
              {/* Location Card */}
              {event.location && (
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <MapPin className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 mb-1">Location</p>
                      <p className="text-sm font-semibold text-gray-900 break-words">{event.location}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Participants Card */}
              {event.max_participants && (
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 mb-1">Participants</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {event.current_participants || 0} / {event.max_participants} registered
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(((event.current_participants || 0) / event.max_participants) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Registration Deadline */}
              {event.registration_deadline && registrationOpen && (
                <div className="bg-white rounded-xl p-5 border border-orange-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 mb-1">Registration Deadline</p>
                      <p className="text-sm font-semibold text-orange-600">{formatDate(event.registration_deadline)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Description Section */}
            <div className="bg-white rounded-xl p-6 sm:p-8 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">About This Event</h2>
              </div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {event.description}
              </p>
            </div>

            {/* Prerequisites Section */}
            {event.prerequisites && (
              <div className="bg-blue-50 rounded-xl p-6 sm:p-8 border border-blue-200">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Prerequisites</h2>
                </div>
                <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                  {event.prerequisites}
                </p>
              </div>
            )}

            {/* Syllabus Section */}
            {event.syllabus && Array.isArray(event.syllabus) && event.syllabus.length > 0 && (
              <div className="bg-white rounded-xl p-6 sm:p-8 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Syllabus</h2>
                </div>
                <div className="space-y-4">
                  {event.syllabus.map((item, index) => (
                    <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-purple-600">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base break-words">{item.topic || item.title}</h3>
                        {item.description && (
                          <p className="text-sm text-gray-600 leading-relaxed break-words">{item.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Learning Outcomes */}
            {event.learning_outcomes && (
              <div className="bg-green-50 rounded-xl p-6 sm:p-8 border border-green-200">
                <div className="flex items-center gap-2 mb-6">
                  <Target className="w-5 h-5 text-green-600" />
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">What You'll Learn</h2>
                </div>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                  {event.learning_outcomes}
                </p>
              </div>
            )}

            {/* Certification Info */}
            {event.certification_details && (
              <div className="bg-yellow-50 rounded-xl p-6 sm:p-8 border border-yellow-200">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Certification</h2>
                </div>
                <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                  {event.certification_details}
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              
              {/* Registration Card */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Registration</h3>
                
                {eventStatus === 'completed' ? (
                  <div className="text-center py-4">
                    <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-600">Event Completed</p>
                  </div>
                ) : eventStatus === 'cancelled' ? (
                  <div className="text-center py-4">
                    <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-red-600">Event Cancelled</p>
                  </div>
                ) : !event.registration_link ? (
                  <div className="text-center py-4">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-600">Registration Details Coming Soon</p>
                  </div>
                ) : !registrationOpen ? (
                  <div className="text-center py-4">
                    <Clock className="w-12 h-12 text-orange-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-orange-600">Registration Closed</p>
                  </div>
                ) : (
                  <>
                    {/* Registration Fee */}
                    {event.registration_fee !== undefined && event.registration_fee !== null && (
                      <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-xs text-gray-600 mb-1">Registration Fee</p>
                        <p className="text-2xl font-bold text-green-600">
                          {event.registration_fee === 0 ? 'FREE' : `₹${event.registration_fee}`}
                        </p>
                      </div>
                    )}
                    
                    <Button 
                      onClick={handleRegisterClick}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 rounded-lg transition-all duration-300 hover:shadow-xl text-sm sm:text-base"
                    >
                      {!user ? (
                        <>
                          <Calendar className="w-5 h-5 mr-2" />
                          Login to Register
                        </>
                      ) : eventStatus === 'ongoing' ? (
                        <>
                          <ExternalLink className="w-5 h-5 mr-2" />
                          Join Live Event
                        </>
                      ) : (
                        <>
                          <Calendar className="w-5 h-5 mr-2" />
                          Register Now
                        </>
                      )}
                    </Button>
                    
                    <p className="text-xs text-gray-500 text-center mt-3">
                      Secure registration via external platform
                    </p>
                  </>
                )}
              </div>

              {/* Event Organizer */}
              {event.organizer_name && (
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Organized By</h3>
                  <p className="text-gray-700 font-medium">{event.organizer_name}</p>
                  {event.organizer_contact && (
                    <p className="text-sm text-gray-600 mt-2">{event.organizer_contact}</p>
                  )}
                </div>
              )}

              {/* Tags */}
              {event.tags && event.tags.length > 0 && (
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Tag className="w-4 h-4 text-gray-600" />
                    <h3 className="text-lg font-bold text-gray-900">Tags</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
