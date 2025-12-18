// frontend/src/hooks/useBalloonData.js
import { useEffect, useState } from "react";
import mockData from "../mock/balloons.json";
import { API_URL } from "../utils/config.js";

// Custom hook to fetch balloon data from the API
export function useBalloonData() {
  const [data, setData] = useState([]);

  // Fetch data on mount
  useEffect(() => {
    // Use mock data in development mode
    if (import.meta.env.DEV) {
      console.log("Using mock balloon data");
      setData(mockData);
    } else {
      fetch(`${API_URL}/api/balloons`)
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
