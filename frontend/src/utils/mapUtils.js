// frontend/src/utils/mapUtils.js
import { MAX_POINTS_PER_HOUR, DIST_THRESHOLD, MAX_SPEED_RATIO, MAX_TURN_ANGLE_DEG } from "./constants.js";


// Reduce visual clutter by sampling a limited number of points per hour.
export function samplePointsByHour(data, maxPoints = MAX_POINTS_PER_HOUR) {
  return data.map(hourData => {
    if (!hourData.positions) {
      return { hour_ago: hourData.hour_ago, positions: [] };
    }

    const step = Math.max(1, Math.floor(hourData.positions.length / maxPoints));

    return {
      hour_ago: hourData.hour_ago,
      positions: hourData.positions.filter((_, i) => i % step === 0),
    };
  });
}

/**
 * Compute the great circle (Haversine) distance between two points in kilometers.
 *
 * This is more accurate than simple lat/lon deltas, especially once balloons
 * start spreading farther apart or approach the poles.
 */
function computeGreatCircleDist(p1, p2) {
  const toRad = deg => deg * Math.PI / 180;

  const lat1 = toRad(p1.latitude);
  const lat2 = toRad(p2.latitude);
  const dLon = toRad(p2.longitude - p1.longitude);

  const a =
    Math.sin((lat2 - lat1) / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.asin(Math.min(1, Math.sqrt(a)));
  const R = 6371; // Earth radius in km

  return R * c;
}

/**
 * Compute longitude deltas across the 180 degree dateline.
 *
 * Without this, direction calculations break when a balloon crosses
 * the map seam (e.g. +179° → -179° looks like a massive jump).
 */
function deltaLonWrapped(lon1, lon2) {
  let dLon = lon2 - lon1;
  while (dLon > 180) dLon -= 360;
  while (dLon < -180) dLon += 360;
  return dLon;
}

// Link points from hour to hour into continuous tracks then convert those tracks into polylines
export function linkPointsWithPolylines(pointsByHour) {
  const tracks = [];

  pointsByHour.forEach(({ hour_ago, positions }) => {
    if (positions.length === 0) return;

    // Filter for track where the last point's hour_ago is one less than current hour_ago
    const extendableTracks = tracks.filter(
      track =>
        track.length > 0 &&
        track[track.length - 1].hour_ago === hour_ago - 1
    );

    // If no existing tracks can be extended then start a new track
    if (extendableTracks.length === 0) {
      positions.forEach(pos => tracks.push([{ ...pos, hour_ago }]));
      return;
    }

    // Build a list of all possible valid links between extendable tracks and current positions
    const possibleLinks = [];

    extendableTracks.forEach((track, trackIdx) => {
      const last = track[track.length - 1];
      const prev = track.length >= 2 ? track[track.length - 2] : null;

      positions.forEach((pos, posIdx) => {
        const distKm = computeGreatCircleDist(last, pos);

        // Discard links that are too far apart
        if (distKm >= DIST_THRESHOLD) return;

        let valid = true;

        // If we have a previous point then apply additional continuity criteria
        if (prev) {
          const distPrevKm = computeGreatCircleDist(prev, last);

          // Prevent divide by zero and noisy stationary points
          if (distPrevKm < 1) valid = false;

          if (valid) {
            
            // Speed continuity, prevent sudden large speed changes from being linked
            const speedRatio = distKm / distPrevKm;
            if (
              speedRatio > MAX_SPEED_RATIO ||
              speedRatio < 1 / MAX_SPEED_RATIO
            ) {
              valid = false;
            }

            // Direction continuity, prevent sharp turns from being linked
            if (valid) {
              const dxPrev = deltaLonWrapped(prev.longitude, last.longitude);
              const dyPrev = last.latitude - prev.latitude;
              const dxNew = deltaLonWrapped(last.longitude, pos.longitude);
              const dyNew = pos.latitude - last.latitude;

              // Compute angle between vectors using dot product
              const magPrev = Math.sqrt(dxPrev ** 2 + dyPrev ** 2);
              const magNew = Math.sqrt(dxNew ** 2 + dyNew ** 2);

              // Prevent divide by zero
              if (magPrev === 0 || magNew === 0) {
                valid = false;
              } else {
                // Clamp dot product to valid range for acos to avoid NaN due to floating point errors
                const dot = (dxPrev * dxNew + dyPrev * dyNew) / (magPrev * magNew);
                const angleDeg = Math.acos(Math.max(-1, Math.min(1, dot))) * 180 / Math.PI;

                // Check if the turn angle exceeds the maximum allowed
                if (angleDeg > MAX_TURN_ANGLE_DEG) valid = false;
              }
            }
          }
        }

        if (valid) {
          possibleLinks.push({ trackIdx, posIdx, distKm });
        }
      });
    });

    // Sort possible links by distance (closest first)
    possibleLinks.sort((a, b) => a.distKm - b.distKm);

    // Assign links greedily so that each track and position is used at most once
    const trackAssigned = new Array(extendableTracks.length).fill(false);
    const posAssigned = new Array(positions.length).fill(false);

    // Apply the links
    for (const link of possibleLinks) {
      if (!trackAssigned[link.trackIdx] && !posAssigned[link.posIdx]) {
        trackAssigned[link.trackIdx] = true;
        posAssigned[link.posIdx] = true;
        extendableTracks[link.trackIdx].push({
          ...positions[link.posIdx],
          hour_ago
        });
      }
    }

    // Start new tracks for any unassigned positions
    positions.forEach((pos, idx) => {
      if (!posAssigned[idx]) {
        tracks.push([{ ...pos, hour_ago }]);
      }
    });
  });

  // Convert tracks into polylines
  const polylines = [];
  tracks.forEach(track => {
    for (let i = 1; i < track.length; i++) {
      polylines.push([
        { ...track[i - 1] },
        { ...track[i] }
      ]);
    }
  });

  return polylines;
}

// Flatten pointsByHour into a single array and add hour_ago to each point
export function flattenPoints(pointsByHour, maxPointsPerHour = null) {
  return pointsByHour.flatMap(hour => {
    const pts = hour.positions.map(p => ({
      ...p,
      hour_ago: hour.hour_ago
    }));

    if (maxPointsPerHour && pts.length > maxPointsPerHour) {
      const step = Math.ceil(pts.length / maxPointsPerHour);
      return pts.filter((_, i) => i % step === 0);
    }

    return pts;
  });
}
