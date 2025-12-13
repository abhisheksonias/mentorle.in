"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import RoleProtected from "@/components/RoleProtected";
import { ROLES } from "@/lib/roles";
import OfferingForm from "@/components/mentorship/OfferingForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function EditOfferingContent() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [offering, setOffering] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffering();
  }, [params.id]);

  const fetchOffering = async () => {
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();

      const headers = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/offerings/${params.id}`, { headers });

      if (response.ok) {
        const { data } = await response.json();
        setOffering(data);
      } else {
        toast({
          title: "Error",
          description: "Offering not found",
          variant: "destructive",
        });
        router.push("/dashboard/offerings");
      }
    } catch (error) {
      console.error("Error fetching offering:", error);
      toast({
        title: "Error",
        description: "Failed to load offering",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Edit Offering</h1>
        <p className="text-gray-600 mt-1">Update your mentorship session details</p>
      </div>

      {offering && <OfferingForm offering={offering} />}
    </div>
  );
}

export default function EditOfferingPage() {
  return (
    <RoleProtected requiredRole={[ROLES.MENTOR, ROLES.ADMIN]}>
      <EditOfferingContent />
    </RoleProtected>
  );
}

