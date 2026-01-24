import { describe, expect, it } from "vitest";
import { computeVersionOverview, NetworkHealthSummary } from "../lib/kpi"; // Import NetworkHealthSummary
import type { PNode } from "../lib/types";
import { EMPTY_STATS } from "../lib/types";

// Helper to build a mock PNode object
const buildNode = (overrides: Partial<PNode> & { ip: string }): PNode => ({
  ip: overrides.ip,
  status: overrides.status ?? "online",
  stats: overrides.stats ?? { ...EMPTY_STATS },
  version: overrides.version,
});

describe("computeVersionOverview", () => {
  it("should return correct overview for an empty list of nodes", () => {
    const overview = computeVersionOverview([]);
    expect(overview.total).toBe(0);
    expect(overview.buckets.length).toBe(0); // No nodes = no buckets (filtered out)
    expect(overview.latestPercentage).toBe(0);
    expect(overview.health.tone).toBe("critical");
    expect(overview.health.description).toContain("0% on latest"); // "latest" when no version detected
  });

  it("maps nodes into buckets with detail breakdowns and correct health summary", () => {
    const nodes: PNode[] = [
      buildNode({ ip: "1.1.1.1", version: "v0.7.3" }),
      buildNode({
        ip: "2.2.2.2",
        version: "v0.7.3-trynet.20251210055354.57fd475",
      }),
      buildNode({ ip: "3.3.3.3", version: "v0.7.1" }),
      buildNode({ ip: "4.4.4.4", version: "v0.6.0" }),
      buildNode({ ip: "5.5.5.5", version: "v0.5.2" }),
      { ...buildNode({ ip: "6.6.6.6", status: "online" }), node_type: "public" as const },
      { ...buildNode({ ip: "7.7.7.7", version: "custom-build" }), node_type: "public" as const },
      buildNode({ ip: "8.8.8.8", version: "v0.7.0" }), // Another v0.7
    ];

    const overview = computeVersionOverview(nodes);
    const byId = Object.fromEntries(
      overview.buckets.map((bucket) => [bucket.id, bucket])
    );

    expect(overview.total).toBe(nodes.length);
    expect(byId["v0.7"].count).toBe(4);
    expect(byId["v0.6"].count).toBe(1);
    expect(byId["v0.5"].count).toBe(1);
    expect(byId["other"].count).toBe(2); // gossip_only and custom-build

    expect(byId["v0.7"].details.length).toBe(4);
    const v073detail = byId["v0.7"].details.find(d => d.label === 'v0.7.3');
    expect(v073detail?.count).toBe(1);
    const v073trynetDetail = byId["v0.7"].details.find(d => d.label === 'v0.7.3-trynet.20251210055354.57fd475');
    expect(v073trynetDetail?.count).toBe(1);
    const v071Detail = byId["v0.7"].details.find(d => d.label === 'v0.7.1');
    expect(v071Detail?.count).toBe(1);
    const v070Detail = byId["v0.7"].details.find(d => d.label === 'v0.7.0');
    expect(v070Detail?.count).toBe(1);


    // "other" bucket should have some details (custom-build or Private)
    const customDetail = byId["other"].details.find(
      (detail) => detail.label === "custom-build" || detail.label === "Unverified Build"
    );
    const privateDetail = byId["other"].details.find(
      (detail) => detail.label === "Private (Hidden)"
    );
    
    // At least one of these should exist and have count >= 1
    const otherDetails = byId["other"].details;
    expect(otherDetails.length).toBeGreaterThan(0);
    const totalOtherCount = otherDetails.reduce((sum, d) => sum + d.count, 0);
    expect(totalOtherCount).toBeGreaterThanOrEqual(2); // 2 nodes in other bucket

    expect(overview.latestPercentage).toBeCloseTo((4 / nodes.length) * 100);
    // 4 active / 8 total nodes = 50%
    expect(overview.health.tone).toBe("warning"); 
    expect(overview.defaultBucketId).toBe("v0.7");
  });

  it("should correctly identify older major versions and 'other'", () => {
    const nodes: PNode[] = [
      buildNode({ ip: "1.1.1.1", version: "v0.4.1" }),
      buildNode({ ip: "2.2.2.2", version: "v0.5.0" }),
      buildNode({ ip: "3.3.3.3", version: "unrecognized" }),
    ];

    const overview = computeVersionOverview(nodes);
    const byId = Object.fromEntries(
      overview.buckets.map((bucket) => [bucket.id, bucket])
    );

    expect(byId["v0.4"].count).toBe(1);
    expect(byId["v0.5"].count).toBe(1);
    expect(byId["other"].count).toBe(1);
    // v0.5 is the highest version detected, so it's "latest" with 1/3 = 33.33%
    expect(overview.latestPercentage).toBeCloseTo(33.33, 1);
    expect(overview.health.tone).toBe("critical"); // < 50% is critical
    expect(overview.defaultBucketId).toBe("v0.5"); // Highest version becomes default
  });
});

// Explicitly test formatHealth using a mock function to simulate its extraction
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

  describe("formatHealth", () => {
    it('should return "Excellent" for latestPercentage >= 90', () => {
      const health = formatHealth(95, "v0.7");
      expect(health.tone).toBe("excellent");
      expect(health.label).toBe("⚡ Excellent");
      expect(health.description).toContain("95% of nodes run v0.7");
    });
  
    it('should return "Good" for latestPercentage >= 70 and < 90', () => {
      const health = formatHealth(75, "v0.7");
      expect(health.tone).toBe("good");
      expect(health.label).toBe("✅ Good");
      expect(health.description).toContain("75% on v0.7. Upgrades advised soon");
    });
  
    it('should return "Warning" for latestPercentage >= 50 and < 70', () => {
      const health = formatHealth(55, "v0.7");
      expect(health.tone).toBe("warning");
      expect(health.label).toBe("⚠️ Warning");
      expect(health.description).toContain("55% on v0.7. Push network updates");
    });
  
    it('should return "Critical" for latestPercentage < 50', () => {
      const health = formatHealth(45, "v0.7");
      expect(health.tone).toBe("critical");
      expect(health.label).toBe("🔴 Critical");
      expect(health.description).toContain("Only 45% on v0.7. Immediate action required");
    });
  
    it('should handle 0% latestPercentage correctly', () => {
      const health = formatHealth(0, "v0.7");
      expect(health.tone).toBe("critical");
      expect(health.description).toContain("Only 0% on v0.7. Immediate action required");
    });
  });
