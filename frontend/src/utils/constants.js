// frontend/src/utils/constants.js
export const MAX_POINTS_PER_HOUR = 50;      // max markers per hour
export const DIST_THRESHOLD = 600;          // degrees for linking points
export const HOURS_TOTAL = 23;              // total hours of data from windborne backend
export const MAX_SPEED_RATIO = 3.0;         // max speed ratio for linking points
export const MAX_TURN_ANGLE_DEG = 20;       // max turn angle for linking points

export const API_URL = import.meta.env.PROD ? 'https://windborne-dashboard-4anl.onrender.com' : 'http://localhost:3000';

// Gradient from red (recent) to blue (old)
export const getColor = (hour) => {
  const ratio = hour / HOURS_TOTAL;         // 0 newest, 23 oldest
  const r = Math.floor(255 * (1 - ratio));  // red is recent
  const g = 40;                             // green to make it more visible
  const b = Math.floor(255 * ratio);        // blue is old
  const alpha = 0.3 + 0.5 * (1 - ratio);    // oldest: 0.3, newest: 0.8
  return `rgba(${r},${g},${b},${alpha})`;
};


