"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { nameToSlug } from "@/lib/slugUtils";
import { 
  Calendar, 
  MapPin, 
  Star,
  Share2, 
  Bookmark,
  User,
  ExternalLink,
  LinkedinIcon,
  GithubIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EventDetailPage() {
  const params = useParams(); 
  const router = useRouter();

  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  // Extract slug from URL params
  const slugArray = params.slug; 
  const eventSlug = slugArray ? slugArray.join('/') : null;

  useEffect(() => {
    if (eventSlug) fetchEventDetails(eventSlug);

    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      
      // Check if user is already registered for this event
      if (user && event) {
        checkRegistrationStatus(user.id);
      }
    };
    getUser();
  }, [eventSlug, event?.id]);

  const fetchEventDetails = async (slug) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: events, error: fetchError } = await supabase
        .from("events_programs")
        .select("*");
      
      if (fetchError) throw fetchError;
      
      const matchedEvent = events?.find(evt => nameToSlug(evt.title) === slug);
      
      if (!matchedEvent) {
        throw new Error("Event not found");
      }
      
      setEvent(matchedEvent);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load event details");
    } finally {
      setIsLoading(false);
    }
  };

  const checkRegistrationStatus = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("event_participants")
        .select("id")
        .eq("event_id", event.id)
        .eq("user_id", userId)
        .single();

      if (data) {
        setIsRegistered(true);
      }
    } catch (error) {
      // If no record found, user is not registered (expected behavior)
      setIsRegistered(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      weekday: "short",
      month: "short", 
      day: "numeric" 
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", { 
      hour: "numeric", 
      minute: "2-digit",
      hour12: true 
    });
  };

  const formatFullDateTime = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    
    const dateStr = start.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric"
    });
    
    const startTime = start.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
    
    const endTime = end ? end.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    }) : null;
    
    const timeStr = endTime ? `${startTime} to ${endTime}` : startTime;
    
    return `${dateStr} · ${timeStr} IST`;
  };

  const isRegistrationClosed = () => {
    if (!event) return false;
    
    const now = new Date();
    
    // Check if event is completed
    if (event.end_date) {
      const endDate = new Date(event.end_date);
      if (endDate < now) return true;
    } else if (event.start_date) {
      const startDate = new Date(event.start_date);
      // If no end date, consider it completed if start date has passed
      if (startDate < now) return true;
    }
    
    // Check if registration deadline has passed
    if (event.registration_deadline) {
      const deadline = new Date(event.registration_deadline);
      if (deadline < now) return true;
    }
    
    return false;
  };

  const handleRegisterClick = async () => {
    // Check if registration is closed
    if (isRegistrationClosed()) {
      alert("Registrations are closed. The registration deadline has passed or the event has been completed.");
      return;
    }

    // Check if user is authenticated
    if (!user) {
      router.push('/signup');
      return;
    }

    // Check if already registered
    if (isRegistered) {
      return;
    }

    setIsRegistering(true);

    try {
      const { data, error } = await supabase
        .from("event_participants")
        .insert({
          event_id: event.id,
          user_id: user.id,
          registered_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;

      setIsRegistered(true);
      setShowThankYou(true);
      
      // Hide thank you message after 5 seconds
      setTimeout(() => {
        setShowThankYou(false);
      }, 5000);
    } catch (error) {
      console.error("Error registering for event:", error);
      alert("Failed to register for event. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
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

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // TODO: Implement actual bookmark functionality with database
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Event Not Found</h2>
          <p className="text-gray-600 mb-6">The event you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/events")}>
            Browse All Events
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Header Section - Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          
          {/* Left Column - Title and Hosted By */}
          <div className="space-y-8">
            
            {/* Event Title - Bold & Attractive */}
            <h1 className="text-5xl lg:text-6xl font-black text-gray-900 leading-tight tracking-tight">
              {event.title}
            </h1>

            {/* Hosted By Section */}
            <div className="flex items-center gap-4 py-6 border-t border-b border-gray-200">
              <div className="flex items-center gap-3">
                {/* Host Avatar */}
                <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {event.college_name ? event.college_name.charAt(0).toUpperCase() : 'E'}
                </div>
                
                {/* Host Info */}
                <div>
                  <p className="text-sm text-gray-600 mb-0.5">Hosted by</p>
                  <p className="text-lg font-bold text-gray-900">
                    {event.college_name || "Event Organizer"}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column - Event Banner (Flyer) */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
              {/* Banner Image Container */}
              <div className="aspect-[21/11] w-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
                {event.banner_image_url ? (
                  <img 
                    src={event.banner_image_url}
                    alt={event.title}
                    className="w-full h-full object-fit"
                    onError={(e) => {
                      console.error('Banner image failed to load:', event.banner_image_url);
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-8xl mb-4">
                        {event.event_type === 'bootcamp' ? '🚀' : 
                         event.event_type === 'workshop' ? '🛠️' : 
                         event.event_type === 'guest_session' ? '👨‍🏫' : '🎉'}
                      </div>
                      <p className="text-gray-500 font-semibold text-lg">Event Banner</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Decorative Wave Effect at Bottom Right */}
              <div className="absolute bottom-0 right-0 w-32 h-32">
                <svg viewBox="0 0 100 100" className="text-purple-500 opacity-20">
                  <path d="M100,100 Q80,80 100,60 L100,100 Z" fill="currentColor"/>
                </svg>
              </div>
            </div>

            {/* Floating Badge */}
            <div className="absolute -top-4 -left-4 bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-full shadow-xl transform -rotate-6">
              <p className="font-bold text-sm">LIVE EVENT</p>
            </div>
          </div>

        </div>

        {/* Main Content Section - Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Column - Event Details (2 columns width) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Event Description */}
            <div className="xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About this event</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            </div>

            {/* Prerequisites */}
            {event.prerequisites && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Prerequisites</h2>
                <p className="text-gray-700 leading-relaxed">{event.prerequisites}</p>
              </div>
            )}

            {/* Learning Outcomes */}
            {event.learning_outcomes && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">What you'll learn</h2>
                <p className="text-gray-700 leading-relaxed">{event.learning_outcomes}</p>
              </div>
            )}


         {/* Speaker Section (if available) */}
{event.speaker_name && (
  <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-200 transition-all hover:shadow-xl hover:-translate-y-1 duration-200">
    <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-3">
      Speaker
    </h2>

    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
      {/* Speaker Image or Initial */}
      <div className="flex-shrink-0">
        {event.speaker_image ? (
          <img
            src={event.speaker_image}
            alt={event.speaker_name}
            className="w-28 h-28 rounded-full object-cover border-4 border-gray-100 shadow-md"
          />
        ) : (
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-4xl border-4 border-gray-100 shadow-md">
            {event.speaker_name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Speaker Info */}
<div className="flex-1 text-center sm:text-left mt-0 md:mt-6">
  <h3 className="text-xl font-semibold text-gray-900 mb-1">
    {event.speaker_name}
  </h3>

  {event.speaker_designation && (
    <p className="text-gray-600 text-sm mb-3">
      {event.speaker_designation}
    </p>
  )}

  {/* Social Links */}
  <div className="flex justify-center sm:justify-start gap-4 mt-2">
    {event.speaker_linkedin && (
      <a
        href={event.speaker_linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
      >
        <LinkedinIcon  className="w-5 h-5" />
        <span className="text-sm font-medium">LinkedIn</span>
        
      </a>
    )}
    {event.speaker_github && (
      <a
        href={event.speaker_github}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-gray-800 hover:text-black transition-colors"
      >
        <GithubIcon  className="w-5 h-5" />
        <span className="text-sm font-medium">GitHub</span>
       
      </a>
    )}
  </div>
</div>
    </div>
  </div>
)}


          </div>

          {/* Right Column - Sticky Registration Card (1 column width) */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-4">
              
              {/* Date & Time Card */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="space-y-6">
                  
                  {/* Date */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white flex items-center justify-center text-black shadow-md">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600 mb-1">Date & Time</p>
                      <p className="font-bold text-gray-900 text-base leading-tight">
                        {formatDate(event.start_date)}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatTime(event.start_date)} IST
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg  bg-white flex items-center justify-center text-black shadow-md">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600 mb-1">Location</p>
                      <p className="font-bold text-gray-900 text-sm leading-tight">
                        {event.college_name}
                      </p>
                      {event.location && (
                        <p className="text-xs text-gray-600 mt-1">{event.location}</p>
                      )}
                    </div>
                  </div>

                  {/* Registration Button */}
                  <div className="pt-2">
                    {isRegistrationClosed() ? (
                      <div className="w-full h-14 bg-gray-100 border-2 border-gray-300 rounded-xl flex items-center justify-center">
                        <div className="flex items-center gap-2 text-gray-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span className="text-base font-bold">Registrations Closed</span>
                        </div>
                      </div>
                    ) : (
                      <Button 
                        onClick={handleRegisterClick}
                        disabled={isRegistering || isRegistered}
                        className={`w-full h-14 text-base font-bold rounded-xl transition-all ${
                          isRegistered 
                            ? 'bg-green-600 hover:bg-green-700 text-white cursor-default' 
                            : 'bg-black hover:bg-gray-800 text-white'
                        }`}
                      >
                        {isRegistering ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Registering...</span>
                          </div>
                        ) : isRegistered ? (
                          <div className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Registered ✓</span>
                          </div>
                        ) : (
                          'Register Now'
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Thank You Message */}
                  {showThankYou && (
                    <div className="mt-4 p-4 bg-green-50 border-2 border-green-500 rounded-xl animate-fade-in">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-green-900 mb-1">Successfully Registered!</p>
                          <p className="text-sm text-green-700">
                            You're all set! We'll send you a confirmation email with event details.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                 

                </div>
              </div>

            </div>
          </div>

        </div>
        
      </div>
    </div>
  );
}