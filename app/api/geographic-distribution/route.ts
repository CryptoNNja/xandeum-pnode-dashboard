import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get country distribution from pnodes
    const { data: pnodes, error } = await supabase
      .from("pnodes")
      .select("country, country_code")
      .not("country", "is", null);

    if (error) {
      console.error("Error fetching geographic distribution:", error);
      return NextResponse.json(
        { error: "Failed to fetch geographic distribution" },
        { status: 500 }
      );
    }

    // Normalize country names
    const normalizeCountryName = (name: string): string => {
      const normalized = name.trim();
      // Handle common variations
      if (normalized === "The Netherlands") return "Netherlands";
      if (normalized === "United States") return "United States";
      if (normalized === "United Kingdom") return "United Kingdom";
      return normalized;
    };

    // Count nodes per country (group by normalized name)
    const countryMap = new Map<string, { country: string; country_code: string; count: number }>();
    
    pnodes.forEach((node) => {
      const rawCountry = node.country || "Unknown";
      const country = normalizeCountryName(rawCountry);
      let countryCode = node.country_code || "XX";
      
      // If "The Netherlands", force NL code
      if (rawCountry === "The Netherlands") {
        countryCode = "NL";
      }
      
      if (countryMap.has(country)) {
        countryMap.get(country)!.count++;
      } else {
        countryMap.set(country, {
          country,
          country_code: countryCode,
          count: 1,
        });
      }
    });

    // Calculate percentages and prepare response
    const totalNodes = pnodes.length;
    const countries = Array.from(countryMap.values())
      .map((item) => ({
        country: item.country,
        country_code: item.country_code,
        node_count: item.count,
        percentage: (item.count / totalNodes) * 100,
      }))
      .sort((a, b) => b.node_count - a.node_count);

    return NextResponse.json({
      countries,
      total_nodes: totalNodes,
      total_countries: countries.length,
    });
  } catch (error) {
    console.error("Error in geographic-distribution API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
