"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users, Mail, Calendar, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ParticipantsDialog({ isOpen, onClose, event }) {
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && event?.id) {
      fetchParticipants();
    }
  }, [isOpen, event?.id]);

  const fetchParticipants = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("event_participants")
        .select(`
          id,
          registered_at,
          mentee_data (
            name,
            email
          )
        `)
        .eq("event_id", event.id)
        .order("registered_at", { ascending: false });

      if (error) throw error;
      setParticipants(data || []);
    } catch (error) {
      console.error("Error fetching participants:", error);
      setParticipants([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Participants - {event?.title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : participants.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No participants yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Share your event to get registrations
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-4">
                {participants.length} participant{participants.length !== 1 ? 's' : ''} registered
              </p>
              
              {participants.map((participant) => (
                <div 
                  key={participant.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {participant.mentee_data?.name?.[0]?.toUpperCase() || "?"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {participant.mentee_data?.name || "Unknown"}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {participant.mentee_data?.email || "No email"}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(participant.registered_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


