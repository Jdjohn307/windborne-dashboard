// frontend/src/hooks/useBalloonData.js
import { useEffect, useState } from "react";
import mockData from "../mock/balloons.json";

export function useBalloonData() {
  const [data, setData] = useState([]);

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("Using mock balloon data");
      setData(mockData);
    } else {
      fetch("http://localhost:3000/api/balloons")
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then(json => setData(json))
        .catch(err => console.error("Fetch failed:", err));
    }
  }, []);

  return data;
}
