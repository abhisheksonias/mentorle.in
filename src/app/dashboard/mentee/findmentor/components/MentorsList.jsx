import React from 'react';
import MentorCard from '@/components/MentorCard';
import { Search } from 'lucide-react';

export default function MentorsList({ 
  mentors,
  loading,
  hasActiveFilters,
  clearAllFilters,
  onFavoriteChange,
  favoriteMentorIds = []
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-500">Loading mentors...</p>
        </div>
      </div>
    );
  }

  if (mentors.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="mb-4">
          <Search className="h-16 w-16 text-gray-300 mx-auto" />
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No mentors found</h3>
        <p className="text-gray-500 mb-4">
          {hasActiveFilters 
            ? "Try adjusting your filters to find more mentors" 
            : "No mentors are currently available"
          }
        </p>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
          >
            Clear All Filters
          </button>
        )}
      </div> 
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {mentors.map((mentor, index) => {
        const isFavorite = favoriteMentorIds.includes(mentor.user_id);
        return (
          <MentorCard
            key={mentor.user_id || `mentor-${index}`}
            Name={mentor.name || `${mentor.first_name || ''} ${mentor.last_name || ''}`.trim()}
            Industry={mentor.Industry}
            experience_years={mentor.experience_years}
            expertise_area={mentor.expertise_area}
            ImageUrl={mentor.ImageUrl || mentor.profile_url}
            mentorData={mentor}
            location={mentor.location}
            onFavoriteChange={onFavoriteChange}
            isFavorite={isFavorite}
          />
        );
      })}
    </div>
  );
}
