// frontend/src/utils/constants.js
export const MAX_POINTS_PER_HOUR = 50;      // max markers per hour
export const DIST_THRESHOLD = 5;            // degrees for linking points
export const HOURS_TOTAL = 23;              // number of hours in dataset

// Gradient from red (recent) to blue (old)
export const getColor = (hour) => {
  const ratio = hour / HOURS_TOTAL;         // 0 → newest, 23 → oldest
  const r = Math.floor(255 * (1 - ratio));  // red is recent
  const g = 40;                             // green to make it more visible
  const b = Math.floor(255 * ratio);        // blue is old
  const alpha = 0.3 + 0.5 * (1 - ratio);    // oldest: 0.3, newest: 0.8
  return `rgba(${r},${g},${b},${alpha})`;
};


