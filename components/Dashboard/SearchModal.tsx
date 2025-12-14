
"use client";

import { useEffect, useRef } from "react";
import { Search } from "lucide-react";

type SearchModalProps = {
  isSearchOpen: boolean;
  setIsSearchOpen: (isOpen: boolean) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
};

export const SearchModal = ({
  isSearchOpen,
  setIsSearchOpen,
  searchTerm,
  setSearchTerm,
}: SearchModalProps) => {
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isSearchOpen) return;
    const timeout = setTimeout(() => searchInputRef.current?.focus(), 0);
    return () => clearTimeout(timeout);
  }, [isSearchOpen]);

  if (!isSearchOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-[#050914] z-50 flex items-center justify-center p-4"
      onClick={() => setIsSearchOpen(false)}
    >
      <div
        className="bg-bg-app border border-border-app rounded-xl max-w-xl w-full overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border-app p-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-text-main">Search</h3>
            <p className="text-sm text-text-faint mt-2">
              Search nodes (IP, version, status)
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsSearchOpen(false)}
            className="text-text-faint hover:text-text-main transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-3 rounded-lg border border-border-app bg-bg-bg px-3 py-2">
            <Search className="w-5 h-5 text-text-soft" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by IP, version, status..."
              className="w-full bg-transparent outline-none text-sm text-text-main"
            />
          </div>
        </div>
        <div className="border-t border-border-app p-4 bg-bg-bg">
          <button
            type="button"
            onClick={() => setIsSearchOpen(false)}
            className="w-full px-4 py-2 bg-bg-bg2 hover:bg-bg-card border border-border-app rounded-lg text-sm font-semibold text-text-main transition-colors theme-transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
