"use client";

import RoleProtected from "@/components/RoleProtected";
import { ROLES } from "@/lib/roles";
import OfferingForm from "@/components/mentorship/OfferingForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

function NewOfferingContent() {
  const router = useRouter();

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
        <h1 className="text-3xl font-bold text-gray-900">Create Offering</h1>
        <p className="text-gray-600 mt-1">Set up a new mentorship session or service</p>
      </div>

      <OfferingForm />
    </div>
  );
}

export default function NewOfferingPage() {
  return (
    <RoleProtected requiredRole={[ROLES.MENTOR, ROLES.ADMIN]}>
      <NewOfferingContent />
    </RoleProtected>
  );
}

