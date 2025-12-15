"use client";

import { useState, useEffect } from "react";
import { X, Save, Upload, FileText, Eye, User, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { uploadProfileImage, uploadResume, deleteFile, validateImageFile, validateResumeFile } from "../utils/storageUtils";
import Image from "next/image";

const EDUCATION_LEVELS = [
  "High School",
  "Diploma",
  "Bachelor's Degree",
  "Master's Degree",
  "PhD",
  "Professional Certification",
  "Other"
];

const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Marketing",
  "Design",
  "Engineering",
  "Business",
  "Media & Entertainment",
  "Real Estate",
  "Consulting",
  "Government",
  "Non-profit",
  "Other"
];

const INTERESTS = [
  "Web Development",
  "Mobile Development",
  "Data Science",
  "Machine Learning",
  "Artificial Intelligence",
  "Cybersecurity",
  "Cloud Computing",
  "DevOps",
  "UI/UX Design",
  "Product Management",
  "Digital Marketing",
  "Business Strategy",
  "Entrepreneurship",
  "Leadership",
  "Communication",
  "Project Management",
  "Sales",
  "Finance",
  "Healthcare",
  "Education"
];

const LANGUAGES = [
  "English", "Hindi", "Spanish", "French", "German", "Chinese", "Japanese",
  "Korean", "Arabic", "Portuguese", "Russian", "Italian", "Dutch", "Other"
];

const SKILLS = [
  "JavaScript", "Python", "Java", "React", "Node.js", "TypeScript", "HTML/CSS",
  "SQL", "MongoDB", "AWS", "Docker", "Kubernetes", "Git", "Agile", "Scrum",
  "Figma", "Adobe XD", "Photoshop", "Illustrator", "Marketing", "Sales", "Writing"
];

const SESSION_TYPES = [
  "1-on-1 Video Call",
  "Group Session",
  "Email/Text Support",
  "Project Review",
  "Code Review"
];

const MENTOR_QUALITIES = [
  "Patient", "Experienced", "Encouraging", "Technical Expert", "Industry Leader",
  "Good Communicator", "Available", "Supportive", "Challenging", "Mentor"
];

