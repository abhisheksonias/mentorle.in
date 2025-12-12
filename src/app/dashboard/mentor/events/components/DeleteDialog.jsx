"use client";

import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function DeleteDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  eventTitle,
  isDeleting 
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Event
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>&ldquo;{eventTitle}&rdquo;</strong>?
          </p>
          <p className="text-sm text-gray-500 mt-2">
            This action cannot be undone. All registrations for this event will also be removed.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

