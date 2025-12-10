"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import RoleProtected from "@/components/RoleProtected";
import { ROLES } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";

// Components
import ProfilePicture from "./components/ProfilePicture";
import BasicInfo from "./components/BasicInfo";
import ProfessionalInfo from "./components/ProfessionalInfo";
import PastExperience from "./components/PastExperience";
import SocialLinks from "./components/SocialLinks";
import SaveStatus from "./components/SaveStatus";
import ProfileProgress from "./components/ProfileProgress";

// Hooks
import { useAutosave } from "./hooks/useAutosave";

// Utils
import { uploadProfileImage, deleteProfileImage, cleanupBrokenImageUrls } from "./utils/storageUtils";

function MentorProfileContent() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Form data according to mentor_data table schema
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    location: "",
    current_role: "",
    industry: "",
    experience_years: "",
    expertise_area: [],
    languages_spoken: [],
    past_experience: [],
    linkedin_url: "",
    github_url: "",
    youtube: "",
    portfolio_url: ""
  });

  // Autosave function - saves form data to database
  const saveFormData = useCallback(async (dataToSave) => {
    if (!profile?.user_id) {
      throw new Error("Profile not loaded");
    }

    // Validate required fields
    if (!dataToSave.name || !dataToSave.email) {
      throw new Error("Name and email are required");
    }

    const updateData = {
      name: dataToSave.name,
      email: dataToSave.email,
      phone: dataToSave.phone,
      bio: dataToSave.bio,
      location: dataToSave.location,
      current_role: dataToSave.current_role,
      Industry: dataToSave.industry,
      experience_years: dataToSave.experience_years ? parseInt(dataToSave.experience_years) : null,
      expertise_area: dataToSave.expertise_area,
      languages_spoken: dataToSave.languages_spoken,
      past_experience: dataToSave.past_experience,
      linkedin_url: dataToSave.linkedin_url,
      github_url: dataToSave.github_url,
      youtube: dataToSave.youtube,
      portfolio_url: dataToSave.portfolio_url,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from("mentor_data")
      .update(updateData)
      .eq("user_id", profile.user_id);

    if (error) {
      throw new Error(error.message);
    }
  }, [profile?.user_id]);

  // Setup autosave hook
  const { saveStatus, lastSaved, error: saveError, triggerSave, isSaving } = useAutosave({
    onSave: saveFormData,
    data: formData,
    debounceMs: 1500,
    enabled: !!profile?.user_id && !isLoading
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push("/login");
          return;
        }

        const { data, error } = await supabase
          .from("mentor_data")
          .select("*")
          .eq("user_id", session.user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          toast({
            title: "Error",
            description: "Failed to load profile data.",
            variant: "destructive",
          });
          return;
        }

        setProfile(data);
        setFormData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          bio: data.bio || "",
          location: data.location || "",
          current_role: data.current_role || "",
          industry: data.industry || "",
          experience_years: data.experience_years || "",
          expertise_area: data.expertise_area || [],
          languages_spoken: data.languages_spoken || [],
          past_experience: data.past_experience || [],
          linkedin_url: data.linkedin_url || "",
          github_url: data.github_url || "",
          youtube: data.youtube || "",
          portfolio_url: data.portfolio_url || ""
        });
        setAvatarUrl(data.profile_url || "");
        setIsLoading(false);

        // Clean up any broken image URLs
        if (data.profile_url) {
          cleanupBrokenImageUrls(session.user.id);
        }
      } catch (error) {
        console.error("Error in fetchProfile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile data.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [router, toast]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field, values) => {
    setFormData(prev => ({
      ...prev,
      [field]: values
    }));
  };

  const handleExperienceChange = (experience) => {
    setFormData(prev => ({
      ...prev,
      past_experience: experience
    }));
  };

  // Handle avatar change - upload immediately (separate from form autosave)
  const handleAvatarChange = async (file, previewUrl) => {
    setAvatarFile(file);
    setAvatarUrl(previewUrl);

    if (!file || !profile?.user_id) return;

    setIsUploadingAvatar(true);
    try {
      // Delete previous image if exists
      if (profile?.profile_url) {
        await deleteProfileImage(profile.profile_url);
      }

      // Upload new image
      const newProfileUrl = await uploadProfileImage(file, profile.user_id);

      // Update database with new profile URL
      const { error } = await supabase
        .from("mentor_data")
        .update({ 
          profile_url: newProfileUrl,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", profile.user_id);

      if (error) throw error;

      // Update local state
      setProfile(prev => ({ ...prev, profile_url: newProfileUrl }));
      setAvatarUrl(newProfileUrl);
      setAvatarFile(null);

      toast({
        title: "Success",
        description: "Profile picture updated!",
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Error",
        description: "Failed to upload profile picture.",
        variant: "destructive",
      });
      // Revert to previous avatar
      setAvatarUrl(profile?.profile_url || "");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Manual save handler (fallback)
  const handleManualSave = async () => {
    triggerSave();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-3">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
              <p className="text-gray-600">Update your mentor profile information</p>
            </div>
          </div>
          
          {/* Save Status Indicator - Below title */}
          <div className="flex items-center gap-3 ml-14">
            <SaveStatus 
              status={saveStatus} 
              lastSaved={lastSaved} 
              error={saveError}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column - Profile Picture & Progress */}
          <div className="lg:col-span-1 space-y-6">
            <ProfilePicture
              profileUrl={avatarUrl}
              onAvatarChange={handleAvatarChange}
              isUploading={isUploadingAvatar}
            />
            
            {/* Profile Completion Progress */}
            <ProfileProgress 
              formData={formData} 
              avatarUrl={avatarUrl}
            />
          </div>

          {/* Right Column - Profile Information */}
          <div className="lg:col-span-3 space-y-6">
            {/* Basic Information */}
            <BasicInfo
              formData={formData}
              onInputChange={handleInputChange}
            />

            {/* Professional Information */}
            <ProfessionalInfo
              formData={formData}
              onInputChange={handleInputChange}
              onArrayChange={handleArrayChange}
            />

            {/* Past Experience */}
            <PastExperience
              pastExperience={formData.past_experience}
              onExperienceChange={handleExperienceChange}
            />

            {/* Social Links */}
            <SocialLinks
              formData={formData}
              onInputChange={handleInputChange}
            />

            {/* Save Button */}
            <div className="flex justify-end pt-6">
              <Button
                onClick={handleManualSave}
                disabled={isSaving}
                variant="outline"
                className="flex items-center gap-2 px-6 py-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save Now"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MentorProfile() {
  return (
    <RoleProtected requiredRole={[ROLES.MENTOR, ROLES.PENDING_MENTOR]}>
      <MentorProfileContent />
    </RoleProtected>
  );
}
