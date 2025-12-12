/**
 * Timezone Utility - Handles Indian Standard Time (IST) conversions
 * IST is UTC+5:30
 */

// Convert date to IST format for display
export const toIST = (date) => {
  if (!date) return "";
  
  const d = new Date(date);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(d);
};

// Get IST date string in YYYY-MM-DD format for input fields
export const getISTDateString = (date) => {
  if (!date) return "";
  
  const d = new Date(date);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata"
  }).format(d);
};

// Get IST time string in HH:MM format for input fields
export const getISTTimeString = (date) => {
  if (!date) return "";
  
  const d = new Date(date);
  const timeStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(d);
  
  return timeStr;
};

// Convert IST date and time inputs to UTC timestamp
export const toUTC = (dateString, timeString = "00:00") => {
  if (!dateString) return null;
  
  // Create a date string in IST
  const istDateTimeString = `${dateString}T${timeString}:00`;
  
  // Parse as IST and convert to UTC
  const istDate = new Date(istDateTimeString + "+05:30");
  
  return istDate.toISOString();
};

// Format date for display in Indian format (DD/MM/YYYY)
export const formatIndianDate = (date) => {
  if (!date) return "N/A";
  
  const d = new Date(date);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(d);
};

// Format date and time for display
export const formatIndianDateTime = (date) => {
  if (!date) return "N/A";
  
  const d = new Date(date);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(d);
};

// Get current IST date for default values
export const getCurrentISTDate = () => {
  const now = new Date();
  return getISTDateString(now);
};

// Get current IST time for default values
export const getCurrentISTTime = () => {
  const now = new Date();
  return getISTTimeString(now);
};

// Extract time from timestamp in IST
export const extractISTTime = (timestamp) => {
  if (!timestamp) return "";
  
  try {
    const date = new Date(timestamp);
    return getISTTimeString(date);
  } catch (error) {
    console.warn("Could not parse timestamp:", timestamp);
    return "";
  }
};

