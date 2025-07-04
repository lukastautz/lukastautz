// Monitor Globe 2D Visualization (Fallback implementation)
class MonitorGlobe {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.monitors = [];
        this.selectedMonitor = null;
        this.coordinateCache = new Map();
        this.rotation = { x: 0, y: 0 };
        this.isDragging = false;
        this.lastMouse = { x: 0, y: 0 };
        this.zoom = 1;
        this.autoRotate = true;
        
        // API Configuration
        this.apiEndpoint = '/page/main'; // The API endpoint mentioned in requirements
        this.nominatimBaseUrl = 'https://nominatim.openstreetmap.org/search';
        
        this.init();
    }

    async init() {
        try {
            this.setupCanvas();
            this.setupEventListeners();
            await this.loadMonitorData();
            this.animate();
            this.hideLoading();
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('Failed to initialize Monitor Globe: ' + error.message);
        }
    }

    setupCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx = this.canvas.getContext('2d');
        
        document.getElementById('globe-container').appendChild(this.canvas);
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });

        // Mouse events for interaction
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMouse = { x: e.clientX, y: e.clientY };
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const deltaX = e.clientX - this.lastMouse.x;
                const deltaY = e.clientY - this.lastMouse.y;
                
                this.rotation.y += deltaX * 0.01;
                this.rotation.x -= deltaY * 0.01;
                
                // Clamp X rotation
                this.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.rotation.x));
                
                this.lastMouse = { x: e.clientX, y: e.clientY };
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.zoom += e.deltaY * -0.001;
            this.zoom = Math.max(0.5, Math.min(3, this.zoom));
        });

        // Click for monitor selection
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const clicked = this.getMonitorAtPosition(x, y);
            if (clicked) {
                this.selectMonitor(clicked);
            } else {
                this.deselectMonitor();
            }
        });
    }

    async loadMonitorData() {
        try {
            // Since the actual API endpoint might not exist, let's simulate monitor data
            // In a real implementation, this would fetch from the actual API
            const simulatedData = await this.getSimulatedMonitorData();
            
            for (const monitor of simulatedData) {
                try {
                    const coordinates = await this.getCityCoordinates(monitor.city);
                    if (coordinates) {
                        monitor.latitude = coordinates.lat;
                        monitor.longitude = coordinates.lon;
                        this.monitors.push(monitor);
                    }
                } catch (error) {
                    console.warn(`Failed to get coordinates for ${monitor.city}:`, error);
                    // Add monitor with approximate coordinates as fallback
                    const fallbackCoords = this.getApproximateCoordinates(monitor.city);
                    monitor.latitude = fallbackCoords.lat;
                    monitor.longitude = fallbackCoords.lon;
                    this.monitors.push(monitor);
                    console.log(`Using fallback coordinates for ${monitor.city}:`, fallbackCoords);
                }
            }
        } catch (error) {
            console.error('Failed to load monitor data:', error);
            this.showError('Failed to load monitor data');
        }
    }

    async getSimulatedMonitorData() {
        // Simulate monitor data - in real implementation, this would fetch from the API
        return [
            {
                name: 'server-tokyo',
                city: 'Tokyo',
                status: 'online',
                cpu: 45,
                ram: 67,
                disk: 23,
                network: 89,
                uptime: '15 days'
            },
            {
                name: 'server-london',
                city: 'London',
                status: 'online',
                cpu: 23,
                ram: 45,
                disk: 67,
                network: 34,
                uptime: '8 days'
            },
            {
                name: 'server-newyork',
                city: 'New York',
                status: 'offline',
                cpu: 0,
                ram: 0,
                disk: 0,
                network: 0,
                uptime: '0 days'
            },
            {
                name: 'server-sydney',
                city: 'Sydney',
                status: 'online',
                cpu: 78,
                ram: 23,
                disk: 45,
                network: 67,
                uptime: '23 days'
            },
            {
                name: 'server-berlin',
                city: 'Berlin',
                status: 'online',
                cpu: 34,
                ram: 56,
                disk: 12,
                network: 78,
                uptime: '12 days'
            }
        ];
    }

    getApproximateCoordinates(cityName) {
        // Fallback coordinates for major cities
        const coordinates = {
            'Tokyo': { lat: 35.6762, lon: 139.6503 },
            'London': { lat: 51.5074, lon: -0.1278 },
            'New York': { lat: 40.7128, lon: -74.0060 },
            'Sydney': { lat: -33.8688, lon: 151.2093 },
            'Berlin': { lat: 52.5200, lon: 13.4050 }
        };
        return coordinates[cityName] || { lat: 0, lon: 0 };
    }

    async getCityCoordinates(cityName) {
        // Check cache first
        if (this.coordinateCache.has(cityName)) {
            console.log(`Using cached coordinates for ${cityName}`);
            return this.coordinateCache.get(cityName);
        }

        try {
            const url = `${this.nominatimBaseUrl}?q=${encodeURIComponent(cityName)}&polygon_geojson=1&format=jsonv2&limit=1`;
            console.log(`Fetching coordinates for ${cityName} from:`, url);
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data || data.length === 0) {
                throw new Error(`No coordinates found for city: ${cityName}`);
            }

            const result = data[0];
            const coordinates = {
                lat: parseFloat(result.lat),
                lon: parseFloat(result.lon)
            };

            // Cache the result
            this.coordinateCache.set(cityName, coordinates);
            console.log(`Coordinates for ${cityName}:`, coordinates);
            
            return coordinates;
        } catch (error) {
            console.error(`Error fetching coordinates for ${cityName}:`, error);
            throw error;
        }
    }

    latLonToScreen(lat, lon) {
        // Convert latitude/longitude to screen coordinates using simple projection
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) * 0.8 * this.zoom;
        
        // Apply rotation
        const rotatedLon = lon + this.rotation.y * (180 / Math.PI);
        const rotatedLat = lat + this.rotation.x * (180 / Math.PI);
        
        // Simple orthographic projection
        const x = centerX + (rotatedLon / 180) * radius;
        const y = centerY - (rotatedLat / 90) * radius;
        
        // Check if point is visible (simple approximation)
        const visible = Math.abs(rotatedLon) < 90;
        
        return { x, y, visible };
    }

    drawGlobe() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) * 0.8 * this.zoom;
        
        // Clear canvas
        this.ctx.fillStyle = '#000011';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw globe outline
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#1a4d7a';
        this.ctx.fill();
        
        // Add gradient for 3D effect
        const gradient = this.ctx.createRadialGradient(
            centerX - radius * 0.3, centerY - radius * 0.3, 0,
            centerX, centerY, radius
        );
        gradient.addColorStop(0, 'rgba(100, 200, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 50, 100, 0.8)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // Draw simple continents outline
        this.drawContinents();
        
        // Draw grid lines
        this.drawGrid();
    }

    drawContinents() {
        // Simplified continent outlines
        this.ctx.strokeStyle = '#2a5d8a';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([3, 3]);
        
        // Draw some basic continental shapes
        for (let lat = -60; lat <= 60; lat += 20) {
            for (let lon = -180; lon <= 180; lon += 30) {
                const pos = this.latLonToScreen(lat, lon);
                if (pos.visible) {
                    this.ctx.beginPath();
                    this.ctx.arc(pos.x, pos.y, 2, 0, 2 * Math.PI);
                    this.ctx.stroke();
                }
            }
        }
        
        this.ctx.setLineDash([]);
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 0.5;
        
        // Latitude lines
        for (let lat = -90; lat <= 90; lat += 30) {
            this.ctx.beginPath();
            let first = true;
            for (let lon = -180; lon <= 180; lon += 5) {
                const pos = this.latLonToScreen(lat, lon);
                if (pos.visible) {
                    if (first) {
                        this.ctx.moveTo(pos.x, pos.y);
                        first = false;
                    } else {
                        this.ctx.lineTo(pos.x, pos.y);
                    }
                }
            }
            this.ctx.stroke();
        }
        
        // Longitude lines
        for (let lon = -180; lon <= 180; lon += 30) {
            this.ctx.beginPath();
            let first = true;
            for (let lat = -90; lat <= 90; lat += 5) {
                const pos = this.latLonToScreen(lat, lon);
                if (pos.visible) {
                    if (first) {
                        this.ctx.moveTo(pos.x, pos.y);
                        first = false;
                    } else {
                        this.ctx.lineTo(pos.x, pos.y);
                    }
                }
            }
            this.ctx.stroke();
        }
    }

    drawMonitors() {
        this.monitors.forEach(monitor => {
            const pos = this.latLonToScreen(monitor.latitude, monitor.longitude);
            
            if (pos.visible) {
                // Choose color based on status
                let color, pulseColor;
                switch (monitor.status) {
                    case 'online':
                        color = '#4CAF50'; // Green
                        pulseColor = 'rgba(76, 175, 80, 0.3)';
                        break;
                    case 'offline':
                        color = '#f44336'; // Red
                        pulseColor = 'rgba(244, 67, 54, 0.3)';
                        break;
                    default:
                        color = '#FFC107'; // Yellow
                        pulseColor = 'rgba(255, 193, 7, 0.3)';
                }
                
                // Override color if selected
                if (monitor === this.selectedMonitor) {
                    color = '#FFC107';
                    pulseColor = 'rgba(255, 193, 7, 0.5)';
                }
                
                // Draw pulsing effect for online monitors
                if (monitor.status === 'online' || monitor === this.selectedMonitor) {
                    const pulseSize = 15 + Math.sin(Date.now() * 0.005) * 5;
                    this.ctx.beginPath();
                    this.ctx.arc(pos.x, pos.y, pulseSize, 0, 2 * Math.PI);
                    this.ctx.fillStyle = pulseColor;
                    this.ctx.fill();
                }
                
                // Draw monitor dot
                this.ctx.beginPath();
                this.ctx.arc(pos.x, pos.y, 12, 0, 2 * Math.PI);
                this.ctx.fillStyle = color;
                this.ctx.fill();
                
                // Draw border
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
                
                // Draw city name
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = 'bold 14px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                this.ctx.shadowBlur = 4;
                this.ctx.fillText(monitor.city, pos.x, pos.y - 20);
                this.ctx.shadowBlur = 0;
            }
        });
    }

    getMonitorAtPosition(x, y) {
        for (const monitor of this.monitors) {
            const pos = this.latLonToScreen(monitor.latitude, monitor.longitude);
            if (pos.visible) {
                const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
                if (distance < 20) {
                    return monitor;
                }
            }
        }
        return null;
    }

    selectMonitor(monitor) {
        this.selectedMonitor = monitor;
        this.showMonitorDetails(monitor);
    }

    deselectMonitor() {
        this.selectedMonitor = null;
        this.closeSidePanel();
    }

    showMonitorDetails(monitor) {
        const detailsContainer = document.getElementById('monitor-details');
        const statusClass = `status-${monitor.status}`;
        
        detailsContainer.innerHTML = `
            <div class="monitor-info">
                <h3>
                    <span class="status-indicator ${statusClass}"></span>
                    ${monitor.name}
                </h3>
                
                <div class="monitor-detail">
                    <label>Location</label>
                    <div class="value">${monitor.city}</div>
                </div>
                
                <div class="monitor-detail">
                    <label>Coordinates</label>
                    <div class="value">${monitor.latitude.toFixed(4)}, ${monitor.longitude.toFixed(4)}</div>
                </div>
                
                <div class="monitor-detail">
                    <label>Status</label>
                    <div class="value">${monitor.status}</div>
                </div>
                
                <div class="monitor-detail">
                    <label>Uptime</label>
                    <div class="value">${monitor.uptime}</div>
                </div>
                
                <div class="monitor-detail">
                    <label>CPU Usage</label>
                    <div class="value">${monitor.cpu}%</div>
                    <div class="usage-bar">
                        <div class="usage-fill" style="width: ${monitor.cpu}%"></div>
                    </div>
                </div>
                
                <div class="monitor-detail">
                    <label>RAM Usage</label>
                    <div class="value">${monitor.ram}%</div>
                    <div class="usage-bar">
                        <div class="usage-fill" style="width: ${monitor.ram}%"></div>
                    </div>
                </div>
                
                <div class="monitor-detail">
                    <label>Disk Usage</label>
                    <div class="value">${monitor.disk}%</div>
                    <div class="usage-bar">
                        <div class="usage-fill" style="width: ${monitor.disk}%"></div>
                    </div>
                </div>
                
                <div class="monitor-detail">
                    <label>Network Usage</label>
                    <div class="value">${monitor.network}%</div>
                    <div class="usage-bar">
                        <div class="usage-fill" style="width: ${monitor.network}%"></div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('side-panel').classList.add('visible');
    }

    closeSidePanel() {
        document.getElementById('side-panel').classList.remove('visible');
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Auto-rotate when not dragging
        if (!this.isDragging && this.autoRotate) {
            this.rotation.y += 0.005;
        }
        
        this.drawGlobe();
        this.drawMonitors();
    }

    showError(message) {
        const errorElement = document.getElementById('error-message');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }
}

// Global functions for HTML event handlers
function closeSidePanel() {
    if (window.monitorGlobe) {
        window.monitorGlobe.closeSidePanel();
        window.monitorGlobe.deselectMonitor();
    }
}

function selectRandomMonitor() {
    if (window.monitorGlobe && window.monitorGlobe.monitors.length > 0) {
        const randomIndex = Math.floor(Math.random() * window.monitorGlobe.monitors.length);
        const randomMonitor = window.monitorGlobe.monitors[randomIndex];
        window.monitorGlobe.selectMonitor(randomMonitor);
    }
}

function toggleAutoRotation() {
    if (window.monitorGlobe) {
        window.monitorGlobe.autoRotate = !window.monitorGlobe.autoRotate;
    }
}

function showAllMonitors() {
    if (window.monitorGlobe) {
        console.log('Loaded monitors:', window.monitorGlobe.monitors);
        alert(`Found ${window.monitorGlobe.monitors.length} monitors: ${window.monitorGlobe.monitors.map(m => m.city).join(', ')}`);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.monitorGlobe = new MonitorGlobe();
});