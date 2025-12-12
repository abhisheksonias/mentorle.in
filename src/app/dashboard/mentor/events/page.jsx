"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import RoleProtected from "@/components/RoleProtected";
import { ROLES } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Clock, History, LayoutGrid } from "lucide-react";
import { supabase } from "@/lib/supabase";

// Services
import {
  fetchMentorEvents,
  createMentorEvent,
  updateMentorEvent,
  deleteMentorEvent,
  uploadEventBanner,
  deleteEventBanner
} from "./services/eventService";

// Components
import EventFilters from "./components/EventFilters";
import EventCard from "./components/EventCard";
import EventForm from "./components/EventForm";
import DeleteDialog from "./components/DeleteDialog";
import ParticipantsDialog from "./components/ParticipantsDialog";

// Utils
import { toUTC } from "./utils/timezone";

function MentorEventsContent() {
  const { toast } = useToast();

  // User state
  const [userId, setUserId] = useState(null);

  // State Management
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState("upcoming"); // "upcoming" | "past" | "all"
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isParticipantsDialogOpen, setIsParticipantsDialogOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get current user and load events
  useEffect(() => {
    const initializeAndLoadEvents = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user?.id) {
          toast({
            title: "Error",
            description: "Please log in to view your events",
            variant: "destructive"
          });
          return;
        }

        setUserId(session.user.id);
        
        // Load events inline
        setIsLoading(true);
        const { data, error } = await fetchMentorEvents(session.user.id);

        if (error) {
          toast({
            title: "Error",
            description: "Failed to load events. Please try again.",
            variant: "destructive"
          });
        } else {
          setEvents(data || []);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error initializing:", error);
        toast({
          title: "Error",
          description: "Failed to load events",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    };

    initializeAndLoadEvents();
  }, [toast]);

  // Reload events helper (used after CRUD operations)
  const reloadEvents = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    const { data, error } = await fetchMentorEvents(userId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load events. Please try again.",
        variant: "destructive"
      });
    } else {
      setEvents(data || []);
    }

    setIsLoading(false);
  };

  // Check if event is in the past
  const isEventPast = (event) => {
    const now = new Date();
    const eventEndDate = new Date(event.end_date);
    return eventEndDate < now;
  };

  // Filter Events
  const filteredEvents = events.filter((event) => {
    // Time-based filter (tabs)
    const matchesTab = (() => {
      if (activeTab === "all") return true;
      if (activeTab === "upcoming") return !isEventPast(event);
      if (activeTab === "past") return isEventPast(event);
      return true;
    })();

    const matchesSearch = 
      event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || event.event_type === filterType;
    const matchesStatus = filterStatus === "all" || event.status === filterStatus;

    return matchesTab && matchesSearch && matchesType && matchesStatus;
  });

  // Count events for tabs
  const upcomingCount = events.filter(e => !isEventPast(e)).length;
  const pastCount = events.filter(e => isEventPast(e)).length;

  // Handle Create Event
  const handleCreateEvent = async (formData, imageFile) => {
    if (!userId) return;
    
    setIsSubmitting(true);

    try {
      // Check if multi-session event
      const hasMultipleSessions = formData.sessions && formData.sessions.length > 0;
      
      // For multi-session events, use first session date as start and last session date as end
      let startDate, endDate;
      if (hasMultipleSessions) {
        // Filter out sessions with incomplete data
        const validSessions = formData.sessions.filter(s => 
          s.date && s.start_time && s.end_time
        );
        
        if (validSessions.length === 0) {
          throw new Error("Please add at least one session with complete date and time information");
        }

        const sortedSessions = [...validSessions].sort((a, b) => 
          new Date(a.date) - new Date(b.date)
        );
        const firstSession = sortedSessions[0];
        const lastSession = sortedSessions[sortedSessions.length - 1];
        startDate = toUTC(firstSession.date, firstSession.start_time || "00:00");
        endDate = toUTC(lastSession.date, lastSession.end_time || "23:59");
        
        // Update sessions to only include valid ones
        formData.sessions = validSessions;
      } else {
        // Validate single session has required time fields
        if (!formData.start_date || !formData.start_time || !formData.end_date || !formData.end_time) {
          throw new Error("Please provide valid date and time information");
        }
        startDate = toUTC(formData.start_date, formData.start_time);
        endDate = toUTC(formData.end_date, formData.end_time);
      }

      // Validate that we have dates
      if (!startDate || !endDate) {
        throw new Error("Please provide valid date and time information");
      }

      const eventData = {
        title: formData.title,
        description: formData.description,
        event_type: formData.event_type,
        college_name: "Online", // Required field - default for mentors
        location: formData.location || "Online",
        start_date: startDate,
        end_date: endDate,
        start_time: startDate, // Required timestamp field (same as start_date)
        meeting_link: hasMultipleSessions ? null : (formData.meeting_link || null),
        status: formData.status,
        banner_image_url: null,
        sessions: hasMultipleSessions ? formData.sessions : [],
        // Advanced settings (optional)
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        registration_deadline: formData.registration_deadline ? toUTC(formData.registration_deadline, "23:59") : null,
        registration_link: formData.registration_link || null,
        prerequisites: formData.prerequisites || null,
        learning_outcomes: formData.learning_outcomes || null,
        // Speaker details (optional)
        speaker_name: formData.speaker_name || null,
        speaker_linkedin: formData.speaker_linkedin || null,
        speaker_github: formData.speaker_github || null,
        speaker_image: formData.speaker_image || null
      };

      const { data: newEvent, error: createError } = await createMentorEvent(eventData, userId);

      if (createError) throw createError;

      // Upload banner image if provided
      if (imageFile && newEvent) {
        const { url, error: uploadError } = await uploadEventBanner(imageFile, newEvent.id);

        if (!uploadError && url) {
          await updateMentorEvent(newEvent.id, { banner_image_url: url }, userId);
          newEvent.banner_image_url = url;
        }
      }

      // Update local state
      setEvents([{ ...newEvent, participant_count: 0 }, ...events]);
      
      toast({
        title: "Success",
        description: "Event created successfully!",
      });

      setIsFormOpen(false);
      setCurrentEvent(null);
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Update Event
  const handleUpdateEvent = async (formData, imageFile) => {
    if (!userId || !currentEvent) return;
    
    setIsSubmitting(true);

    try {
      // Check if multi-session event
      const hasMultipleSessions = formData.sessions && formData.sessions.length > 0;
      
      // For multi-session events, use first session date as start and last session date as end
      let startDate, endDate;
      if (hasMultipleSessions) {
        // Filter out sessions with incomplete data
        const validSessions = formData.sessions.filter(s => 
          s.date && s.start_time && s.end_time
        );
        
        if (validSessions.length === 0) {
          throw new Error("Please add at least one session with complete date and time information");
        }

        const sortedSessions = [...validSessions].sort((a, b) => 
          new Date(a.date) - new Date(b.date)
        );
        const firstSession = sortedSessions[0];
        const lastSession = sortedSessions[sortedSessions.length - 1];
        startDate = toUTC(firstSession.date, firstSession.start_time || "00:00");
        endDate = toUTC(lastSession.date, lastSession.end_time || "23:59");
        
        // Update sessions to only include valid ones
        formData.sessions = validSessions;
      } else {
        // Validate single session has required time fields
        if (!formData.start_date || !formData.start_time || !formData.end_date || !formData.end_time) {
          throw new Error("Please provide valid date and time information");
        }
        startDate = toUTC(formData.start_date, formData.start_time);
        endDate = toUTC(formData.end_date, formData.end_time);
      }

      // Validate that we have dates
      if (!startDate || !endDate) {
        throw new Error("Please provide valid date and time information");
      }

      const eventData = {
        title: formData.title,
        description: formData.description,
        event_type: formData.event_type,
        college_name: "Online", // Required field - default for mentors
        location: formData.location || "Online",
        start_date: startDate,
        end_date: endDate,
        start_time: startDate, // Required timestamp field (same as start_date)
        meeting_link: hasMultipleSessions ? null : (formData.meeting_link || null),
        status: formData.status,
        sessions: hasMultipleSessions ? formData.sessions : [],
        // Advanced settings (optional)
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        registration_deadline: formData.registration_deadline ? toUTC(formData.registration_deadline, "23:59") : null,
        registration_link: formData.registration_link || null,
        prerequisites: formData.prerequisites || null,
        learning_outcomes: formData.learning_outcomes || null,
        // Speaker details (optional)
        speaker_name: formData.speaker_name || null,
        speaker_linkedin: formData.speaker_linkedin || null,
        speaker_github: formData.speaker_github || null,
        speaker_image: formData.speaker_image || null
      };

      // Handle banner image
      if (imageFile) {
        if (currentEvent.banner_image_url) {
          await deleteEventBanner(currentEvent.banner_image_url);
        }

        const { url, error: uploadError } = await uploadEventBanner(imageFile, currentEvent.id);

        if (!uploadError && url) {
          eventData.banner_image_url = url;
        }
      }

      const { data: updatedEvent, error: updateError } = await updateMentorEvent(
        currentEvent.id, 
        eventData, 
        userId
      );

      if (updateError) throw updateError;

      // Update local state
      setEvents(events.map(e => 
        e.id === currentEvent.id 
          ? { ...updatedEvent, participant_count: e.participant_count } 
          : e
      ));
      
      toast({
        title: "Success",
        description: "Event updated successfully!",
      });

      setIsFormOpen(false);
      setCurrentEvent(null);
    } catch (error) {
      console.error("Error updating event:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update event",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Event
  const handleDeleteEvent = async () => {
    if (!userId || !currentEvent) return;
    
    setIsDeleting(true);

    try {
      if (currentEvent.banner_image_url) {
        await deleteEventBanner(currentEvent.banner_image_url);
      }

      const { error } = await deleteMentorEvent(currentEvent.id, userId);

      if (error) throw error;

      setEvents(events.filter(e => e.id !== currentEvent.id));
      
      toast({
        title: "Success",
        description: "Event deleted successfully!",
      });

      setIsDeleteDialogOpen(false);
      setCurrentEvent(null);
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete event",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Dialog Handlers
  const openCreateDialog = () => {
    setCurrentEvent(null);
    setIsFormOpen(true);
  };

  const openEditDialog = (event) => {
    setCurrentEvent(event);
    setIsFormOpen(true);
  };

  const openDeleteDialog = (event) => {
    setCurrentEvent(event);
    setIsDeleteDialogOpen(true);
  };

  const openParticipantsDialog = (event) => {
    setCurrentEvent(event);
    setIsParticipantsDialogOpen(true);
  };

  const handleFormSubmit = (formData, imageFile) => {
    if (currentEvent) {
      handleUpdateEvent(formData, imageFile);
    } else {
      handleCreateEvent(formData, imageFile);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="h-7 w-7" />
                My Events
              </h1>
              <p className="text-gray-600 mt-1">
                Create and manage your workshops, bootcamps, and sessions
              </p>
            </div>
            <Button onClick={openCreateDialog} className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Event
            </Button>
          </div>
        </div>

        {/* Time Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
              activeTab === "upcoming"
                ? "bg-black text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            <Clock className="h-4 w-4" />
            Upcoming
            {upcomingCount > 0 && (
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                activeTab === "upcoming" ? "bg-white/20" : "bg-gray-100"
              }`}>
                {upcomingCount}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab("past")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
              activeTab === "past"
                ? "bg-black text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            <History className="h-4 w-4" />
            Past
            {pastCount > 0 && (
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                activeTab === "past" ? "bg-white/20" : "bg-gray-100"
              }`}>
                {pastCount}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab("all")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
              activeTab === "all"
                ? "bg-black text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            All
            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
              activeTab === "all" ? "bg-white/20" : "bg-gray-100"
            }`}>
              {events.length}
            </span>
          </button>
        </div>

        {/* Filters */}
        <EventFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterType={filterType}
          setFilterType={setFilterType}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
        />

        {/* Events Grid */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Loading your events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            {activeTab === "past" ? (
              <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            ) : activeTab === "upcoming" ? (
              <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            ) : (
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            )}
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {events.length === 0 
                ? "No events yet" 
                : activeTab === "upcoming" 
                  ? "No upcoming events"
                  : activeTab === "past"
                    ? "No past events"
                    : "No matching events"
              }
            </h3>
            <p className="text-gray-500 mb-6">
              {events.length === 0 
                ? "Create your first event to start engaging with mentees"
                : activeTab === "upcoming"
                  ? "Create a new event to get started"
                  : activeTab === "past"
                    ? "Your completed events will appear here"
                    : "Try adjusting your filters"
              }
            </p>
            {(events.length === 0 || activeTab === "upcoming") && (
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                {events.length === 0 ? "Create Your First Event" : "Create Event"}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={openEditDialog}
                onDelete={openDeleteDialog}
                onViewParticipants={openParticipantsDialog}
              />
            ))}
          </div>
        )}

        {/* Event Form Dialog */}
        <EventForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setCurrentEvent(null);
          }}
          onSubmit={handleFormSubmit}
          initialData={currentEvent}
          isSubmitting={isSubmitting}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setCurrentEvent(null);
          }}
          onConfirm={handleDeleteEvent}
          eventTitle={currentEvent?.title}
          isDeleting={isDeleting}
        />

        {/* Participants Dialog */}
        <ParticipantsDialog
          isOpen={isParticipantsDialogOpen}
          onClose={() => {
            setIsParticipantsDialogOpen(false);
            setCurrentEvent(null);
          }}
          event={currentEvent}
        />
      </div>
    </div>
  );
}

export default function MentorEventsPage() {
  return (
    <RoleProtected requiredRole={[ROLES.MENTOR, ROLES.PENDING_MENTOR]}>
      <MentorEventsContent />
    </RoleProtected>
  );
}

