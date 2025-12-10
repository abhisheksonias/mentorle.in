"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, User, Loader2 } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { validateImageFile } from "../utils/storageUtils";

export default function ProfilePicture({ profileUrl, onAvatarChange, isUploading = false }) {
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(profileUrl || "");
  const { toast } = useToast();

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file using utility function
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      toast({
        title: "Invalid file",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarUrl(e.target.result);
      onAvatarChange(file, e.target.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Picture
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-gray-200 shadow-lg">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Profile"
                  width={128}
                  height={128}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    console.error('Image load error:', avatarUrl);
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className={`w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center ${avatarUrl ? 'hidden' : 'flex'}`}
              >
                <User className="h-16 w-16 text-gray-400" />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              id="avatar-upload"
              disabled={isUploading}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('avatar-upload').click()}
              disabled={isUploading}
              className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload Photo
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            JPG, PNG or GIF. Max size 5MB.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
