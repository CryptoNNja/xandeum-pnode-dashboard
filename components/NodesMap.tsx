"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Popup, GeoJSON, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import type { GeoJsonObject } from "geojson";
import { useTheme } from "@/hooks/useTheme";
import { getHealthStatus, type HealthStatus } from "@/lib/health";
import type { PNode } from "@/lib/types";

interface NodeLocation {
  ip: string;
  lat: number;
  lng: number;
  city: string;
  country: string;
  status: HealthStatus;
}

interface IpWhoResponse {
  success: boolean;
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
}

const getMapStyles = (isLight: boolean) => `
  .leaflet-container { 
    background-color: ${isLight ? '#f5f5f7' : 'var(--map-bg)'} !important; 
    font-family: 'Inter', sans-serif; 
    width: 100% !important;
    height: 100% !important;
    min-width: 100% !important;
  }
  .leaflet-control-attribution { display: none; }
  path.leaflet-interactive { pointer-events: none !important; stroke-linejoin: round; will-change: transform; }
  .tech-cluster { background: ${isLight ? '#ffffff' : 'var(--map-cluster-bg)'}; border: 2px solid ${isLight ? '#EA580C' : 'var(--accent-aqua)'}; color: ${isLight ? '#EA580C' : 'var(--accent-aqua)'}; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-family: monospace; font-weight: bold; font-size: 11px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); transition: transform 0.2s; }
  .tech-cluster:hover { background: ${isLight ? '#EA580C' : 'var(--accent-aqua)'}; color: ${isLight ? '#ffffff' : 'var(--text-main)'}; transform: scale(1.1); }
  .solid-marker { background: transparent; display: flex; justify-content: center; align-items: center; }
  .solid-core { width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 0 2px ${isLight ? '#1F2937' : 'var(--text-main)'}, 0 0 0 4px ${isLight ? '#f5f5f7' : 'var(--bg-bg)'}; transition: transform 0.1s; will-change: transform; }
  .solid-marker:hover .solid-core { transform: scale(1.4); border: 3px solid ${isLight ? '#EA580C' : 'var(--accent-aqua)'}; z-index: 999; box-shadow: 0 0 12px ${isLight ? 'rgba(234, 88, 12, 0.6)' : 'rgba(0, 212, 170, 0.6)'}; }
  .leaflet-popup-content-wrapper { background: ${isLight ? '#ffffff' : 'var(--map-popup-bg)'} !important; border: 2px solid ${isLight ? '#EA580C' : 'var(--accent-aqua)'} !important; color: ${isLight ? '#1F2937' : 'var(--text-main)'} !important; border-radius: 8px !important; padding: 0 !important; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }
  .leaflet-popup-tip { background: ${isLight ? '#ffffff' : 'var(--map-popup-bg)'} !important; border: 2px solid ${isLight ? '#EA580C' : 'var(--accent-aqua)'}; border-top: none; }
  .leaflet-popup-close-button { color: ${isLight ? '#1F2937' : 'var(--text-main)'} !important; }
`;

