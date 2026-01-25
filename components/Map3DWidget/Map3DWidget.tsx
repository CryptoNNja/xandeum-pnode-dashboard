'use client';

import { useState, Suspense, lazy } from 'react';
import { Map3DButton } from './Map3DButton';

// Lazy load GlobeViewerMapLibre (MapLibre GL - Professional 3D visualization with dark-matter style)
const Map3DViewer = lazy(() => 
  import('../Map3D/GlobeViewerMapLibre').then(mod => ({ default: mod.GlobeViewerMapLibre }))
);

type Map3DWidgetProps = {
  pnodes: any[];
};

export function Map3DWidget({ pnodes }: Map3DWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Hide button when modal is open
  const buttonStyle = isOpen ? { display: 'none' } : undefined;
  
  return (
    <>
      {/* Floating Button - Above Calculator */}
      <div style={buttonStyle}>
        <Map3DButton onClick={() => setIsOpen(true)} isOpen={isOpen} />
      </div>
      
      {/* 3D Viewer Modal */}
      {isOpen && (
        <>
          {/* Hide other widgets using CSS */}
          <style>{`
            /* Hide calculator widget */
            [class*="STOINCCalculator"] { display: none !important; }
            button[aria-label*="calculator" i] { display: none !important; }
            button[aria-label*="STOINC" i] { display: none !important; }
            
            /* Hide chatbot widget */
            [class*="ChatbotWidget"] { display: none !important; }
            [class*="ChatPanel"] { display: none !important; }
            [class*="FloatingButton"] { display: none !important; }
            button[aria-label*="chat" i] { display: none !important; }
            button[aria-label*="AI" i] { display: none !important; }
            
            /* Hide any floating action buttons */
            div[class*="fixed"][class*="bottom"] button:not([aria-label*="3D" i]):not([aria-label*="globe" i]) {
              display: none !important;
            }
          `}</style>
          <Suspense fallback={
          <div className="fixed inset-0 z-[9999] bg-bg-dark flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <div className="text-text-primary font-medium">Loading 3D Globe...</div>
              <div className="text-text-secondary text-sm mt-2">Rendering {pnodes.length} nodes</div>
            </div>
          </div>
        }>
          <Map3DViewer nodes={(() => {
            const mapped = pnodes
              .filter((p: any) => p.lat !== null && p.lat !== undefined && p.lng !== null && p.lng !== undefined)
              .map((p: any) => {
                
                return {
                  ip: p.ip,
                  lat: p.lat,
                  lng: p.lng,
                  health: p._score || 0,
                  // Try multiple possible field names
                  storage: p.storage_committed || p.stats?.storage_committed || 0,
                  hasActiveStreams: p.active_streams > 0,
                  version: p.version,
                  city: p.city || 'Unknown',
                  country: p.country || 'Unknown',
                  country_code: p.country_code,
                  pubkey: p.pubkey,
                  uptime: p.uptime || p.stats?.uptime || 0,
                  cpu: p.stats?.cpu_percent ?? 0,
                  ram: p.stats && typeof p.stats.ram_used === 'number' && typeof p.stats.ram_total === 'number' && p.stats.ram_total > 0
                    ? (p.stats.ram_used / p.stats.ram_total) * 100
                    : 0,
                  status: (p.status === 'online' ? 'active' : 'inactive') as 'active' | 'inactive',
                  isPublic: p.node_type === 'public' && p.lat !== null && p.lat !== undefined && p.lng !== null && p.lng !== undefined,
                  operator: p.manager_wallet,
                };
              });
            return mapped;
          })()} onClose={() => setIsOpen(false)} />
        </Suspense>
        </>
      )}
    </>
  );
}
