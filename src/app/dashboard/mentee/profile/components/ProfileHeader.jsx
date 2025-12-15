"use client";

import { User, Edit3 } from "lucide-react";
import Image from "next/image";

export default function ProfileHeader({ profile, isEditing, onEdit }) {
  const getInitials = () => {
    if (profile?.name) {
      const nameParts = profile.name.split(' ');
      return nameParts.map(part => part.charAt(0)).join('').toUpperCase().slice(0, 2);
    }
    return 'U';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          {profile?.profile_url ? (
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-300">
              <Image
                src={profile.profile_url}
                alt="Profile"
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-xl font-semibold text-white">
                {getInitials()}
              </span>
            </div>
          )}
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <User className="h-6 w-6 text-blue-600" />
              Profile
            </h1>
            <p className="text-gray-600 mt-1">
              {profile?.name ? `${profile.name}'s Profile` : 'Manage your profile information'}
            </p>
          </div>
        </div>
        
        {!isEditing && (
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Edit3 className="h-4 w-4" />
            Edit Profile
          </button>
        )}
      </div>
    </div>
  );
}
