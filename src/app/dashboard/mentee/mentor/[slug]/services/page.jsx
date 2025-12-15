"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Calendar, Clock, IndianRupee, MessageSquare, User, ArrowRight, Briefcase, Linkedin, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import OfferingCard from "@/components/mentorship/OfferingCard";

// Import microservices
import MentorService from "./api/mentorService";

// Loading and Error States
function LoadingState() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading mentor services...</p>
      </div>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Mentor Not Found</h1>
        <Link 
          href="/dashboard/mentee/findmentor"
          className="text-purple-600 hover:text-purple-800 font-medium"
        >
          ← Back to Find Mentors
        </Link>
      </div>
    </div>
  );
}

// Mentor Offerings Component
function MentorOfferings({ mentorId, mentorName }) {
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOfferings();
  }, [mentorId]);

  const fetchOfferings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/offerings?mentor_id=${mentorId}&status=active`, { headers });
      if (response.ok) {
        const { data } = await response.json();
        setOfferings(data || []);
      }
    } catch (error) {
      console.error("Error fetching offerings:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-gray-200">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Briefcase className="w-5 h-5" />
          Mentorship Offerings
        </CardTitle>
      </CardHeader>
      <CardContent>
        {offerings.length === 0 ? (
          <div className="text-center py-8">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No active offerings available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offerings.map((offering) => (
              <OfferingCard key={offering.id} offering={offering} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Mentor Events Component
function MentorEvents({ mentorId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [mentorId]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("created_by", mentorId)
        .gte("start_date", new Date().toISOString())
        .order("start_date", { ascending: true })
        .limit(5);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-gray-200">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No upcoming events</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/event/${event.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h4 className="font-medium text-gray-900 mb-2">{event.title}</h4>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(event.start_date), "MMM d, yyyy")}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {format(new Date(event.start_date), "h:mm a")}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Mentor Reviews Component
function MentorReviews({ mentorId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, [mentorId]);

  const fetchReviews = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/feedback?mentor_id=${mentorId}&status=active`, { headers });
      if (response.ok) {
        const { data } = await response.json();
        setReviews(data || []);
        
        // Calculate average rating
        const ratings = data.filter(r => r.rating).map(r => r.rating);
        if (ratings.length > 0) {
          const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
          setAverageRating(avg);
        }
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-gray-200">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Reviews & Feedback
          </CardTitle>
          {averageRating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{averageRating.toFixed(1)}</span>
              <span className="text-sm text-gray-500">({reviews.length})</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No reviews yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.slice(0, 5).map((review) => (
              <div key={review.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{review.user?.name || "Anonymous"}</p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {format(new Date(review.created_at), "MMM d, yyyy")}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-700 mt-2">{review.comment}</p>
                )}
                {review.mentor_response && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-600 mb-1">Mentor Response:</p>
                    <p className="text-sm text-gray-700">{review.mentor_response}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MentorServicesPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [mentor, setMentor] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    fetchMentorAndServices();
  }, [params.slug]);

  const fetchMentorAndServices = async () => {
    try {
      setLoading(true);

      const result = await MentorService.fetchMentorComplete(params.slug);
      
      if (result.error || !result.mentor) {
        console.error("Error fetching mentor data:", result.error);
        console.log("Slug used:", params.slug);
        
        // Try alternative: fetch by user_id if slug is actually a UUID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.slug);
        
        if (isUUID) {
          const { data: mentorByUuid, error: uuidError } = await supabase
            .from("mentor_data")
            .select("*")
            .eq("user_id", params.slug)
            .eq("status", "approved")
            .single();

          if (!uuidError && mentorByUuid) {
            const imageUrl = await MentorService.getProfileImageUrl(mentorByUuid.profile_url);
            setMentor(mentorByUuid);
            setServices([]);
            setImageUrl(imageUrl);
            setLoading(false);
            return;
          }
        }

        toast({
          title: "Error",
          description: result.error?.message || "Mentor not found",
          variant: "destructive",
        });
        // Don't redirect immediately, let user see the error
        setLoading(false);
        return;
      }

      setMentor(result.mentor);
      setServices(result.services || []);
      setImageUrl(result.imageUrl || "");
      
      if (result.error) {
        console.error("Error fetching services:", result.error);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load mentor data",
        variant: "destructive",
      });
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!mentor) {
    return <NotFoundState />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                {mentor.name} - Services
              </h1>
              <p className="text-gray-600 mt-2">Discover mentorship offerings designed for your success</p>
            </div>
            <Link 
              href="/dashboard/mentee/findmentor"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              ← Back to Mentors
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Enhanced Mentor Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-8">
              {/* Profile Image Section */}
              <div className="relative">
                <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                  {imageUrl && !imageError ? (
                    <Image
                      src={imageUrl}
                      alt={mentor.name || 'Mentor Profile'}
                      fill
                      className="object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center">
                        <span className="text-3xl font-bold text-purple-600">
                          {mentor.name ? mentor.name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2) : '?'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Glare Effect Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none"></div>
                  
                  {/* Badge */}
                  {mentor.badge && (
                    <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold text-white ${
                      mentor.badge.toLowerCase() === 'instructor' ? 'bg-green-600' : 'bg-blue-600'
                    }`}>
                      {mentor.badge.charAt(0).toUpperCase() + mentor.badge.slice(1)}
                    </span>
                  )}
                </div>
                
                {/* Profile Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent text-white">
                  <h2 className="text-2xl font-bold mb-1">{mentor.name}</h2>
                  {mentor.current_role && (
                    <p className="text-gray-200">{mentor.current_role}</p>
                  )}
                </div>
              </div>
              
              {/* Profile Details */}
              <div className="p-6">
                {/* Experience and Location */}
                {(mentor.experience_years || mentor.location) && (
                  <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                    {mentor.experience_years && (
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-gray-900">{mentor.experience_years}</span>
                        <span>years exp</span>
                      </div>
                    )}
                    {mentor.location && (
                      <span>{mentor.location}</span>
                    )}
                  </div>
                )}
                
                {/* Bio */}
                {mentor.bio && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-4">
                      {mentor.bio}
                    </p>
                  </div>
                )}
                
                {/* Expertise Areas */}
                {mentor.expertise_area && mentor.expertise_area.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Expertise</h3>
                    <div className="flex flex-wrap gap-2">
                      {mentor.expertise_area.slice(0, 4).map((area, index) => (
                        <span
                          key={index}
                          className="inline-block px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full"
                        >
                          {area}
                        </span>
                      ))}
                      {mentor.expertise_area.length > 4 && (
                        <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                          +{mentor.expertise_area.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Rating Display */}
                {mentor.average_rating && (
                  <div className="flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-lg mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-gray-900">{mentor.average_rating.toFixed(1)}</span>
                    </div>
                    <span className="text-gray-500 text-sm">• Verified Mentor</span>
                  </div>
                )}

                {/* Social Links */}
                {(mentor.linkedin_url || mentor.github_url || mentor.portfolio_url) && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm">Connect</h3>
                    <div className="flex gap-2">
                      {mentor.linkedin_url && (
                        <a
                          href={mentor.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                      {mentor.github_url && (
                        <a
                          href={mentor.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                          </svg>
                        </a>
                      )}
                      {mentor.portfolio_url && (
                        <a
                          href={mentor.portfolio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Services Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Offerings Section */}
            <MentorOfferings mentorId={mentor.user_id} mentorName={mentor.name} />
            
            {/* Events Section */}
            <MentorEvents mentorId={mentor.user_id} />
            
            {/* Reviews Section */}
            <MentorReviews mentorId={mentor.user_id} />
          </div>
        </div>
      </div>
    </div>
  );
}
