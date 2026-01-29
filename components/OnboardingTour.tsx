"use client";

import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { CallBackProps } from 'react-joyride';
import { getJoyrideStyles } from '@/lib/joyride-styles';
import { useTheme } from '@/hooks/useTheme';

/**
 * OnboardingTour - Presentational Joyride wrapper component
 * 
 * @description
 * This component wraps react-joyride and properly isolates it from Next.js 15+ 
 * params/searchParams props that are automatically passed down the component tree.
 * 
 * @solution
 * - Uses a wrapper function component that accepts ONLY the needed props
 * - Prevents Next.js from passing params/searchParams to Joyride
 * - React Portal to mount outside the main component tree
 * - Dynamic import with SSR disabled
 * 
 * @props
 * - run: Controls whether the tour is active
 * - steps: Array of tour steps configuration
 * - handleJoyrideCallback: Callback for tour events (step changes, completion, etc.)
 * 
 * @see hooks/useOnboarding.tsx for state management
 */

// Dynamically import Joyride with no SSR
const Joyride = dynamic(
  () => import('react-joyride'),
  { ssr: false }
);

export type OnboardingTourProps = {
  run: boolean;
  steps: any[];
  handleJoyrideCallback: (data: CallBackProps) => void;
};

// Inner wrapper that ONLY accepts our specific props - blocks Next.js props
function JoyrideIsolated({ 
  run, 
  steps, 
  callback,
  theme 
}: { 
  run: boolean; 
  steps: any[]; 
  callback: (data: CallBackProps) => void;
  theme: string;
}) {
  return (
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
        callback={callback}
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

export function OnboardingTour({
  run,
  steps,
  handleJoyrideCallback,
}: OnboardingTourProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Memoize props to prevent re-renders and ensure clean prop passing
  // MUST be before any conditional returns (Rules of Hooks)
  const joyrideProps = useMemo(() => ({
    run,
    steps,
    callback: handleJoyrideCallback,
    theme,
  }), [run, steps, handleJoyrideCallback, theme]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Only render on client-side and use portal to break out of Next.js component tree
  if (!mounted) return null;

  return createPortal(
    <JoyrideIsolated {...joyrideProps} />,
    document.body
  );
}
