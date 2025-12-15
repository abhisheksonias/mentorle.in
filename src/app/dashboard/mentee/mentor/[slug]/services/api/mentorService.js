import { supabase } from "@/lib/supabase";
import { slugToName } from "@/lib/slugUtils";

/**
 * MentorService - Handles all mentor-related API operations
 * This microservice encapsulates mentor data fetching with multiple fallback strategies
 */
export class MentorService {
  /**
   * Fetch mentor by slug with multiple fallback strategies
   * @param {string} slug - The mentor slug from URL
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  static async fetchMentorBySlug(slug) {
    try {
      // Check if slug is actually a UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      if (isUUID) {
        const { data, error } = await supabase
          .from("mentor_data")
          .select("*")
          .eq("user_id", slug)
          .eq("status", "approved")
          .single();
        
        if (!error && data) {
          return { data, error: null };
        }
      }

      const mentorName = slugToName(slug);
      console.log("Looking for mentor with name:", mentorName);
      
      // Strategy 1: Try to match slug directly (replace hyphens with spaces)
      const slugAsName = slug.replace(/-/g, " ");
      const slugResult = await supabase
        .from("mentor_data")
        .select("*")
        .eq("status", "approved")
        .ilike("name", slugAsName)
        .limit(1);

      if (!slugResult.error && slugResult.data && slugResult.data.length > 0) {
        return { data: slugResult.data[0], error: null };
      }

      // Strategy 2: Exact match
      const exactResult = await supabase
        .from("mentor_data")
        .select("*")
        .eq("status", "approved")
        .eq("name", mentorName)
        .single();

      if (!exactResult.error && exactResult.data) {
        return { data: exactResult.data, error: null };
      }

      // Strategy 3: Case-insensitive match
      console.log("Exact match failed, trying case-insensitive match");
      const caseInsensitiveResult = await supabase
        .from("mentor_data")
        .select("*")
        .eq("status", "approved")
        .ilike("name", mentorName)
        .limit(1);

      if (!caseInsensitiveResult.error && caseInsensitiveResult.data && caseInsensitiveResult.data.length > 0) {
        return { data: caseInsensitiveResult.data[0], error: null };
      }

      // Strategy 4: Partial match
      console.log("Case-insensitive match failed, trying partial match");
      const partialResult = await supabase
        .from("mentor_data")
        .select("*")
        .eq("status", "approved")
        .ilike("name", `%${mentorName}%`)
        .limit(1);

      if (!partialResult.error && partialResult.data && partialResult.data.length > 0) {
        return { data: partialResult.data[0], error: null };
      }

      // Strategy 5: Try matching first name or last name separately
      const nameParts = mentorName.split(" ").filter(p => p.length > 0);
      if (nameParts.length > 0) {
        const firstNameMatch = await supabase
          .from("mentor_data")
          .select("*")
          .eq("status", "approved")
          .or(`first_name.ilike.%${nameParts[0]}%,last_name.ilike.%${nameParts[0]}%`)
          .limit(1);

        if (!firstNameMatch.error && firstNameMatch.data && firstNameMatch.data.length > 0) {
          return { data: firstNameMatch.data[0], error: null };
        }
      }

      return { 
        data: null, 
        error: new Error(`Mentor not found for slug: ${slug}`) 
      };
    } catch (error) {
      console.error("Error in fetchMentorBySlug:", error);
      return { data: null, error };
    }
  }

  /**
   * Fetch mentor services (offerings) by user ID
   * @param {string} mentorUserId - The mentor's user ID
   * @returns {Promise<{data: Array, error: Error|null}>}
   */
  static async fetchMentorServices(mentorUserId) {
    try {
      // Use mentorship_offerings table instead of mentor_services
      const { data, error } = await supabase
        .from("mentorship_offerings")
        .select("*")
        .eq("mentor_id", mentorUserId)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching mentor offerings:", error);
        // Return empty array instead of error to prevent page crash
        return { data: [], error: null };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error("Error in fetchMentorServices:", error);
      return { data: [], error: null };
    }
  }

  /**
   * Get mentor profile image URL
   * @param {string} profileUrl - The profile URL from mentor data
   * @returns {Promise<string>} - Returns the processed image URL
   */
  static async getProfileImageUrl(profileUrl) {
    try {
      if (!profileUrl) {
        return "";
      }

      if (profileUrl.startsWith("http")) {
        return profileUrl;
      }

      const { data } = supabase.storage.from("media").getPublicUrl(profileUrl);
      return data?.publicUrl || "";
    } catch (error) {
      console.error("Error getting profile image URL:", error);
      return "";
    }
  }

  /**
   * Fetch complete mentor data with services and profile image
   * @param {string} slug - The mentor slug from URL
   * @returns {Promise<{mentor: Object|null, services: Array, imageUrl: string, error: Error|null}>}
   */
  static async fetchMentorComplete(slug) {
    try {
      // Fetch mentor data
      const { data: mentor, error: mentorError } = await this.fetchMentorBySlug(slug);
      
      if (mentorError || !mentor) {
        return { 
          mentor: null, 
          services: [], 
          imageUrl: "", 
          error: mentorError || new Error("Mentor not found") 
        };
      }

      // Fetch services and image URL in parallel
      const [servicesResult, imageUrl] = await Promise.all([
        this.fetchMentorServices(mentor.user_id),
        this.getProfileImageUrl(mentor.profile_url)
      ]);

      return {
        mentor,
        services: servicesResult.data,
        imageUrl,
        error: servicesResult.error
      };
    } catch (error) {
      console.error("Error in fetchMentorComplete:", error);
      return { 
        mentor: null, 
        services: [], 
        imageUrl: "", 
        error 
      };
    }
  }
}

export default MentorService;