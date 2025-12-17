// frontend/src/utils/mapUtils.js
import { MAX_POINTS_PER_HOUR, DIST_THRESHOLD } from "./constants.js";

// Sample points evenly per hour to reduce clutter
export function samplePointsByHour(data, maxPoints = MAX_POINTS_PER_HOUR) {
  return data.map(hourData => {
    if (!hourData.positions) return { hour_ago: hourData.hour_ago, positions: [] };
    const step = Math.max(1, Math.floor(hourData.positions.length / maxPoints));
    return {
      hour_ago: hourData.hour_ago,
      positions: hourData.positions.filter((_, i) => i % step === 0),
    };
  });
}

// Generate polylines linking points from hour to previous hour
export function linkPointsWithPolylines(pointsByHour) {
  const polylines = [];
  const prevHourPositions = {};

  pointsByHour.forEach(({ hour_ago, positions }) => {
    positions.forEach(pos => {
      let nearest = null;
      let minDist = DIST_THRESHOLD;

      if (prevHourPositions[hour_ago - 1]) {
        prevHourPositions[hour_ago - 1].forEach(prev => {
          const dx = pos.longitude - prev.longitude;
          const dy = pos.latitude - prev.latitude;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDist) {
            minDist = dist;
            nearest = prev;
          }
        });
      }

      if (nearest) {
        polylines.push([
          { ...nearest, hour_ago: hour_ago - 1 },
          { ...pos, hour_ago }
        ]);
      }
    });

    prevHourPositions[hour_ago] = positions;
  });

  return polylines;
}

// Flatten all points for markers
export function flattenPoints(pointsByHour, maxPointsPerHour = null) {
  // If maxPointsPerHour is set, slice per hour
  return pointsByHour.flatMap(hour => {
    const pts = hour.positions.map(p => ({ ...p, hour_ago: hour.hour_ago }));
    if (maxPointsPerHour && pts.length > maxPointsPerHour) {
      const step = Math.ceil(pts.length / maxPointsPerHour);
      return pts.filter((_, i) => i % step === 0);
    }
    return pts;
  });
}
