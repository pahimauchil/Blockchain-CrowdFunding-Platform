/**
 * Returns the number of days left until the deadline (UTC). Never negative.
 * Expects deadline as a Unix timestamp in SECONDS (not milliseconds).
 * Converts deadline to milliseconds for JS Date.
 * Uses Math.ceil for human-friendly display (partial days count as 1).
 *
 * Fix: Added debug logs to verify deadline format and calculation.
 */
export const daysLeft = (deadline) => {
  // Normalize deadline to milliseconds.
  // If it's clearly in milliseconds (>= 1e12), use directly.
  // If it's in seconds (<= 1e12), multiply by 1000.
  let deadlineNum = Number(deadline);
  if (!Number.isFinite(deadlineNum) || Number.isNaN(deadlineNum)) {
    // Fallback: try parsing as ISO string
    const parsed = new Date(deadline).getTime();
    deadlineNum = parsed;
  }

  // If deadlineNum looks like seconds (10 digits, < 1e12), convert to ms.
  const deadlineMs = deadlineNum < 1e12 ? deadlineNum * 1000 : deadlineNum;

  const nowMs = Date.now();
  const remainingDays = Math.ceil((deadlineMs - nowMs) / (1000 * 60 * 60 * 24));
  return Math.max(0, remainingDays);
};

export const calculateBarPercentage = (goal, raisedAmount) => {
  const percentage = Math.round((raisedAmount * 100) / goal);

  return percentage;
};

export const checkIfImage = (url, callback) => {
  const img = new Image();
  img.src = url;

  if (img.complete) callback(true);

  img.onload = () => callback(true);
  img.onerror = () => callback(false);
};
