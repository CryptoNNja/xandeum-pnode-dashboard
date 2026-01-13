import React from 'react';

interface NinjaIconProps {
  className?: string;
}

export function NinjaIcon({ className = 'w-6 h-6' }: NinjaIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Ninja mask/head */}
      <path d="M12 2C8 2 5 5 5 8v2c0 1 0.5 2 1.5 2.5" />
      <path d="M19 8c0-3-3-6-7-6" />
      <path d="M5 10c0 1 0.5 2 1.5 2.5L8 14" />
      <path d="M19 8v2c0 1-0.5 2-1.5 2.5L16 14" />
      
      {/* Eyes - sharp and focused */}
      <line x1="9" y1="8" x2="9.5" y2="8" />
      <line x1="14.5" y1="8" x2="15" y2="8" />
      
      {/* Ninja body/gi */}
      <path d="M8 14v3c0 2 1 4 4 4s4-2 4-4v-3" />
      
      {/* Arms in stealth position */}
      <path d="M8 15l-3 2" />
      <path d="M16 15l3 2" />
      
      {/* Shuriken detail (optional small star) */}
      <circle cx="18" cy="6" r="1.5" fill="currentColor" />
      <line x1="18" y1="4.5" x2="18" y2="7.5" strokeWidth="1" />
      <line x1="16.5" y1="6" x2="19.5" y2="6" strokeWidth="1" />
    </svg>
  );
}

export function RoninIcon({ className = 'w-6 h-6' }: NinjaIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Ronin hat (kasa) */}
      <path d="M4 8c0-1 2-4 8-4s8 3 8 4" />
      <path d="M4 8l8 2l8-2" />
      
      {/* Head */}
      <circle cx="12" cy="13" r="3" />
      
      {/* Eyes */}
      <line x1="10.5" y1="13" x2="10.5" y2="13.1" strokeWidth="2" />
      <line x1="13.5" y1="13" x2="13.5" y2="13.1" strokeWidth="2" />
      
      {/* Katana on back */}
      <path d="M8 16l-2 6" />
      <path d="M16 16l2 6" />
      <line x1="6" y1="18" x2="18" y2="18" strokeWidth="1.5" />
      <line x1="7" y1="19.5" x2="17" y2="19.5" strokeWidth="0.5" opacity="0.5" />
    </svg>
  );
}

export function KatanaIcon({ className = 'w-6 h-6' }: NinjaIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Katana blade - elegant curved line */}
      <path d="M5 19l14-14" strokeWidth="2.5" />
      <path d="M4.5 19.5l15-15" strokeWidth="0.5" opacity="0.3" />
      
      {/* Tsuba (guard) - circular */}
      <circle cx="7" cy="17" r="1.5" fill="currentColor" opacity="0.3" />
      
      {/* Tsuka (handle) with wrap pattern */}
      <line x1="3" y1="21" x2="7" y2="17" strokeWidth="3" />
      <line x1="4" y1="21" x2="5" y2="20" strokeWidth="0.5" opacity="0.5" />
      <line x1="5" y1="20" x2="6" y2="19" strokeWidth="0.5" opacity="0.5" />
      <line x1="6" y1="19" x2="7" y2="18" strokeWidth="0.5" opacity="0.5" />
      
      {/* Blade tip - sharp point */}
      <path d="M19 5l0.5-0.5" strokeWidth="1.5" />
    </svg>
  );
}