export default function ProfileForm({ profile, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    current_status: "",
    education_level: "",
    goals: "",
    location: "",
    timezone: "Asia/Kolkata",
    languages: [],
    skills: [],
    interests: [],
    preferred_industries: [],
    education: {
      field: "",
      degree: "",
      school: "",
      start_year: "",
      end_year: ""
    },
    work_background: {
      company: "",
      position: "",
      start_date: "",
      end_date: "",
      description: ""
    },
    preferences: {
      mentor_qualities: [],
      session_type: [],
      preferred_time_windows: {
        morning: false,
        afternoon: false,
        evening: false,
        weekend: false
      }
    },
    linkedin_url: "",
    github_url: "",
    instagram_url: "",
    portfolio_url: "",
    profile_url: "",
    resume_url: ""
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
        current_status: profile.current_status || "",
        education_level: profile.education_level || "",
        goals: profile.goals || "",
        location: profile.location || "",
        timezone: profile.timezone || "Asia/Kolkata",
        languages: profile.languages || [],
        skills: profile.skills || [],
        interests: profile.interests || [],
        preferred_industries: profile.preferred_industries || [],
        education: {
          field: "",
          degree: "",
          school: "",
          start_year: "",
          end_year: "",
          ...(profile.education || {})
        },
        work_background: {
          company: "",
          position: "",
          start_date: "",
          end_date: "",
          description: "",
          ...(profile.work_background || {})
        },
        preferences: {
          mentor_qualities: profile.preferences?.mentor_qualities || [],
          session_type: profile.preferences?.session_type || [],
          preferred_time_windows: profile.preferences?.preferred_time_windows || {
            morning: false,
            afternoon: false,
            evening: false,
            weekend: false
          }
        },
        linkedin_url: profile.linkedin_url || "",
        github_url: profile.github_url || "",
        instagram_url: profile.instagram_url || "",
        portfolio_url: profile.portfolio_url || "",
        profile_url: profile.profile_url || "",
        resume_url: profile.resume_url || ""
      });
      setProfilePhotoPreview(profile.profile_url || "");
    }
  }, [profile]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

     if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
       newErrors.phone = "Please enter a valid phone number";
     }

     // Social media URL validation
     const isValidUrl = (url, expectedDomain) => {
       if (!url) return true; // Empty URLs are allowed
       try {
         const urlObj = new URL(url);
         return urlObj.hostname.includes(expectedDomain);
       } catch {
         return false;
       }
     };

     if (formData.linkedin_url && !isValidUrl(formData.linkedin_url, 'linkedin.com')) {
       newErrors.linkedin_url = "Please enter a valid LinkedIn URL";
     }

     if (formData.github_url && !isValidUrl(formData.github_url, 'github.com')) {
       newErrors.github_url = "Please enter a valid GitHub URL";
     }

     if (formData.instagram_url && !isValidUrl(formData.instagram_url, 'instagram.com')) {
       newErrors.instagram_url = "Please enter a valid Instagram URL";
     }

     if (formData.portfolio_url && !isValidUrl(formData.portfolio_url, '')) {
       try {
         new URL(formData.portfolio_url);
       } catch {
         newErrors.portfolio_url = "Please enter a valid portfolio URL";
       }
     }

     setErrors(newErrors);
     return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Ensure education object is properly formatted
      const formattedData = {
        ...formData,
        education: {
          field: formData.education?.field || "",
          degree: formData.education?.degree || "",
          school: formData.education?.school || "",
          start_year: formData.education?.start_year || "",
          end_year: formData.education?.end_year || ""
        }
      };
      
      await onSave(formattedData);
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleArrayChange = (field, value) => {
    const currentArray = formData[field];
    if (currentArray.includes(value)) {
      setFormData(prev => ({
        ...prev,
        [field]: currentArray.filter(item => item !== value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: [...currentArray, value]
      }));
    }
  };

  const handleEducationChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      education: {
        field: "",
        degree: "",
        school: "",
        start_year: "",
        end_year: "",
        ...prev.education,
        [field]: value
      }
    }));
  };

  const handleWorkBackgroundChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      work_background: {
        company: "",
        position: "",
        start_date: "",
        end_date: "",
        description: "",
        ...prev.work_background,
        [field]: value
      }
    }));
  };

  const handlePreferencesChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [field]: value
      }
    }));
  };

  const handleTimeWindowChange = (window, checked) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        preferred_time_windows: {
          ...prev.preferences.preferred_time_windows,
          [window]: checked
        }
      }
    }));
  };

  const handleProfilePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      toast({
        title: "Invalid file",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => setProfilePhotoPreview(e.target.result);
      reader.readAsDataURL(file);

      if (profile?.user_id) {
        // Delete old photo if exists
        if (profile.profile_url) {
          await deleteFile(profile.profile_url, "mentee-profiles");
        }

        // Upload new photo
        const newProfileUrl = await uploadProfileImage(file, profile.user_id);
        setFormData(prev => ({ ...prev, profile_url: newProfileUrl }));
        setProfilePhotoPreview(newProfileUrl);

        toast({
          title: "Success",
          description: "Profile photo uploaded!",
        });
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast({
        title: "Error",
        description: "Failed to upload profile photo.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleResumeUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validation = validateResumeFile(file);
    if (!validation.isValid) {
      toast({
        title: "Invalid file",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setIsUploadingResume(true);
    try {
      if (profile?.user_id) {
        // Delete old resume if exists
        if (profile.resume_url) {
          await deleteFile(profile.resume_url, "mentee-resumes");
        }

        // Upload new resume
        const newResumeUrl = await uploadResume(file, profile.user_id);
        setFormData(prev => ({ ...prev, resume_url: newResumeUrl }));

        toast({
          title: "Success",
          description: "Resume uploaded!",
        });
      }
    } catch (error) {
      console.error("Error uploading resume:", error);
      toast({
        title: "Error",
        description: "Failed to upload resume.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingResume(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Edit Profile</h2>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Photo */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Photo</h3>
          <div className="flex items-center gap-6">
            <div className="relative">
              {profilePhotoPreview ? (
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-300">
                  <Image
                    src={profilePhotoPreview}
                    alt="Profile"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                  <User className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 cursor-pointer transition-colors">
                {isUploadingPhoto ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Photo
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePhotoUpload}
                  className="hidden"
                  disabled={isUploadingPhoto}
                />
              </label>
              <p className="text-sm text-gray-500 mt-2">JPG, PNG or GIF. Max 5MB</p>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter your full name"
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.phone ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter your phone number"
            />
            {errors.phone && (
              <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Status
            </label>
            <input
              type="text"
              value={formData.current_status}
              onChange={(e) => handleInputChange("current_status", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Student, Professional, Job Seeker"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Education Level
            </label>
            <select
              value={formData.education_level}
              onChange={(e) => handleInputChange("education_level", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select education level</option>
              {EDUCATION_LEVELS.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your location"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Languages
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3">
              {LANGUAGES.map(lang => (
                <label key={lang} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.languages.includes(lang)}
                    onChange={() => handleArrayChange("languages", lang)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{lang}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Skills
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3">
            {SKILLS.map(skill => (
              <label key={skill} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.skills.includes(skill)}
                  onChange={() => handleArrayChange("skills", skill)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{skill}</span>
              </label>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2">Select your technical and professional skills</p>
        </div>

        {/* Detailed Education */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Detailed Education</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Field of Study
              </label>
              <input
                type="text"
                value={formData.education?.field || ""}
                onChange={(e) => handleEducationChange("field", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Computer Science and Engineering"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Degree
              </label>
              <input
                type="text"
                value={formData.education?.degree || ""}
                onChange={(e) => handleEducationChange("degree", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., BTech, BSc, MSc"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School/University
              </label>
              <input
                type="text"
                value={formData.education?.school || ""}
                onChange={(e) => handleEducationChange("school", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Guru Nanak Dev University, Amritsar"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Year
                </label>
                <input
                  type="number"
                  value={formData.education?.start_year || ""}
                  onChange={(e) => handleEducationChange("start_year", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="2024"
                  min="1900"
                  max="2100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Year
                </label>
                <input
                  type="number"
                  value={formData.education?.end_year || ""}
                  onChange={(e) => handleEducationChange("end_year", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="2028"
                  min="1900"
                  max="2100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Work Background */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-900 mb-4">Work Background</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company/Organization
              </label>
              <input
                type="text"
                value={formData.work_background?.company || ""}
                onChange={(e) => handleWorkBackgroundChange("company", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., Google, Microsoft"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position/Role
              </label>
              <input
                type="text"
                value={formData.work_background?.position || ""}
                onChange={(e) => handleWorkBackgroundChange("position", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., Software Engineer, Intern"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.work_background?.start_date || ""}
                onChange={(e) => handleWorkBackgroundChange("start_date", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date (leave empty if current)
              </label>
              <input
                type="date"
                value={formData.work_background?.end_date || ""}
                onChange={(e) => handleWorkBackgroundChange("end_date", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.work_background?.description || ""}
                onChange={(e) => handleWorkBackgroundChange("description", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Describe your role and responsibilities"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => handleInputChange("bio", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Tell us about yourself, your background, and what you're looking to achieve"
            rows={4}
            maxLength={500}
          />
          <p className="text-gray-500 text-sm mt-1">
            {formData.bio.length}/500 characters
          </p>
        </div>

        {/* Goals */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Goals
          </label>
          <textarea
            value={formData.goals}
            onChange={(e) => handleInputChange("goals", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="What are your career or learning goals? What do you want to achieve?"
            rows={4}
            maxLength={500}
          />
          <p className="text-gray-500 text-sm mt-1">
            {formData.goals.length}/500 characters
          </p>
        </div>

        {/* Interests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Interests
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {INTERESTS.map(interest => (
              <label key={interest} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.interests.includes(interest)}
                  onChange={() => handleArrayChange("interests", interest)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{interest}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Preferred Industries */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Industries
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {INDUSTRIES.map(industry => (
              <label key={industry} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.preferred_industries.includes(industry)}
                  onChange={() => handleArrayChange("preferred_industries", industry)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{industry}</span>
              </label>
            ))}
          </div>
        </div>

         {/* Timezone */}
         <div>
           <label className="block text-sm font-medium text-gray-700 mb-2">
             Timezone
           </label>
           <select
             value={formData.timezone}
             onChange={(e) => handleInputChange("timezone", e.target.value)}
             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
           >
             <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
             <option value="UTC">UTC</option>
             <option value="America/New_York">America/New_York (EST)</option>
             <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
             <option value="Europe/London">Europe/London (GMT)</option>
             <option value="Europe/Paris">Europe/Paris (CET)</option>
             <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
             <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
           </select>
         </div>

        {/* Preferences */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-orange-900 mb-4">Mentorship Preferences</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Mentor Qualities
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {MENTOR_QUALITIES.map(quality => (
                  <label key={quality} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.preferences?.mentor_qualities?.includes(quality) || false}
                      onChange={() => {
                        const current = formData.preferences?.mentor_qualities || [];
                        const updated = current.includes(quality)
                          ? current.filter(q => q !== quality)
                          : [...current, quality];
                        handlePreferencesChange("mentor_qualities", updated);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{quality}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Session Types
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {SESSION_TYPES.map(type => (
                  <label key={type} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.preferences?.session_type?.includes(type) || false}
                      onChange={() => {
                        const current = formData.preferences?.session_type || [];
                        const updated = current.includes(type)
                          ? current.filter(t => t !== type)
                          : [...current, type];
                        handlePreferencesChange("session_type", updated);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Time Windows
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { key: "morning", label: "Morning (6 AM - 12 PM)" },
                  { key: "afternoon", label: "Afternoon (12 PM - 5 PM)" },
                  { key: "evening", label: "Evening (5 PM - 9 PM)" },
                  { key: "weekend", label: "Weekend" }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.preferences?.preferred_time_windows?.[key] || false}
                      onChange={(e) => handleTimeWindowChange(key, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

         {/* Social Media & Portfolio Links */}
         <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
           <h3 className="text-lg font-semibold text-purple-900 mb-4">Social Media & Portfolio Links</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 LinkedIn URL
               </label>
               <input
                 type="url"
                 value={formData.linkedin_url}
                 onChange={(e) => handleInputChange("linkedin_url", e.target.value)}
                 className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                   errors.linkedin_url ? 'border-red-300' : 'border-gray-300'
                 }`}
                 placeholder="https://linkedin.com/in/yourprofile"
               />
               {errors.linkedin_url && (
                 <p className="text-red-600 text-sm mt-1">{errors.linkedin_url}</p>
               )}
             </div>

             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 GitHub URL
               </label>
               <input
                 type="url"
                 value={formData.github_url}
                 onChange={(e) => handleInputChange("github_url", e.target.value)}
                 className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                   errors.github_url ? 'border-red-300' : 'border-gray-300'
                 }`}
                 placeholder="https://github.com/yourusername"
               />
               {errors.github_url && (
                 <p className="text-red-600 text-sm mt-1">{errors.github_url}</p>
               )}
             </div>

             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 Instagram URL
               </label>
               <input
                 type="url"
                 value={formData.instagram_url}
                 onChange={(e) => handleInputChange("instagram_url", e.target.value)}
                 className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                   errors.instagram_url ? 'border-red-300' : 'border-gray-300'
                 }`}
                 placeholder="https://instagram.com/yourusername"
               />
               {errors.instagram_url && (
                 <p className="text-red-600 text-sm mt-1">{errors.instagram_url}</p>
               )}
             </div>

             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 Portfolio URL
               </label>
               <input
                 type="url"
                 value={formData.portfolio_url}
                 onChange={(e) => handleInputChange("portfolio_url", e.target.value)}
                 className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                   errors.portfolio_url ? 'border-red-300' : 'border-gray-300'
                 }`}
                 placeholder="https://yourportfolio.com"
               />
               {errors.portfolio_url && (
                 <p className="text-red-600 text-sm mt-1">{errors.portfolio_url}</p>
               )}
             </div>
           </div>
         </div>

         {/* Resume Upload */}
         <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
           <h3 className="text-lg font-semibold text-gray-900 mb-4">Resume</h3>
           <div className="flex items-center gap-4">
             {formData.resume_url ? (
               <div className="flex items-center gap-3 p-3 bg-white border border-gray-300 rounded-lg flex-1">
                 <FileText className="w-5 h-5 text-gray-600" />
                 <div className="flex-1">
                   <p className="text-sm font-medium text-gray-900">Resume uploaded</p>
                   <a
                     href={formData.resume_url}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="text-sm text-blue-600 hover:underline"
                   >
                     View Resume
                   </a>
                 </div>
               </div>
             ) : (
               <p className="text-sm text-gray-500 flex-1">No resume uploaded</p>
             )}
             <label className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 cursor-pointer transition-colors">
               {isUploadingResume ? (
                 <>
                   <Loader2 className="w-4 h-4 animate-spin" />
                   Uploading...
                 </>
               ) : (
                 <>
                   <Upload className="w-4 h-4" />
                   {formData.resume_url ? "Replace Resume" : "Upload Resume"}
                 </>
               )}
               <input
                 type="file"
                 accept=".pdf,.doc,.docx"
                 onChange={handleResumeUpload}
                 className="hidden"
                 disabled={isUploadingResume}
               />
             </label>
           </div>
           <p className="text-sm text-gray-500 mt-2">PDF or Word document. Max 10MB</p>
         </div>

        {/* Profile Preview */}
        {showPreview && (
          <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Profile Preview (as visible to mentors)
            </h3>
            <div className="bg-white rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-4">
                {profilePhotoPreview ? (
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-300">
                    <Image
                      src={profilePhotoPreview}
                      alt="Profile"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                    <User className="w-10 h-10 text-gray-400" />
                  </div>
                )}
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{formData.name || "Your Name"}</h4>
                  <p className="text-gray-600">{formData.current_status || "Current Status"}</p>
                  <p className="text-sm text-gray-500">{formData.location || "Location"}</p>
                </div>
              </div>
              {formData.bio && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">About</h5>
                  <p className="text-gray-700 text-sm">{formData.bio}</p>
                </div>
              )}
              {formData.skills && formData.skills.length > 0 && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Skills</h5>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {formData.languages && formData.languages.length > 0 && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Languages</h5>
                  <p className="text-gray-700 text-sm">{formData.languages.join(", ")}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? "Hide Preview" : "Preview Profile"}
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
