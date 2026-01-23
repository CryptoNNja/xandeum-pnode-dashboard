import type { PNode } from "./types";
import { normalizeVersionLabel } from "./versioning";

type Severity = "latest" | "warning" | "critical" | "other";

interface VersionBucketDefinition {
  id: string;
  label: string;
  shortLabel: string;
  subtitle: string;
  color: string;
  severity: Severity;
}

export interface VersionBucketDetail {
  label: string;
  count: number;
  percentageOfBucket: number;
}

export interface VersionBucketSummary extends VersionBucketDefinition {
  count: number;
  percentage: number;
  details: VersionBucketDetail[];
}

export interface NetworkHealthSummary {
  label: string;
  tone: "excellent" | "good" | "warning" | "critical";
  color: string;
  description: string;
}

export interface VersionOverview {
  total: number;
  buckets: VersionBucketSummary[];
  latestPercentage: number;
  health: NetworkHealthSummary;
  defaultBucketId: string;
}

const extractMajorVersion = (normalized?: string | null): string | null => {
  if (!normalized) return null;
  const match = normalized.match(/^v(\d+)\.(\d+)/i);
  if (!match) return null;
  return `v${match[1]}.${match[2]}`;
};

// Parse version string to comparable number (e.g., "v0.8" -> 0.8)
const parseVersionNumber = (version: string): number => {
  const match = version.match(/^v(\d+)\.(\d+)/i);
  if (!match) return 0;
  return parseFloat(`${match[1]}.${match[2]}`);
};

// Version name mapping
const VERSION_NAMES: Record<string, string> = {
  "v0.4": "Herrenberg",
  "v0.5": "Ingolstadt",
  "v0.6": "Stuttgart",
  "v0.7": "Heidelberg",
  "v0.8": "Quantum", // New version
};

const formatHealth = (
  latestPercentage: number,
  latestLabel: string
): NetworkHealthSummary => {
  if (latestPercentage >= 90) {
    return {
      label: "⚡ Excellent",
      tone: "excellent",
      color: "#10B981",
      description: `${latestPercentage.toFixed(
        0
      )}% of nodes run ${latestLabel}`,
    };
  }
  if (latestPercentage >= 70) {
    return {
      label: "✅ Good",
      tone: "good",
      color: "#22D3EE",
      description: `${latestPercentage.toFixed(
        0
      )}% on ${latestLabel}. Upgrades advised soon`,
    };
  }
  if (latestPercentage >= 50) {
    return {
      label: "⚠️ Warning",
      tone: "warning",
      color: "#F59E0B",
      description: `${latestPercentage.toFixed(
        0
      )}% on ${latestLabel}. Push network updates`,
    };
  }
  return {
    label: "🔴 Critical",
    tone: "critical",
    color: "#EF4444",
    description: `Only ${latestPercentage.toFixed(
      0
    )}% on ${latestLabel}. Immediate action required`,
  };
};

export function computeVersionOverview(pnodes: PNode[]): VersionOverview {
  const total = pnodes.length;
  const bucketCounts = new Map<string, number>();
  const bucketDetails = new Map<string, Map<string, number>>();

  const registerDetail = (bucketId: string, label: string) => {
    if (!bucketDetails.has(bucketId)) {
      bucketDetails.set(bucketId, new Map());
    }
    const map = bucketDetails.get(bucketId)!;
    map.set(label, (map.get(label) ?? 0) + 1);
  };

  // First pass: collect all versions
  pnodes.forEach((node) => {
    const normalized = normalizeVersionLabel(node.version);
    const major = extractMajorVersion(normalized);
    const bucketId = major || "other";

    const detailLabel =
      bucketId === "other"
        ? node.node_type !== "public"
          ? "Private (Hidden)"
          : node.version?.trim() && node.version.trim().length > 0
          ? node.version.trim()
          : normalized ?? "Unverified Build"
        : normalized ?? "Unreported";

    bucketCounts.set(bucketId, (bucketCounts.get(bucketId) ?? 0) + 1);
    registerDetail(bucketId, detailLabel);
  });

  // Get all detected versions (excluding "other")
  const detectedVersions = Array.from(bucketCounts.keys())
    .filter((id) => id !== "other")
    .sort((a, b) => {
      // Sort by version number descending (newest first)
      return parseVersionNumber(b) - parseVersionNumber(a);
    });

  // Create bucket definitions dynamically
  const versionBucketDefs: VersionBucketDefinition[] = detectedVersions.map((versionId, index) => {
    const versionName = VERSION_NAMES[versionId] || "";
    const shortLabel = versionId;
    const label = versionName ? `${versionId} ${versionName}` : versionId;

    // Determine severity and color based on position
    let severity: Severity;
    let color: string;
    let subtitle: string;

    if (index === 0) {
      // Latest version
      severity = "latest";
      color = "#10B981"; // Green
      subtitle = "Latest release";
    } else if (index === 1) {
      // One version behind
      severity = "warning";
      color = "#F59E0B"; // Orange
      subtitle = "Update recommended";
    } else {
      // Older versions
      severity = "critical";
      color = "#EF4444"; // Red
      subtitle = index === 2 ? "Critical – upgrade now" : "End of support";
    }

    return {
      id: versionId,
      label,
      shortLabel,
      subtitle,
      color,
      severity,
    };
  });

  // Add "other" bucket if it has nodes
  if (bucketCounts.has("other") && (bucketCounts.get("other") ?? 0) > 0) {
    versionBucketDefs.push({
      id: "other",
      label: "Other / Unknown",
      shortLabel: "Other",
      subtitle: "Private or unverified",
      color: "#6B7280",
      severity: "other",
    });
  }

  // Build bucket summaries - ONLY for versions with count > 0
  const buckets: VersionBucketSummary[] = versionBucketDefs
    .map((definition) => {
      const count = bucketCounts.get(definition.id) ?? 0;
      const percentage = total === 0 ? 0 : (count / total) * 100;
      const detailEntries = bucketDetails.get(definition.id);
      const details: VersionBucketDetail[] = detailEntries
        ? Array.from(detailEntries.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([label, detailCount]) => ({
              label,
              count: detailCount,
              percentageOfBucket: count === 0 ? 0 : (detailCount / count) * 100,
            }))
        : [];

      return {
        ...definition,
        count,
        percentage,
        details,
      };
    })
    .filter((bucket) => bucket.count > 0); // Filter out empty versions

  // Find latest bucket (first non-other bucket with count > 0)
  const latestBucket = buckets.find((bucket) => bucket.severity === "latest");
  const latestPercentage = latestBucket?.percentage ?? 0;
  const health = formatHealth(
    latestPercentage,
    latestBucket?.shortLabel ?? "latest"
  );

  const defaultBucketId = buckets[0]?.id ?? "other";

  return {
    total,
    buckets,
    latestPercentage,
    health,
    defaultBucketId,
  };
}
