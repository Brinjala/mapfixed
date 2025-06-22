import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Layers, Zap } from 'lucide-react';

interface MapViewProps {
  disasters: any[];
  resources: any[];
  selectedDisaster: any;
  onLocationSelect?: (lat: number, lng: number) => void;
}

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  type: 'disaster' | 'resource';
  title: string;
  description?: string;
}

export const MapView: React.FC<MapViewProps> = ({ 
  disasters, 
  resources, 
  selectedDisaster, 
  onLocationSelect 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [mapStyle, setMapStyle] = useState<'roadmap' | 'satellite' | 'terrain'>('roadmap');

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    const mapContainer = mapRef.current;
    mapContainer.innerHTML = '';

    // Create enhanced map container with better styling
    const mapDiv = document.createElement('div');
    mapDiv.style.cssText = `
      width: 100%;
      height: 100%;
      position: relative;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      overflow: hidden;
      box-shadow: inset 0 0 50px rgba(0,0,0,0.1);
    `;

    // Add grid overlay for better visual structure
    const gridOverlay = document.createElement('div');
    gridOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: 
        linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
      background-size: 50px 50px;
      pointer-events: none;
    `;
    mapDiv.appendChild(gridOverlay);

    // Add map title with better styling
    const mapTitle = document.createElement('div');
    mapTitle.innerHTML = `
      <div style="
        position: absolute; 
        top: 16px; 
        left: 16px; 
        background: rgba(255,255,255,0.95); 
        padding: 12px 16px; 
        border-radius: 8px; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
        z-index: 1000;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.2);
      ">
        <div style="font-weight: 700; color: #1f2937; font-size: 16px; margin-bottom: 4px;">
          🗺️ Interactive Map
        </div>
        <div style="font-size: 12px; color: #6b7280;">
          ${disasters.length} disasters • ${resources.length} resources
        </div>
      </div>
    `;
    mapDiv.appendChild(mapTitle);

    // Add coordinate display
    const coordDisplay = document.createElement('div');
    coordDisplay.id = 'coord-display';
    coordDisplay.style.cssText = `
      position: absolute;
      bottom: 16px;
      left: 16px;
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-family: monospace;
      z-index: 1000;
    `;
    coordDisplay.textContent = 'Click on map to see coordinates';
    mapDiv.appendChild(coordDisplay);

    mapContainer.appendChild(mapDiv);
    setMap(mapDiv);

    // Enhanced click handler with visual feedback
    mapDiv.addEventListener('click', (e) => {
      if (onLocationSelect) {
        const rect = mapDiv.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Convert pixel coordinates to approximate lat/lng (NYC area)
        const lat = 40.7128 + (0.5 - y / rect.height) * 0.3;
        const lng = -74.0060 + (x / rect.width - 0.5) * 0.4;
        
        // Update coordinate display
        const coordEl = document.getElementById('coord-display');
        if (coordEl) {
          coordEl.textContent = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
        }

        // Add click ripple effect
        const ripple = document.createElement('div');
        ripple.style.cssText = `
          position: absolute;
          left: ${x}px;
          top: ${y}px;
          width: 20px;
          height: 20px;
          border: 2px solid #3b82f6;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          animation: ripple 1s ease-out;
          pointer-events: none;
          z-index: 999;
        `;
        
        // Add ripple animation
        const style = document.createElement('style');
        style.textContent = `
          @keyframes ripple {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
          }
        `;
        if (!document.head.querySelector('style[data-ripple]')) {
          style.setAttribute('data-ripple', 'true');
          document.head.appendChild(style);
        }

        mapDiv.appendChild(ripple);
        setTimeout(() => ripple.remove(), 1000);
        
        onLocationSelect(lat, lng);
      }
    });

  }, [onLocationSelect]);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Default to NYC
          setUserLocation({ lat: 40.7128, lng: -74.0060 });
        }
      );
    } else {
      setUserLocation({ lat: 40.7128, lng: -74.0060 });
    }
  }, []);

  // Update markers when data changes
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    const existingMarkers = map.querySelectorAll('.map-marker');
    existingMarkers.forEach((marker: Element) => marker.remove());

    const newMarkers: MapMarker[] = [];

    // Add disaster markers with improved positioning
    disasters.forEach((disaster, index) => {
      const marker: MapMarker = {
        id: disaster.id,
        lat: 40.7128 + (Math.random() - 0.5) * 0.15,
        lng: -74.0060 + (Math.random() - 0.5) * 0.15,
        type: 'disaster',
        title: disaster.title,
        description: disaster.description
      };
      newMarkers.push(marker);

      // Create enhanced marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'map-marker disaster-marker';
      const isSelected = selectedDisaster?.id === disaster.id;
      
      markerEl.style.cssText = `
        position: absolute;
        left: ${30 + (index % 3) * 25}%;
        top: ${25 + Math.floor(index / 3) * 20}%;
        transform: translate(-50%, -50%);
        background: ${isSelected ? '#dc2626' : '#ef4444'};
        color: white;
        padding: 10px 14px;
        border-radius: 25px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
        z-index: ${isSelected ? 200 : 100};
        max-width: 180px;
        text-align: center;
        border: 3px solid ${isSelected ? '#fca5a5' : 'white'};
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
      `;
      
      markerEl.innerHTML = `
        <div style="display: flex; align-items: center; gap: 6px; justify-content: center;">
          <span style="font-size: 14px;">🚨</span>
          <span style="font-weight: 700;">${disaster.title}</span>
        </div>
        <div style="font-size: 10px; opacity: 0.9; margin-top: 2px;">
          ${disaster.location_name || 'Unknown location'}
        </div>
      `;
      
      // Add hover effects
      markerEl.addEventListener('mouseenter', () => {
        markerEl.style.transform = 'translate(-50%, -50%) scale(1.1)';
        markerEl.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.6)';
      });
      
      markerEl.addEventListener('mouseleave', () => {
        markerEl.style.transform = 'translate(-50%, -50%) scale(1)';
        markerEl.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
      });
      
      markerEl.addEventListener('click', (e) => {
        e.stopPropagation();
        // Trigger disaster selection
        const event = new CustomEvent('selectDisaster', { detail: disaster });
        window.dispatchEvent(event);
      });

      map.appendChild(markerEl);
    });

    // Add resource markers with better distribution
    resources.forEach((resource, index) => {
      const marker: MapMarker = {
        id: resource.id,
        lat: 40.7128 + (Math.random() - 0.5) * 0.12,
        lng: -74.0060 + (Math.random() - 0.5) * 0.12,
        type: 'resource',
        title: resource.name,
        description: resource.type
      };
      newMarkers.push(marker);

      const markerEl = document.createElement('div');
      markerEl.className = 'map-marker resource-marker';
      
      const statusColors = {
        available: '#10b981',
        limited: '#f59e0b',
        full: '#ef4444',
        closed: '#6b7280'
      };
      
      markerEl.style.cssText = `
        position: absolute;
        left: ${60 + (index % 4) * 15}%;
        top: ${50 + Math.floor(index / 4) * 15}%;
        transform: translate(-50%, -50%);
        background: ${statusColors[resource.availability_status] || '#10b981'};
        color: white;
        padding: 8px 12px;
        border-radius: 18px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 3px 8px rgba(16, 185, 129, 0.3);
        z-index: 90;
        max-width: 140px;
        text-align: center;
        border: 2px solid white;
        transition: all 0.3s ease;
      `;
      
      const resourceIcons = {
        shelter: '🏠',
        medical: '🏥',
        food: '🍽️',
        emergency_services: '🚑',
        transportation: '🚌'
      };
      
      markerEl.innerHTML = `
        <div style="display: flex; align-items: center; gap: 4px; justify-content: center;">
          <span style="font-size: 10px;">${resourceIcons[resource.type] || '📍'}</span>
          <span>${resource.name}</span>
        </div>
      `;

      // Add hover effects
      markerEl.addEventListener('mouseenter', () => {
        markerEl.style.transform = 'translate(-50%, -50%) scale(1.1)';
        markerEl.style.zIndex = '150';
      });
      
      markerEl.addEventListener('mouseleave', () => {
        markerEl.style.transform = 'translate(-50%, -50%) scale(1)';
        markerEl.style.zIndex = '90';
      });

      map.appendChild(markerEl);
    });

    // Add user location marker if available
    if (userLocation) {
      const userMarker = document.createElement('div');
      userMarker.className = 'map-marker user-marker';
      userMarker.style.cssText = `
        position: absolute;
        left: 45%;
        top: 45%;
        transform: translate(-50%, -50%);
        background: #3b82f6;
        color: white;
        padding: 10px;
        border-radius: 50%;
        font-size: 16px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        z-index: 110;
        border: 4px solid white;
        animation: userPulse 2s infinite;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      userMarker.innerHTML = '📍';
      
      // Add enhanced pulse animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes userPulse {
          0% { 
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4), 0 0 0 0 rgba(59, 130, 246, 0.7); 
          }
          70% { 
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4), 0 0 0 15px rgba(59, 130, 246, 0); 
          }
          100% { 
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4), 0 0 0 0 rgba(59, 130, 246, 0); 
          }
        }
      `;
      if (!document.head.querySelector('style[data-user-pulse]')) {
        style.setAttribute('data-user-pulse', 'true');
        document.head.appendChild(style);
      }

      map.appendChild(userMarker);
    }

    setMarkers(newMarkers);
  }, [map, disasters, resources, selectedDisaster, userLocation]);

  return (
    <div className="bg-white rounded-lg shadow-lg border overflow-hidden">
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Interactive Map</h3>
              <p className="text-sm text-gray-600">Real-time disaster and resource tracking</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setMapStyle('roadmap')}
              className={`px-3 py-1 text-xs rounded-md transition-all ${
                mapStyle === 'roadmap' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Road
            </button>
            <button
              onClick={() => setMapStyle('satellite')}
              className={`px-3 py-1 text-xs rounded-md transition-all ${
                mapStyle === 'satellite' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Satellite
            </button>
            <Layers className="h-4 w-4 text-gray-500" />
          </div>
        </div>
      </div>
      
      <div className="relative">
        <div ref={mapRef} className="w-full h-96" />
        
        {/* Enhanced Map Legend */}
        <div className="absolute bottom-4 right-4 bg-white p-4 rounded-lg shadow-xl border text-xs max-w-xs">
          <div className="font-bold text-gray-900 mb-3 flex items-center">
            <Zap className="h-4 w-4 mr-2 text-yellow-500" />
            Map Legend
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-red-500 rounded-md shadow-sm"></div>
              <span className="text-gray-700">Active Disasters ({disasters.length})</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-green-500 rounded-md shadow-sm"></div>
              <span className="text-gray-700">Available Resources</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-yellow-500 rounded-md shadow-sm"></div>
              <span className="text-gray-700">Limited Resources</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-blue-500 rounded-full shadow-sm"></div>
              <span className="text-gray-700">Your Location</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-gray-500 text-xs">Click anywhere to get coordinates</p>
          </div>
        </div>

        {/* Map Stats */}
        <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-xl border text-xs">
          <div className="font-bold text-gray-900 mb-2">Live Stats</div>
          <div className="space-y-1 text-gray-600">
            <div className="flex justify-between">
              <span>Disasters:</span>
              <span className="font-semibold text-red-600">{disasters.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Resources:</span>
              <span className="font-semibold text-green-600">{resources.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Markers:</span>
              <span className="font-semibold text-blue-600">{markers.length + 1}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};