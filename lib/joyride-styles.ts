/**
 * Joyride (react-joyride) theme styles
 * Centralized styling configuration for the onboarding tour
 */

import type { Styles } from 'react-joyride';

export function getJoyrideStyles(theme: 'light' | 'dark'): Partial<Styles> {
  const isDark = theme === 'dark';
  
  return {
    options: {
      primaryColor: '#14f195', // Xandeum brand color
      backgroundColor: isDark ? '#1a1f3a' : '#ffffff',
      textColor: isDark ? '#f8fafc' : '#0f172a',
      overlayColor: 'rgba(10, 14, 39, 0.85)',
      arrowColor: isDark ? '#1a1f3a' : '#ffffff',
      zIndex: 10000,
    },
    tooltip: {
      borderRadius: '16px',
      fontSize: '14px',
      padding: '20px',
      border: isDark 
        ? '1px solid rgba(100, 116, 139, 0.2)' 
        : '1px solid #e5e7eb',
      boxShadow: isDark
        ? '0 20px 45px -25px rgba(2, 4, 24, 0.65), 0 0 40px rgba(20, 241, 149, 0.1)'
        : '0 10px 25px rgba(0, 0, 0, 0.1)',
    },
    tooltipContainer: {
      textAlign: 'left',
    },
    tooltipTitle: {
      fontSize: '16px',
      fontWeight: '700',
      marginBottom: '12px',
      lineHeight: '1.4',
    },
    tooltipContent: {
      fontSize: '14px',
      lineHeight: '1.6',
      padding: '0',
    },
    buttonNext: {
      backgroundColor: '#14f195',
      color: '#0a0e27',
      borderRadius: '8px',
      padding: '10px 20px',
      fontSize: '14px',
      fontWeight: '600',
      border: 'none',
      boxShadow: '0 0 20px rgba(20, 241, 149, 0.3)',
      transition: 'all 0.3s ease',
    },
    buttonBack: {
      color: '#14f195',
      fontSize: '14px',
      fontWeight: '600',
      marginRight: '12px',
    },
    buttonSkip: {
      color: '#94a3b8',
      fontSize: '13px',
      fontWeight: '500',
    },
    spotlight: {
      borderRadius: '12px',
      boxShadow: '0 0 0 9999px rgba(10, 14, 39, 0.85), 0 0 40px rgba(20, 241, 149, 0.2)',
    },
    beaconInner: {
      backgroundColor: '#14f195',
    },
    beaconOuter: {
      backgroundColor: 'rgba(20, 241, 149, 0.3)',
      borderColor: '#14f195',
    },
  };
}
