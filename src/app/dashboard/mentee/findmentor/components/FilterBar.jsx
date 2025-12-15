import { useState } from 'react';
import { Search, Filter, ChevronDown, X } from 'lucide-react';

export default function FilterBar({ 
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
  industries,
  expertiseAreas,
  locations,
  languages,
  clearAllFilters
}) {
  const [showFilters, setShowFilters] = useState(false);
  
  const hasActiveFilters = searchTerm || selectedIndustry || selectedExpertise || 
    experienceRange || selectedLocation || priceRange || selectedLanguage || 
    selectedSessionType || hasAvailability || showFavorites;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 shadow-sm">
      {/* Search Bar */}
      <div className="relative mb-3">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Search by name, skill, topic, role, company..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-700"
        />
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors duration-200"
        >
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filters</span>
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
        </button>
        
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors duration-200"
          >
            <X className="h-4 w-4" />
            Clear all
          </button>
        )}
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
          {/* Industry Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
            >
              <option value="">All Industries</option>
              {industries.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>

          {/* Expertise Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expertise</label>
            <select
              value={selectedExpertise}
              onChange={(e) => setSelectedExpertise(e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
            >
              <option value="">All Expertise</option>
              {expertiseAreas.map(expertise => (
                <option key={expertise} value={expertise}>{expertise}</option>
              ))}
            </select>
          </div>

          {/* Experience Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
            <select
              value={experienceRange}
              onChange={(e) => setExperienceRange(e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
            >
              <option value="">Any Experience</option>
              <option value="0-2">0-2 years</option>
              <option value="3-5">3-5 years</option>
              <option value="6-10">6-10 years</option>
              <option value="10+">10+ years</option>
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
            >
              <option value="">All Locations</option>
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>

          {/* Price Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
            <select
              value={priceRange || ""}
              onChange={(e) => setPriceRange(e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
            >
              <option value="">Any Price</option>
              <option value="free">Free</option>
              <option value="0-500">₹0 - ₹500</option>
              <option value="500-1000">₹500 - ₹1,000</option>
              <option value="1000-2000">₹1,000 - ₹2,000</option>
              <option value="2000+">₹2,000+</option>
            </select>
          </div>

          {/* Language Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
            <select
              value={selectedLanguage || ""}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
            >
              <option value="">All Languages</option>
              {languages && languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          {/* Session Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Session Type</label>
            <select
              value={selectedSessionType || ""}
              onChange={(e) => setSelectedSessionType(e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
            >
              <option value="">All Types</option>
              <option value="1-on-1">1-on-1 Video Call</option>
              <option value="group">Group Session</option>
              <option value="email">Email/Text Support</option>
              <option value="review">Project/Code Review</option>
            </select>
          </div>

          {/* Availability Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="hasAvailability"
                checked={hasAvailability || false}
                onChange={(e) => setHasAvailability(e.target.checked)}
                className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
              />
              <label htmlFor="hasAvailability" className="text-sm text-gray-700 cursor-pointer">
                Available Now
              </label>
            </div>
          </div>

          {/* Favorites Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Favorites</label>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="showFavorites"
                checked={showFavorites || false}
                onChange={(e) => setShowFavorites(e.target.checked)}
                className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
              />
              <label htmlFor="showFavorites" className="text-sm text-gray-700 cursor-pointer">
                Show Favorites Only
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
