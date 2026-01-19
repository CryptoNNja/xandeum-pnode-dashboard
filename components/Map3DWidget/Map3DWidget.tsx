'use client';

import { useState, Suspense, lazy } from 'react';
import { Map3DButton } from './Map3DButton';

// Lazy load the heavy 3D viewer
const Map3DViewer = lazy(() => 
  import('../Map3D/Map3DViewer').then(mod => ({ default: mod.Map3DViewer }))
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
            [class*="STOINCCalculator"] { display: none !important; }
            [class*="ChatbotWidget"] { display: none !important; }
          `}</style>
          <Suspense fallback={
          <div className="fixed inset-0 z-50 bg-bg-dark flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <div className="text-text-primary font-medium">Loading 3D Globe...</div>
              <div className="text-text-secondary text-sm mt-2">Rendering {pnodes.length} nodes</div>
            </div>
          </div>
        }>
          <Map3DViewer pnodes={pnodes} onClose={() => setIsOpen(false)} />
        </Suspense>
        </>
      )}
    </>
  );
}
