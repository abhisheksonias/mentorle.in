import { supabase } from "@/lib/supabase";

/**
 * Upload profile image to Supabase storage
 * @param {File} file - The image file to upload
 * @param {string} userId - User ID for unique file naming
 * @returns {Promise<string>} - Public URL of uploaded image
 */
export const uploadProfileImage = async (file, userId) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `profile_${Date.now()}.${fileExt}`;
    const filePath = `mentee-profiles/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw error;
  }
};

/**
 * Upload resume to Supabase storage
 * @param {File} file - The resume file to upload
 * @param {string} userId - User ID for unique file naming
 * @returns {Promise<string>} - Public URL of uploaded resume
 */
export const uploadResume = async (file, userId) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `resume_${Date.now()}.${fileExt}`;
    const filePath = `mentee-resumes/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading resume:', error);
    throw error;
  }
};

/**
 * Delete file from Supabase storage
 * @param {string} fileUrl - URL of the file to delete
 * @param {string} folder - Folder name (mentee-profiles or mentee-resumes)
 * @returns {Promise<boolean>} - Success status
 */
export const deleteFile = async (fileUrl, folder) => {
  try {
    if (!fileUrl) return true;

    const urlParts = fileUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `${folder}/${fileName}`;
    
    const { error: deleteError } = await supabase.storage
      .from('media')
      .remove([filePath]);
    
    if (deleteError) {
      console.warn("Failed to delete file:", deleteError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

/**
 * Validate image file
 * @param {File} file - File to validate
 * @returns {Object} - Validation result with isValid and error message
 */
export const validateImageFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!file) {
    return { isValid: false, error: "No file selected" };
  }

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: "Please select a JPG, PNG, or GIF image" };
  }

  if (file.size > maxSize) {
    return { isValid: false, error: "Please select an image smaller than 5MB" };
  }

  return { isValid: true, error: null };
};

/**
 * Validate resume file
 * @param {File} file - File to validate
 * @returns {Object} - Validation result with isValid and error message
 */
export const validateResumeFile = (file) => {
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!file) {
    return { isValid: false, error: "No file selected" };
  }

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: "Please select a PDF or Word document" };
  }

  if (file.size > maxSize) {
    return { isValid: false, error: "Please select a file smaller than 10MB" };
  }

  return { isValid: true, error: null };
};

