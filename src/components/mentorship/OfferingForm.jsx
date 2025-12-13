"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Save, X, Clock, IndianRupee, Calendar, Shield } from "lucide-react";

const CATEGORIES = [
  { value: "resume_review", label: "Resume Review" },
  { value: "portfolio_review", label: "Portfolio Review" },
  { value: "career_guidance", label: "Career Guidance" },
  { value: "mock_interview", label: "Mock Interview" },
  { value: "code_review", label: "Code Review" },
  { value: "mentorship", label: "General Mentorship" },
  { value: "project_guidance", label: "Project Guidance" },
  { value: "other", label: "Other" }
];

const DURATIONS = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" }
];

export default function OfferingForm({ offering = null, onSave }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "mentorship",
    price: 0,
    currency: "INR",
    duration_minutes: 30,
    use_profile_availability: true,
    buffer_before_minutes: 5,
    buffer_after_minutes: 5,
    max_bookings_per_day: 5,
    advance_booking_days: 30,
    min_notice_hours: 24,
    cancellation_policy: "",
    preparation_notes: "",
    status: "draft"
  });

  useEffect(() => {
    if (offering) {
      setFormData({
        title: offering.title || "",
        description: offering.description || "",
        category: offering.category || "mentorship",
        price: offering.price || 0,
        currency: offering.currency || "INR",
        duration_minutes: offering.duration_minutes || 30,
        use_profile_availability: offering.use_profile_availability !== false,
        buffer_before_minutes: offering.buffer_before_minutes || 5,
        buffer_after_minutes: offering.buffer_after_minutes || 5,
        max_bookings_per_day: offering.max_bookings_per_day || 5,
        advance_booking_days: offering.advance_booking_days || 30,
        min_notice_hours: offering.min_notice_hours || 24,
        cancellation_policy: offering.cancellation_policy || "",
        preparation_notes: offering.preparation_notes || "",
        status: offering.status || "draft"
      });
    }
  }, [offering]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e, publishStatus = null) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.title.trim()) {
        throw new Error("Title is required");
      }

      const submitData = {
        ...formData,
        status: publishStatus || formData.status
      };

      const { supabase } = await import("@/lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();

      const headers = {
        "Content-Type": "application/json",
      };

      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const url = offering ? `/api/offerings/${offering.id}` : "/api/offerings";
      const method = offering ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(submitData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save offering");
      }

      toast({
        title: "Success",
        description: offering ? "Offering updated!" : "Offering created!",
      });

      if (onSave) {
        onSave(result.data);
      } else {
        router.push("/dashboard/offerings");
      }
    } catch (error) {
      console.error("Error saving offering:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="e.g., Resume Review 1:1"
              className="text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="What will mentees get from this session?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => handleChange("category", e.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Pricing & Duration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <IndianRupee className="w-5 h-5" />
            Pricing & Duration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="1"
                value={formData.price}
                onChange={(e) => handleChange("price", parseFloat(e.target.value) || 0)}
                placeholder="0 for free"
              />
              <p className="text-xs text-gray-500">Enter 0 for free sessions</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <select
                id="duration"
                value={formData.duration_minutes}
                onChange={(e) => handleChange("duration_minutes", parseInt(e.target.value))}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              >
                {DURATIONS.map(dur => (
                  <option key={dur.value} value={dur.value}>{dur.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Availability Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Availability
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Use Profile Availability</p>
              <p className="text-sm text-gray-500">Sync with your weekly availability settings</p>
            </div>
            <Switch
              checked={formData.use_profile_availability}
              onCheckedChange={(checked) => handleChange("use_profile_availability", checked)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="buffer_before">Buffer Before (minutes)</Label>
              <Input
                id="buffer_before"
                type="number"
                min="0"
                max="60"
                value={formData.buffer_before_minutes}
                onChange={(e) => handleChange("buffer_before_minutes", parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="buffer_after">Buffer After (minutes)</Label>
              <Input
                id="buffer_after"
                type="number"
                min="0"
                max="60"
                value={formData.buffer_after_minutes}
                onChange={(e) => handleChange("buffer_after_minutes", parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_bookings">Max Bookings/Day</Label>
              <Input
                id="max_bookings"
                type="number"
                min="1"
                max="20"
                value={formData.max_bookings_per_day}
                onChange={(e) => handleChange("max_bookings_per_day", parseInt(e.target.value) || 5)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_notice">Minimum Notice (hours)</Label>
              <Input
                id="min_notice"
                type="number"
                min="1"
                max="168"
                value={formData.min_notice_hours}
                onChange={(e) => handleChange("min_notice_hours", parseInt(e.target.value) || 24)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="advance_days">Advance Booking (days)</Label>
            <Input
              id="advance_days"
              type="number"
              min="1"
              max="90"
              value={formData.advance_booking_days}
              onChange={(e) => handleChange("advance_booking_days", parseInt(e.target.value) || 30)}
            />
            <p className="text-xs text-gray-500">How far in advance mentees can book</p>
          </div>
        </CardContent>
      </Card>

      {/* Policies */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Policies & Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cancellation">Cancellation Policy</Label>
            <Textarea
              id="cancellation"
              value={formData.cancellation_policy}
              onChange={(e) => handleChange("cancellation_policy", e.target.value)}
              placeholder="e.g., Free cancellation up to 24 hours before the session"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preparation">Preparation Notes</Label>
            <Textarea
              id="preparation"
              value={formData.preparation_notes}
              onChange={(e) => handleChange("preparation_notes", e.target.value)}
              placeholder="What should mentees prepare before the session?"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4">
        <Button
          type="button"
          onClick={(e) => handleSubmit(e, "draft")}
          variant="outline"
          disabled={loading}
        >
          <Save className="w-4 h-4 mr-2" />
          Save as Draft
        </Button>

        <Button
          type="button"
          onClick={(e) => handleSubmit(e, "active")}
          disabled={loading}
          className="bg-black text-white hover:bg-gray-800"
        >
          <Calendar className="w-4 h-4 mr-2" />
          {loading ? "Saving..." : "Publish & Go Live"}
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </form>
  );
}

