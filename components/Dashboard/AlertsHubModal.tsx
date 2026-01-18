"use client";

import { useState, useMemo, useEffect } from "react";
import { X, AlertCircle, Activity } from "lucide-react";
import clsx from "clsx";
import type { AlertsHubProps } from "@/types/alerts";
import { useAlertsFilters } from "@/hooks/useAlertsFilters";
import { AlertsListTab } from "./AlertsListTab";
import { AlertsAnalyticsTab } from "./AlertsAnalyticsTab";

export const AlertsHubModal = ({
  isOpen,
  onClose,
  alerts,
  totalNodes,
  isLight,
  defaultTab = 'alerts',
  defaultFilters,
}: AlertsHubProps) => {
  const [activeTab, setActiveTab] = useState<'alerts' | 'analytics'>(defaultTab);
  
  // Initialize filters hook
  const { filters, setFilters, filteredAlerts, resetFilters } = useAlertsFilters(alerts, defaultFilters);

  // Reset tab and filters when modal opens/closes or defaultTab changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      if (defaultFilters) {
        setFilters({
          searchTerm: defaultFilters.searchTerm || '',
          severity: defaultFilters.severity || 'all',
          type: defaultFilters.type || 'all',
        });
      }
    }
  }, [isOpen, defaultTab, defaultFilters]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSwitchToAlerts = () => {
    setActiveTab('alerts');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={clsx(
          "relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl border shadow-2xl flex flex-col theme-transition",
          isLight ? "bg-white/98 border-gray-200/50" : "bg-[#0a0e27]/98 border-white/20"
        )}
      >
        {/* Header */}
        <div
          className={clsx(
            "p-6 border-b flex items-center justify-between",
            isLight ? "border-gray-200/50 bg-gradient-to-br from-blue-500/5 to-purple-500/5" : "border-white/20 bg-gradient-to-br from-blue-500/10 to-purple-500/10"
          )}
        >
          <div className="flex items-center gap-4">
            <div
              className={clsx(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                isLight ? "bg-red-500/10" : "bg-red-500/15"
              )}
            >
              <Activity className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text-main">Alerts Hub</h2>
              <p className="text-sm text-text-soft mt-1">
                Comprehensive system monitoring & insights
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg text-text-faint hover:text-text-main theme-transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          className={clsx(
            "flex items-center gap-1 px-6 pt-4 border-b",
            isLight ? "border-gray-200/50" : "border-white/20"
          )}
        >
          <button
            onClick={() => setActiveTab('alerts')}
            className={clsx(
              "flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-semibold text-sm transition-all relative",
              activeTab === 'alerts'
                ? "text-accent bg-accent/10"
                : "text-text-soft hover:text-text-main hover:bg-bg-hover"
            )}
          >
            <AlertCircle className="w-4 h-4" />
            Alerts
            {activeTab === 'alerts' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={clsx(
              "flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-semibold text-sm transition-all relative",
              activeTab === 'analytics'
                ? "text-accent bg-accent/10"
                : "text-text-soft hover:text-text-main hover:bg-bg-hover"
            )}
          >
            <Activity className="w-4 h-4" />
            Analytics
            {activeTab === 'analytics' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'alerts' ? (
            <AlertsListTab
              alerts={filteredAlerts}
              filters={filters}
              onFiltersChange={setFilters}
              onResetFilters={resetFilters}
              onClose={onClose}
              isLight={isLight}
              allAlerts={alerts}
            />
          ) : (
            <AlertsAnalyticsTab
              alerts={alerts}
              totalNodes={totalNodes}
              isLight={isLight}
              onSwitchToAlerts={handleSwitchToAlerts}
            />
          )}
        </div>

        {/* Footer */}
        <div
          className={clsx(
            "p-4 border-t flex items-center justify-between",
            isLight ? "border-gray-200/50 bg-gray-50/50" : "border-white/20 bg-black/20"
          )}
        >
          <p className="text-xs text-text-faint">
            Alerts are monitored in real-time and updated every cycle
          </p>
          <button
            onClick={onClose}
            className={clsx(
              "px-4 py-2 rounded-lg font-semibold text-sm transition-all",
              "bg-accent text-white hover:bg-accent/90"
            )}
          >
            Close Hub
          </button>
        </div>
      </div>
    </div>
  );
};
