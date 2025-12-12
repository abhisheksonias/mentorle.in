/**
 * Blog utility functions
 */

import { createSlug } from "./slugify";

/**
 * Generate a unique slug from title
 * @param {string} title - The post title
 * @param {string} existingSlug - Optional existing slug to check uniqueness
 * @returns {Promise<string>} - Unique slug
 */
export async function generateUniqueSlug(title, existingSlug = null) {
  if (!title) return "";
  
  let baseSlug = createSlug(title);
  let slug = baseSlug;
  let counter = 1;

  // If this is an edit and slug hasn't changed, return existing slug
  if (existingSlug && slug === existingSlug) {
    return existingSlug;
  }

  // Check uniqueness (this will be done in the API route with Supabase)
  return slug;
}

/**
 * Calculate reading time in minutes
 * @param {string} content - The post content
 * @returns {number} - Reading time in minutes
 */
export function calculateReadingTime(content) {
  if (!content) return 0;
  
  // Average reading speed: 200-250 words per minute
  const wordsPerMinute = 225;
  const wordCount = content.trim().split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);
  
  return Math.max(1, readingTime); // At least 1 minute
}

/**
 * Validate post data
 * @param {Object} postData - Post data to validate
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export function validatePostData(postData) {
  const errors = [];

  if (!postData.title || postData.title.trim().length < 3) {
    errors.push("Title must be at least 3 characters");
  }

  // For drafts, allow empty or short content
  // For published and scheduled posts, require at least 50 characters
  if (postData.status === 'published' || postData.status === 'scheduled') {
    if (!postData.content || postData.content.trim().length < 50) {
      errors.push(`Content must be at least 50 characters for ${postData.status} posts`);
    }
  } else {
    // For drafts, just check if content exists (can be empty)
    if (postData.content === undefined || postData.content === null) {
      errors.push("Content field is required");
    }
  }

  if (postData.status && !["draft", "published", "scheduled", "archived", "pending"].includes(postData.status)) {
    errors.push("Invalid status");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

