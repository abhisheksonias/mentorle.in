"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Calendar, 
  Clock, 
  Video,
  GripVertical,
  Check,
  X
} from "lucide-react";

/**
 * SessionManager - Component for managing multiple sessions within an event
 * Allows adding, editing, and removing sessions
 */
export default function SessionManager({ sessions = [], onChange }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Generate unique ID for new sessions
  const generateId = () => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Add new session
  const handleAddSession = () => {
    const newSession = {
      id: generateId(),
      title: `Session ${sessions.length + 1}`,
      date: "",
      start_time: "",
      end_time: "",
      meeting_link: ""
    };
    
    onChange([...sessions, newSession]);
    setEditingId(newSession.id);
    setEditForm(newSession);
  };

  // Start editing a session
  const handleStartEdit = (session) => {
    setEditingId(session.id);
    setEditForm({ ...session });
  };

  // Save edited session
  const handleSaveEdit = () => {
    if (!editForm.date || !editForm.start_time || !editForm.end_time) {
      return; // Don't save incomplete sessions
    }
    
    const updatedSessions = sessions.map(s => 
      s.id === editingId ? { ...editForm } : s
    );
    onChange(updatedSessions);
    setEditingId(null);
    setEditForm({});
  };

  // Cancel editing
  const handleCancelEdit = () => {
    // If it's a new session without data, remove it
    if (editForm.date === "" && editForm.start_time === "" && editForm.end_time === "") {
      onChange(sessions.filter(s => s.id !== editingId));
    }
    setEditingId(null);
    setEditForm({});
  };

  // Remove session
  const handleRemoveSession = (sessionId) => {
    onChange(sessions.filter(s => s.id !== sessionId));
    if (editingId === sessionId) {
      setEditingId(null);
      setEditForm({});
    }
  };

  // Update edit form field
  const handleEditChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  // Format time for display
  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    try {
      const [hours, minutes] = timeStr.split(":");
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="space-y-4">
      {/* Sessions List */}
      {sessions.length > 0 && (
        <div className="space-y-3">
          {sessions.map((session, index) => (
            <Card 
              key={session.id} 
              className={`p-4 ${editingId === session.id ? 'ring-2 ring-black' : 'hover:bg-gray-50'}`}
            >
              {editingId === session.id ? (
                // Edit Mode
                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`title-${session.id}`} className="text-sm">Session Title</Label>
                    <Input
                      id={`title-${session.id}`}
                      value={editForm.title || ""}
                      onChange={(e) => handleEditChange("title", e.target.value)}
                      placeholder="e.g., Introduction to React"
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor={`date-${session.id}`} className="text-sm">Date *</Label>
                      <Input
                        id={`date-${session.id}`}
                        type="date"
                        value={editForm.date || ""}
                        onChange={(e) => handleEditChange("date", e.target.value)}
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`start-${session.id}`} className="text-sm">Start *</Label>
                      <Input
                        id={`start-${session.id}`}
                        type="time"
                        value={editForm.start_time || ""}
                        onChange={(e) => handleEditChange("start_time", e.target.value)}
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`end-${session.id}`} className="text-sm">End *</Label>
                      <Input
                        id={`end-${session.id}`}
                        type="time"
                        value={editForm.end_time || ""}
                        onChange={(e) => handleEditChange("end_time", e.target.value)}
                        className="mt-1"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`link-${session.id}`} className="text-sm">Meeting Link</Label>
                    <Input
                      id={`link-${session.id}`}
                      type="url"
                      value={editForm.meeting_link || ""}
                      onChange={(e) => handleEditChange("meeting_link", e.target.value)}
                      placeholder="https://zoom.us/j/..."
                      className="mt-1"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={!editForm.date || !editForm.start_time || !editForm.end_time}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Save Session
                    </Button>
                  </div>
                </div>
              ) : (
                // Display Mode
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {session.title || `Session ${index + 1}`}
                      </h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                        {session.date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(session.date)}
                          </span>
                        )}
                        {session.start_time && session.end_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatTime(session.start_time)} - {formatTime(session.end_time)}
                          </span>
                        )}
                        {session.meeting_link && (
                          <span className="flex items-center gap-1 text-blue-600">
                            <Video className="h-3.5 w-3.5" />
                            Link added
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEdit(session)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSession(session.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Add Session Button */}
      <Button
        type="button"
        variant="outline"
        onClick={handleAddSession}
        className="w-full border-dashed"
        disabled={editingId !== null}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Session
      </Button>

      {/* Helper Text */}
      {sessions.length === 0 && (
        <p className="text-sm text-gray-500 text-center">
          Add sessions to create a multi-part event or series
        </p>
      )}
    </div>
  );
}

