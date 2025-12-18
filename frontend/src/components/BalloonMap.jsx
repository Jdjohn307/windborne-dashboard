// src/components/BalloonMap.jsx
import React, { useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, Polyline, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getColor, API_URL } from "../utils/constants.js";

// Main map component displaying balloon positions and tracks
export default function BalloonMap({ allPoints = [], polylines = [] }) {
  const [predictedPaths, setPredictedPaths] = useState([]);

  // Smooth wind direction calc using exponential moving average
  function smoothDirection(prevDir, newDir, alpha = 0.3) {
    const delta = ((newDir - prevDir + 540) % 360) - 180; // shortest angle diff
    return (prevDir + alpha * delta + 360) % 360;
  }

  /*
  * Simulate balloon path given windy forecast data
  * Note that data from Windy API is random and may not reflect real balloon behavior
  * Thus balloon path simulation is often not realistic, but in theory shows how balloons
  * might move given the wind conditions.
  */
  function simulateBalloonPath(startPoint, windyData) {
    const path = [{ lat: startPoint.latitude, lon: startPoint.longitude }];
    let prevDir = windyData[0]?.wind.direction || 0;
    const dt = 600; // 10 minutes in seconds

    // Iterate through windy forecast data to compute path
    windyData.forEach((wp) => {
      const last = path[path.length - 1];
      const speedKmh = wp.wind.speed * 3.6;

      // Smooth sudden direction changes
      const dir = smoothDirection(prevDir, wp.wind.direction, 0.3);
      prevDir = dir;

      const distanceKm = (speedKmh * dt) / 3600; // distance in km for dt
      const directionRad = (dir * Math.PI) / 180;

      // Convert km to degrees
      const deltaLat = (distanceKm * Math.cos(directionRad)) / 111;
      const deltaLon =
        (distanceKm * Math.sin(directionRad)) / (111 * Math.cos(last.lat * (Math.PI / 180)));

      path.push({
        lat: last.lat + deltaLat,
        lon: last.lon + deltaLon,
      });
    });

    return path;
  }

  // Find the end point of the track containing the clicked point
  function getTrackEndPoint(clickedPoint, polylines) {
    if (!polylines || polylines.length === 0) return clickedPoint;

    // Build tracks from polylines
    const tracks = [];
    const trackMap = new Map(); // map from point identifier to track index

    polylines.forEach(segment => {
      const [p1, p2] = segment;
      const key1 = `${p1.latitude}-${p1.longitude}-${p1.hour_ago}`;
      const key2 = `${p2.latitude}-${p2.longitude}-${p2.hour_ago}`;

      let trackIdx1 = trackMap.get(key1);
      let trackIdx2 = trackMap.get(key2);

      if (trackIdx1 !== undefined && trackIdx2 !== undefined && trackIdx1 !== trackIdx2) {
        // merge tracks
        tracks[trackIdx1] = [...tracks[trackIdx1], ...tracks[trackIdx2]];
        tracks[trackIdx2] = [];
        trackMap.set(key2, trackIdx1);
      } else if (trackIdx1 !== undefined) {
        tracks[trackIdx1].push(p2);
        trackMap.set(key2, trackIdx1);
      } else if (trackIdx2 !== undefined) {
        tracks[trackIdx2].unshift(p1);
        trackMap.set(key1, trackIdx2);
      } else {
        // new track
        const newIdx = tracks.length;
        tracks.push([p1, p2]);
        trackMap.set(key1, newIdx);
        trackMap.set(key2, newIdx);
      }
    });

    // Find the track containing the clicked point
    const clickedKey = `${clickedPoint.latitude}-${clickedPoint.longitude}-${clickedPoint.hour_ago}`;
    const trackIdx = trackMap.get(clickedKey);

    if (trackIdx !== undefined) {
      const track = tracks[trackIdx].filter(p => p); // remove empty slots from merges
      // Return the last point in the track
      return track[0];
    }

    // fallback if not found
    return clickedPoint;
  }

  // Handle click on a balloon point to fetch and display predicted path for most recent position
  const handlePointClick = async (point) => {
    try {
      // Get the first point in this point's track (the newest)
      const startPoint = getTrackEndPoint(point, polylines);

      console.log(`Fetching windy forecast data`);
      const res = await fetch(`${API_URL}/api/windy/forecast?lat=${startPoint.latitude}&lon=${startPoint.longitude}`);
      console.log(`Fetched windy forecast data`);

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();

      const path = simulateBalloonPath(startPoint, json.data);
      setPredictedPaths([path]);
    } catch (err) {
      console.error("Windy forecast fetch failed:", err);
    }
  };



  // Adjust polyline segment positions to handle date line crossings on the edge of the map
  const getSafePositions = (segment) => {
    if (segment.length < 2) return segment.map(p => [p.latitude, p.longitude]);

    const p1 = segment[0];
    const p2 = segment[1];

    let lon1 = p1.longitude;
    let lon2 = p2.longitude;

    // If raw difference > 180 degrees, adjust the second point by 360 to make the short path
    let dLon = lon2 - lon1;
    if (dLon > 180) lon2 -= 360;
    if (dLon < -180) lon2 += 360;

    return [[p1.latitude, lon1], [p2.latitude, lon2]];
  };

  // Render the map with points, polylines, and predicted paths
  return (
    <MapContainer center={[20, 0]} zoom={2} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution="© OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        noWrap={true}
      />

      {/* Points and clickable areas */}
      {allPoints.map((p, i) => (
        <React.Fragment key={i}>
          {/* Visible point */}
          <CircleMarker
            center={[p.latitude, p.longitude]}
            radius={2}
            pathOptions={{ color: getColor(p.hour_ago) }}
          />
          
          {/* Invisible interaction radius */}
          <Circle
            center={[p.latitude, p.longitude]}
            radius={15000}
            pathOptions={{ opacity: 0, fillOpacity: 0 }}
            eventHandlers={{ click: () => handlePointClick(p) }}
          >
            <Tooltip
              direction="top"
              offset={[0, -4]}
              opacity={0.9}
              sticky
            >
              <div style={{ fontSize: "12px", lineHeight: "1.4" }}>
                <div><strong>{p.hour_ago}h ago</strong></div>
                <div>Latitude: {p.latitude.toFixed(4)}</div>
                <div>Longitude: {p.longitude.toFixed(4)}</div>
                <div>Altitude: {p.altitude_km.toFixed(4)} km</div>
              </div>
            </Tooltip>
          </Circle>
        </React.Fragment>
      ))}

      {/* Polyline tracks */}
      {polylines.map((line, i) => {
        const safePositions = getSafePositions(line);
        return (
          <Polyline
            key={i}
            positions={safePositions}
            color={getColor(line[0].hour_ago)}
            weight={1}
          />
        );
      })}

      {/* Predicted paths */}
      {predictedPaths.map((path, i) => {
        // Adjust path for date line crossings
        const safePath = [];
        let prevLon = path[0].lon;
        safePath.push([path[0].lat, prevLon]);

        // Iterate through path points and adjust longitudes as needed
        for (let j = 1; j < path.length; j++) {
          let currLon = path[j].lon;
          let dLon = currLon - prevLon;
          if (dLon > 180) currLon -= 360;
          if (dLon < -180) currLon += 360;
          safePath.push([path[j].lat, currLon]);
          prevLon = currLon; // use adjusted for next segment
        }

        // Render the predicted path polyline
        return (
          <Polyline
            key={`pred-${i}`}
            positions={safePath}
            color="orange"
            weight={2}
            dashArray="4"
          />
        );
      })}
    </MapContainer>
  );
}