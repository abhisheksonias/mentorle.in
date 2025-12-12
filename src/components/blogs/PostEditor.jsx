"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, X, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { createSlug } from "@/lib/slugify";
import { useAutosave } from "@/hooks/useAutosave";
import { format } from "date-fns";
import RichTextEditor from "./RichTextEditor";
import ImageUpload from "./ImageUpload";
import TagsInput from "./TagsInput";

export default function PostEditor({ post = null, onSave }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentPostId, setCurrentPostId] = useState(post?.id || null);
  const [formData, setFormData] = useState({
    title: post?.title || "",
    slug: post?.slug || "",
    summary: post?.summary || "",
    content: post?.content || "",
    tags: post?.tags || [],
    status: post?.status || "draft",
    featured: post?.featured || false,
    cover_url: post?.cover_url || "",
    scheduled_at: post?.status === 'scheduled' ? post?.published_at : "",
  });

  // Update form data when post prop changes (for edit page)
  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || "",
        slug: post.slug || "",
        summary: post.summary || "",
        content: post.content || "",
        tags: post.tags || [],
        status: post.status || "draft",
        featured: post.featured || false,
        cover_url: post.cover_url || "",
        scheduled_at: post.status === 'scheduled' ? post.published_at : "",
      });
      setCurrentPostId(post.id);
    }
  }, [post]);

  // Autosave function - only updates existing posts
  const performAutosave = async (data) => {
    if (!currentPostId) return; // Only autosave existing posts

    // Get access token
    const { supabase } = await import('@/lib/supabase');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error("Session expired");
    }

    const payload = {
      title: data.title,
      summary: data.summary || null,
      content: data.content,
      tags: data.tags.length > 0 ? data.tags : null,
      status: data.status,
      featured: data.featured,
      cover_url: data.cover_url || null,
    };

    // Include scheduled date if status is scheduled
    if (data.status === 'scheduled' && data.scheduled_at) {
      payload.published_at = new Date(data.scheduled_at).toISOString();
    }

    const response = await fetch(`/api/posts/${currentPostId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMessage = "Failed to save";
      try {
        const text = await response.text();
        if (text) {
          const data = JSON.parse(text);
          errorMessage = data.error || errorMessage;
        }
      } catch (parseError) {
        // If parsing fails, use default error message
        errorMessage = `Failed to save (${response.status})`;
      }
      throw new Error(errorMessage);
    }
  };

  // Autosave hook - only enabled for existing posts
  const { saveStatus, lastSaved, error: autosaveError } = useAutosave({
    onSave: performAutosave,
    data: formData,
    enabled: !!currentPostId, // Only enable if post exists
    debounceMs: 2000, // 2 second debounce
  });

  useEffect(() => {
    if (formData.title && !post) {
      const autoSlug = createSlug(formData.title);
      setFormData((prev) => ({ ...prev, slug: autoSlug }));
    }
  }, [formData.title, post]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (!formData.title || formData.title.trim().length < 3) {
      toast({
        title: "Validation Error",
        description: "Title must be at least 3 characters",
        variant: "destructive",
      });
      return;
    }

    // For published and scheduled posts, require content
    if ((formData.status === 'published' || formData.status === 'scheduled') && (!formData.content || formData.content.trim().length < 50)) {
      toast({
        title: "Validation Error",
        description: `${formData.status === 'published' ? 'Published' : 'Scheduled'} posts must have at least 50 characters of content`,
        variant: "destructive",
      });
      return;
    }

    // For scheduled posts, require date and validate it's in the future
    if (formData.status === 'scheduled') {
      if (!formData.scheduled_at) {
        toast({
          title: "Validation Error",
          description: "Please select a date and time for scheduled post",
          variant: "destructive",
        });
        return;
      }
      const scheduledDate = new Date(formData.scheduled_at);
      if (scheduledDate <= new Date()) {
        toast({
          title: "Validation Error",
          description: "Scheduled date must be in the future",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    try {
      // Get access token from Supabase
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication Error",
          description: "Please log in again to continue",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Prepare payload with scheduling support
      const payload = {
        title: formData.title,
        summary: formData.summary || null,
        content: formData.content || "",
        tags: formData.tags.length > 0 ? formData.tags : null,
        status: formData.status,
        featured: formData.featured,
        cover_url: formData.cover_url || null,
      };

      // Handle scheduled posts
      if (formData.status === 'scheduled' && formData.scheduled_at) {
        payload.published_at = new Date(formData.scheduled_at).toISOString();
      }

      const url = post ? `/api/posts/${post.id}` : "/api/posts";
      const method = post ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        credentials: "include", // Include cookies in request
        body: JSON.stringify(payload),
      });

      // Check if response has content before parsing
      const contentType = response.headers.get("content-type");
      let data = {};
      
      if (contentType && contentType.includes("application/json")) {
        try {
          const text = await response.text();
          data = text ? JSON.parse(text) : {};
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          data = { error: "Failed to parse server response" };
        }
      } else {
        const text = await response.text();
        data = { error: text || "Server error occurred" };
      }

      if (!response.ok) {
        const errorMessage = data.error || data.details || `Failed to save post (Status: ${response.status})`;
        console.error('Post save error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          data: data,
          userRole: data.userRole,
          requiredRoles: data.requiredRoles
        });
        throw new Error(errorMessage);
      }

      const successMessage = formData.status === 'scheduled' 
        ? `Post scheduled for ${new Date(formData.scheduled_at).toLocaleString()}`
        : post ? "Post updated successfully" : "Post created successfully";

      toast({
        title: "Success",
        description: successMessage,
      });

      // Always redirect to posts page after save
      if (onSave) {
        onSave(data.data);
      } else {
        router.push("/dashboard/posts");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Render save status indicator
  const renderSaveStatus = () => {
    if (!currentPostId) return null; // Don't show for non-existent posts

    switch (saveStatus) {
      case 'saving':
        return (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Saving...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>All changes saved</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <XCircle className="h-4 w-4" />
            <span>Save failed: {autosaveError}</span>
          </div>
        );
      case 'idle':
      default:
        return lastSaved ? (
          <span className="text-sm text-gray-500">
            Last saved: {format(lastSaved, "h:mm:ss a")}
          </span>
        ) : null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Save Status Indicator */}
      {currentPostId && (
        <div className="flex justify-end">
          {renderSaveStatus()}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Enter post title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          value={formData.slug}
          onChange={(e) => handleChange("slug", e.target.value)}
          placeholder="url-friendly-slug"
        />
        <p className="text-xs text-gray-500">
          Auto-generated from title. You can customize it.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="summary">Summary</Label>
        <Textarea
          id="summary"
          value={formData.summary}
          onChange={(e) => handleChange("summary", e.target.value)}
          placeholder="Brief summary of the post"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content *</Label>
        <RichTextEditor
          value={formData.content}
          onChange={(value) => handleChange("content", value)}
          placeholder="Write your post content here (markdown supported)"
        />
      </div>

      <TagsInput
        value={formData.tags}
        onChange={(tags) => handleChange("tags", tags)}
        label="Tags"
      />

      <ImageUpload
        value={formData.cover_url}
        onChange={(url) => handleChange("cover_url", url)}
        label="Cover Image"
      />

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch
            id="featured"
            checked={formData.featured}
            onCheckedChange={(checked) => handleChange("featured", checked)}
          />
          <Label htmlFor="featured">Featured Post</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          value={formData.status}
          onChange={(e) => handleChange("status", e.target.value)}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
        >
          <option value="draft">Draft</option>
          <option value="published">Publish Now</option>
          <option value="scheduled">Schedule for Later</option>
          <option value="pending">Pending Review</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {formData.status === "scheduled" && (
        <div className="space-y-2">
          <Label htmlFor="scheduled_at">Schedule Date & Time *</Label>
          <Input
            id="scheduled_at"
            type="datetime-local"
            value={formData.scheduled_at ? new Date(formData.scheduled_at).toISOString().slice(0, 16) : ""}
            onChange={(e) => handleChange("scheduled_at", e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            required
            className="w-full"
          />
          <p className="text-xs text-gray-500">
            Post will be automatically published at this date and time
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Saving..." : currentPostId ? "Save Now" : (post ? "Update Post" : "Create Post")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/posts")}
        >
          <X className="w-4 h-4 mr-2" />
          {currentPostId ? "Done" : "Cancel"}
        </Button>
      </div>
    </form>
  );
}

