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
 * Uses React Portal + dynamic import to completely isolate Joyride
 * from Next.js component tree and prevent params/searchParams Promise issues.
 * 
 * The component receives onboarding state as props from the parent,
 * ensuring a single source of truth for the tour state.
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
    return () => setMounted(false);
  }, []);

  // Only render on client-side and use portal to break out of Next.js component tree
  if (!mounted) return null;

  return createPortal(
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
    />,
    document.body
  );
}
