"use client";

import { useState, useEffect, useCallback } from "react";

export interface FavoriteNode {
  ip: string;
  addedAt: number;
  tags?: string[];
  note?: string;
  category?: string;
}

interface UseFavoritesReturn {
  favorites: FavoriteNode[];
  favoriteIds: Set<string>;
  isFavorite: (ip: string) => boolean;
  addFavorite: (ip: string, metadata?: Partial<Omit<FavoriteNode, 'ip' | 'addedAt'>>) => void;
  removeFavorite: (ip: string) => void;
  toggleFavorite: (ip: string) => boolean;
  updateFavorite: (ip: string, updates: Partial<Omit<FavoriteNode, 'ip' | 'addedAt'>>) => void;
  clearFavorites: () => void;
  addMultipleFavorites: (ips: string[]) => void;
  removeMultipleFavorites: (ips: string[]) => void;
  exportFavorites: () => string;
  importFavorites: (jsonString: string) => boolean;
}

const STORAGE_KEY = "xandeum_pnode_favorites";

/**
 * Custom hook for managing favorite pNodes with localStorage persistence
 * 
 * Features:
 * - Persistent storage with localStorage
 * - Optimistic updates
 * - Batch operations
 * - Import/Export functionality
 * - Extensible metadata (tags, notes, categories)
 * 
 * @example
 * const { favorites, addFavorite, isFavorite } = useFavorites();
 */
export const useFavorites = (): UseFavoritesReturn => {
  const [favorites, setFavorites] = useState<FavoriteNode[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as FavoriteNode[];
        setFavorites(parsed);
        setFavoriteIds(new Set(parsed.map(f => f.ip)));
      }
    } catch (error) {
      console.error("Error loading favorites from localStorage:", error);
    }
  }, []);

  // Sync to localStorage whenever favorites change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error("Error saving favorites to localStorage:", error);
    }
  }, [favorites]);

  // Check if a node is favorited
  const isFavorite = useCallback((ip: string): boolean => {
    return favoriteIds.has(ip);
  }, [favoriteIds]);

  // Add a node to favorites
  const addFavorite = useCallback((ip: string, metadata?: Partial<Omit<FavoriteNode, 'ip' | 'addedAt'>>) => {
    setFavorites(prev => {
      // Avoid duplicates
      if (prev.some(f => f.ip === ip)) {
        return prev;
      }

      const newFavorite: FavoriteNode = {
        ip,
        addedAt: Date.now(),
        ...metadata,
      };

      const updated = [...prev, newFavorite];
      setFavoriteIds(new Set(updated.map(f => f.ip)));
      return updated;
    });
  }, []);

  // Remove a node from favorites
  const removeFavorite = useCallback((ip: string) => {
    setFavorites(prev => {
      const updated = prev.filter(f => f.ip !== ip);
      setFavoriteIds(new Set(updated.map(f => f.ip)));
      return updated;
    });
  }, []);

  // Toggle favorite status (returns new state: true = added, false = removed)
  const toggleFavorite = useCallback((ip: string): boolean => {
    const isCurrentlyFavorite = favoriteIds.has(ip);
    
    if (isCurrentlyFavorite) {
      removeFavorite(ip);
      return false;
    } else {
      addFavorite(ip);
      return true;
    }
  }, [favoriteIds, addFavorite, removeFavorite]);

  // Update metadata for an existing favorite
  const updateFavorite = useCallback((ip: string, updates: Partial<Omit<FavoriteNode, 'ip' | 'addedAt'>>) => {
    setFavorites(prev => 
      prev.map(f => 
        f.ip === ip 
          ? { ...f, ...updates }
          : f
      )
    );
  }, []);

  // Clear all favorites
  const clearFavorites = useCallback(() => {
    setFavorites([]);
    setFavoriteIds(new Set());
  }, []);

  // Add multiple nodes at once (batch operation)
  const addMultipleFavorites = useCallback((ips: string[]) => {
    setFavorites(prev => {
      const existingIps = new Set(prev.map(f => f.ip));
      const newFavorites = ips
        .filter(ip => !existingIps.has(ip))
        .map(ip => ({
          ip,
          addedAt: Date.now(),
        }));

      const updated = [...prev, ...newFavorites];
      setFavoriteIds(new Set(updated.map(f => f.ip)));
      return updated;
    });
  }, []);

  // Remove multiple nodes at once (batch operation)
  const removeMultipleFavorites = useCallback((ips: string[]) => {
    setFavorites(prev => {
      const ipsSet = new Set(ips);
      const updated = prev.filter(f => !ipsSet.has(f.ip));
      setFavoriteIds(new Set(updated.map(f => f.ip)));
      return updated;
    });
  }, []);

  // Export favorites as JSON string
  const exportFavorites = useCallback((): string => {
    return JSON.stringify(favorites, null, 2);
  }, [favorites]);

  // Import favorites from JSON string (returns success status)
  const importFavorites = useCallback((jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString) as FavoriteNode[];
      
      // Validate structure
      if (!Array.isArray(parsed)) {
        throw new Error("Invalid format: not an array");
      }

      // Merge with existing favorites (avoid duplicates)
      setFavorites(prev => {
        const existingIps = new Set(prev.map(f => f.ip));
        const newFavorites = parsed.filter(f => !existingIps.has(f.ip));
        const updated = [...prev, ...newFavorites];
        setFavoriteIds(new Set(updated.map(f => f.ip)));
        return updated;
      });

      return true;
    } catch (error) {
      console.error("Error importing favorites:", error);
      return false;
    }
  }, []);

  return {
    favorites,
    favoriteIds,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    updateFavorite,
    clearFavorites,
    addMultipleFavorites,
    removeMultipleFavorites,
    exportFavorites,
    importFavorites,
  };
};
