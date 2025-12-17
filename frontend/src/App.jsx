import BalloonMap from "./components/BalloonMap.jsx";
import { useBalloonData } from "./hooks/useBalloonData.js";
import { samplePointsByHour, linkPointsWithPolylines, flattenPoints } from "./utils/mapUtils.js";

export default function App() {
  const data = useBalloonData();

  // Sample per hour
  const pointsByHour = samplePointsByHour(data, 50);
  const polylines = linkPointsWithPolylines(pointsByHour);
  const allPoints = flattenPoints(pointsByHour);

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <BalloonMap allPoints={allPoints} polylines={polylines} />
    </div>
  );
}
