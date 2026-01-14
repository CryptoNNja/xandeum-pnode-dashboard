"use client";

import { NetworkType } from "@/lib/types";
import clsx from "clsx";
import { Globe, TestTube, Layers } from "lucide-react";

interface NetworkToggleProps {
  value: NetworkType | "all";
  onChange: (network: NetworkType | "all") => void;
  className?: string;
}

/**
 * 🆕 Network Toggle Component
 * Permet de filtrer entre MAINNET, DEVNET et ALL
 */
export function NetworkToggle({ value, onChange, className }: NetworkToggleProps) {
  const options = [
    { value: "MAINNET" as const, label: "Mainnet", icon: Globe, color: "green" },
    { value: "DEVNET" as const, label: "Devnet", icon: TestTube, color: "yellow" },
    { value: "all" as const, label: "All Networks", icon: Layers, color: "blue" },
  ];

  return (
    <div className={clsx("flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg", className)}>
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = value === option.value;
        
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-md transition-all font-medium text-sm",
              "hover:bg-white dark:hover:bg-gray-700",
              isActive && "bg-white dark:bg-gray-700 shadow-sm",
              isActive && option.color === "green" && "text-green-600 dark:text-green-400",
              isActive && option.color === "yellow" && "text-yellow-600 dark:text-yellow-400",
              isActive && option.color === "blue" && "text-blue-600 dark:text-blue-400",
              !isActive && "text-gray-600 dark:text-gray-400"
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * 🆕 Network Badge Component
 * Badge visuel pour afficher le type de réseau d'un node
 */
interface NetworkBadgeProps {
  network?: NetworkType;
  confidence?: "high" | "medium" | "low";
  className?: string;
}

export function NetworkBadge({ network, confidence, className }: NetworkBadgeProps) {
  if (!network || network === "UNKNOWN") {
    return (
      <span className={clsx(
        "inline-flex items-center px-2 py-1 rounded text-xs font-medium",
        "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
        className
      )}>
        Unknown
      </span>
    );
  }

  const isMainnet = network === "MAINNET";
  
  return (
    <span className={clsx(
      "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
      isMainnet 
        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" 
        : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
      className
    )}>
      <span className={clsx(
        "w-1.5 h-1.5 rounded-full",
        isMainnet ? "bg-green-500" : "bg-yellow-500"
      )} />
      {network}
      {confidence && confidence !== "high" && (
        <span className="opacity-60 ml-1" title={`Confidence: ${confidence}`}>
          ({confidence[0]})
        </span>
      )}
    </span>
  );
}
