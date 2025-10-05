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

// Curated static list of all 50 US state capitals for comprehensive coverage
const CURATED_CITIES: { location: string; lat: number; lng: number }[] = [
    // All 50 US State Capitals
    { location: "Montgomery, Alabama", lat: 32.361538, lng: -86.279118 },
    { location: "Juneau, Alaska", lat: 58.301935, lng: -134.419740 },
    { location: "Phoenix, Arizona", lat: 33.448457, lng: -112.073844 },
    { location: "Little Rock, Arkansas", lat: 34.736009, lng: -92.331122 },
    { location: "Sacramento, California", lat: 38.576668, lng: -121.493629 },
    { location: "Denver, Colorado", lat: 39.739236, lng: -104.990251 },
    { location: "Hartford, Connecticut", lat: 41.767, lng: -72.677 },
    { location: "Dover, Delaware", lat: 39.161921, lng: -75.526755 },
    { location: "Tallahassee, Florida", lat: 30.4518, lng: -84.27277 },
    { location: "Atlanta, Georgia", lat: 33.76, lng: -84.39 },
    { location: "Honolulu, Hawaii", lat: 21.30895, lng: -157.826182 },
    { location: "Boise, Idaho", lat: 43.613739, lng: -116.237651 },
    { location: "Springfield, Illinois", lat: 39.78325, lng: -89.650373 },
    { location: "Indianapolis, Indiana", lat: 39.790942, lng: -86.147685 },
    { location: "Des Moines, Iowa", lat: 41.590939, lng: -93.620866 },
    { location: "Topeka, Kansas", lat: 39.04, lng: -95.69 },
    { location: "Frankfort, Kentucky", lat: 38.197274, lng: -84.86311 },
    { location: "Baton Rouge, Louisiana", lat: 30.45809, lng: -91.140229 },
    { location: "Augusta, Maine", lat: 44.323535, lng: -69.765261 },
    { location: "Annapolis, Maryland", lat: 38.972945, lng: -76.501157 },
    { location: "Boston, Massachusetts", lat: 42.2352, lng: -71.0275 },
    { location: "Lansing, Michigan", lat: 42.354558, lng: -84.955255 },
    { location: "Saint Paul, Minnesota", lat: 44.95, lng: -93.094 },
    { location: "Jackson, Mississippi", lat: 32.320, lng: -90.207 },
    { location: "Jefferson City, Missouri", lat: 38.572954, lng: -92.189283 },
    { location: "Helena, Montana", lat: 46.595805, lng: -112.027031 },
    { location: "Lincoln, Nebraska", lat: 40.809868, lng: -96.675345 },
    { location: "Carson City, Nevada", lat: 39.161921, lng: -119.767403 },
    { location: "Concord, New Hampshire", lat: 43.220093, lng: -71.549896 },
    { location: "Trenton, New Jersey", lat: 40.221741, lng: -74.756138 },
    { location: "Santa Fe, New Mexico", lat: 35.667231, lng: -105.964575 },
    { location: "Albany, New York", lat: 42.659829, lng: -73.781339 },
    { location: "Raleigh, North Carolina", lat: 35.771, lng: -78.638 },
    { location: "Bismarck, North Dakota", lat: 46.813343, lng: -100.779004 },
    { location: "Columbus, Ohio", lat: 39.961176, lng: -82.998794 },
    { location: "Oklahoma City, Oklahoma", lat: 35.482309, lng: -97.534994 },
    { location: "Salem, Oregon", lat: 44.931109, lng: -123.029159 },
    { location: "Harrisburg, Pennsylvania", lat: 40.269789, lng: -76.875613 },
    { location: "Providence, Rhode Island", lat: 41.82355, lng: -71.422132 },
    { location: "Columbia, South Carolina", lat: 34.000, lng: -81.035 },
    { location: "Pierre, South Dakota", lat: 44.367966, lng: -100.336378 },
    { location: "Nashville, Tennessee", lat: 36.165, lng: -86.784 },
    { location: "Austin, Texas", lat: 30.266667, lng: -97.75 },
    { location: "Salt Lake City, Utah", lat: 40.777477, lng: -111.888237 },
    { location: "Montpelier, Vermont", lat: 44.26639, lng: -72.580536 },
    { location: "Richmond, Virginia", lat: 37.54, lng: -77.46 },
    { location: "Olympia, Washington", lat: 47.042418, lng: -122.893077 },
    { location: "Charleston, West Virginia", lat: 38.349497, lng: -81.633294 },
    { location: "Madison, Wisconsin", lat: 43.074722, lng: -89.384444 },
    { location: "Cheyenne, Wyoming", lat: 41.145548, lng: -104.802042 },
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
    for (let i = copy.length - 1; i > 0; i--) {
        // shuffle
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    const slice = copy.slice(0, Math.min(count, copy.length));
    return slice.map((c) => ({
        lat: c.lat,
        lng: c.lng,
        value: randomAQIBase(pollutant),
        pollutantType: pollutant,
        location: c.location,
        timestamp: new Date().toISOString(),
    }));
}

// US State Capitals with coordinates
const US_STATE_CAPITALS = [
    { name: "Montgomery, Alabama", lat: 32.361538, lng: -86.279118 },
    { name: "Juneau, Alaska", lat: 58.301935, lng: -134.41974 },
    { name: "Phoenix, Arizona", lat: 33.448457, lng: -112.073844 },
    { name: "Little Rock, Arkansas", lat: 34.736009, lng: -92.331122 },
    { name: "Sacramento, California", lat: 38.576668, lng: -121.493629 },
    { name: "Denver, Colorado", lat: 39.739236, lng: -104.990251 },
    { name: "Hartford, Connecticut", lat: 41.767, lng: -72.677 },
    { name: "Dover, Delaware", lat: 39.161921, lng: -75.526755 },
    { name: "Tallahassee, Florida", lat: 30.4518, lng: -84.27277 },
    { name: "Atlanta, Georgia", lat: 33.76, lng: -84.39 },
    { name: "Honolulu, Hawaii", lat: 21.30895, lng: -157.826182 },
    { name: "Boise, Idaho", lat: 43.613739, lng: -116.237651 },
    { name: "Springfield, Illinois", lat: 39.78325, lng: -89.650373 },
    { name: "Indianapolis, Indiana", lat: 39.790942, lng: -86.147685 },
    { name: "Des Moines, Iowa", lat: 41.590939, lng: -93.620866 },
    { name: "Topeka, Kansas", lat: 39.04, lng: -95.69 },
    { name: "Frankfort, Kentucky", lat: 38.194, lng: -84.86311 },
    { name: "Baton Rouge, Louisiana", lat: 30.45809, lng: -91.140229 },
    { name: "Augusta, Maine", lat: 44.323535, lng: -69.765261 },
    { name: "Annapolis, Maryland", lat: 38.972945, lng: -76.501157 },
    { name: "Boston, Massachusetts", lat: 42.2352, lng: -71.0275 },
    { name: "Lansing, Michigan", lat: 42.354558, lng: -84.955255 },
    { name: "Saint Paul, Minnesota", lat: 44.95, lng: -93.094 },
    { name: "Jackson, Mississippi", lat: 32.32, lng: -90.207 },
    { name: "Jefferson City, Missouri", lat: 38.572954, lng: -92.189283 },
    { name: "Helena, Montana", lat: 46.595805, lng: -112.027031 },
    { name: "Lincoln, Nebraska", lat: 40.809868, lng: -96.675345 },
    { name: "Carson City, Nevada", lat: 39.161921, lng: -119.767409 },
    { name: "Concord, New Hampshire", lat: 43.220093, lng: -71.549896 },
    { name: "Trenton, New Jersey", lat: 40.221741, lng: -74.756138 },
    { name: "Santa Fe, New Mexico", lat: 35.667231, lng: -105.964575 },
    { name: "Albany, New York", lat: 42.659829, lng: -73.781339 },
    { name: "Raleigh, North Carolina", lat: 35.771, lng: -78.638 },
    { name: "Bismarck, North Dakota", lat: 46.813343, lng: -100.779004 },
    { name: "Columbus, Ohio", lat: 39.961176, lng: -82.998794 },
    { name: "Oklahoma City, Oklahoma", lat: 35.482309, lng: -97.534994 },
    { name: "Salem, Oregon", lat: 44.931109, lng: -123.029159 },
    { name: "Harrisburg, Pennsylvania", lat: 40.269789, lng: -76.875613 },
    { name: "Providence, Rhode Island", lat: 41.82355, lng: -71.422132 },
    { name: "Columbia, South Carolina", lat: 34.0, lng: -81.035 },
    { name: "Pierre, South Dakota", lat: 44.367966, lng: -100.336378 },
    { name: "Nashville, Tennessee", lat: 36.165, lng: -86.784 },
    { name: "Austin, Texas", lat: 30.266667, lng: -97.75 },
    { name: "Salt Lake City, Utah", lat: 40.777477, lng: -111.888237 },
    { name: "Montpelier, Vermont", lat: 44.26639, lng: -72.58133 },
    { name: "Richmond, Virginia", lat: 37.54, lng: -77.46 },
    { name: "Olympia, Washington", lat: 47.042418, lng: -122.893077 },
    { name: "Charleston, West Virginia", lat: 38.349497, lng: -81.633294 },
    { name: "Madison, Wisconsin", lat: 43.074722, lng: -89.384444 },
    { name: "Cheyenne, Wyoming", lat: 41.145548, lng: -104.802042 },
];

// International cities including Kuching
const INTERNATIONAL_CITIES = [
    { name: "Kuching, Malaysia", lat: 1.5535, lng: 110.3593 },
];

// Combined list of all cities
const ALL_CITIES = [...US_STATE_CAPITALS, ...INTERNATIONAL_CITIES];

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const pollutant = searchParams.get("pollutant") || "aqi";
        const location = searchParams.get("location");
        const random = searchParams.get("random") === "true";
        const countParam = parseInt(searchParams.get("count") || "0", 10);
        const count = isNaN(countParam)
            ? 25
            : Math.min(Math.max(countParam, 5), 60);

        let pollutionData: any[] = [];
        let source: string;

        if (random) {
            // Static curated list sampling
            pollutionData = buildCuratedSet(pollutant, count);
            source = "curated-static";
        } else if (location) {
            pollutionData = await fetchOpenMeteoPollutionData(
                pollutant,
                location
            );
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
            {
                success: false,
                error: "Failed to fetch pollution data",
                pollutionData: [],
            },
            { status: 500 }
        );
    }
}

