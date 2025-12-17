import { MapContainer, TileLayer, CircleMarker, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getColor } from "../utils/constants.js";

export default function BalloonMap({ allPoints = [], polylines = [] }) {
  return (
    <MapContainer center={[20, 0]} zoom={2} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution="© OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        noWrap={true}
      />

      {allPoints.map((p, i) => (
        <CircleMarker
          key={i}
          center={[p.latitude, p.longitude]}
          radius={2}
          pathOptions={{ color: getColor(p.hour_ago) }}
        />
      ))}

      {polylines.map((line, i) => (
        <Polyline
          key={i}
          positions={line.map(p => [p.latitude, p.longitude])}
          color={getColor(line[0].hour_ago)}
          weight={1}
        />
      ))}
    </MapContainer>
  );
}
