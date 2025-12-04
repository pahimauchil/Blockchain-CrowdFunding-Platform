/**
 * Trust score utility functions
 * Used for determining color classes based on trust score values
 */

/**
 * Get Tailwind CSS color class based on trust score
 * @param {number} score - Trust score (0-100)
 * @returns {string} Tailwind CSS color class
 */
export const getTrustColor = (score) => {
  if (score >= 70) return "text-green-500";
  if (score >= 50) return "text-yellow-500";
  return "text-red-500";
};


















