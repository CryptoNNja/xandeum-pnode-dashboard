"use client";

import dynamic from 'next/dynamic';
import { CallBackProps } from 'react-joyride';
import { getJoyrideStyles } from '@/lib/joyride-styles';
import { useTheme } from '@/hooks/useTheme';

/**
 * OnboardingTour - Presentational Joyride wrapper component
 * 
 * Uses dynamic import with ssr: false to completely isolate Joyride
 * from Next.js SSR and prevent params/searchParams Promise issues.
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

  return (
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
    />
  );
}
