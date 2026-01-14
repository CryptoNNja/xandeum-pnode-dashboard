"use client";

import { Globe, TestTube } from "lucide-react";
import clsx from "clsx";

type NetworkType = "MAINNET" | "DEVNET";
type BadgeSize = "xs" | "sm" | "md";

interface NetworkBadgeProps {
  network: NetworkType;
  count?: number;
  size?: BadgeSize;
  className?: string;
  showIcon?: boolean;
}

const NETWORK_CONFIG = {
  MAINNET: {
    label: "Mainnet",
    icon: Globe,
    colors: {
      light: "bg-green-100 text-green-700 border-green-200",
      dark: "dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50",
    },
  },
  DEVNET: {
    label: "Devnet",
    icon: TestTube,
    colors: {
      light: "bg-yellow-100 text-yellow-700 border-yellow-200",
      dark: "dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/50",
    },
  },
};

const SIZE_CLASSES = {
  xs: "text-[10px] px-1.5 py-0.5 gap-1",
  sm: "text-xs px-2 py-1 gap-1.5",
  md: "text-sm px-3 py-1.5 gap-2",
};

const ICON_SIZES = {
  xs: "w-2.5 h-2.5",
  sm: "w-3 h-3",
  md: "w-3.5 h-3.5",
};

export function NetworkBadge({
  network,
  count,
  size = "sm",
  className,
  showIcon = true,
}: NetworkBadgeProps) {
  const config = NETWORK_CONFIG[network];
  const Icon = config.icon;

  return (
    <div
      className={clsx(
        "inline-flex items-center font-medium rounded-md border uppercase tracking-wider transition-all",
        config.colors.light,
        config.colors.dark,
        SIZE_CLASSES[size],
        className
      )}
    >
      {showIcon && <Icon className={ICON_SIZES[size]} strokeWidth={2.5} />}
      <span>{config.label}</span>
      {count !== undefined && (
        <span className="font-bold ml-0.5">
          {count}
        </span>
      )}
    </div>
  );
}
