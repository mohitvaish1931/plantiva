import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    L: any;
  }
}

interface LocationMapProps {
  lat: number;
  lon: number;
  label?: string;
  approximate?: boolean;
  zoom?: number;
}

/** Leaflet map (loaded from the CDN in index.html) centred on the user's location. */
export function LocationMap({ lat, lon, label, approximate, zoom = 13 }: LocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);

  useEffect(() => {
    const L = window.L;
    if (!containerRef.current || !L) return;

    const map = L.map(containerRef.current, { zoomControl: false, attributionControl: true });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);
    L.control.zoom({ position: 'bottomleft' }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    };
  }, []);

  useEffect(() => {
    const L = window.L;
    const map = mapRef.current;
    if (!L || !map) return;

    map.setView([lat, lon], approximate ? Math.min(zoom, 11) : zoom);

    const icon = L.divIcon({
      className: '',
      html: '<div style="width:16px;height:16px;border-radius:50%;background:#10b981;border:3px solid #fff;box-shadow:0 0 12px rgba(16,185,129,.8)"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    if (markerRef.current) markerRef.current.setLatLng([lat, lon]);
    else markerRef.current = L.marker([lat, lon], { icon }).addTo(map);
    if (label) markerRef.current.bindPopup(`<b>${label.replace(/</g, '&lt;')}</b>`);

    // Show an uncertainty ring when the location only comes from the IP address.
    if (circleRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
    }
    if (approximate) {
      circleRef.current = L.circle([lat, lon], { radius: 5000, color: '#f59e0b', weight: 1, fillOpacity: 0.08 }).addTo(map);
    }
  }, [lat, lon, label, approximate, zoom]);

  if (typeof window !== 'undefined' && !window.L) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
        Map unavailable
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full" style={{ zIndex: 0 }} />;
}
