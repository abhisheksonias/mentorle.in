import { supabase } from "@/lib/supabase";

/**
 * Mentor Event Service - Handles mentor-specific event operations
 * Filters events by created_by to show only mentor's own events
 */

// Fetch events created by the current mentor
export const fetchMentorEvents = async (mentorUserId) => {
  try {
    const { data: events, error } = await supabase
      .from("events_programs")
      .select("*")
      .eq("created_by", mentorUserId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Fetch participant counts for all events
    const eventsWithCounts = await Promise.all(
      (events || []).map(async (event) => {
        const { count, error: countError } = await supabase
          .from("event_participants")
          .select("*", { count: "exact", head: true })
          .eq("event_id", event.id);

        return {
          ...event,
          participant_count: countError ? 0 : (count || 0)
        };
      })
    );

    return { data: eventsWithCounts, error: null };
  } catch (error) {
    console.error("Error fetching mentor events:", error);
    return { data: null, error };
  }
};

// Create a new event (mentor-specific defaults)
export const createMentorEvent = async (eventData, mentorUserId) => {
  try {
    const { data, error } = await supabase
      .from("events_programs")
      .insert([{
        ...eventData,
        created_by: mentorUserId,
        college_name: eventData.college_name || "Online" // Default for mentors
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error creating event:", error);
    return { data: null, error };
  }
};

// Update an existing event (only if owned by mentor)
export const updateMentorEvent = async (eventId, eventData, mentorUserId) => {
  try {
    // First verify ownership
    const { data: existing, error: checkError } = await supabase
      .from("events_programs")
      .select("created_by")
      .eq("id", eventId)
      .single();

    if (checkError) throw checkError;
    
    if (existing.created_by !== mentorUserId) {
      throw new Error("You can only edit your own events");
    }

    const { data, error } = await supabase
      .from("events_programs")
      .update(eventData)
      .eq("id", eventId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error updating event:", error);
    return { data: null, error };
  }
};

// Delete an event (only if owned by mentor)
export const deleteMentorEvent = async (eventId, mentorUserId) => {
  try {
    // First verify ownership
    const { data: existing, error: checkError } = await supabase
      .from("events_programs")
      .select("created_by")
      .eq("id", eventId)
      .single();

    if (checkError) throw checkError;
    
    if (existing.created_by !== mentorUserId) {
      throw new Error("You can only delete your own events");
    }

    const { error } = await supabase
      .from("events_programs")
      .delete()
      .eq("id", eventId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error("Error deleting event:", error);
    return { error };
  }
};

// Upload event banner image
export const uploadEventBanner = async (file, eventId) => {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${eventId}-${Date.now()}.${fileExt}`;
    const filePath = `events/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("media")
      .getPublicUrl(filePath);

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error("Error uploading banner:", error);
    return { url: null, error };
  }
};

// Delete event banner from storage
export const deleteEventBanner = async (bannerUrl) => {
  try {
    if (!bannerUrl) return { error: null };
    
    const path = bannerUrl.split("/media/")[1];
    if (!path) return { error: null };

    const { error } = await supabase.storage
      .from("media")
      .remove([path]);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error("Error deleting banner:", error);
    return { error };
  }
};

