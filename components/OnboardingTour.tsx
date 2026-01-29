"use client";

import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { CallBackProps } from 'react-joyride';
import { getJoyrideStyles } from '@/lib/joyride-styles';
import { useTheme } from '@/hooks/useTheme';

/**
 * OnboardingTour - Completely isolated Joyride wrapper
 * 
 * @description
 * This is the PROPER solution for Next.js 15+ params/searchParams issues.
 * We create a completely separate React root that's NOT part of the Next.js
 * component tree, so params/searchParams never reach it.
 * 
 * @solution
 * - Dynamic import of Joyride inside useEffect (client-only)
 * - Separate React root with createRoot (not part of Next.js tree)
 * - Direct DOM manipulation to mount/unmount
 * - Zero connection to Next.js component hierarchy
 * 
 * @props
 * - run: Controls whether the tour is active
 * - steps: Array of tour steps configuration
 * - handleJoyrideCallback: Callback for tour events
 * 
 * @see hooks/useOnboarding.tsx for state management
 */

export type OnboardingTourProps = {
  run: boolean;
  steps: any[];
  handleJoyrideCallback: (data: CallBackProps) => void;
};

export function OnboardingTour({
  run,
  steps,
  handleJoyrideCallback,
}: OnboardingTourProps) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<Root | null>(null);

  // Create container and root once on mount
  useEffect(() => {
    console.log('🎯 OnboardingTour: Creating container and root');
    if (!containerRef.current) {
      containerRef.current = document.createElement('div');
      containerRef.current.id = 'joyride-root';
      document.body.appendChild(containerRef.current);
      console.log('✅ Container created and added to body');
    }

    const initRoot = async () => {
      if (!rootRef.current && containerRef.current) {
        rootRef.current = createRoot(containerRef.current);
        console.log('✅ React root created');
      }
    };

    initRoot();

    // Cleanup only on unmount
    return () => {
      setTimeout(() => {
        if (rootRef.current) {
          rootRef.current.unmount();
          rootRef.current = null;
        }
        if (containerRef.current && document.body.contains(containerRef.current)) {
          document.body.removeChild(containerRef.current);
          containerRef.current = null;
        }
      }, 0);
    };
  }, []); // Only on mount/unmount

  // Re-render Joyride when props change
  useEffect(() => {
    console.log('🔄 OnboardingTour: Re-render effect triggered', { run, stepsCount: steps.length });
    const renderJoyride = async () => {
      console.log('📦 Importing Joyride...');
      const Joyride = (await import('react-joyride')).default;
      console.log('✅ Joyride imported');

      if (rootRef.current) {
        console.log('🎨 Rendering Joyride with run=', run);
        rootRef.current.render(
          <>
            <style>{`
              /* Smooth transitions for Joyride elements */
              .react-joyride__spotlight {
                transition: all 0.3s ease-in-out !important;
              }
              
              .react-joyride__overlay {
                transition: opacity 0.3s ease-in-out !important;
              }
            `}</style>
            <Joyride
              steps={steps}
              run={run}
              continuous={true}
              showSkipButton={true}
              showProgress={true}
              scrollToFirstStep={true}
              scrollOffset={120}
              disableScrolling={false}
              disableOverlayClose={true}
              spotlightClicks={false}
              callback={handleJoyrideCallback}
              styles={getJoyrideStyles(theme)}
              locale={{
                back: '← Back',
                close: 'Close',
                last: 'Finish Tour ✓',
                next: 'Next →',
                skip: 'Skip Tour',
              }}
              floaterProps={{
                disableAnimation: false,
              }}
            />
          </>
        );
      }
    };

    renderJoyride();
  }, [run, steps, handleJoyrideCallback, theme]); // Re-render on prop changes

  return null; // This component doesn't render anything in the Next.js tree
}
