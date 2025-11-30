/**
 * Date utility functions for handling Unix timestamps and date inputs
 * Campaign deadlines are stored as Unix timestamps (seconds) in the database
 * HTML date inputs require YYYY-MM-DD format
 */

/**
 * Convert Unix timestamp (seconds) to YYYY-MM-DD string for date input
 * @param {number|string} timestamp - Unix timestamp in seconds
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const timestampToDateInput = (timestamp) => {
  if (!timestamp) return "";

  // Handle both seconds and milliseconds
  let timestampMs;
  if (typeof timestamp === "number") {
    // If timestamp is in seconds (< 1e12), convert to milliseconds
    timestampMs = timestamp < 1e12 ? timestamp * 1000 : timestamp;
  } else if (typeof timestamp === "string") {
    // Try parsing as number first
    const num = Number(timestamp);
    if (!Number.isNaN(num)) {
      timestampMs = num < 1e12 ? num * 1000 : num;
    } else {
      // Try parsing as date string
      const date = new Date(timestamp);
      if (!Number.isNaN(date.getTime())) {
        timestampMs = date.getTime();
      } else {
        return "";
      }
    }
  } else {
    return "";
  }

  const date = new Date(timestampMs);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/**
 * Convert YYYY-MM-DD string to Unix timestamp (seconds) at end of day UTC
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {number} Unix timestamp in seconds
 */
export const dateInputToTimestamp = (dateString) => {
  if (!dateString) return null;

  const parts = dateString.split("-");
  if (parts.length !== 3) return null;

  const [year, month, day] = parts.map(Number);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return null;
  }

  // Create date at end of day UTC (23:59:59)
  const date = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));
  if (Number.isNaN(date.getTime())) return null;

  // Return timestamp in seconds
  return Math.floor(date.getTime() / 1000);
};

/**
 * Format timestamp to readable date string
 * @param {number|string} timestamp - Unix timestamp in seconds
 * @param {object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDate = (timestamp, options = {}) => {
  if (!timestamp) return "N/A";

  let timestampMs;
  if (typeof timestamp === "number") {
    timestampMs = timestamp < 1e12 ? timestamp * 1000 : timestamp;
  } else if (typeof timestamp === "string") {
    const num = Number(timestamp);
    if (!Number.isNaN(num)) {
      timestampMs = num < 1e12 ? num * 1000 : num;
    } else {
      const date = new Date(timestamp);
      if (!Number.isNaN(date.getTime())) {
        timestampMs = date.getTime();
      } else {
        return "Invalid Date";
      }
    }
  } else {
    return "Invalid Date";
  }

  const date = new Date(timestampMs);
  if (Number.isNaN(date.getTime())) return "Invalid Date";

  const defaultOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  return date.toLocaleDateString("en-US", { ...defaultOptions, ...options });
};

/**
 * Check if a date is in the past
 * @param {number|string} timestamp - Unix timestamp in seconds
 * @returns {boolean} True if date is in the past
 */
export const isPastDate = (timestamp) => {
  if (!timestamp) return false;

  let timestampMs;
  if (typeof timestamp === "number") {
    timestampMs = timestamp < 1e12 ? timestamp * 1000 : timestamp;
  } else {
    return false;
  }

  return timestampMs < Date.now();
};

/**
 * Normalize deadline to seconds (handles both seconds and milliseconds)
 * @param {number|string} deadline - Deadline timestamp (seconds or milliseconds)
 * @returns {number} Deadline in seconds
 */
export const normalizeDeadlineSeconds = (dl) => {
  const n = Number(dl);
  if (!Number.isFinite(n)) return 0;
  return n >= 1e12 ? Math.floor(n / 1000) : Math.floor(n);
};

