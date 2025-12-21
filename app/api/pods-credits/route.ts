import { NextResponse } from "next/server";

export const revalidate = 300; // Cache for 5 minutes

interface PodCredit {
  pod_id: string;
  credits: number;
}

interface PodsCreditsResponse {
  pods_credits: PodCredit[];
  status: string;
}

export async function GET() {
  try {
    const response = await fetch(
      "https://podcredits.xandeum.network/api/pods-credits",
      {
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch credits: ${response.status}`);
    }

    const data: PodsCreditsResponse = await response.json();

    if (data.status !== "success" || !data.pods_credits) {
      throw new Error("Invalid response from credits API");
    }

    // Calculate statistics
    const allPods = data.pods_credits;
    const podsWithCredits = allPods.filter((p) => p.credits > 0);
    const totalCredits = allPods.reduce((sum, p) => sum + p.credits, 0);

    // Sort by credits descending
    const sortedPods = [...allPods].sort((a, b) => b.credits - a.credits);

    // Calculate distribution buckets
    const buckets = [
      { min: 40000, max: Infinity, label: "40K+", count: 0 },
      { min: 30000, max: 40000, label: "30-40K", count: 0 },
      { min: 20000, max: 30000, label: "20-30K", count: 0 },
      { min: 10000, max: 20000, label: "10-20K", count: 0 },
      { min: 1, max: 10000, label: "1-10K", count: 0 },
      { min: 0, max: 1, label: "0 (Inactive)", count: 0 },
    ];

    allPods.forEach((pod) => {
      const bucket = buckets.find(
        (b) => pod.credits >= b.min && pod.credits < b.max
      );
      if (bucket) bucket.count++;
    });

    // Calculate median
    const sortedCredits = [...allPods]
      .map((p) => p.credits)
      .sort((a, b) => a - b);
    const median =
      sortedCredits.length % 2 === 0
        ? (sortedCredits[sortedCredits.length / 2 - 1] +
            sortedCredits[sortedCredits.length / 2]) /
          2
        : sortedCredits[Math.floor(sortedCredits.length / 2)];

    return NextResponse.json({
      totalPods: allPods.length,
      podsEarning: podsWithCredits.length,
      podsInactive: allPods.length - podsWithCredits.length,
      participationRate:
        allPods.length > 0
          ? (podsWithCredits.length / allPods.length) * 100
          : 0,
      totalCredits,
      avgCredits:
        podsWithCredits.length > 0
          ? totalCredits / podsWithCredits.length
          : 0,
      medianCredits: median,
      topEarners: sortedPods.slice(0, 10), // Top 10 for the card preview
      allPods: sortedPods, // All pods for the full leaderboard
      distribution: buckets,
    });
  } catch (error) {
    console.error("Error fetching pods credits:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch credits data",
      },
      { status: 500 }
    );
  }
}
