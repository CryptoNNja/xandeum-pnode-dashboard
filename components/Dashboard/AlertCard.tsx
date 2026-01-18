"use client";

import { AlertCircle, AlertTriangle, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import type { Alert } from "@/types/alerts";

type AlertCardProps = {
  alert: Alert;
  isLight: boolean;
  onClose: () => void;
};

export const AlertCard = ({ alert, isLight, onClose }: AlertCardProps) => {
  const router = useRouter();

  const handleClick = () => {
    if (alert.ip) {
      onClose(); // Close modal first for better UX
      router.push(`/pnode/${alert.ip}`);
    }
  };

  const isCritical = alert.severity === "critical";
  const hasIp = Boolean(alert.ip);

  return (
    <div
      onClick={hasIp ? handleClick : undefined}
      className={clsx(
        "p-4 rounded-xl border transition-all duration-200",
        hasIp && "cursor-pointer group",
        !hasIp && "cursor-default opacity-60",
        isCritical
          ? hasIp
            ? "bg-red-500/5 border-red-500/20 hover:border-red-500/40 hover:bg-red-500/10"
            : "bg-red-500/5 border-red-500/20"
          : hasIp
            ? "bg-orange-500/5 border-orange-500/20 hover:border-orange-500/40 hover:bg-orange-500/10"
            : "bg-orange-500/5 border-orange-500/20"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          {isCritical ? (
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-text-main group-hover:text-accent transition-colors">
              {alert.type}
            </p>
            <p className="text-xs text-text-soft mt-0.5">
              Node: <span className="font-mono">{alert.ip}</span>
            </p>
            <p className="text-xs text-text-main mt-2 break-words">{alert.message}</p>
          </div>
        </div>
        <div className="text-right flex flex-col items-end gap-2 shrink-0">
          <span
            className={clsx(
              "text-xs font-mono font-bold px-2 py-1 rounded whitespace-nowrap",
              isCritical ? "bg-red-500/20 text-red-500" : "bg-orange-500/20 text-orange-500"
            )}
          >
            {alert.value}
          </span>
          {hasIp && (
            <ChevronRight className="w-4 h-4 text-text-faint group-hover:text-text-main transition-all translate-x-0 group-hover:translate-x-1" />
          )}
        </div>
      </div>
    </div>
  );
};
