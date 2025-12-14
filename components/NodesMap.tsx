"use client";

import { useEffect, useState, useMemo } from "react";
import { MapContainer, Marker, Popup, GeoJSON } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { PNode } from "@/lib/types";
import { useTheme } from "@/hooks/useTheme";

// --- STYLES & ICONS (From User Request) ---

const createSolidIcon = (status: string) => {
  let color = "#64748B"; // Private
  if (status === "Excellent") color = "#10B981";
  if (status === "Good") color = "#38BDF8"; // GOOD = bleu
  if (status === "Warning") color = "#F59E0B";
  if (status === "Critical") color = "#EF4444";

  return L.divIcon({
    className: "solid-marker",
    html: `<div class="solid-core" style="background-color: ${color};"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -10],
  });
};

const createClusterIcon = (cluster: any) => {
  return L.divIcon({
    html: `<span>${cluster.getChildCount()}</span>`,
    className: "tech-cluster",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

// --- HELPER FUNCTIONS ---

const getHealthStatus = (stats: any, statusStr?: string) => {
  if (statusStr === "gossip_only" || !stats || stats.uptime === 0)
    return "Private";
  const cpu = stats.cpu_percent;
  if (cpu >= 90) return "Critical";
  if (cpu >= 70) return "Warning";
  if (cpu < 20 && stats.uptime / 3600 >= 24) return "Excellent";
  return "Good";
};

interface NodeLocation {
  ip: string;
  lat: number;
  lng: number;
  city: string;
  country: string;
  status: string;
}

export default function NodesMap({ nodes }: { nodes: PNode[] }) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const mapStyles = useMemo(() => `
    .leaflet-container { background-color: ${isLight ? '#F3F4F6' : '#111827'} !important; font-family: 'Inter', sans-serif; }
    .leaflet-control-attribution { display: none; }
    path.leaflet-interactive { pointer-events: none !important; stroke-linejoin: round; will-change: transform; }
    .tech-cluster { background: ${isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(5, 10, 20, 0.95)'}; border: 1px solid ${isLight ? '#EA580C' : '#00D4AA'}; color: ${isLight ? '#EA580C' : '#00D4AA'}; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-family: monospace; font-weight: bold; font-size: 11px; box-shadow: 0 0 0 4px ${isLight ? 'rgba(234, 88, 12, 0.15)' : 'rgba(0, 212, 170, 0.15)'}; transition: transform 0.2s; }
    .tech-cluster:hover { background: ${isLight ? '#EA580C' : '#00D4AA'}; color: ${isLight ? '#FFF' : '#000'}; transform: scale(1.1); }
    .solid-marker { background: transparent; display: flex; justify-content: center; align-items: center; }
    .solid-core { width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 0 1px ${isLight ? '#FFF' : '#000'}; transition: transform 0.1s; will-change: transform; }
    .solid-marker:hover .solid-core { transform: scale(1.4); border: 2px solid white; z-index: 999; }
    .leaflet-popup-content-wrapper { background: ${isLight ? '#FFFFFF' : '#0A0E27'} !important; border: 1px solid ${isLight ? '#EA580C' : '#00D4AA'} !important; color: ${isLight ? '#000' : '#fff'} !important; border-radius: 2px !important; padding: 0 !important; }
    .leaflet-popup-tip { background: ${isLight ? '#EA580C' : '#00D4AA'} !important; }
    .leaflet-popup-close-button { color: ${isLight ? '#000' : '#fff'} !important; }
  `, [isLight]);

  const geoJsonStyle = useMemo(() => ({
    fillColor: isLight ? "#E5E7EB" : "#020204",
    fillOpacity: 0.5,
    color: isLight ? "#EA580C" : "#00D4AA",
    weight: 0.8,
    opacity: 0.5,
  }), [isLight]);

  const [locations, setLocations] = useState<NodeLocation[]>([]);
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [map, setMap] = useState<L.Map | null>(null);

  // 1. Fetch World Map GeoJSON
  useEffect(() => {
    fetch(
      "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json"
    )
      .then((res) => res.json())
      .then((data) => {
        setGeoJsonData(data);
        setMapReady(true);
      })
      .catch((err) => console.error("Failed to load GeoJSON map", err));
  }, []);

  // 2. Fetch Locations (Robust + Local API)
  useEffect(() => {
    if (!nodes || nodes.length === 0) return;

    const fetchLocations = async () => {
      const cached = localStorage.getItem("pnode_locations_v2");
      const knownLocations: NodeLocation[] = cached ? JSON.parse(cached) : [];
      
      // Identify missing
      const missing = nodes.filter(n => !knownLocations.find(l => l.ip === n.ip));
      
      // Update state with known
      const currentMapped = knownLocations.map(l => {
        const n = nodes.find(node => node.ip === l.ip);
        return {
          ...l,
          status: n ? getHealthStatus(n.stats, n.status) : "Private"
        };
      }).filter(l => nodes.find(n => n.ip === l.ip)); // Only keep current nodes
      
      setLocations(currentMapped);

      // Fetch missing (Batch of 5)
      if (missing.length > 0) {
        const newLocations = [...knownLocations];
        let updated = false;
        const batch = missing.slice(0, 5); 

        for (const node of batch) {
          try {
            // Use local API proxy instead of direct external call
            const res = await fetch(`/api/geolocate/${node.ip}`);
            if (res.ok) {
              const data = await res.json();
              if (data.success) {
                newLocations.push({
                  ip: node.ip,
                  lat: data.latitude,
                  lng: data.longitude,
                  city: data.city,
                  country: data.country,
                  status: getHealthStatus(node.stats, node.status)
                });
                updated = true;
              }
            }
          } catch (e) {
            console.error("Geo error", e);
          }
          await new Promise(r => setTimeout(r, 200));
        }

        if (updated) {
          localStorage.setItem("pnode_locations_v2", JSON.stringify(newLocations));
          // Re-merge to update state
          const finalMapped = newLocations.map(l => {
            const n = nodes.find(node => node.ip === l.ip);
            return {
              ...l,
              status: n ? getHealthStatus(n.stats, n.status) : "Private"
            };
          }).filter(l => nodes.find(n => n.ip === l.ip));
          setLocations(finalMapped);
        }
      }
    };

    fetchLocations();
  }, [nodes]);

  // 3. Resize Observer (Layout Fix)
  useEffect(() => {
    if (!map) return;
    
    map.invalidateSize();
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });

    const container = document.getElementById("map-container-robust");
    if (container) {
      resizeObserver.observe(container);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [map]);

  const markers = useMemo(() => {
    return locations.map((loc, idx) => (
      <Marker
        key={`${loc.ip}-${idx}`}
        position={[loc.lat, loc.lng]}
        icon={createSolidIcon(loc.status)}
      >
        <Popup className="custom-popup">
          <div className="p-2 min-w-[120px] text-center">
            <div className="text-xs font-bold text-white mb-1">
              {loc.city}
            </div>
            <div className="text-[10px] text-gray-400 mb-2">
              {loc.country}
            </div>
            <a
              href={`/pnode/${loc.ip}`}
              className="inline-block bg-[#00D4AA] hover:bg-white hover:text-black text-black text-[9px] font-bold py-1 px-2 rounded transition-colors"
            >
              ANALYZE
            </a>
          </div>
        </Popup>
      </Marker>
    ));
  }, [locations]);

  if (!mapReady || !geoJsonData) {
    return (
      <div className={`h-[650px] w-full rounded-xl border flex items-center justify-center ${isLight ? 'bg-gray-100 border-gray-300' : 'bg-[#111827] border-[#2D3454]'}`}>
        <p className={`animate-pulse font-mono text-xs ${isLight ? 'text-[#EA580C]' : 'text-[#00D4AA]'}`}>
          LOADING CARTOGRAPHY...
        </p>
      </div>
    );
  }

  return (
    <div 
      id="map-container-robust"
      className={`relative h-[650px] w-full rounded-xl overflow-hidden border shadow-2xl ${isLight ? 'bg-gray-100 border-gray-300' : 'bg-[#111827] border-[#2D3454]'}`}
      style={{
        /* FIX: Min-width to prevent collapse */
        minWidth: "300px",
        display: "block"
      }}
    >
      <style>{mapStyles}</style>

      {/* Legend Overlay */}
      <div className={`absolute bottom-6 left-6 z-[400] px-4 py-3 rounded border text-[10px] font-mono pointer-events-none ${isLight ? 'bg-white/90 border-[#EA580C]/30 text-gray-600' : 'bg-black/80 border-[#00D4AA]/30 text-gray-400'}`}>
        <div className={`mb-1 font-bold ${isLight ? 'text-[#EA580C]' : 'text-[#00D4AA]'}`}>
          NODE HEALTH
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
            EXCELLENT
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8]"></span>
            GOOD
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
            WARNING
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#EF4444]"></span>
            CRITICAL
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#64748B]"></span>
            PRIVATE
          </div>
        </div>
      </div>

      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={18}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", background: "transparent" }}
        ref={setMap}
      >
        {/* @ts-ignore */}
        <GeoJSON
          key="static-world-map"
          data={geoJsonData}
          style={geoJsonStyle}
          interactive={false}
        />

        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterIcon}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          maxClusterRadius={40}
        >
          {markers}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
