import React from 'react';
import { X } from 'lucide-react';

export default function FilterTags({
  searchTerm,
  setSearchTerm,
  selectedIndustry,
  setSelectedIndustry,
  selectedExpertise,
  setSelectedExpertise,
  experienceRange,
  setExperienceRange,
  selectedLocation,
  setSelectedLocation,
  priceRange,
  setPriceRange,
  selectedLanguage,
  setSelectedLanguage,
  selectedSessionType,
  setSelectedSessionType,
  hasAvailability,
  setHasAvailability,
  showFavorites,
  setShowFavorites,
  hasActiveFilters
}) {
  if (!hasActiveFilters) {
    return null;
  }
  
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {searchTerm && (
        <span className="inline-flex items-center gap-1 bg-black text-white px-3 py-1 rounded-full text-sm">
          Search: {searchTerm}
          <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchTerm("")} />
        </span>
      )}
      
      {selectedIndustry && (
        <span className="inline-flex items-center gap-1 bg-gray-800 text-white px-3 py-1 rounded-full text-sm">
          {selectedIndustry}
          <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedIndustry("")} />
        </span>
      )}
      
      {selectedExpertise && (
        <span className="inline-flex items-center gap-1 bg-gray-700 text-white px-3 py-1 rounded-full text-sm">
          {selectedExpertise}
          <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedExpertise("")} />
        </span>
      )}
      
      {experienceRange && (
        <span className="inline-flex items-center gap-1 bg-gray-600 text-white px-3 py-1 rounded-full text-sm">
          {experienceRange} years
          <X className="h-3 w-3 cursor-pointer" onClick={() => setExperienceRange("")} />
        </span>
      )}
      
      {selectedLocation && (
        <span className="inline-flex items-center gap-1 bg-gray-500 text-white px-3 py-1 rounded-full text-sm">
          {selectedLocation}
          <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedLocation("")} />
        </span>
      )}

      {priceRange && (
        <span className="inline-flex items-center gap-1 bg-gray-400 text-white px-3 py-1 rounded-full text-sm">
          Price: {priceRange === "free" ? "Free" : priceRange === "0-500" ? "₹0-₹500" : priceRange === "500-1000" ? "₹500-₹1K" : priceRange === "1000-2000" ? "₹1K-₹2K" : "₹2K+"}
          <X className="h-3 w-3 cursor-pointer" onClick={() => setPriceRange("")} />
        </span>
      )}

      {selectedLanguage && (
        <span className="inline-flex items-center gap-1 bg-gray-400 text-white px-3 py-1 rounded-full text-sm">
          {selectedLanguage}
          <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedLanguage("")} />
        </span>
      )}

      {selectedSessionType && (
        <span className="inline-flex items-center gap-1 bg-gray-400 text-white px-3 py-1 rounded-full text-sm">
          {selectedSessionType}
          <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedSessionType("")} />
        </span>
      )}

      {hasAvailability && (
        <span className="inline-flex items-center gap-1 bg-gray-400 text-white px-3 py-1 rounded-full text-sm">
          Available Now
          <X className="h-3 w-3 cursor-pointer" onClick={() => setHasAvailability(false)} />
        </span>
      )}

      {showFavorites && (
        <span className="inline-flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
          Favorites Only
          <X className="h-3 w-3 cursor-pointer" onClick={() => setShowFavorites(false)} />
        </span>
      )}
    </div>
  );
}
