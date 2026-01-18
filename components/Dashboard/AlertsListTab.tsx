"use client";

import { useState, useMemo } from "react";
import { AlertCircle } from "lucide-react";
import clsx from "clsx";
import type { Alert, AlertFilters } from "@/types/alerts";
import { AlertCard } from "./AlertCard";
import { FilterBar } from "./FilterBar";
import { Pagination } from "@/components/common/Pagination";

type AlertsListTabProps = {
  alerts: Alert[];
  filters: AlertFilters;
  onFiltersChange: (filters: AlertFilters) => void;
  onResetFilters: () => void;
  onClose: () => void;
  isLight: boolean;
  allAlerts: Alert[]; // Toutes les alertes non filtrées pour les counts
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export const AlertsListTab = ({
  alerts,
  filters,
  onFiltersChange,
  onResetFilters,
  onClose,
  isLight,
  allAlerts,
}: AlertsListTabProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Pagination calculations
  const totalPages = Math.ceil(alerts.length / pageSize);
  const paginatedAlerts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return alerts.slice(start, start + pageSize);
  }, [alerts, currentPage, pageSize]);

  // Reset to page 1 when filters change or alerts change
  useMemo(() => {
    setCurrentPage(1);
  }, [alerts.length, filters]);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col h-[calc(90vh-280px)]">
      {/* Filter Bar - Sticky Top */}
      <div className="flex-shrink-0 pb-4">
        <FilterBar
          filters={filters}
          onFiltersChange={onFiltersChange}
          onReset={onResetFilters}
          isLight={isLight}
          totalResults={alerts.length}
          totalAlerts={allAlerts.length}
          allAlerts={allAlerts}
        />
      </div>

      {/* Alerts List - Scrollable with overflow control */}
      <div className="flex-1 overflow-y-auto pr-2 -mr-2">
        {paginatedAlerts.length > 0 ? (
          <div className="space-y-3 overflow-hidden">
            {paginatedAlerts.map((alert, index) => (
              <AlertCard
                key={`${alert.ip}-${alert.type}-${index}`}
                alert={alert}
                isLight={isLight}
                onClose={onClose}
              />
            ))}
          </div>
        ) : (
          // Empty State
          <div className="flex flex-col items-center justify-center h-full py-8 px-4">
            <div className={clsx(
              "w-16 h-16 rounded-full flex items-center justify-center mb-4",
              "bg-bg-hover border-2 border-border-app"
            )}>
              <AlertCircle className="w-8 h-8 text-text-faint" />
            </div>
            <h3 className="text-lg font-bold text-text-main mb-2">No alerts found</h3>
            <p className="text-sm text-text-soft text-center mb-4">
              {filters.searchTerm || filters.severity !== 'all' || filters.type !== 'all'
                ? "Try adjusting your filters to see more results."
                : "Great news! There are no alerts at the moment."}
            </p>
            {(filters.searchTerm || filters.severity !== 'all' || filters.type !== 'all') && (
              <button
                onClick={onResetFilters}
                className={clsx(
                  "px-4 py-2 rounded-lg font-medium text-sm transition-all",
                  "bg-accent text-white hover:bg-accent/90"
                )}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination Controls - Sticky Bottom */}
      {paginatedAlerts.length > 0 && totalPages > 1 && (
        <div className="flex-shrink-0 pt-4 mt-4 border-t border-border-app">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-soft">Show</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className={clsx(
                  "px-3 py-1.5 rounded-lg border text-sm font-medium transition-all cursor-pointer",
                  isLight 
                    ? "bg-white text-gray-900 border-gray-300" 
                    : "bg-[#1a1f3a] text-white border-white/20",
                  "focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                )}
              >
                {PAGE_SIZE_OPTIONS.map(size => (
                  <option 
                    key={size} 
                    value={size}
                    className={isLight ? "bg-white text-gray-900" : "bg-[#1a1f3a] text-white"}
                  >
                    {size}
                  </option>
                ))}
              </select>
              <span className="text-sm text-text-soft">per page</span>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={alerts.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        </div>
      )}
    </div>
  );
};
