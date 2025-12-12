"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, Calendar, Video, FileText, Layers, Settings, ChevronDown, ChevronUp, Users, Link, User } from "lucide-react";
import { getISTDateString, extractISTTime } from "../utils/timezone";
import SessionManager from "./SessionManager";

export default function EventForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData = null,
  isSubmitting 
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_type: "workshop",
    location: "",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    meeting_link: "",
    status: "upcoming",
    // Advanced settings
    max_participants: "",
    registration_deadline: "",
    registration_link: "",
    prerequisites: "",
    learning_outcomes: "",
    // Speaker details
    speaker_name: "",
    speaker_linkedin: "",
    speaker_github: "",
    speaker_image: ""
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Multi-session state
  const [isMultiSession, setIsMultiSession] = useState(false);
  const [sessions, setSessions] = useState([]);
  
  // Advanced settings toggle
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Initialize form with existing data when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        event_type: initialData.event_type || "workshop",
        location: initialData.location || "",
        start_date: initialData.start_date ? getISTDateString(initialData.start_date) : "",
        start_time: initialData.start_date ? extractISTTime(initialData.start_date) : "",
        end_date: initialData.end_date ? getISTDateString(initialData.end_date) : "",
        end_time: initialData.end_date ? extractISTTime(initialData.end_date) : "",
        meeting_link: initialData.meeting_link || "",
        status: initialData.status || "upcoming",
        // Advanced settings
        max_participants: initialData.max_participants || "",
        registration_deadline: initialData.registration_deadline ? getISTDateString(initialData.registration_deadline) : "",
        registration_link: initialData.registration_link || "",
        prerequisites: initialData.prerequisites || "",
        learning_outcomes: initialData.learning_outcomes || "",
        // Speaker details
        speaker_name: initialData.speaker_name || "",
        speaker_linkedin: initialData.speaker_linkedin || "",
        speaker_github: initialData.speaker_github || "",
        speaker_image: initialData.speaker_image || ""
      });
      setImagePreview(initialData.banner_image_url || null);
      
      // Check if event has sessions
      if (initialData.sessions && initialData.sessions.length > 0) {
        setIsMultiSession(true);
        setSessions(initialData.sessions);
      } else {
        setIsMultiSession(false);
        setSessions([]);
      }
      
      // Show advanced settings if any are filled
      if (initialData.max_participants || initialData.registration_deadline || 
          initialData.registration_link || initialData.prerequisites || 
          initialData.learning_outcomes || initialData.speaker_name) {
        setShowAdvanced(true);
      }
    } else {
      resetForm();
    }
  }, [initialData, isOpen]);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      event_type: "workshop",
      location: "",
      start_date: "",
      start_time: "",
      end_date: "",
      end_time: "",
      meeting_link: "",
      status: "upcoming",
      // Advanced settings
      max_participants: "",
      registration_deadline: "",
      registration_link: "",
      prerequisites: "",
      learning_outcomes: "",
      // Speaker details
      speaker_name: "",
      speaker_linkedin: "",
      speaker_github: "",
      speaker_image: ""
    });
    setImageFile(null);
    setImagePreview(null);
    setIsMultiSession(false);
    setShowAdvanced(false);
    setSessions([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSessionModeToggle = (multiSession) => {
    setIsMultiSession(multiSession);
    if (!multiSession) {
      setSessions([]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Double-check validation before submitting
    if (!isFormValid()) {
      return;
    }
    
    // For multi-session, only include valid sessions (with all required fields)
    const validSessions = isMultiSession 
      ? sessions.filter(s => s.date && s.start_time && s.end_time)
      : [];
    
    // Include sessions in form data if multi-session mode
    const submitData = {
      ...formData,
      sessions: validSessions
    };
    
    onSubmit(submitData, imageFile);
  };

  // Check if form is valid for submission
  const isFormValid = () => {
    const hasBasicInfo = formData.title && formData.description;
    
    if (isMultiSession) {
      // For multi-session, need at least one valid session
      return hasBasicInfo && sessions.length > 0 && sessions.every(s => s.date && s.start_time && s.end_time);
    } else {
      // For single session, need date/time fields
      return hasBasicInfo && formData.start_date && formData.start_time && formData.end_date && formData.end_time;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {initialData ? "Edit Event" : "Create New Event"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Event Basics */}
          <div className="bg-gray-50 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Event Basics
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Introduction to React Workshop"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe what attendees will learn..."
                  rows={3}
                  required
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="event_type">Event Type *</Label>
                  <select
                    id="event_type"
                    name="event_type"
                    value={formData.event_type}
                    onChange={handleInputChange}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black bg-white"
                    required
                  >
                    <option value="workshop">Workshop</option>
                    <option value="bootcamp">Bootcamp</option>
                    <option value="guest_session">Guest Session</option>
                    <option value="event">Event</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="status">Status *</Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black bg-white"
                    required
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Featured Image */}
              <div>
                <Label htmlFor="banner_image">Featured Image</Label>
                <Input
                  id="banner_image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="mt-1 cursor-pointer"
                />
                {imagePreview && (
                  <div className="mt-3">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Session Mode Toggle */}
          <div className="bg-gray-50 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Session Type
            </h3>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleSessionModeToggle(false)}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  !isMultiSession 
                    ? 'border-black bg-black text-white' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="font-medium">Single Session</div>
                <div className={`text-sm mt-1 ${!isMultiSession ? 'text-gray-300' : 'text-gray-500'}`}>
                  One-time event with fixed date
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => handleSessionModeToggle(true)}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  isMultiSession 
                    ? 'border-black bg-black text-white' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="font-medium">Multiple Sessions</div>
                <div className={`text-sm mt-1 ${isMultiSession ? 'text-gray-300' : 'text-gray-500'}`}>
                  Series with multiple dates
                </div>
              </button>
            </div>
          </div>

          {/* Schedule - Single Session */}
          {!isMultiSession && (
            <div className="bg-gray-50 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule (IST)
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input
                      id="start_date"
                      name="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                      required={!isMultiSession}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="start_time">Start Time *</Label>
                    <Input
                      id="start_time"
                      name="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={handleInputChange}
                      required={!isMultiSession}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="end_date">End Date *</Label>
                    <Input
                      id="end_date"
                      name="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                      required={!isMultiSession}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_time">End Time *</Label>
                    <Input
                      id="end_time"
                      name="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={handleInputChange}
                      required={!isMultiSession}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Location (Optional)</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g., Online or venue address"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="meeting_link">Meeting Link</Label>
                  <Input
                    id="meeting_link"
                    name="meeting_link"
                    type="url"
                    value={formData.meeting_link}
                    onChange={handleInputChange}
                    placeholder="https://zoom.us/j/... or Google Meet link"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Schedule - Multiple Sessions */}
          {isMultiSession && (
            <div className="bg-gray-50 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Sessions (IST)
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="location">Location (applies to all sessions)</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g., Online or venue address"
                    className="mt-1"
                  />
                </div>
                
                <SessionManager 
                  sessions={sessions} 
                  onChange={setSessions} 
                />
                
                {sessions.length === 0 && (
                  <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                    Add at least one session to create a multi-session event
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Advanced Settings (Collapsible) */}
          <div className="border rounded-lg">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">Advanced Settings</span>
                <span className="text-xs text-gray-400">(Optional)</span>
              </div>
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </button>
            
            {showAdvanced && (
              <div className="p-5 pt-0 space-y-6 border-t">
                {/* Registration Settings */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Registration Settings
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="max_participants">Max Participants</Label>
                      <Input
                        id="max_participants"
                        name="max_participants"
                        type="number"
                        min="1"
                        value={formData.max_participants}
                        onChange={handleInputChange}
                        placeholder="e.g., 50"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="registration_deadline">Registration Deadline</Label>
                      <Input
                        id="registration_deadline"
                        name="registration_deadline"
                        type="date"
                        value={formData.registration_deadline}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="registration_link">External Registration Link</Label>
                    <Input
                      id="registration_link"
                      name="registration_link"
                      type="url"
                      value={formData.registration_link}
                      onChange={handleInputChange}
                      placeholder="https://forms.google.com/..."
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Optional: Link to external registration form</p>
                  </div>
                </div>

                {/* Content Details */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Content Details
                  </h4>
                  
                  <div>
                    <Label htmlFor="prerequisites">Prerequisites</Label>
                    <Textarea
                      id="prerequisites"
                      name="prerequisites"
                      value={formData.prerequisites}
                      onChange={handleInputChange}
                      placeholder="What should attendees know beforehand?"
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="learning_outcomes">Learning Outcomes</Label>
                    <Textarea
                      id="learning_outcomes"
                      name="learning_outcomes"
                      value={formData.learning_outcomes}
                      onChange={handleInputChange}
                      placeholder="What will attendees learn from this event?"
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Speaker Details */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Speaker Details
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="speaker_name">Speaker Name</Label>
                      <Input
                        id="speaker_name"
                        name="speaker_name"
                        value={formData.speaker_name}
                        onChange={handleInputChange}
                        placeholder="John Doe"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="speaker_image">Speaker Image URL</Label>
                      <Input
                        id="speaker_image"
                        name="speaker_image"
                        type="url"
                        value={formData.speaker_image}
                        onChange={handleInputChange}
                        placeholder="https://..."
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="speaker_linkedin">Speaker LinkedIn</Label>
                      <Input
                        id="speaker_linkedin"
                        name="speaker_linkedin"
                        type="url"
                        value={formData.speaker_linkedin}
                        onChange={handleInputChange}
                        placeholder="https://linkedin.com/in/..."
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="speaker_github">Speaker GitHub</Label>
                      <Input
                        id="speaker_github"
                        name="speaker_github"
                        type="url"
                        value={formData.speaker_github}
                        onChange={handleInputChange}
                        placeholder="https://github.com/..."
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !isFormValid()}
            >
              {isSubmitting ? "Saving..." : initialData ? "Update Event" : "Create Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
