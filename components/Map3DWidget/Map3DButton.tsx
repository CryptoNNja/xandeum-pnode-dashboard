'use client';

import { Globe } from 'lucide-react';

type Map3DButtonProps = {
  onClick: () => void;
};

export function Map3DButton({ onClick }: Map3DButtonProps) {
  return (
    <button
      onClick={onClick}
      className="group relative bg-gradient-to-br from-primary to-primary/80 text-bg-dark px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-3"
      title="Open 3D Network Globe"
    >
      {/* Animated glow effect */}
      <div className="absolute inset-0 rounded-xl bg-primary opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300" />
      
      {/* Icon with animation */}
      <div className="relative">
        <Globe className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
        <div className="absolute inset-0 bg-primary rounded-full opacity-0 group-hover:opacity-50 blur-md animate-ping" />
      </div>
      
      {/* Text */}
      <div className="relative flex flex-col items-start">
        <span className="text-sm font-bold leading-none">3D Globe</span>
        <span className="text-xs opacity-90 leading-none mt-0.5">Network View</span>
      </div>
      
      {/* Shine effect */}
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
      </div>
    </button>
  );
}
