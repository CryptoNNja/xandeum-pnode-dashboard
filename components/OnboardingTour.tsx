"use client";

import Joyride, { CallBackProps } from 'react-joyride';
import { getJoyrideStyles } from '@/lib/joyride-styles';
import { useTheme } from '@/hooks/useTheme';

/**
 * OnboardingTour - Presentational Joyride wrapper component
 * 
 * This component is isolated to prevent Next.js 15+ params/searchParams
 * Promise unwrapping issues. By separating Joyride into its own component,
 * we avoid the automatic prop passing from Next.js page components.
 * 
 * The component receives onboarding state as props from the parent,
 * ensuring a single source of truth for the tour state.
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
