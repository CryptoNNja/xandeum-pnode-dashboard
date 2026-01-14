'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface DashboardContextType {
  currentPage: string;
  selectedNodes: string[];
  activeFilters: {
    network?: 'MAINNET' | 'DEVNET' | 'PRIVATE';
    status?: 'online' | 'offline' | 'all';
    search?: string;
  };
  visibleNodeCount: number;
  setSelectedNodes: (nodes: string[]) => void;
  setActiveFilters: (filters: any) => void;
  setVisibleNodeCount: (count: number) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState({});
  const [visibleNodeCount, setVisibleNodeCount] = useState(0);

  return (
    <DashboardContext.Provider
      value={{
        currentPage: pathname || '/',
        selectedNodes,
        activeFilters,
        visibleNodeCount,
        setSelectedNodes,
        setActiveFilters,
        setVisibleNodeCount,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (!context) {
    // Return default values if context not available
    return {
      currentPage: '/',
      selectedNodes: [],
      activeFilters: {},
      visibleNodeCount: 0,
      setSelectedNodes: () => {},
      setActiveFilters: () => {},
      setVisibleNodeCount: () => {},
    };
  }
  return context;
}
