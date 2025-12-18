import BalloonMap from "./components/BalloonMap.jsx";
import { useBalloonData } from "./hooks/useBalloonData.js";
import { samplePointsByHour, linkPointsWithPolylines, flattenPoints } from "./utils/mapUtils.js";

export default function App() {
  const data = useBalloonData();

  // Process data: sample points and link into polylines
  const pointsByHour = samplePointsByHour(data, 50);
  const polylines = linkPointsWithPolylines(pointsByHour);
  const allPoints = flattenPoints(pointsByHour);

  // Render the main application with the BalloonMap
  return (
    <div style={{ height: "100%", width: "100%" }}>
      <BalloonMap allPoints={allPoints} polylines={polylines} />
    </div>
  );
}
