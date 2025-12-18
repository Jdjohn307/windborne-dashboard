# Windborne Dashboard

A web-based dashboard visualizing the positions and trajectories of Windborne Systems' weather balloons over the past 24 hours. Balloon positions are displayed as colored points on a global map (red for recent, fading to blue for older), connected into continuous tracks. Clicking a point simulates a predicted future path using wind forecast data from the Windy API.

**Note**: The free Windy API provides randomized/sample data rather than real forecasts, so predicted paths are illustrative only and may not reflect actual wind conditions.

This project was built as part of a coding challenge for a job application.

## Live Demo

- Frontend: [https://jdjohn307.github.io/windborne-dashboard/](https://jdjohn307.github.io/windborne-dashboard/)
- Backend API (hosted on Render): [https://windborne-dashboard-4anl.onrender.com](https://windborne-dashboard-4anl.onrender.com)

## Features

- Real-time visualization of balloon positions from the last 24 hours
- Color gradient indicating data age (red = recent, blue = older)
- Intelligent trajectory linking using distance, speed, and direction continuity
- Click any balloon point to view a simulated future path (dashed orange line)
- Handles international date line crossings for accurate global rendering
- Point sampling to reduce visual clutter while preserving detail
- Mock data support for offline development
- Backend caching of Windy API responses (30-minute expiry)

## Tech Stack

### Frontend
- React (with custom hooks)
- Leaflet + react-leaflet (interactive map)
- Vite (build tool)
- Vanilla JavaScript utilities for data processing

### Backend
- Ruby on Rails 8.1 (API-only)
- Net::HTTP clients for Windborne Systems and Windy APIs
- Solid Cache for response caching
- SQLite3 (development)
- Rack CORS enabled
- Deployed with Render

## Prerequisites

- Node.js (v18+)
- Ruby 3.0+
- Bundler
- Windy API key (free tier available at [api.windy.com](https://api.windy.com))

## Setup

The project has separate frontend and backend directories.

### Backend
```bash
cd backend
bundle install


# Create .env with your Windy API key

echo "WINDY_API_KEY=your_key_here" > .env

rails server
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

App available at http://localhost:5173 (uses mock data in development)
In production, the frontend uses the Render-hosted backend URL defined in constants.js

## Misc Notes

Backend deployed to Render (free tier)
Frontend deployed to GitHub Pages
Update API_URL in frontend/src/utils/constants.js for production