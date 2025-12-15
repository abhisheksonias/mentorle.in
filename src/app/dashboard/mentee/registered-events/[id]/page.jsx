"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Play, CheckCircle, Clock, BookOpen, Award, MapPin, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import Link from "next/link";

export default function RegisteredEventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (params.id) {
      fetchEventDetails();
    }
  }, [params.id]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      // Get event details
      const { data: eventData, error: eventError } = await supabase
        .from("events_programs")
        .select("*")
        .eq("id", params.id)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      // Get registration and progress
      const { data: registration, error: regError } = await supabase
        .from("event_participants")
        .select("completion_status, attendance_status, progress_data")
        .eq("event_id", params.id)
        .eq("user_id", session.user.id)
        .single();

      if (regError && regError.code !== "PGRST116") {
        console.error("Error fetching registration:", regError);
      }

      // Check if this is a course/bootcamp
      const isCourse = eventData.event_type === "bootcamp" || eventData.event_type === "course";
      
      if (isCourse) {
        // Parse modules from event data or progress data
        // For now, we'll create sample modules structure
        // In production, this would come from a course_modules table or event metadata
        const courseModules = eventData.course_modules || generateSampleModules(eventData);
        setModules(courseModules);
      } else {
        // For non-course events, show event details instead
        setModules([]);
      }

      // Calculate progress (only for courses)
      if (isCourse && registration?.progress_data) {
        const progressData = typeof registration.progress_data === 'string' 
          ? JSON.parse(registration.progress_data) 
          : registration.progress_data;
        const completedModules = progressData.completed_modules || [];
        const courseModules = eventData.course_modules || generateSampleModules(eventData);
        const progressPercent = courseModules.length > 0 
          ? (completedModules.length / courseModules.length) * 100 
          : 0;
        setProgress(progressPercent);
      } else {
        setProgress(0);
      }
    } catch (error) {
      console.error("Error fetching event details:", error);
      toast({
        title: "Error",
        description: "Failed to load course details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSampleModules = (event) => {
    // Generate sample modules based on event type
    // In production, this would come from database
    if (event.event_type === "bootcamp" || event.event_type === "course") {
      return [
        { id: 1, title: "Introduction", duration: "30 min", completed: false },
        { id: 2, title: "Getting Started", duration: "45 min", completed: false },
        { id: 3, title: "Core Concepts", duration: "60 min", completed: false },
        { id: 4, title: "Advanced Topics", duration: "90 min", completed: false },
        { id: 5, title: "Final Project", duration: "120 min", completed: false }
      ];
    }
    return [];
  };

  const handleModuleComplete = async (moduleId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Update module completion status
      const updatedModules = modules.map(m => 
        m.id === moduleId ? { ...m, completed: true } : m
      );
      setModules(updatedModules);

      const completedModules = updatedModules.filter(m => m.completed).map(m => m.id);
      const progressPercent = (completedModules.length / modules.length) * 100;
      setProgress(progressPercent);

      // Save progress to database
      const { error } = await supabase
        .from("event_participants")
        .update({
          progress_data: {
            completed_modules: completedModules,
            last_accessed_module: moduleId,
            progress_percent: progressPercent
          },
          completion_status: progressPercent === 100 ? "completed" : "in_progress"
        })
        .eq("event_id", params.id)
        .eq("user_id", session.user.id);

      if (error) throw error;

      toast({
        title: "Progress Saved",
        description: "Your progress has been saved successfully",
      });
    } catch (error) {
      console.error("Error saving progress:", error);
      toast({
        title: "Error",
        description: "Failed to save progress",
        variant: "destructive"
      });
    }
  };

  const handleResumeModule = (module) => {
    // Navigate to module content or open in new tab
    if (module.content_url) {
      window.open(module.content_url, "_blank");
    } else {
      toast({
        title: "Module Content",
        description: `Starting ${module.title}...`,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-500">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30 flex items-center justify-center">
        <Card className="p-12 text-center border-gray-200">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Event Not Found</h3>
          <p className="text-gray-500 mb-4">The event you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/dashboard/mentee/registered-events")} className="bg-black text-white">
            Back to Registered Events
          </Button>
        </Card>
      </div>
    );
  }

  const isCourse = event.event_type === "bootcamp" || event.event_type === "course";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30">
      <div className="max-w-5xl mx-auto px-4 py-8 mt-10">
        {/* Back Button */}
        <Link
          href="/dashboard/mentee/registered-events"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Registered Events
        </Link>

        {/* Event Header */}
        <Card className="p-8 mb-6 border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <Badge variant="outline" className={`mb-3 ${
                isCourse ? "bg-indigo-100 text-indigo-800 border-indigo-200" :
                event.event_type === "hackathon" ? "bg-purple-100 text-purple-800 border-purple-200" :
                "bg-orange-100 text-orange-800 border-orange-200"
              }`}>
                {isCourse ? "📚 Course" : event.event_type === "hackathon" ? "💻 Hackathon" : "🎉 Event"}
              </Badge>
              <h1 className="text-3xl font-bold text-black mb-2">{event.title}</h1>
              {event.description && (
                <p className="text-gray-600 mb-4">{event.description}</p>
              )}
            </div>
          </div>

          {/* Progress Bar (only for courses) */}
          {isCourse && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Course Progress</span>
                <span className="text-sm font-bold text-indigo-700">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-indigo-200 rounded-full h-3">
                <div
                  className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Event Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {event.start_date && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Started: {format(parseISO(event.start_date), "MMM dd, yyyy")}</span>
              </div>
            )}
            {isCourse && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <BookOpen className="w-4 h-4" />
                <span>{modules.length} Modules</span>
              </div>
            )}
            {isCourse && progress === 100 && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Award className="w-4 h-4" />
                <span className="font-semibold">Course Completed!</span>
              </div>
            )}
          </div>
        </Card>

        {/* Modules List (only for courses) */}
        {isCourse ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-black mb-4">Course Modules</h2>
            {modules.length === 0 ? (
              <Card className="p-8 text-center border-gray-200">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Modules Available</h3>
                <p className="text-gray-500">Course content will be available soon.</p>
              </Card>
            ) : (
              modules.map((module, index) => (
              <Card key={module.id} className="p-6 border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-black">{module.title}</h3>
                        {module.duration && (
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {module.duration}
                          </p>
                        )}
                      </div>
                    </div>
                    {module.description && (
                      <p className="text-gray-600 ml-13 mt-2">{module.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {module.completed ? (
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Completed
                      </Badge>
                    ) : (
                      <Button
                        onClick={() => handleResumeModule(module)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {index === 0 || modules[index - 1]?.completed ? "Start" : "Locked"}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
            )}
          </div>
        ) : (
          <Card className="p-8 border-gray-200">
            <h2 className="text-2xl font-bold text-black mb-4">Event Details</h2>
            <div className="space-y-4">
              {event.start_date && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-700">
                    <strong>Start:</strong> {format(parseISO(event.start_date), "MMM dd, yyyy 'at' h:mm a")}
                  </span>
                </div>
              )}
              {event.end_date && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-700">
                    <strong>End:</strong> {format(parseISO(event.end_date), "MMM dd, yyyy 'at' h:mm a")}
                  </span>
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-700"><strong>Location:</strong> {event.location}</span>
                </div>
              )}
              {(event.registration_link || event.meeting_link) && (
                <div className="pt-4">
                  <Button
                    onClick={() => {
                      const link = event.registration_link || event.meeting_link;
                      if (link) window.open(link, "_blank");
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Join Event
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

