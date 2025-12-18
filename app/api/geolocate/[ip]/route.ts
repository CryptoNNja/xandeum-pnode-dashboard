import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const isValidIp = (ip: string) => {
  // Accept IPv4 and (basic) IPv6 forms.
  return /^[0-9a-fA-F:.]+$/.test(ip) && ip.length <= 64;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Geolocation response type
type GeoData = {
  success: boolean;
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
  country_code?: string;
  message?: string;
};

// Provider 1: ipwho.is (HTTPS, higher quality, but has monthly limits)
async function fetchFromIpWhois(ip: string): Promise<GeoData> {
  const url = `https://ipwho.is/${encodeURIComponent(ip)}?fields=success,latitude,longitude,city,country,country_code,message`;
  
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "user-agent": "xandeum-dashboard/1.0",
      accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`ipwho.is HTTP ${res.status}`);
  }

  const data = await res.json();
  
  // Check for rate limit message
  if (data.message && data.message.toLowerCase().includes("limit")) {
    throw new Error("Rate limited");
  }

  return {
    success: Boolean(data.success),
    latitude: data.latitude,
    longitude: data.longitude,
    city: data.city,
    country: data.country,
    country_code: data.country_code,
    message: data.message,
  };
}

// Provider 2: ip-api.com (HTTP, unlimited 45req/min, fallback)
async function fetchFromIpApi(ip: string): Promise<GeoData> {
  const url = `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,countryCode,city,lat,lon`;
  
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "user-agent": "xandeum-dashboard/1.0",
      accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`ip-api.com HTTP ${res.status}`);
  }

  const data = await res.json();

  // ip-api.com uses "status": "success" instead of "success": true
  const isSuccess = data.status === "success";

  return {
    success: isSuccess,
    latitude: data.lat,
    longitude: data.lon,
    city: data.city,
    country: data.country,
    country_code: data.countryCode,
    message: isSuccess ? undefined : data.message,
  };
}

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

  let geoData: GeoData;

  try {
    // Try ipwho.is first (better quality, HTTPS)
    geoData = await fetchFromIpWhois(ip);
    
    // If ipwho.is failed or hit rate limit, try fallback
    if (!geoData.success) {
      console.log(`[Geolocate] ipwho.is failed for ${ip}, trying ip-api.com...`);
      geoData = await fetchFromIpApi(ip);
    }
  } catch (primaryError) {
    // Primary provider failed, try fallback
    console.log(`[Geolocate] ipwho.is error for ${ip}: ${primaryError}, trying ip-api.com...`);
    try {
      geoData = await fetchFromIpApi(ip);
    } catch (fallbackError) {
      // Both providers failed
      console.error(`[Geolocate] Both providers failed for ${ip}`);
      return NextResponse.json(
        {
          success: false,
          error: "All geolocation providers failed",
          message: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
        },
        { status: 502 }
      );
    }
  }

  // Save geolocation data to database if successful
  if (geoData.success && geoData.latitude && geoData.longitude) {
    try {
      const { data: updateData, error: updateError } = await supabase
        .from("pnodes")
        .update({
          lat: geoData.latitude,
          lng: geoData.longitude,
          city: geoData.city || null,
          country: geoData.country || null,
          country_code: geoData.country_code || null,
        })
        .eq("ip", ip)
        .select();
      
      if (updateError) {
        console.error(`[Geolocate] Supabase update error for ${ip}:`, updateError);
      } else {
        console.log(`[Geolocate] Saved to DB for ${ip}:`, updateData?.length ? 'OK' : 'No rows updated');
      }
    } catch (dbError) {
      console.error("[Geolocate] Failed to save geolocation to DB:", dbError);
    }
  }

  return NextResponse.json(
    {
      success: geoData.success,
      latitude: geoData.latitude,
      longitude: geoData.longitude,
      city: geoData.city,
      country: geoData.country,
      country_code: geoData.country_code,
      message: geoData.message,
    },
    { status: 200 }
  );
}
