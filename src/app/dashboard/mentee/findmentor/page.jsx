"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { filterMentors, extractFilterOptions } from "./utils/filterUtils";
import FilterBar from "./components/FilterBar";
import FilterTags from "./components/FilterTags";
import MentorsList from "./components/MentorsList";

export default function FindMentorPage() {
  const [mentors, setMentors] = useState([]);
  const [filteredMentors, setFilteredMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState("");
  const [experienceRange, setExperienceRange] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedSessionType, setSelectedSessionType] = useState("");
  const [hasAvailability, setHasAvailability] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showRecommended, setShowRecommended] = useState(false);
  const [favoriteMentorIds, setFavoriteMentorIds] = useState([]);

  // Filter options (will be populated from mentor data)
  const [industries, setIndustries] = useState([]);
  const [expertiseAreas, setExpertiseAreas] = useState([]);
  const [locations, setLocations] = useState([]);
  const [languages, setLanguages] = useState([]);

  const hasActiveFilters = searchTerm || selectedIndustry || selectedExpertise || experienceRange || 
    selectedLocation || priceRange || selectedLanguage || selectedSessionType || hasAvailability || showFavorites;

  useEffect(() => {
    fetchMentors();
    fetchFavorites();
  }, []);

  // Apply filters whenever filter states change
  useEffect(() => {
    const filters = {
      searchTerm,
      selectedIndustry,
      selectedExpertise,
      experienceRange,
      selectedLocation,
      priceRange,
      selectedLanguage,
      selectedSessionType,
      hasAvailability,
      showFavorites,
      favoriteMentorIds
    };
    
    const filtered = filterMentors(mentors, filters);
    setFilteredMentors(filtered);
  }, [mentors, searchTerm, selectedIndustry, selectedExpertise, experienceRange, selectedLocation, 
      priceRange, selectedLanguage, selectedSessionType, hasAvailability, showFavorites, favoriteMentorIds]);

  const fetchMentors = async () => {
    try {
      const { data, error } = await supabase
        .from("mentor_data")
        // .select("id, first_name, last_name, current_role, expertise_area, bio, profile_url, linkedin_url, portfolio_url, experience_years, status, Industry, location")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });
     
      if (error) throw error;
     
      if (data && data.length > 0) {
        // Process mentor data to include proper image URLs
        const processedMentors = data.map((mentor) => {
          let mentorWithImage = { ...mentor };
         
          if (mentor.profile_url) {
            // Get public URL for the profile image
            const { data: urlData } = supabase
              .storage
              .from('media')
              .getPublicUrl(mentor.profile_url);
             
            if (urlData?.publicUrl) {
              mentorWithImage.ImageUrl = urlData.publicUrl;
            }
          }
         
          return mentorWithImage;
        });

        // Sort mentors: those with profile pics first, then by creation date (newest first)
        const sortedMentors = processedMentors.sort((a, b) => {
          // Check if mentors have profile images
          const aHasImage = a.profile_url && (a.profile_url.startsWith('http') || a.ImageUrl);
          const bHasImage = b.profile_url && (b.profile_url.startsWith('http') || b.ImageUrl);
          
          // First priority: mentors with profile pictures
          if (aHasImage && !bHasImage) return -1;
          if (!aHasImage && bHasImage) return 1;
          
          // Second priority: newer mentors first (by created_at)
          const dateA = new Date(a.created_at || 0);
          const dateB = new Date(b.created_at || 0);
          return dateB - dateA;
        });
       
        setMentors(sortedMentors);
        setFilteredMentors(sortedMentors);
        
        // Extract unique filter options
        const options = extractFilterOptions(sortedMentors);
        setIndustries(options.industries);
        setExpertiseAreas(options.expertiseAreas);
        setLocations(options.locations);
        setLanguages(options.languages || []);
      } else {
        setMentors([]);
        setFilteredMentors([]);
      }
    } catch (error) {
      console.error("Error fetching mentors:", error);
      setMentors([]);
      setFilteredMentors([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log("No session found, skipping favorites fetch");
        setFavoriteMentorIds([]);
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`
      };

      console.log("Fetching favorites for user:", session.user.id);
      const response = await fetch(`/api/favorites?mentee_id=${session.user.id}`, { headers });
      
      if (response.ok) {
        const result = await response.json();
        const favorites = result.data || [];
        const mentorIds = favorites.map(f => f.mentor_id).filter(Boolean);
        console.log("Fetched favorites successfully:", mentorIds.length, "favorites");
        setFavoriteMentorIds(mentorIds);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to fetch favorites:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        setFavoriteMentorIds([]);
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
      setFavoriteMentorIds([]);
    }
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedIndustry("");
    setSelectedExpertise("");
    setExperienceRange("");
    setSelectedLocation("");
    setPriceRange("");
    setSelectedLanguage("");
    setSelectedSessionType("");
    setHasAvailability(false);
    setShowFavorites(false);
  };

  // Fetch recommended mentors based on mentee profile
  const fetchRecommendedMentors = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      // Get mentee profile
      const { data: menteeProfile } = await supabase
        .from("mentee_data")
        .select("interests, preferred_industries, skills, languages")
        .eq("user_id", session.user.id)
        .single();

      if (!menteeProfile) return [];

      // Find mentors matching mentee preferences
      let recommendedQuery = supabase
        .from("mentor_data")
        .select("*")
        .eq("status", "approved");

      // Match by interests/expertise
      if (menteeProfile.interests && menteeProfile.interests.length > 0) {
        // This is a simplified matching - in production, you'd want more sophisticated matching
        recommendedQuery = recommendedQuery.contains("expertise_area", menteeProfile.interests.slice(0, 3));
      }

      const { data: recommended } = await recommendedQuery.limit(6);

      return recommended || [];
    } catch (error) {
      console.error("Error fetching recommended mentors:", error);
      return [];
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30 max-w-8xl mx-auto p-3 mt-10">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-black to-black bg-clip-text text-transparent mb-2">
          Find Your Perfect Mentor
        </h1>
        <p className="text-gray-600 flex items-center">
          Connect with experienced professionals in your field
        </p>
      </div>

      {/* Recommended Section */}
      {!hasActiveFilters && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Recommended for You</h2>
          <button
            onClick={async () => {
              const recommended = await fetchRecommendedMentors();
              if (recommended.length > 0) {
                setFilteredMentors(recommended);
                setShowRecommended(true);
              }
            }}
            className="text-sm text-gray-600 hover:text-black underline"
          >
            Show Recommendations
          </button>
        </div>
      )}

      {/* Search and Filter Section */}
      <FilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedIndustry={selectedIndustry}
        setSelectedIndustry={setSelectedIndustry}
        selectedExpertise={selectedExpertise}
        setSelectedExpertise={setSelectedExpertise}
        experienceRange={experienceRange}
        setExperienceRange={setExperienceRange}
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={setSelectedLanguage}
        selectedSessionType={selectedSessionType}
        setSelectedSessionType={setSelectedSessionType}
        hasAvailability={hasAvailability}
        setHasAvailability={setHasAvailability}
        showFavorites={showFavorites}
        setShowFavorites={setShowFavorites}
        industries={industries}
        expertiseAreas={expertiseAreas}
        locations={locations}
        languages={languages}
        clearAllFilters={clearAllFilters}
      />

      {/* Active Filters Display */}
      <FilterTags
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedIndustry={selectedIndustry}
        setSelectedIndustry={setSelectedIndustry}
        selectedExpertise={selectedExpertise}
        setSelectedExpertise={setSelectedExpertise}
        experienceRange={experienceRange}
        setExperienceRange={setExperienceRange}
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={setSelectedLanguage}
        selectedSessionType={selectedSessionType}
        setSelectedSessionType={setSelectedSessionType}
        hasAvailability={hasAvailability}
        setHasAvailability={setHasAvailability}
        showFavorites={showFavorites}
        setShowFavorites={setShowFavorites}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Results Counter */}
      <div className="mb-3">
        <p className="text-gray-600">
          Showing <span className="font-semibold text-black">{filteredMentors.length}</span> of{" "}
          <span className="font-semibold">{mentors.length}</span> mentors
        </p>
      </div>

      {/* Mentors Grid */}
      <MentorsList
        mentors={filteredMentors}
        loading={loading}
        hasActiveFilters={hasActiveFilters}
        clearAllFilters={clearAllFilters}
        onFavoriteChange={fetchFavorites}
        favoriteMentorIds={favoriteMentorIds}
      />
    </div>
  );
}


// "use client";
// import { useEffect, useState } from "react";
// import MentorCard from "@/components/MentorCard";
// import { supabase } from "@/lib/supabase";
// import { Search, Filter, X, ChevronDown } from "lucide-react";

// export default function FindMentorPage() {
//   const [mentors, setMentors] = useState([]);
//   const [filteredMentors, setFilteredMentors] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [showFilters, setShowFilters] = useState(false);
  
//   // Filter states
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedIndustry, setSelectedIndustry] = useState("");
//   const [selectedExpertise, setSelectedExpertise] = useState("");
//   const [experienceRange, setExperienceRange] = useState("");
//   const [selectedLocation, setSelectedLocation] = useState("");

//   // Filter options (will be populated from mentor data)
//   const [industries, setIndustries] = useState([]);
//   const [expertiseAreas, setExpertiseAreas] = useState([]);
//   const [locations, setLocations] = useState([]);

//   useEffect(() => {
//     const fetchMentors = async () => {
//       try {
//         const { data, error } = await supabase
//           .from("mentor_data")
//           .select("id, first_name, last_name, expertise_area, bio, profile_url, linkedin_url, portfolio_url, experience_years, status, Industry, location")
//           .eq("status", "approved");
       
//         if (error) throw error;
       
//         if (data && data.length > 0) {
//           // Process mentor data to include proper image URLs
//           const processedMentors = data.map((mentor) => {
//             let mentorWithImage = { ...mentor };
           
//             if (mentor.profile_url) {
//               // Get public URL for the profile image
//               const { data: urlData } = supabase
//                 .storage
//                 .from('media')
//                 .getPublicUrl(mentor.profile_url);
               
//               if (urlData?.publicUrl) {
//                 mentorWithImage.ImageUrl = urlData.publicUrl;
//               }
//             }
           
//             return mentorWithImage;
//           });
         
//           setMentors(processedMentors);
//           setFilteredMentors(processedMentors);
          
//           // Extract unique filter options
//           extractFilterOptions(processedMentors);
//         } else {
//           setMentors([]);
//           setFilteredMentors([]);
//         }
//       } catch (error) {
//         console.error("Error fetching mentors:", error);
//         setMentors([]);
//         setFilteredMentors([]);
//       } finally {
//         setLoading(false);
//       }
//     };
   
//     fetchMentors();
//   }, []);

//   const extractFilterOptions = (mentorData) => {
//     // Extract unique industries
//     const uniqueIndustries = [...new Set(mentorData.map(m => m.Industry).filter(Boolean))];
//     setIndustries(uniqueIndustries);

//     // Extract unique expertise areas
//     const allExpertiseAreas = mentorData.flatMap(mentor => {
//       if (Array.isArray(mentor.expertise_area)) {
//         return mentor.expertise_area;
//       } else if (mentor.expertise_area) {
//         return [mentor.expertise_area];
//       }
//       return [];
//     });
//     const uniqueExpertiseAreas = [...new Set(allExpertiseAreas)];
//     setExpertiseAreas(uniqueExpertiseAreas);

//     // Extract unique locations
//     const uniqueLocations = [...new Set(mentorData.map(m => m.location).filter(Boolean))];
//     setLocations(uniqueLocations);
//   };

//   // Apply filters whenever filter states change
//   useEffect(() => {
//     let filtered = [...mentors];

//     // Search term filter
//     if (searchTerm) {
//       filtered = filtered.filter(mentor => 
//         `${mentor.first_name} ${mentor.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         mentor.Industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         mentor.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         (Array.isArray(mentor.expertise_area) 
//           ? mentor.expertise_area.some(area => area.toLowerCase().includes(searchTerm.toLowerCase()))
//           : mentor.expertise_area?.toLowerCase().includes(searchTerm.toLowerCase())
//         )
//       );
//     }

//     // Industry filter
//     if (selectedIndustry) {
//       filtered = filtered.filter(mentor => mentor.Industry === selectedIndustry);
//     }

//     // Expertise filter
//     if (selectedExpertise) {
//       filtered = filtered.filter(mentor => {
//         if (Array.isArray(mentor.expertise_area)) {
//           return mentor.expertise_area.includes(selectedExpertise);
//         }
//         return mentor.expertise_area === selectedExpertise;
//       });
//     }

//     // Experience range filter
//     if (experienceRange) {
//       filtered = filtered.filter(mentor => {
//         const years = mentor.experience_years;
//         if (!years) return false;
        
//         switch (experienceRange) {
//           case "0-2": return years >= 0 && years <= 2;
//           case "3-5": return years >= 3 && years <= 5;
//           case "6-10": return years >= 6 && years <= 10;
//           case "10+": return years > 10;
//           default: return true;
//         }
//       });
//     }

//     // Location filter
//     if (selectedLocation) {
//       filtered = filtered.filter(mentor => mentor.location === selectedLocation);
//     }

//     setFilteredMentors(filtered);
//   }, [mentors, searchTerm, selectedIndustry, selectedExpertise, experienceRange, selectedLocation]);

//   const clearAllFilters = () => {
//     setSearchTerm("");
//     setSelectedIndustry("");
//     setSelectedExpertise("");
//     setExperienceRange("");
//     setSelectedLocation("");
//   };

//   const hasActiveFilters = searchTerm || selectedIndustry || selectedExpertise || experienceRange || selectedLocation;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30 max-w-8xl mx-auto p-3 mt-10">
//       <div className=" mb-4">
//         <h1 className="text-3xl font-bold bg-gradient-to-r from-black to-black bg-clip-text text-transparent mb-2">
//           Find Your Perfect Mentor</h1>
//         <p className="text-gray-600 flex items-center">Connect with experienced professionals in your field</p>
//       </div>

//       {/* Search and Filter Section */}
//       <div className="bg-white rounded-2xl border border-gray-200 p-2 mb-4">
//         {/* Search Bar */}
//         <div className="relative mb-2">
//           <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
//           <input
//             type="text"
//             placeholder="Search mentors by name, industry, or expertise..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-700"
//           />
//         </div>

//         {/* Filter Toggle */}
//         <div className="flex items-center justify-between">
//           <button
//             onClick={() => setShowFilters(!showFilters)}
//             className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors duration-200"
//           >
//             <Filter className="h-4 w-4" />
//             <span className="font-medium">Filters</span>
//             <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
//           </button>
          
//           {hasActiveFilters && (
//             <button
//               onClick={clearAllFilters}
//               className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors duration-200"
//             >
//               <X className="h-4 w-4" />
//               Clear all
//             </button>
//           )}
//         </div>

//         {/* Filter Options */}
//         {showFilters && (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mt-3 pt-2 border-t border-gray-100">
//             {/* Industry Filter */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
//               <select
//                 value={selectedIndustry}
//                 onChange={(e) => setSelectedIndustry(e.target.value)}
//                 className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
//               >
//                 <option value="">All Industries</option>
//                 {industries.map(industry => (
//                   <option key={industry} value={industry}>{industry}</option>
//                 ))}
//               </select>
//             </div>

//             {/* Expertise Filter */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Expertise</label>
//               <select
//                 value={selectedExpertise}
//                 onChange={(e) => setSelectedExpertise(e.target.value)}
//                 className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
//               >
//                 <option value="">All Expertise</option>
//                 {expertiseAreas.map(expertise => (
//                   <option key={expertise} value={expertise}>{expertise}</option>
//                 ))}
//               </select>
//             </div>

//             {/* Experience Filter */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
//               <select
//                 value={experienceRange}
//                 onChange={(e) => setExperienceRange(e.target.value)}
//                 className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
//               >
//                 <option value="">Any Experience</option>
//                 <option value="0-2">0-2 years</option>
//                 <option value="3-5">3-5 years</option>
//                 <option value="6-10">6-10 years</option>
//                 <option value="10+">10+ years</option>
//               </select>
//             </div>

//             {/* Location Filter */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
//               <select
//                 value={selectedLocation}
//                 onChange={(e) => setSelectedLocation(e.target.value)}
//                 className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
//               >
//                 <option value="">All Locations</option>
//                 {locations.map(location => (
//                   <option key={location} value={location}>{location}</option>
//                 ))}
//               </select>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Active Filters Display */}
//       {hasActiveFilters && (
//         <div className="flex flex-wrap gap-2 mb-6">
//           {searchTerm && (
//             <span className="inline-flex items-center gap-1 bg-black text-white px-3 py-1 rounded-full text-sm">
//               Search: {searchTerm}
//               <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchTerm("")} />
//             </span>
//           )}
//           {selectedIndustry && (
//             <span className="inline-flex items-center gap-1 bg-gray-800 text-white px-3 py-1 rounded-full text-sm">
//               {selectedIndustry}
//               <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedIndustry("")} />
//             </span>
//           )}
//           {selectedExpertise && (
//             <span className="inline-flex items-center gap-1 bg-gray-700 text-white px-3 py-1 rounded-full text-sm">
//               {selectedExpertise}
//               <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedExpertise("")} />
//             </span>
//           )}
//           {experienceRange && (
//             <span className="inline-flex items-center gap-1 bg-gray-600 text-white px-3 py-1 rounded-full text-sm">
//               {experienceRange} years
//               <X className="h-3 w-3 cursor-pointer" onClick={() => setExperienceRange("")} />
//             </span>
//           )}
//           {selectedLocation && (
//             <span className="inline-flex items-center gap-1 bg-gray-500 text-white px-3 py-1 rounded-full text-sm">
//               {selectedLocation}
//               <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedLocation("")} />
//             </span>
//           )}
//         </div>
//       )}

//       {/* Results Counter */}
//       <div className="mb-3">
//         <p className="text-gray-600">
//           Showing <span className="font-semibold text-black">{filteredMentors.length}</span> of{" "}
//           <span className="font-semibold">{mentors.length}</span> mentors
//         </p>
//       </div>

//       {/* Mentors Grid */}
//       {loading ? (
//         <div className="flex items-center justify-center py-5">
//           <div className="text-center">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
//             <p className="text-gray-500">Loading mentors...</p>
//           </div>
//         </div>
//       ) : filteredMentors.length === 0 ? (
//         <div className="text-center py-5">
//           <div className="mb-4">
//             <Search className="h-16 w-16 text-gray-300 mx-auto" />
//           </div>
//           <h3 className="text-xl font-semibold text-gray-700 mb-2">No mentors found</h3>
//           <p className="text-gray-500 mb-4">
//             {hasActiveFilters 
//               ? "Try adjusting your filters to find more mentors" 
//               : "No mentors are currently available"
//             }
//           </p>
//           {hasActiveFilters && (
//             <button
//               onClick={clearAllFilters}
//               className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
//             >
//               Clear All Filters
//             </button>
//           )}
//         </div> 
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
//           {filteredMentors.map((mentor) => (
//             <MentorCard
//               key={mentor.id}
//               Name={`${mentor.first_name} ${mentor.last_name}`}
//               Industry={mentor.Industry}
//               experience_years={mentor.experience_years}
//               expertise_area={mentor.expertise_area}
//               ImageUrl={mentor.ImageUrl || mentor.profile_url}
//               mentorData={mentor}
//               location={mentor.location}
//             />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }