/**
 * Filter mentors based on applied filters
 * 
 * @param {Array} mentors - The full list of mentors to filter
 * @param {Object} filters - The filter criteria to apply
 * @returns {Array} - Filtered mentors list
 */
export function filterMentors(mentors, filters) {
  const {
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
  } = filters;
  
  let filtered = [...mentors];

  // Enhanced search term filter (name, skill/topic, role, company)
  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    filtered = filtered.filter(mentor => {
      // Search in name
      const nameMatch = mentor.name?.toLowerCase().includes(searchLower) ||
                       `${mentor.first_name || ''} ${mentor.last_name || ''}`.toLowerCase().includes(searchLower);
      
      // Search in industry
      const industryMatch = mentor.Industry?.toLowerCase().includes(searchLower);
      
      // Search in bio
      const bioMatch = mentor.bio?.toLowerCase().includes(searchLower);
      
      // Search in expertise/skills
      const expertiseMatch = Array.isArray(mentor.expertise_area) 
        ? mentor.expertise_area.some(area => area.toLowerCase().includes(searchLower))
        : mentor.expertise_area?.toLowerCase().includes(searchLower);
      
      // Search in role
      const roleMatch = mentor.current_role?.toLowerCase().includes(searchLower);
      
      // Search in company (from past_experience)
      const companyMatch = mentor.past_experience?.some(exp => 
        exp.company?.toLowerCase().includes(searchLower)
      ) || false;
      
      // Search in skills (if available)
      const skillsMatch = Array.isArray(mentor.skills)
        ? mentor.skills.some(skill => skill.toLowerCase().includes(searchLower))
        : false;
      
      return nameMatch || industryMatch || bioMatch || expertiseMatch || roleMatch || companyMatch || skillsMatch;
    });
  }

  // Industry filter
  if (selectedIndustry) {
    filtered = filtered.filter(mentor => mentor.Industry === selectedIndustry);
  }

  // Expertise filter
  if (selectedExpertise) {
    filtered = filtered.filter(mentor => {
      if (Array.isArray(mentor.expertise_area)) {
        return mentor.expertise_area.includes(selectedExpertise);
      }
      return mentor.expertise_area === selectedExpertise;
    });
  }

  // Experience range filter
  if (experienceRange) {
    filtered = filtered.filter(mentor => {
      const years = mentor.experience_years;
      if (!years) return false;
      
      switch (experienceRange) {
        case "0-2": return years >= 0 && years <= 2;
        case "3-5": return years >= 3 && years <= 5;
        case "6-10": return years >= 6 && years <= 10;
        case "10+": return years > 10;
        default: return true;
      }
    });
  }

  // Location filter
  if (selectedLocation) {
    filtered = filtered.filter(mentor => mentor.location === selectedLocation);
  }

  // Price range filter (based on offerings)
  if (priceRange) {
    filtered = filtered.filter(mentor => {
      // This will be enhanced when we fetch offerings with mentors
      // For now, we'll check if mentor has offerings in the price range
      const minPrice = priceRange === "free" ? 0 : 
                      priceRange === "0-500" ? 0 : 
                      priceRange === "500-1000" ? 500 : 
                      priceRange === "1000-2000" ? 1000 : 
                      priceRange === "2000+" ? 2000 : 0;
      const maxPrice = priceRange === "free" ? 0 : 
                      priceRange === "0-500" ? 500 : 
                      priceRange === "500-1000" ? 1000 : 
                      priceRange === "1000-2000" ? 2000 : 
                      priceRange === "2000+" ? Infinity : Infinity;
      
      // If mentor has price info in their data, use it
      // Otherwise, we'll need to check offerings separately
      return true; // Placeholder - will be enhanced with offerings data
    });
  }

  // Language filter
  if (selectedLanguage) {
    filtered = filtered.filter(mentor => {
      const languages = Array.isArray(mentor.languages) ? mentor.languages : 
                       mentor.languages ? [mentor.languages] : [];
      return languages.some(lang => lang.toLowerCase() === selectedLanguage.toLowerCase());
    });
  }

  // Session type filter (based on offerings)
  if (selectedSessionType) {
    // This will be enhanced when we fetch offerings with mentors
    // For now, return all (will be filtered by offerings data)
    return filtered;
  }

  // Availability filter
  if (hasAvailability) {
    // Check if mentor has availability set up
    filtered = filtered.filter(mentor => {
      // Check if mentor has availability in their profile
      return mentor.use_profile_availability !== false; // Placeholder
    });
  }

  // Favorites filter - only show mentors that are in the favorites list
  if (showFavorites) {
    if (!favoriteMentorIds || favoriteMentorIds.length === 0) {
      // If filter is on but no favorites, return empty array
      return [];
    }
    filtered = filtered.filter(mentor => {
      // Check if mentor's user_id is in the favorites list
      const isFavorite = favoriteMentorIds.includes(mentor.user_id);
      return isFavorite;
    });
  }

  return filtered;
}

/**
 * Extract unique filter options from mentor data
 * 
 * @param {Array} mentorData - The mentor data to extract options from
 * @returns {Object} - Object containing arrays of filter options
 */
export function extractFilterOptions(mentorData) {
  // Extract unique industries
  const industries = [...new Set(mentorData.map(m => m.Industry).filter(Boolean))];

  // Extract unique expertise areas
  const allExpertiseAreas = mentorData.flatMap(mentor => {
    if (Array.isArray(mentor.expertise_area)) {
      return mentor.expertise_area;
    } else if (mentor.expertise_area) {
      return [mentor.expertise_area];
    }
    return [];
  });
  const expertiseAreas = [...new Set(allExpertiseAreas)];

  // Extract unique locations
  const locations = [...new Set(mentorData.map(m => m.location).filter(Boolean))];

  // Extract unique languages
  const allLanguages = mentorData.flatMap(mentor => {
    if (Array.isArray(mentor.languages)) {
      return mentor.languages;
    } else if (mentor.languages) {
      return [mentor.languages];
    }
    return [];
  });
  const languages = [...new Set(allLanguages)];

  // Extract unique roles
  const roles = [...new Set(mentorData.map(m => m.current_role).filter(Boolean))];

  // Extract unique companies (from past_experience)
  const allCompanies = mentorData.flatMap(mentor => {
    if (Array.isArray(mentor.past_experience)) {
      return mentor.past_experience.map(exp => exp.company).filter(Boolean);
    }
    return [];
  });
  const companies = [...new Set(allCompanies)];

  return {
    industries,
    expertiseAreas,
    locations,
    languages,
    roles,
    companies
  };
}
