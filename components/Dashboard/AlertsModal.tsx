
"use client";

import { Check, AlertCircle, AlertTriangle } from "lucide-react";
import type { AlertSeverity } from "@/hooks/usePnodeDashboard";

type AlertsModalProps = {
  isAlertOpen: boolean;
  setIsAlertOpen: (isOpen: boolean) => void;
  alerts: { type: string; message: string; ip: string; severity: AlertSeverity }[];
  criticalCount: number;
};

export const AlertsModal = ({
  isAlertOpen,
  setIsAlertOpen,
  alerts,
  criticalCount,
}: AlertsModalProps) => {
  if (!isAlertOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-[#050914] z-50 flex items-center justify-center p-4"
      onClick={() => setIsAlertOpen(false)}
    >
      <div
        className="bg-bg-app border border-border-app rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-border-app p-6 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-text-main">System Alerts</h3>
            <p className="text-sm text-text-faint mt-2">
              {alerts.length} alert{alerts.length !== 1 ? "s" : ""} detected
              {criticalCount > 0 && (
                <span className="ml-2 text-kpi-critical font-semibold">
                  ({criticalCount} critical node{criticalCount !== 1 ? "s" : ""})
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => setIsAlertOpen(false)}
            className="text-text-faint hover:text-text-main transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-120px)]">
          {alerts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-kpi-excellent/10 mb-4">
                <svg className="w-8 h-8 text-kpi-excellent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-kpi-excellent text-lg font-semibold">
                ✓ All Systems Healthy
              </p>
              <p className="text-text-faint text-sm mt-2">
                No alerts to display
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border-app">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-4 hover:bg-bg-bg2 transition-colors cursor-pointer theme-transition ${
                    alert.severity === "critical"
                      ? "border-l-4 border-kpi-critical"
                      : alert.severity === "warning"
                      ? "border-l-4 border-kpi-warning"
                      : "border-l-4 border-kpi-good"
                  }`}
                  onClick={() => {
                    setIsAlertOpen(false);
                    window.location.href = `/pnode/${alert.ip}`;
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-2 rounded uppercase ${
                        alert.severity === "critical"
                          ? "bg-kpi-critical/10 text-kpi-critical border border-kpi-critical/20"
                          : alert.severity === "warning"
                          ? "bg-kpi-warning/10 text-kpi-warning border border-kpi-warning/20"
                          : "bg-kpi-good/10 text-kpi-good border border-kpi-good/20"
                      }`}
                    >
                      {alert.type}
                    </span>
                    <span className="text-xs text-text-faint font-mono">
                      {alert.ip}
                    </span>
                  </div>
                  <p className="text-sm text-text-main">{alert.message}</p>
                  <p className="text-xs text-text-soft mt-2">
                    Click to view node details →
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border-app p-4 bg-bg-bg">
          <button
            onClick={() => setIsAlertOpen(false)}
            className="w-full px-4 py-2 bg-bg-bg2 hover:bg-bg-card border border-border-app rounded-lg text-sm font-semibold text-text-main transition-colors theme-transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
