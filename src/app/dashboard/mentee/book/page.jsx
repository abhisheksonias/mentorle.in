"use client";

import { useState, useEffect } from "react";
import RoleProtected from "@/components/RoleProtected";
import { ROLES } from "@/lib/roles";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import OfferingCard from "@/components/mentorship/OfferingCard";
import BookingModal from "@/components/mentorship/BookingModal";
import { Search, Filter, Briefcase } from "lucide-react";

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "resume_review", label: "Resume Review" },
  { value: "portfolio_review", label: "Portfolio Review" },
  { value: "career_guidance", label: "Career Guidance" },
  { value: "mock_interview", label: "Mock Interview" },
  { value: "code_review", label: "Code Review" },
  { value: "mentorship", label: "Mentorship" },
  { value: "project_guidance", label: "Project Guidance" },
];

function BrowseOfferingsContent() {
  const { toast } = useToast();
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedOffering, setSelectedOffering] = useState(null);
  const [mentorAvailability, setMentorAvailability] = useState([]);

  useEffect(() => {
    fetchOfferings();
  }, [categoryFilter]);

  const fetchOfferings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: "active"
      });

      if (categoryFilter !== "all") {
        params.append("category", categoryFilter);
      }

      const response = await fetch(`/api/offerings?${params}`);

      if (response.ok) {
        const { data } = await response.json();
        setOfferings(data || []);
      }
    } catch (error) {
      console.error("Error fetching offerings:", error);
      toast({
        title: "Error",
        description: "Failed to load offerings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (offering) => {
    try {
      // Fetch mentor's availability
      const response = await fetch(`/api/availability?mentor_id=${offering.mentor_id}`);
      if (response.ok) {
        const { data } = await response.json();
        setMentorAvailability(data || []);
      }
      setSelectedOffering(offering);
    } catch (error) {
      console.error("Error fetching availability:", error);
      toast({
        title: "Error",
        description: "Failed to load mentor availability",
        variant: "destructive",
      });
    }
  };

  const filteredOfferings = offerings.filter(offering => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      offering.title?.toLowerCase().includes(query) ||
      offering.description?.toLowerCase().includes(query) ||
      offering.mentor?.name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Book a Session</h1>
        <p className="text-gray-600 mt-1">Find and book 1:1 mentorship sessions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by title, description, or mentor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-md border border-input bg-transparent px-3 py-2 text-sm min-w-[180px]"
        >
          {CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading offerings...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredOfferings.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Briefcase className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No offerings found</h3>
            <p className="text-gray-600">
              {searchQuery || categoryFilter !== "all"
                ? "Try adjusting your search or filters"
                : "No offerings available at the moment"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Offerings Grid */}
      {!loading && filteredOfferings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOfferings.map((offering) => (
            <OfferingCard
              key={offering.id}
              offering={offering}
              onBook={handleBook}
            />
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {selectedOffering && (
        <BookingModal
          offering={selectedOffering}
          mentorAvailability={mentorAvailability}
          onClose={() => setSelectedOffering(null)}
          onSuccess={() => {
            setSelectedOffering(null);
            toast({
              title: "Success!",
              description: "Your booking has been confirmed",
            });
          }}
        />
      )}
    </div>
  );
}

export default function BrowseOfferingsPage() {
  return (
    <RoleProtected requiredRole={[ROLES.MENTEE, ROLES.ADMIN]}>
      <BrowseOfferingsContent />
    </RoleProtected>
  );
}

