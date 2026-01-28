"use client";

import Joyride from 'react-joyride';
import { useOnboarding } from '@/hooks/useOnboarding';
import { getJoyrideStyles } from '@/lib/joyride-styles';
import { useTheme } from '@/hooks/useTheme';

/**
 * OnboardingTour - Isolated component for Joyride tour
 * 
 * This component is isolated to prevent Next.js 15+ params/searchParams
 * Promise unwrapping issues. By separating Joyride into its own component,
 * we avoid the automatic prop passing from Next.js page components.
 */
export function OnboardingTour() {
  const { theme } = useTheme();
  const { run, steps, handleJoyrideCallback } = useOnboarding();

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
