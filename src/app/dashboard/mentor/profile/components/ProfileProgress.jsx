"use client";

import { useMemo } from "react";
import { CheckCircle2, Circle } from "lucide-react";

/**
 * Profile completion progress bar
 * Calculates and displays profile completion percentage
 */
export default function ProfileProgress({ formData, avatarUrl }) {
  
  // Define fields and their weights for completion calculation
  const fieldConfig = useMemo(() => [
    // Core fields (Step 1) - Higher weight
    { key: 'name', label: 'Name', weight: 15, getValue: () => formData.name },
    { key: 'current_role', label: 'Current Role', weight: 15, getValue: () => formData.current_role },
    { key: 'bio', label: 'Bio', weight: 10, getValue: () => formData.bio },
    { key: 'avatar', label: 'Profile Photo', weight: 10, getValue: () => avatarUrl },
    
    // Professional fields (Step 2) - Medium weight
    { key: 'expertise_area', label: 'Expertise Areas', weight: 15, getValue: () => formData.expertise_area?.length > 0 },
    { key: 'experience_years', label: 'Years of Experience', weight: 5, getValue: () => formData.experience_years },
    { key: 'industry', label: 'Industry', weight: 5, getValue: () => formData.industry },
    
    // Social links - Lower weight (at least one is good)
    { key: 'social_links', label: 'Social Links', weight: 10, getValue: () => 
      formData.linkedin_url || formData.github_url || formData.youtube || formData.portfolio_url 
    },
    
    // Optional but nice to have
    { key: 'location', label: 'Location', weight: 5, getValue: () => formData.location },
    { key: 'languages_spoken', label: 'Languages', weight: 5, getValue: () => formData.languages_spoken?.length > 0 },
    { key: 'past_experience', label: 'Work Experience', weight: 5, getValue: () => formData.past_experience?.length > 0 },
  ], [formData, avatarUrl]);

  // Calculate completion
  const { percentage, completedFields, totalFields, missingFields } = useMemo(() => {
    let totalWeight = 0;
    let completedWeight = 0;
    const missing = [];
    let completed = 0;

    fieldConfig.forEach(field => {
      totalWeight += field.weight;
      const value = field.getValue();
      const isCompleted = Boolean(value);
      
      if (isCompleted) {
        completedWeight += field.weight;
        completed++;
      } else {
        missing.push(field.label);
      }
    });

    return {
      percentage: Math.round((completedWeight / totalWeight) * 100),
      completedFields: completed,
      totalFields: fieldConfig.length,
      missingFields: missing
    };
  }, [fieldConfig]);

  // Get progress bar color based on percentage
  const getProgressColor = () => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  // Get status message
  const getStatusMessage = () => {
    if (percentage === 100) return 'Profile complete! 🎉';
    if (percentage >= 80) return 'Almost there!';
    if (percentage >= 50) return 'Good progress';
    return 'Let\'s complete your profile';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Profile Completion</h3>
        <span className={`text-lg font-bold ${percentage >= 80 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-orange-600'}`}>
          {percentage}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 rounded-full h-2.5 mb-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${getProgressColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Status Message */}
      <p className="text-xs text-gray-500 mb-3">{getStatusMessage()}</p>

      {/* Missing Fields (show top 3 if not complete) */}
      {percentage < 100 && missingFields.length > 0 && (
        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs font-medium text-gray-600 mb-2">Complete these to improve:</p>
          <ul className="space-y-1.5">
            {missingFields.slice(0, 3).map((field) => (
              <li key={field} className="flex items-center gap-2 text-xs text-gray-500">
                <Circle className="h-3 w-3 text-gray-300" />
                <span>{field}</span>
              </li>
            ))}
            {missingFields.length > 3 && (
              <li className="text-xs text-gray-400 ml-5">
                +{missingFields.length - 3} more
              </li>
            )}
          </ul>
        </div>
      )}

      {/* All Complete */}
      {percentage === 100 && (
        <div className="flex items-center gap-2 text-green-600 border-t border-gray-100 pt-3">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-xs font-medium">All fields completed</span>
        </div>
      )}
    </div>
  );
}

