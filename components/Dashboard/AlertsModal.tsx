"use client";

import { X, AlertCircle, AlertTriangle, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import type { Alert } from "@/hooks/usePnodeDashboard";

type AlertsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  alerts: Alert[];
  isLight: boolean;
};

export const AlertsModal = ({
  isOpen,
  onClose,
  alerts,
  isLight,
}: AlertsModalProps) => {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl border border-border-app shadow-2xl flex flex-col theme-transition"
        style={{
          backgroundColor: isLight ? "rgba(247,249,255,0.98)" : "rgba(5,9,24,0.98)",
        }}
      >
        <div className="p-6 border-b border-border-app flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-main">
                System Alerts
              </h2>
              <p className="text-sm text-text-soft">
                {alerts.length} active issues detected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg text-text-faint hover:text-text-main theme-transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {alerts.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-text-soft">No active alerts. All systems operational.</p>
            </div>
          ) : (
            alerts.map((alert, idx) => (
              <div
                key={`${alert.ip}-${idx}`}
                onClick={() => {
                  router.push(`/pnode/${alert.ip}`);
                  onClose();
                }}
                className={clsx(
                  "p-4 rounded-xl border cursor-pointer group theme-transition",
                  alert.severity === "critical"
                    ? "bg-red-500/5 border-red-500/20 hover:border-red-500/40"
                    : "bg-orange-500/5 border-orange-500/20 hover:border-orange-500/40"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {alert.severity === "critical" ? (
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-sm font-bold text-text-main group-hover:text-accent theme-transition">
                        {alert.type}
                      </p>
                      <p className="text-xs text-text-soft mt-0.5">
                        Node: <span className="font-mono">{alert.ip}</span>
                      </p>
                      <p className="text-xs text-text-main mt-2">
                        {alert.message}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <span className="text-xs font-mono font-bold text-text-main px-2 py-1 rounded bg-black/20">
                      {alert.value}
                    </span>
                    <ChevronRight className="w-4 h-4 text-text-faint group-hover:text-text-main theme-transition translate-x-0 group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-border-app bg-black/20">
          <p className="text-[10px] text-center text-text-faint uppercase tracking-widest">
            Alerts are updated every cycle
          </p>
        </div>
      </div>
    </div>
  );
};