const createSolidIcon = (status: string, isLight: boolean) => {
  // Helper to get CSS variable value
  const getCssVar = (varName: string, fallback: string): string => {
    if (typeof window === "undefined") return fallback;
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || fallback;
  };

  let color = getCssVar("--kpi-private", "#64748B"); // Private
  if (status === "Excellent") color = getCssVar("--kpi-excellent", "#10B981");
  if (status === "Good") color = getCssVar("--kpi-good", "#60A5FA");
  if (status === "Warning") color = getCssVar("--kpi-warning", "#F59E0B");
  if (status === "Critical") color = getCssVar("--kpi-critical", "#EF4444");

  return L.divIcon({
    className: "solid-marker",
    html: `<div class="solid-core" style="background-color: ${color};"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -10],
  });
};

type ClusterLike = { getChildCount(): number };

const createClusterIcon = (cluster: ClusterLike) => {
  return L.divIcon({
    html: `<span>${cluster.getChildCount()}</span>`,
    className: "tech-cluster",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

const geoJsonStyle: L.PathOptions = {
  fillColor: "#000",
  fillOpacity: 0,
  color: "#00D4AA",
  weight: 0.8,
  opacity: 0.5,
};

const getGeoJsonStyleForTheme = (isLight: boolean) => ({
  ...geoJsonStyle,
  fillColor: isLight ? "#FEF3E2" : "#0A0E1A",
  fillOpacity: isLight ? 0.6 : 0.3,
  color: isLight ? "#EA580C" : "#00D4AA",
  weight: isLight ? 1.5 : 0.8,
  opacity: isLight ? 0.8 : 0.5,
});

export interface NodesMapProps {
  nodes: PNode[];
}

export default function NodesMap({ nodes }: NodesMapProps) {
  const { theme, mounted: themeMounted } = useTheme();
  const isLight = themeMounted && theme === "light";
  const [locations, setLocations] = useState<NodeLocation[]>([]);
  const [geoJsonData, setGeoJsonData] = useState<GeoJsonObject | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [geoJsonError, setGeoJsonError] = useState<string | null>(null);
  const [geoLocateErrorCount, setGeoLocateErrorCount] = useState(0);
  const [mapKey, setMapKey] = useState(0);
  const [calculatedWidth, setCalculatedWidth] = useState<number | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mapDebugEnabled =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("mapdebug") === "1";

  useEffect(() => {
    return () => {
      const map = mapRef.current;
      if (!map) return;

      try {
        map.off();
        map.remove();
      } catch (error) {
        console.warn("Failed to dispose Leaflet map", error);
      } finally {
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    fetch(
      "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json",
      { signal: controller.signal }
    )
      .then((res) => res.json() as Promise<GeoJsonObject>)
      .then((data) => {
        setGeoJsonData(data);
        setGeoJsonError(null);
      })
      .catch((err) => {
        console.error("Failed to load geojson map", err);
        setGeoJsonData(null);
        setGeoJsonError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setMapReady(true);
      });
  }, []);


  // Calculate width from window size (accounting for max-width and padding)
  useEffect(() => {
    const calculateWidth = () => {
      if (typeof window === "undefined") return;
      
      // Calculate based on max-w-[1600px] with px-6 (24px padding each side)
      const maxWidth = 1600;
      const padding = 48; // 24px * 2
      const windowWidth = window.innerWidth;
      const availableWidth = Math.min(windowWidth - padding, maxWidth - padding);
      
      setCalculatedWidth(availableWidth);
      if (mapDebugEnabled) {
        console.log('[Map Debug] Calculated width:', availableWidth, 'px (window:', windowWidth, 'px)');
      }
    };

    calculateWidth();
    window.addEventListener('resize', calculateWidth);
    return () => window.removeEventListener('resize', calculateWidth);
  }, [mapDebugEnabled]);

  useEffect(() => {
    const fetchLocations = async () => {
      const cachedRaw = localStorage.getItem("pnode_locations_v2");
      let cachedLocs: NodeLocation[] = [];
      if (cachedRaw) {
        try {
          const parsed = JSON.parse(cachedRaw);
          if (Array.isArray(parsed)) {
            cachedLocs = parsed as NodeLocation[];
          }
        } catch (error) {
          console.warn("Failed to parse cached node locations", error);
        }
      }

      const newLocations = [...cachedLocs];
      let updated = false;
      const nodesToFetch = nodes.filter(
        (n) => !newLocations.find((l) => l.ip === n.ip)
      );

      if (nodesToFetch.length === 0 && newLocations.length > 0) {
        const merged = newLocations.map((loc) => {
          const n = nodes.find((node) => node.ip === loc.ip);
          const newStatus = n ? getHealthStatus(n) : "Private";
          return { ...loc, status: newStatus };
        });
        setLocations(merged);
        return;
      }

      for (const node of nodesToFetch) {
        try {
          await new Promise((r) => setTimeout(r, 200));
          const res = await fetch(`/api/geolocate/${encodeURIComponent(node.ip)}`);
          const data: IpWhoResponse = await res.json();
          if (data.success && typeof data.latitude === "number" && typeof data.longitude === "number") {
            newLocations.push({
              ip: node.ip,
              lat: data.latitude,
              lng: data.longitude,
              city: data.city ?? "Unknown",
              country: data.country ?? "Unknown",
              status: getHealthStatus(node),
            });
            updated = true;
          }
        } catch (error) {
          console.error("Failed to geolocate", node.ip, error);
          setGeoLocateErrorCount((c) => c + 1);
        }
      }

      if (updated) {
        localStorage.setItem(
          "pnode_locations_v2",
          JSON.stringify(newLocations)
        );
      }

      // Always merge and set locations if we have any (even if no new ones were fetched)
      if (newLocations.length > 0) {
        const merged = newLocations.map((loc) => {
          const n = nodes.find((node) => node.ip === loc.ip);
          return {
            ...loc,
            status: n ? getHealthStatus(n) : "Private",
          };
        });
        setLocations(merged);
      }
    };
    fetchLocations();
  }, [nodes]);

  const markers = useMemo(() => {
    return locations.map((loc) => (
      <Marker
        key={loc.ip}
        position={[loc.lat, loc.lng]}
        icon={createSolidIcon(loc.status, isLight)}
      >
        <Popup className="custom-popup">
          <div className="p-2 min-w-[120px] text-center">
            <div className={`text-xs font-bold mb-1 ${isLight ? 'text-gray-900' : 'text-white'}`}>
              {loc.city}
            </div>
            <div className="text-[10px] text-gray-400 mb-2">
              {loc.country}
            </div>
            <a
              href={`/pnode/${loc.ip}`}
              className="inline-block text-[9px] font-bold py-1 px-2 rounded transition-colors"
              style={{
                backgroundColor: isLight ? '#EA580C' : '#00D4AA',
                color: isLight ? '#ffffff' : '#000000',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.color = '#000000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isLight ? '#EA580C' : '#00D4AA';
                e.currentTarget.style.color = isLight ? '#ffffff' : '#000000';
              }}
            >
              ANALYZE
            </a>
          </div>
        </Popup>
      </Marker>
    ));
  }, [locations, isLight]);

  const InvalidateSizeOnMount = () => {
    const map = useMap();

    useEffect(() => {
      let invalidateCount = 0;
      const MAX_INVALIDATES = 10; // Limit to prevent infinite loops
      
      const invalidate = () => {
        if (invalidateCount >= MAX_INVALIDATES) return;
        invalidateCount++;
        
        try {
          if (!map || !map.getContainer()) return;
          
          const container = map.getContainer();
          const rect = container.getBoundingClientRect();
          const parent = container.parentElement;
          const parentRect = parent?.getBoundingClientRect();
          
          // Only log once to avoid spam
          if (mapDebugEnabled && invalidateCount === 1) {
            console.log('[Map Debug] Leaflet container dimensions:', {
              container: { width: rect.width, height: rect.height },
              parent: parentRect ? { width: parentRect.width, height: parentRect.height } : null,
              computed: {
                width: window.getComputedStyle(container).width,
                height: window.getComputedStyle(container).height,
              }
            });
          }
          
          // If width is zero or very small, force it from parent
          if (rect.width < 100 && parentRect && parentRect.width > 100) {
            container.style.width = `${parentRect.width}px`;
            container.style.height = `${parentRect.height}px`;
            if (mapDebugEnabled && invalidateCount === 1) {
              console.log('[Map Debug] Forced dimensions:', {
                width: parentRect.width,
                height: parentRect.height
              });
            }
          }
          
          map.invalidateSize();
        } catch (e) {
          if (mapDebugEnabled && invalidateCount === 1) {
            console.warn('[Map Debug] Error invalidating size:', e);
          }
        }
      };

      // Immediate invalidate
      invalidate();
      
      // Limited delayed invalidates
      const timeouts = [
        setTimeout(invalidate, 100),
        setTimeout(invalidate, 300),
        setTimeout(invalidate, 500),
      ];

      // Listen for window resize
      const handleResize = () => {
        invalidateCount = 0; // Reset counter on resize
        invalidate();
      };
      window.addEventListener('resize', handleResize);

      return () => {
        timeouts.forEach(clearTimeout);
        window.removeEventListener('resize', handleResize);
      };
    }, [map, mapDebugEnabled]);

    return null;
  };

  // Only wait for theme to be mounted
  if (!themeMounted) {
    return (
      <div className="h-[650px] w-full rounded-xl border border-border-app bg-bg-card flex flex-col items-center justify-center gap-4 text-text-soft theme-transition">
        <div className="w-12 h-12 border-4 border-accent-aqua border-t-transparent rounded-full animate-spin" />
        <p className="text-xs uppercase tracking-[0.35em]">Loading map</p>
      </div>
    );
  }

  // Bloc principal : map prête
  return (
    <div 
      ref={wrapperRef}
      className="relative w-full rounded-xl border shadow-2xl"
      style={{
        height: '650px',
        width: calculatedWidth ? `${calculatedWidth}px` : '100%',
        minWidth: calculatedWidth ? `${calculatedWidth}px` : '100%',
        maxWidth: '100%',
        display: 'block',
        boxSizing: 'border-box',
        borderColor: isLight ? 'rgba(0, 0, 0, 0.12)' : '#2D3454',
        background: isLight ? '#f5f5f7' : '#020204',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <style>{getMapStyles(isLight)}</style>
      {/* Légende alignée avec le reste du dashboard */}
      <div className="absolute bottom-6 left-6 z-[1000] px-4 py-3 rounded border text-[10px] font-mono pointer-events-none" style={{
        background: isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
        borderColor: isLight ? 'rgba(234, 88, 12, 0.3)' : 'rgba(0, 212, 170, 0.3)',
        color: isLight ? '#1F2937' : '#a3a3a3',
      }}>
        <div className="mb-1 font-bold" style={{ color: isLight ? '#EA580C' : '#00D4AA' }}>
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
        key={mapKey}
        center={[20, 0]}
        zoom={1.5}
        minZoom={1}
        maxZoom={18}
        scrollWheelZoom={true}
        style={{ 
          height: "650px", 
          width: calculatedWidth ? `${calculatedWidth}px` : "100%",
          minWidth: calculatedWidth ? `${calculatedWidth}px` : "100%",
          background: "transparent"
        }}
        maxBounds={[[-90, -180], [90, 180]]}
        maxBoundsViscosity={0.5}
      >
        <InvalidateSizeOnMount />
        {geoJsonData ? (
          <GeoJSON
            key="static-world-map"
            data={geoJsonData}
            style={getGeoJsonStyleForTheme(isLight)}
            interactive={false}
          />
        ) : null}
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
