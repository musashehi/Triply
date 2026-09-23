import { NextRequest, NextResponse } from "next/server";

type GeocodeResult = {
  lat: string;
  lon: string;
  display_name: string;
  [key: string]: unknown;
};

const cache = new Map<string, GeocodeResult[]>();

let lastRequestTime = 0;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query?.trim()) {
    return NextResponse.json(
      { error: "Search query is required." },
      { status: 400 }
    );
  }

  const cleanQuery = query.trim();
  const cacheKey = cleanQuery.toLowerCase();
  if (cache.has(cacheKey)) {
    return NextResponse.json(cache.get(cacheKey));
  }

  try {
   
    const now = Date.now();
    const elapsed = now - lastRequestTime;

    if (elapsed < 1200) {
      await wait(1200 - elapsed);
    }

    const url = new URL(
      "https://nominatim.openstreetmap.org/search"
    );

    url.searchParams.set("q", cleanQuery);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("addressdetails", "1");

    lastRequestTime = Date.now();

    let response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Triply-AI-Travel-Planner/1.0 (student project)",
        "Accept-Language": "en",
      },
      cache: "no-store",
    });

    
    if (response.status === 429) {
      console.warn(
        `Nominatim rate limit for: ${cleanQuery}. Retrying...`
      );

      await wait(3000);

      lastRequestTime = Date.now();

      response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent":
            "Triply-AI-Travel-Planner/1.0 (student project)",
          "Accept-Language": "en",
        },
        cache: "no-store",
      });
    }

    if (!response.ok) {
      console.warn(
        `Nominatim failed for "${cleanQuery}": ${response.status}`
      );

      return NextResponse.json([], { status: 200 });
    }

    const data: GeocodeResult[] = await response.json();
    cache.set(cacheKey, data);

    return NextResponse.json(data);
  } catch (error) {
    console.warn(
      `Geocoding failed for "${cleanQuery}":`,
      error
    );

    
    return NextResponse.json([], { status: 200 });
  }
}