// generatePollutionData now only used for non-random fallback (left unchanged except removing static references)
async function generatePollutionData(
    pollutant: string,
    location?: string | null
): Promise<any[]> {
    try {
        if (location)
            return await fetchOpenMeteoPollutionData(pollutant, location);
        return await fetchRandomGlobalAirQuality(pollutant, 20);
    } catch {
        return generateLightweightMock(pollutant, 20);
    }
}

function generateLightweightMock(pollutant: string, count: number): any[] {
    const pts: any[] = [];
    for (let i = 0; i < count; i++) {
        const lat = parseFloat((Math.random() * 115 - 55).toFixed(3));
        const lng = parseFloat((Math.random() * 360 - 180).toFixed(3));
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

async function fetchRandomGlobalAirQuality(
    pollutant: string,
    count: number
): Promise<any[]> {
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

async function fetchOpenMeteoPollutionData(
    pollutant: string,
    location?: string | null
): Promise<any[]> {
    try {
        let lat: number | null = null;
        let lng: number | null = null;
        let resolvedName: string | undefined = location || undefined;

        if (location) {
            const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
                location
            )}&count=1&language=en&format=json`;
            const geoRes = await fetch(geoUrl);
            if (!geoRes.ok) throw new Error("Geocoding failed");
            const geo = await geoRes.json();
            const first = geo.results?.[0];
            if (!first) throw new Error("No geocode result");
            lat = first.latitude;
            lng = first.longitude;
            resolvedName = first.name || location;
        } else {
            lat = parseFloat((Math.random() * 120 - 60).toFixed(3));
            lng = parseFloat((Math.random() * 360 - 180).toFixed(3));
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
        if (
            !aq.hourly ||
            !Array.isArray(aq.hourly.time) ||
            !aq.hourly.time.length
        )
            throw new Error("No hourly data");

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

        const pick = (arr: any[] | undefined, i: number) =>
            arr && Array.isArray(arr) && arr[i] != null ? Number(arr[i]) : null;

        const pm25Val = pick(aq.hourly.pm2_5, nearestIdx);
        const pm10Val = pick(aq.hourly.pm10, nearestIdx);
        const usAqiVal = pick(aq.hourly.us_aqi, nearestIdx);
        const ozoneVal = pick(aq.hourly.ozone, nearestIdx);
        const no2Val = pick(aq.hourly.nitrogen_dioxide, nearestIdx);

        let computedAQI: number | null = usAqiVal;
        if (computedAQI == null) {
            const a25 = pm25Val != null ? aqiFromPM25(pm25Val) : null;
            const a10 = pm10Val != null ? aqiFromPM10(pm10Val) : null;
            if (a25 != null || a10 != null)
                computedAQI = Math.max(a25 ?? 0, a10 ?? 0);
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
            return Math.round(
                ((bp.Ih - bp.Il) / (bp.Ch - bp.Cl)) * (c - bp.Cl) + bp.Il
            );
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
            return Math.round(
                ((bp.Ih - bp.Il) / (bp.Ch - bp.Cl)) * (c - bp.Cl) + bp.Il
            );
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
    // ... rest of implementation
}
*/
