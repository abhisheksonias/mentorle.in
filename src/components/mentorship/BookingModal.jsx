"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, startOfDay, addHours } from "date-fns";
import { Calendar, Clock, IndianRupee, X, ChevronLeft, ChevronRight } from "lucide-react";

export default function BookingModal({ offering, mentorAvailability, onClose, onSuccess }) {
  const { toast } = useToast();
  const [step, setStep] = useState(1); // 1: Select date, 2: Select time, 3: Confirm
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);

  // Generate available dates based on advance booking days
  useEffect(() => {
    const dates = [];
    const today = startOfDay(new Date());
    const minNotice = addHours(new Date(), offering.min_notice_hours);
    
    for (let i = 0; i <= offering.advance_booking_days; i++) {
      const date = addDays(today, i);
      if (date >= minNotice) {
        const dayOfWeek = date.getDay();
        // Check if mentor is available on this day
        const hasAvailability = mentorAvailability?.some(slot => slot.day_of_week === dayOfWeek);
        if (hasAvailability) {
          dates.push(date);
        }
      }
    }
    setAvailableDates(dates);
  }, [offering, mentorAvailability]);

  // Generate available time slots for selected date
  useEffect(() => {
    if (!selectedDate || !mentorAvailability) {
      setAvailableSlots([]);
      return;
    }

    const dayOfWeek = selectedDate.getDay();
    const daySlots = mentorAvailability.filter(slot => slot.day_of_week === dayOfWeek);
    
    const slots = [];
    const now = new Date();
    const minNotice = addHours(now, offering.min_notice_hours);

    daySlots.forEach(slot => {
      const [startHour, startMin] = slot.start_time.split(':').map(Number);
      const [endHour, endMin] = slot.end_time.split(':').map(Number);
      
      // Generate slots based on duration
      let currentHour = startHour;
      let currentMin = startMin;
      
      while (currentHour * 60 + currentMin + offering.duration_minutes <= endHour * 60 + endMin) {
        const slotTime = new Date(selectedDate);
        slotTime.setHours(currentHour, currentMin, 0, 0);
        
        // Only add if after minimum notice time
        if (slotTime > minNotice) {
          slots.push({
            time: format(slotTime, "HH:mm"),
            label: format(slotTime, "h:mm a"),
            datetime: slotTime
          });
        }
        
        // Move to next slot
        currentMin += offering.duration_minutes + offering.buffer_after_minutes;
        while (currentMin >= 60) {
          currentMin -= 60;
          currentHour += 1;
        }
      }
    });

    setAvailableSlots(slots);
  }, [selectedDate, mentorAvailability, offering]);

  const handleBook = async () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Error",
        description: "Please select a date and time",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: "Error",
          description: "Please log in to book a session",
          variant: "destructive",
        });
        return;
      }

      const scheduledAt = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':').map(Number);
      scheduledAt.setHours(hours, minutes, 0, 0);

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          offering_id: offering.id,
          scheduled_at: scheduledAt.toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          meeting_notes: notes.trim() || null
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to book session");
      }

      toast({
        title: "Booked!",
        description: "Your session has been booked successfully",
      });

      if (onSuccess) {
        onSuccess(result.data);
      }
      onClose();
    } catch (error) {
      console.error("Error booking session:", error);
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Book Session</h2>
            <p className="text-sm text-gray-600">{offering.title}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Step 1: Select Date */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-600 mb-4">
                <Calendar className="w-5 h-5" />
                <span className="font-medium">Select a date</span>
              </div>

              {availableDates.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No available dates. Please check back later.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {availableDates.slice(0, 15).map((date) => (
                    <button
                      key={date.toISOString()}
                      onClick={() => {
                        setSelectedDate(date);
                        setSelectedTime(null);
                        setStep(2);
                      }}
                      className={`p-3 rounded-lg border text-center transition-colors ${
                        selectedDate?.toISOString() === date.toISOString()
                          ? "bg-black text-white border-black"
                          : "hover:bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="text-xs text-gray-500 uppercase">
                        {format(date, "EEE")}
                      </div>
                      <div className="text-lg font-bold">
                        {format(date, "d")}
                      </div>
                      <div className="text-xs">
                        {format(date, "MMM")}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Time */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-gray-600 hover:text-black"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">
                    {selectedDate && format(selectedDate, "EEEE, MMM d")}
                  </span>
                </div>
              </div>

              {availableSlots.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No available time slots for this date.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => {
                        setSelectedTime(slot.time);
                        setStep(3);
                      }}
                      className={`p-3 rounded-lg border text-center transition-colors ${
                        selectedTime === slot.time
                          ? "bg-black text-white border-black"
                          : "hover:bg-gray-50 border-gray-200"
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div className="space-y-6">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-1 text-gray-600 hover:text-black"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-medium">Booking Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Session</span>
                    <span className="font-medium">{offering.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date</span>
                    <span className="font-medium">
                      {selectedDate && format(selectedDate, "EEEE, MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time</span>
                    <span className="font-medium">
                      {selectedTime && format(new Date(`2000-01-01T${selectedTime}`), "h:mm a")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-medium">{offering.duration_minutes} minutes</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-gray-600">Price</span>
                    <span className="font-bold text-lg">
                      {offering.price > 0 ? `₹${offering.price}` : "Free"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">What would you like to discuss? (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Share any context or questions you have..."
                  rows={3}
                />
              </div>

              {/* Preparation notes */}
              {offering.preparation_notes && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-1">Before your session</h4>
                  <p className="text-sm text-yellow-700">{offering.preparation_notes}</p>
                </div>
              )}

              {/* Cancellation policy */}
              {offering.cancellation_policy && (
                <p className="text-xs text-gray-500">
                  <strong>Cancellation Policy:</strong> {offering.cancellation_policy}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          {step === 3 ? (
            <Button
              className="w-full bg-black text-white hover:bg-gray-800"
              onClick={handleBook}
              disabled={loading}
            >
              {loading ? "Booking..." : offering.price > 0 ? `Book for ₹${offering.price}` : "Book Free Session"}
            </Button>
          ) : (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{offering.duration_minutes} min</span>
              </div>
              <div className="flex items-center gap-2">
                <IndianRupee className="w-4 h-4" />
                <span>{offering.price > 0 ? `₹${offering.price}` : "Free"}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

