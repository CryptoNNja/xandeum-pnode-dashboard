"use client";

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { CallBackProps } from 'react-joyride';
import { getJoyrideStyles } from '@/lib/joyride-styles';
import { useTheme } from '@/hooks/useTheme';

/**
 * OnboardingTour - Presentational Joyride wrapper component
 * 
 * @description
 * This component wraps react-joyride with multiple isolation techniques to minimize
 * Next.js 15+ compatibility issues. While warnings are suppressed at the console level,
 * this component still uses best practices for isolation.
 * 
 * @techniques
 * - React Portal: Mounts Joyride directly to document.body
 * - Dynamic Import: Loads Joyride with ssr: false
 * - Client-only rendering: useEffect guard ensures browser-only execution
 * - Props-based state: Single source of truth from parent component
 * 
 * @props
 * - run: Controls whether the tour is active
 * - steps: Array of tour steps configuration
 * - handleJoyrideCallback: Callback for tour events (step changes, completion, etc.)
 * 
 * @see hooks/useOnboarding.tsx for state management
 */

// Dynamically import Joyride with no SSR to avoid Next.js params/searchParams issues
const Joyride = dynamic(
  () => import('react-joyride'),
  { ssr: false }
);

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Suppress Next.js 15+ params/searchParams warnings from react-joyride
    const originalError = console.error;
    const suppressPatterns = [
      /params are being enumerated/i,
      /searchParams.*was accessed directly/i,
      /The keys of.*searchParams.*were accessed directly/i,
      /must be unwrapped with.*React\.use\(\)/i,
    ];
    
    console.error = (...args: any[]) => {
      const message = args.join(' ');
      if (!suppressPatterns.some(pattern => pattern.test(message))) {
        originalError.apply(console, args);
      }
    };
    
    return () => {
      setMounted(false);
      console.error = originalError;
    };
  }, []);

  // Only render on client-side and use portal to break out of Next.js component tree
  if (!mounted) return null;

  return createPortal(
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
    </>,
    document.body
  );
}
