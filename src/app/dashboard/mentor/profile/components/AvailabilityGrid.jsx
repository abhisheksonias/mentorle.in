"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Check, X, Save, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DAYS = [
  { value: 0, label: "Sun", fullLabel: "Sunday" },
  { value: 1, label: "Mon", fullLabel: "Monday" },
  { value: 2, label: "Tue", fullLabel: "Tuesday" },
  { value: 3, label: "Wed", fullLabel: "Wednesday" },
  { value: 4, label: "Thu", fullLabel: "Thursday" },
  { value: 5, label: "Fri", fullLabel: "Friday" },
  { value: 6, label: "Sat", fullLabel: "Saturday" },
];

// Time slots from 6 AM to 10 PM in 1-hour increments
const TIME_SLOTS = [];
for (let hour = 6; hour <= 21; hour++) {
  const time = `${hour.toString().padStart(2, '0')}:00`;
  const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
  const label = hour === 0 ? "12 AM" 
    : hour < 12 ? `${hour} AM` 
    : hour === 12 ? "12 PM" 
    : `${hour - 12} PM`;
  TIME_SLOTS.push({ time, endTime, label });
}

export default function AvailabilityGrid({ userId }) {
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  // Create a key for each slot (e.g., "1-09:00" for Monday 9 AM)
  const getSlotKey = (day, time) => `${day}-${time}`;

  // Parse availability data into a map
  const parseAvailability = useCallback((slots) => {
    const map = {};
    slots.forEach(slot => {
      const key = getSlotKey(slot.day_of_week, slot.start_time.substring(0, 5));
      map[key] = true;
    });
    return map;
  }, []);

  // Fetch availability on mount
  useEffect(() => {
    fetchAvailability();
  }, [userId]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers = {
        "Content-Type": "application/json",
      };
      
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/availability', { headers });
      
      if (response.ok) {
        const { data } = await response.json();
        setAvailability(parseAvailability(data || []));
      }
    } catch (error) {
      console.error("Error fetching availability:", error);
      toast({
        title: "Error",
        description: "Failed to load availability",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle a time slot
  const toggleSlot = (day, time) => {
    const key = getSlotKey(day, time);
    setAvailability(prev => {
      const newAvailability = { ...prev };
      if (newAvailability[key]) {
        delete newAvailability[key];
      } else {
        newAvailability[key] = true;
      }
      return newAvailability;
    });
    setHasChanges(true);
  };

  // Toggle entire day
  const toggleDay = (day) => {
    const daySlots = TIME_SLOTS.map(slot => getSlotKey(day, slot.time));
    const allSelected = daySlots.every(key => availability[key]);
    
    setAvailability(prev => {
      const newAvailability = { ...prev };
      daySlots.forEach(key => {
        if (allSelected) {
          delete newAvailability[key];
        } else {
          newAvailability[key] = true;
        }
      });
      return newAvailability;
    });
    setHasChanges(true);
  };

  // Save availability
  const saveAvailability = async () => {
    try {
      setSaving(true);
      
      // Convert availability map to slots array
      const slots = Object.keys(availability).map(key => {
        const [day, time] = key.split('-');
        const timeIndex = TIME_SLOTS.findIndex(t => t.time === time);
        return {
          day_of_week: parseInt(day),
          start_time: time,
          end_time: TIME_SLOTS[timeIndex]?.endTime || `${parseInt(time.split(':')[0]) + 1}:00`
        };
      });

      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers = {
        "Content-Type": "application/json",
      };
      
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/availability', {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          slots,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone 
        })
      });

      if (response.ok) {
        toast({
          title: "Saved",
          description: "Availability updated successfully",
        });
        setHasChanges(false);
      } else {
        const errorData = await response.json();
        console.error('Save error:', errorData);
        throw new Error(errorData.details || errorData.error || 'Failed to save');
      }
    } catch (error) {
      console.error("Error saving availability:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save availability",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Clear all availability
  const clearAll = () => {
    setAvailability({});
    setHasChanges(true);
  };

  // Count selected slots per day
  const getSelectedCount = (day) => {
    return TIME_SLOTS.filter(slot => availability[getSlotKey(day, slot.time)]).length;
  };

  if (loading) {
    return (
      <Card className="border-gray-200">
        <CardContent className="py-12 text-center">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
          <p className="text-gray-500 mt-2">Loading availability...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Weekly Availability
            </CardTitle>
            <CardDescription className="mt-1">
              Click time slots to set when you're available for mentorship sessions
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              className="text-gray-600"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
            <Button
              size="sm"
              onClick={saveAvailability}
              disabled={saving || !hasChanges}
              className="bg-black text-white hover:bg-gray-800"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-black rounded" />
            <span className="text-gray-600">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded" />
            <span className="text-gray-600">Unavailable</span>
          </div>
          {hasChanges && (
            <span className="text-orange-600 text-xs ml-auto">Unsaved changes</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Header row with days */}
          <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-1 mb-2">
            <div className="text-sm font-medium text-gray-500 flex items-center justify-center">
              Time
            </div>
            {DAYS.map(day => {
              const count = getSelectedCount(day.value);
              const allSelected = count === TIME_SLOTS.length;
              return (
                <button
                  key={day.value}
                  onClick={() => toggleDay(day.value)}
                  className={`text-center py-2 rounded-lg transition-colors ${
                    allSelected 
                      ? 'bg-black text-white' 
                      : count > 0 
                        ? 'bg-gray-200 text-gray-800'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="text-sm font-medium">{day.label}</div>
                  <div className="text-xs opacity-70">{count}h</div>
                </button>
              );
            })}
          </div>

          {/* Time slots grid */}
          <div className="space-y-1">
            {TIME_SLOTS.map(slot => (
              <div key={slot.time} className="grid grid-cols-[80px_repeat(7,1fr)] gap-1">
                {/* Time label */}
                <div className="text-xs text-gray-500 flex items-center justify-end pr-2 font-mono">
                  {slot.label}
                </div>
                
                {/* Day cells */}
                {DAYS.map(day => {
                  const key = getSlotKey(day.value, slot.time);
                  const isSelected = availability[key];
                  return (
                    <button
                      key={key}
                      onClick={() => toggleSlot(day.value, slot.time)}
                      className={`h-8 rounded transition-all duration-150 ${
                        isSelected 
                          ? 'bg-black hover:bg-gray-800' 
                          : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'
                      }`}
                      title={`${day.fullLabel} ${slot.label}`}
                    >
                      {isSelected && (
                        <Check className="w-3 h-3 mx-auto text-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="text-gray-500">Total availability:</span>
            <span className="font-medium text-gray-900">
              {Object.keys(availability).length} hours/week
            </span>
            {Object.keys(availability).length > 0 && (
              <>
                <span className="text-gray-300">|</span>
                <span className="text-gray-500">
                  {DAYS.filter(d => getSelectedCount(d.value) > 0).map(d => d.label).join(', ')}
                </span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

