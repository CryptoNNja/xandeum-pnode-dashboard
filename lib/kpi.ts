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

const VERSION_BUCKET_DEFINITIONS: VersionBucketDefinition[] = [
  {
    id: "v0.7",
    label: "v0.7 Heidelberg",
    shortLabel: "v0.7",
    subtitle: "Latest release",
    color: "#10B981",
    severity: "latest",
  },
  {
    id: "v0.6",
    label: "v0.6 Stuttgart",
    shortLabel: "v0.6",
    subtitle: "Update recommended",
    color: "#F59E0B",
    severity: "warning",
  },
  {
    id: "v0.5",
    label: "v0.5 Ingolstadt",
    shortLabel: "v0.5",
    subtitle: "Critical – upgrade now",
    color: "#EF4444",
    severity: "critical",
  },
  {
    id: "v0.4",
    label: "v0.4 Herrenberg",
    shortLabel: "v0.4",
    subtitle: "End of support",
    color: "#EF4444",
    severity: "critical",
  },
  {
    id: "other",
    label: "Other / Unknown",
    shortLabel: "Other",
    subtitle: "Private or unverified",
    color: "#6B7280",
    severity: "other",
  },
];

const KNOWN_MAJOR_IDS = new Set(
  VERSION_BUCKET_DEFINITIONS.filter((def) => def.id !== "other").map(
    (def) => def.id
  )
);

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
  const match = normalized.match(/^v\d+\.\d+/i);
  if (!match) return null;
  return match[0].toLowerCase();
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

  pnodes.forEach((node) => {
    const normalized = normalizeVersionLabel(node.version);
    const major = extractMajorVersion(normalized);
    const bucketId = major && KNOWN_MAJOR_IDS.has(major) ? major : "other";

    const detailLabel =
      bucketId === "other"
        ? node.status !== "active"
          ? "Private (Hidden)"
          : node.version?.trim() && node.version.trim().length > 0
          ? node.version.trim()
          : normalized ?? "Unverified Build"
        : normalized ?? "Unreported";

    bucketCounts.set(bucketId, (bucketCounts.get(bucketId) ?? 0) + 1);
    registerDetail(bucketId, detailLabel);
  });

  const buckets: VersionBucketSummary[] = VERSION_BUCKET_DEFINITIONS.map(
    (definition) => {
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
    }
  );

  const latestBucketId = VERSION_BUCKET_DEFINITIONS[0].id;
  const latestBucket = buckets.find((bucket) => bucket.id === latestBucketId);
  const latestPercentage = latestBucket?.percentage ?? 0;
  const health = formatHealth(
    latestPercentage,
    latestBucket?.shortLabel ?? "latest"
  );

  const defaultBucketId =
    buckets.find((bucket) => bucket.count > 0)?.id ?? latestBucketId;

  return {
    total,
    buckets,
    latestPercentage,
    health,
    defaultBucketId,
  };
}
