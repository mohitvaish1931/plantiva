import { useEffect, useRef } from 'react';

interface PlantMapProps {
  lat: number;
  lon: number;
}

declare global {
  interface Window {
    L: any;
  }
}

const PlantMap: React.FC<PlantMapProps> = ({ lat, lon }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    
    // Check if Leaflet is loaded from CDN
    if (typeof window.L === 'undefined') {
      console.error('Leaflet not found. Make sure the CDN is linked in index.html');
      return;
    }

    const L = window.L;

    // Initialize map if it hasn't been initialized yet
    if (!leafletMap.current) {
      leafletMap.current = L.map(mapRef.current, {
        center: [lat, lon],
        zoom: 13,
        zoomControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(leafletMap.current);

      L.control.zoom({ position: 'bottomright' }).addTo(leafletMap.current);
    } else {
      // Update center if it changes
      leafletMap.current.setView([lat, lon], 13);
    }

    // Add marker for current location
    const customIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: #10b981; width: 24px; height: 24px; border-radius: 50%; border: 4px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3); position: relative;">
              <div style="position: absolute; top: 100%; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 10px solid white;"></div>
             </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 34]
    });

    const marker = L.marker([lat, lon], { icon: customIcon }).addTo(leafletMap.current);
    marker.bindPopup("<div style='color: #065f46; font-weight: bold;'>You are here 📍</div><p style='margin:0; font-size: 11px; color: #666;'>Monitoring plant health in your micro-climate.</p>").openPopup();

    // Mock nearby botanical gardens
    const gardens = [
      { name: "City Botanical Garden", coords: [lat + 0.005, lon + 0.005] },
      { name: "Organic Nursery", coords: [lat - 0.008, lon - 0.002] }
    ];

    gardens.forEach(garden => {
      L.marker(garden.coords, {
        icon: L.divIcon({
            className: 'garden-icon',
            html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;"></div>`,
            iconSize: [16, 16]
        })
      }).addTo(leafletMap.current).bindPopup(`<b>${garden.name}</b>`);
    });

    return () => {
      // Cleanup is usually handled by leafletMap.current.remove() if we want full unmount, 
      // but in React with StrictMode, we should be careful to only init once.
    };
  }, [lat, lon]);

  return (
    <div className="relative w-full h-[300px] rounded-3xl overflow-hidden border border-white/10 shadow-xl group">
      <div ref={mapRef} style={{ height: '100%', width: '100%', zIndex: 1 }} />
      <div className="absolute top-4 left-4 z-[10] pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
          Live Environment Monitor
        </div>
      </div>
      <div className="absolute inset-0 border-2 border-emerald-500/20 rounded-3xl pointer-events-none z-[11] group-hover:border-emerald-500/40 transition-colors" />
    </div>
  );
};

export default PlantMap;
