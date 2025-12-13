"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import RoleProtected from "@/components/RoleProtected";
import { ROLES } from "@/lib/roles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, Edit, Trash2, Clock, IndianRupee, Users, Star,
  Play, Pause, MoreVertical, Calendar
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function OfferingsContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchOfferings();
  }, [statusFilter]);

  const fetchOfferings = async () => {
    try {
      setLoading(true);
      const { supabase } = await import("@/lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();

      const headers = {
        "Content-Type": "application/json",
      };

      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const params = new URLSearchParams({
        own: "true",
        status: statusFilter
      });

      const response = await fetch(`/api/offerings?${params}`, { headers });
      const result = await response.json();

      if (response.ok) {
        setOfferings(result.data || []);
      } else {
        console.error("API error:", result);
        toast({
          title: "Error",
          description: result.error || "Failed to load offerings",
          variant: "destructive",
        });
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

  const handleStatusChange = async (id, newStatus) => {
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`/api/offerings/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Offering ${newStatus === "active" ? "activated" : "paused"}`,
        });
        fetchOfferings();
      }
    } catch (error) {
      console.error("Error updating offering:", error);
      toast({
        title: "Error",
        description: "Failed to update offering",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this offering?")) return;

    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`/api/offerings/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        toast({
          title: "Deleted",
          description: "Offering deleted successfully",
        });
        fetchOfferings();
      } else {
        const data = await response.json();
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error deleting offering:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete offering",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: "bg-green-100 text-green-800",
      draft: "bg-gray-100 text-gray-800",
      paused: "bg-yellow-100 text-yellow-800",
      archived: "bg-red-100 text-red-800"
    };
    return styles[status] || styles.draft;
  };

  const getCategoryLabel = (category) => {
    const labels = {
      resume_review: "Resume Review",
      portfolio_review: "Portfolio Review",
      career_guidance: "Career Guidance",
      mock_interview: "Mock Interview",
      code_review: "Code Review",
      mentorship: "Mentorship",
      project_guidance: "Project Guidance",
      other: "Other"
    };
    return labels[category] || category;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Offerings</h1>
          <p className="text-gray-600 mt-1">Manage your mentorship sessions and services</p>
        </div>
        <Link href="/dashboard/offerings/new">
          <Button className="bg-black text-white hover:bg-gray-800">
            <Plus className="w-4 h-4 mr-2" />
            Create Offering
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="paused">Paused</option>
          <option value="archived">Archived</option>
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
      {!loading && offerings.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No offerings yet</h3>
            <p className="text-gray-600 mb-6">Create your first offering to start accepting bookings</p>
            <Link href="/dashboard/offerings/new">
              <Button className="bg-black text-white hover:bg-gray-800">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Offering
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Offerings Grid */}
      {!loading && offerings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offerings.map((offering) => (
            <Card key={offering.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <Badge className={getStatusBadge(offering.status)}>
                    {offering.status}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/offerings/${offering.id}/edit`)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      {offering.status === "active" ? (
                        <DropdownMenuItem onClick={() => handleStatusChange(offering.id, "paused")}>
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </DropdownMenuItem>
                      ) : offering.status !== "archived" && (
                        <DropdownMenuItem onClick={() => handleStatusChange(offering.id, "active")}>
                          <Play className="w-4 h-4 mr-2" />
                          Activate
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => handleDelete(offering.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardTitle className="text-lg mt-2">{offering.title}</CardTitle>
                <CardDescription>
                  {getCategoryLabel(offering.category)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {offering.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {offering.description}
                  </p>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <IndianRupee className="w-4 h-4" />
                    <span>{offering.price > 0 ? `₹${offering.price}` : "Free"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{offering.duration_minutes} minutes</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{offering.total_bookings || 0} bookings</span>
                  </div>
                  {offering.average_rating && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{offering.average_rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <Link href={`/dashboard/offerings/${offering.id}/bookings`}>
                    <Button variant="outline" size="sm" className="w-full">
                      View Bookings
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OfferingsPage() {
  return (
    <RoleProtected requiredRole={[ROLES.MENTOR, ROLES.ADMIN]}>
      <OfferingsContent />
    </RoleProtected>
  );
}

