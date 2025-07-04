# Monitor Globe - 3D Server Monitoring

A complete 3D globe visualization website that displays server monitors at their physical locations worldwide with real-time monitoring data.

## Features

- **3D Globe Visualization**: Realistic Earth appearance with gradient shading and continental outlines
- **Monitor Location Mapping**: Uses OpenStreetMap Nominatim API to convert city names to coordinates
- **Interactive Controls**: Mouse drag rotation, wheel zoom, auto-rotation with pause on interaction
- **Real-time Monitoring**: Displays CPU, RAM, disk, and network usage with visual progress bars
- **Status Indicators**: Color-coded monitors (green=online, red=offline, yellow=selected)
- **Error Handling**: Graceful fallback to hardcoded coordinates when API is unavailable
- **Coordinate Caching**: Reduces API calls by caching city coordinates
- **Professional UI**: Dark theme with glassmorphism effects and responsive design

## Files

- `index.html` - Main application interface
- `monitor-globe.js` - Core globe visualization and monitor management logic
- `demo.html` - Feature showcase and demo interface

## Usage

1. Open `index.html` in a web browser
2. View the 3D globe with auto-rotation
3. Click on monitor locations to view detailed information
4. Use debug controls to test different monitors
5. Interact with the globe using mouse controls

## API Integration

The application integrates with OpenStreetMap's Nominatim API:
```
https://nominatim.openstreetmap.org/search?q={CITY}&polygon_geojson=1&format=jsonv2
```

With graceful fallback to hardcoded coordinates for network-restricted environments.

## Monitor Data Structure

Each monitor displays:
- Server name and location
- Geographic coordinates  
- Online/offline status
- System uptime
- CPU usage percentage
- RAM usage percentage
- Disk usage percentage
- Network usage percentage

