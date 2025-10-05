import { NextRequest, NextResponse } from "next/server";

// --- In-memory cache (kept for potential future live AQI blending) ---
interface CachedAQIEntry {
  lat: number;
  lng: number;
  value: number;
  pollutantType: string;
  location: string;
  timestamp: number; // epoch ms
}

const AQI_CACHE: Record<string, CachedAQIEntry> = {};
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_SIZE = 500; // cap

function pruneAndCollect(p: string) {
  const now = Date.now();
  return Object.values(AQI_CACHE).filter(
    (e) => now - e.timestamp <= CACHE_TTL_MS && e.pollutantType === p
  );
}

// Curated static global city list (lat/lng approximate)
const CURATED_CITIES: { location: string; lat: number; lng: number }[] = [
  { location: 'New York, USA', lat: 40.7128, lng: -74.0060 },
  { location: 'Los Angeles, USA', lat: 34.0522, lng: -118.2437 },
  { location: 'Chicago, USA', lat: 41.8781, lng: -87.6298 },
  { location: 'Houston, USA', lat: 29.7604, lng: -95.3698 },
  { location: 'Mexico City, Mexico', lat: 19.4326, lng: -99.1332 },
  { location: 'Toronto, Canada', lat: 43.6532, lng: -79.3832 },
  { location: 'Vancouver, Canada', lat: 49.2827, lng: -123.1207 },
  { location: 'São Paulo, Brazil', lat: -23.5505, lng: -46.6333 },
  { location: 'Rio de Janeiro, Brazil', lat: -22.9068, lng: -43.1729 },
  { location: 'Buenos Aires, Argentina', lat: -34.6037, lng: -58.3816 },
  { location: 'Santiago, Chile', lat: -33.4489, lng: -70.6693 },
  { location: 'Lima, Peru', lat: -12.0464, lng: -77.0428 },
  { location: 'London, UK', lat: 51.5074, lng: -0.1278 },
  { location: 'Paris, France', lat: 48.8566, lng: 2.3522 },
  { location: 'Berlin, Germany', lat: 52.52, lng: 13.405 },
  { location: 'Madrid, Spain', lat: 40.4168, lng: -3.7038 },
  { location: 'Rome, Italy', lat: 41.9028, lng: 12.4964 },
  { location: 'Amsterdam, Netherlands', lat: 52.3676, lng: 4.9041 },
  { location: 'Brussels, Belgium', lat: 50.8503, lng: 4.3517 },
  { location: 'Zurich, Switzerland', lat: 47.3769, lng: 8.5417 },
  { location: 'Vienna, Austria', lat: 48.2082, lng: 16.3738 },
  { location: 'Prague, Czech Republic', lat: 50.0755, lng: 14.4378 },
  { location: 'Warsaw, Poland', lat: 52.2297, lng: 21.0122 },
  { location: 'Stockholm, Sweden', lat: 59.3293, lng: 18.0686 },
  { location: 'Oslo, Norway', lat: 59.9139, lng: 10.7522 },
  { location: 'Helsinki, Finland', lat: 60.1699, lng: 24.9384 },
  { location: 'Copenhagen, Denmark', lat: 55.6761, lng: 12.5683 },
  { location: 'Athens, Greece', lat: 37.9838, lng: 23.7275 },
  { location: 'Istanbul, Türkiye', lat: 41.0082, lng: 28.9784 },
  { location: 'Moscow, Russia', lat: 55.7558, lng: 37.6173 },
  { location: 'Cairo, Egypt', lat: 30.0444, lng: 31.2357 },
  { location: 'Lagos, Nigeria', lat: 6.5244, lng: 3.3792 },
  { location: 'Johannesburg, South Africa', lat: -26.2041, lng: 28.0473 },
  { location: 'Nairobi, Kenya', lat: -1.2921, lng: 36.8219 },
  { location: 'Accra, Ghana', lat: 5.6037, lng: -0.1870 },
  { location: 'Addis Ababa, Ethiopia', lat: 8.9806, lng: 38.7578 },
  { location: 'Dubai, UAE', lat: 25.2048, lng: 55.2708 },
  { location: 'Riyadh, Saudi Arabia', lat: 24.7136, lng: 46.6753 },
  { location: 'Doha, Qatar', lat: 25.2854, lng: 51.5310 },
  { location: 'Mumbai, India', lat: 19.076, lng: 72.8777 },
  { location: 'Delhi, India', lat: 28.7041, lng: 77.1025 },
  { location: 'Bangalore, India', lat: 12.9716, lng: 77.5946 },
  { location: 'Karachi, Pakistan', lat: 24.8607, lng: 67.0011 },
  { location: 'Dhaka, Bangladesh', lat: 23.8103, lng: 90.4125 },
  { location: 'Bangkok, Thailand', lat: 13.7563, lng: 100.5018 },
  { location: 'Jakarta, Indonesia', lat: -6.2088, lng: 106.8456 },
  { location: 'Singapore, Singapore', lat: 1.3521, lng: 103.8198 },
  { location: 'Kuala Lumpur, Malaysia', lat: 3.139, lng: 101.6869 },
  { location: 'Manila, Philippines', lat: 14.5995, lng: 120.9842 },
  { location: 'Seoul, South Korea', lat: 37.5665, lng: 126.978 },
  { location: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503 },
  { location: 'Osaka, Japan', lat: 34.6937, lng: 135.5023 },
  { location: 'Beijing, China', lat: 39.9042, lng: 116.4074 },
  { location: 'Shanghai, China', lat: 31.2304, lng: 121.4737 },
  { location: 'Hong Kong, China', lat: 22.3193, lng: 114.1694 },
  { location: 'Taipei, Taiwan', lat: 25.033, lng: 121.5654 },
  { location: 'Sydney, Australia', lat: -33.8688, lng: 151.2093 },
  { location: 'Melbourne, Australia', lat: -37.8136, lng: 144.9631 },
  { location: 'Auckland, New Zealand', lat: -36.8485, lng: 174.7633 },
  { location: 'Wellington, New Zealand', lat: -41.2865, lng: 174.7762 },
];

