import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const isValidIp = (ip: string) => {
  // Accept IPv4 and (basic) IPv6 forms.
  // This is intentionally permissive; upstream will reject invalid values.
  return /^[0-9a-fA-F:.]+$/.test(ip) && ip.length <= 64;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  _request: Request,
  context: { params: Promise<{ ip: string }> }
) {
  const { ip } = await context.params;

  if (!isValidIp(ip)) {
    return NextResponse.json(
      { success: false, error: "Invalid IP" },
      { status: 400 }
    );
  }

  const url = `https://ipwho.is/${encodeURIComponent(
    ip
  )}?fields=success,latitude,longitude,city,country,message`;

  try {
    const res = await fetch(url, {
      // Avoid caching surprises during dev.
      cache: "no-store",
      headers: {
        "user-agent": "xandeum-dashboard/1.0 (+nextjs)",
        accept: "application/json",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Upstream HTTP ${res.status}` },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      success?: boolean;
      latitude?: number;
      longitude?: number;
      city?: string;
      country?: string;
      country_code?: string;
      message?: string;
    };

    // Save geolocation data to database if successful
    if (data.success && data.latitude && data.longitude) {
      try {
        await supabase
          .from("pnodes")
          .update({
            lat: data.latitude,
            lng: data.longitude,
            city: data.city || null,
            country: data.country || null,
            country_code: data.country_code || null,
          })
          .eq("ip", ip);
      } catch (dbError) {
        // Log error but don't fail the request
        console.error("Failed to save geolocation to DB:", dbError);
      }
    }

    return NextResponse.json(
      {
        success: Boolean(data.success),
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city,
        country: data.country,
        country_code: data.country_code,
        message: data.message,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 502 }
    );
  }
}