function randomAQIBase(pollutant: string) {
  const base = {
    pm25: 5 + Math.random() * 90,
    pm10: 8 + Math.random() * 140,
    o3: 50 + Math.random() * 70,
    no2: 5 + Math.random() * 70,
    aqi: 20 + Math.random() * 180,
  } as const;
  return base[pollutant as keyof typeof base] ?? base.aqi;
}

function buildCuratedSet(pollutant: string, count: number) {
  const copy = [...CURATED_CITIES];
  for (let i = copy.length - 1; i > 0; i--) { // shuffle
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  const slice = copy.slice(0, Math.min(count, copy.length));
  return slice.map(c => ({
    lat: c.lat,
    lng: c.lng,
    value: randomAQIBase(pollutant),
    pollutantType: pollutant,
    location: c.location,
    timestamp: new Date().toISOString(),
  }));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pollutant = searchParams.get("pollutant") || "aqi";
    const location = searchParams.get("location");
    const random = searchParams.get("random") === "true";
    const countParam = parseInt(searchParams.get("count") || "0", 10);
    const count = isNaN(countParam) ? 25 : Math.min(Math.max(countParam, 5), 60);

    let pollutionData: any[] = [];
    let source: string;

    if (random) {
      // Static curated list sampling
      pollutionData = buildCuratedSet(pollutant, count);
      source = "curated-static";
    } else if (location) {
      pollutionData = await fetchOpenMeteoPollutionData(pollutant, location);
      source = "open-meteo";
    } else {
      // fallback dynamic (legacy usage)
      pollutionData = await generatePollutionData(pollutant, null);
      source = "dynamic-mixed";
    }

    return NextResponse.json({
      success: true,
      pollutionData,
      metadata: {
        pollutant,
        location,
        random,
        source,
        count: random ? count : undefined,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error fetching pollution data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch pollution data", pollutionData: [] },
      { status: 500 }
    );
  }
}

// generatePollutionData now only used for non-random fallback (left unchanged except removing static references)
async function generatePollutionData(pollutant: string, location?: string | null): Promise<any[]> {
  try {
    if (location) return await fetchOpenMeteoPollutionData(pollutant, location);
    return await fetchRandomGlobalAirQuality(pollutant, 20);
  } catch {
    return generateLightweightMock(pollutant, 20);
  }
}

function generateLightweightMock(pollutant: string, count: number): any[] {
  const pts: any[] = [];
  for (let i = 0; i < count; i++) {
    const lat = parseFloat(((Math.random() * 115) - 55).toFixed(3));
    const lng = parseFloat(((Math.random() * 360) - 180).toFixed(3));
    const value = randomAQIBase(pollutant);
    pts.push({
      lat,
      lng,
      value,
      pollutantType: pollutant,
      location: `Lat ${lat.toFixed(1)}, Lon ${lng.toFixed(1)}`,
      timestamp: new Date().toISOString(),
    });
  }
  return pts;
}

async function fetchRandomGlobalAirQuality(pollutant: string, count: number): Promise<any[]> {
  const fresh = pruneAndCollect(pollutant);
  if (fresh.length >= count) {
    const sh = [...fresh];
    for (let i = sh.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sh[i], sh[j]] = [sh[j], sh[i]];
    }
    return sh.slice(0, count).map((e) => ({
      lat: e.lat,
      lng: e.lng,
      value: e.value,
      pollutantType: e.pollutantType,
      location: e.location,
      timestamp: new Date(e.timestamp).toISOString(),
    }));
  }

  return generateLightweightMock(pollutant, count);
}

async function fetchOpenMeteoPollutionData(pollutant: string, location?: string): Promise<any[]> {
  try {
    let lat: number | null = null;
    let lng: number | null = null;
    let resolvedName: string | undefined = location;

    if (location) {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;
      const geoRes = await fetch(geoUrl);
      if (!geoRes.ok) throw new Error("Geocoding failed");
      const geo = await geoRes.json();
      const first = geo.results?.[0];
      if (!first) throw new Error("No geocode result");
      lat = first.latitude;
      lng = first.longitude;
      resolvedName = first.name || location;
    } else {
      lat = parseFloat(((Math.random() * 120) - 60).toFixed(3));
      lng = parseFloat(((Math.random() * 360) - 180).toFixed(3));
      resolvedName = `Lat ${lat}, Lon ${lng}`;
    }

    if (lat == null || lng == null) throw new Error("Missing coordinates");

    const hourlyVars = [
      "us_aqi",
      "pm2_5",
      "pm10",
      "ozone",
      "nitrogen_dioxide",
      "carbon_monoxide",
    ].join(",");
    const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&hourly=${hourlyVars}&current=us_aqi&timezone=UTC`;
    const aqRes = await fetch(aqUrl, { cache: "no-store" });
    if (!aqRes.ok) throw new Error("Air quality fetch failed");
    const aq = await aqRes.json();
    if (!aq.hourly || !Array.isArray(aq.hourly.time) || !aq.hourly.time.length) throw new Error("No hourly data");

    const times: string[] = aq.hourly.time;
    const now = Date.now();
    let nearestIdx = times.length - 1;
    let minDiff = Infinity;
    for (let i = 0; i < times.length; i++) {
      const t = Date.parse(times[i]);
      if (isNaN(t)) continue;
      const diff = Math.abs(t - now);
      if (diff < minDiff) {
        minDiff = diff;
        nearestIdx = i;
      }
    }

    const pick = (arr: any[] | undefined, i: number) => (arr && Array.isArray(arr) && arr[i] != null ? Number(arr[i]) : null);

    const pm25Val = pick(aq.hourly.pm2_5, nearestIdx);
    const pm10Val = pick(aq.hourly.pm10, nearestIdx);
    const usAqiVal = pick(aq.hourly.us_aqi, nearestIdx);
    const ozoneVal = pick(aq.hourly.ozone, nearestIdx);
    const no2Val = pick(aq.hourly.nitrogen_dioxide, nearestIdx);

    let computedAQI: number | null = usAqiVal;
    if (computedAQI == null) {
      const a25 = pm25Val != null ? aqiFromPM25(pm25Val) : null;
      const a10 = pm10Val != null ? aqiFromPM10(pm10Val) : null;
      if (a25 != null || a10 != null) computedAQI = Math.max(a25 ?? 0, a10 ?? 0);
    }

    const mapping: Record<string, number | null> = {
      aqi: computedAQI,
      pm25: pm25Val,
      pm10: pm10Val,
      o3: ozoneVal,
      no2: no2Val,
    };

    const baseValue = mapping[pollutant] ?? computedAQI;
    if (baseValue == null) throw new Error("No pollutant value");

    return [
      {
        lat,
        lng,
        value: baseValue,
        pollutantType: pollutant,
        location: resolvedName,
        timestamp: new Date().toISOString(),
      },
    ];
  } catch {
    return generateLightweightMock(pollutant, 10);
  }
}

function aqiFromPM25(c: number): number {
  const bps = [
    { Cl: 0, Ch: 12, Il: 0, Ih: 50 },
    { Cl: 12.1, Ch: 35.4, Il: 51, Ih: 100 },
    { Cl: 35.5, Ch: 55.4, Il: 101, Ih: 150 },
    { Cl: 55.5, Ch: 150.4, Il: 151, Ih: 200 },
    { Cl: 150.5, Ch: 250.4, Il: 201, Ih: 300 },
    { Cl: 250.5, Ch: 350.4, Il: 301, Ih: 400 },
    { Cl: 350.5, Ch: 500.4, Il: 401, Ih: 500 },
  ];
  for (const bp of bps)
    if (c >= bp.Cl && c <= bp.Ch)
      return Math.round(((bp.Ih - bp.Il) / (bp.Ch - bp.Cl)) * (c - bp.Cl) + bp.Il);
  return 500;
}
function aqiFromPM10(c: number): number {
  const bps = [
    { Cl: 0, Ch: 54, Il: 0, Ih: 50 },
    { Cl: 55, Ch: 154, Il: 51, Ih: 100 },
    { Cl: 155, Ch: 254, Il: 101, Ih: 150 },
    { Cl: 255, Ch: 354, Il: 151, Ih: 200 },
    { Cl: 355, Ch: 424, Il: 201, Ih: 300 },
    { Cl: 425, Ch: 504, Il: 301, Ih: 400 },
    { Cl: 505, Ch: 604, Il: 401, Ih: 500 },
  ];
  for (const bp of bps)
    if (c >= bp.Cl && c <= bp.Ch)
      return Math.round(((bp.Ih - bp.Il) / (bp.Ch - bp.Cl)) * (c - bp.Cl) + bp.Il);
  return 500;
}

// For future implementation with real APIs:
/*
async function fetchRealPollutionData(pollutant: string, location?: string | null) {
    // Example implementation for OpenWeatherMap Air Pollution API
    const API_KEY = process.env.OPENWEATHER_API_KEY;
    
    if (!API_KEY) {
        throw new Error("OpenWeatherMap API key not configured");
    }

    // If location is provided, geocode it first
    let coordinates = [];
    if (location) {
        const geocodeResponse = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${API_KEY}`
        );
        const geocodeData = await geocodeResponse.json();
        if (geocodeData.length > 0) {
            coordinates.push({ lat: geocodeData[0].lat, lon: geocodeData[0].lon });
        }
    }

    // Add major US cities
    const majorCities = [
        { lat: 40.7128, lon: -74.0060 }, // New York
        { lat: 34.0522, lon: -118.2437 }, // Los Angeles
        { lat: 41.8781, lon: -87.6298 }, // Chicago
        // ... more cities
    ];

    const pollutionData = [];
    
    for (const coord of [...coordinates, ...majorCities]) {
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/air_pollution?lat=${coord.lat}&lon=${coord.lon}&appid=${API_KEY}`
            );
            const data = await response.json();
            
            if (data.list && data.list.length > 0) {
                const pollution = data.list[0];
                pollutionData.push({
                    lat: coord.lat,
                    lng: coord.lon,
                    value: pollution.components[pollutant] || pollution.main.aqi,
                    pollutantType: pollutant,
                    timestamp: new Date(pollution.dt * 1000).toISOString(),
                });
            }
        } catch (error) {
            console.error(`Error fetching pollution data for ${coord.lat}, ${coord.lon}:`, error);
        }
    }

    return pollutionData;
}
*/