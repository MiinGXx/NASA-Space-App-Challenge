// app/api/tempo/latest/route.ts
import { NextResponse } from "next/server";

const CMR = "https://cmr.earthdata.nasa.gov/search/granules.json";

// Import debug settings
import { GET as getDebugSettings } from "../debug-settings/route";

export async function GET() {
    console.log("🔍 TEMPO API: Starting search for latest granule...");

    // Get current debug settings
    const debugSettingsResponse = await getDebugSettings();
    const debugSettings = await debugSettingsResponse.json();

    console.log("🔧 TEMPO API: Using debug settings:", debugSettings);

    // Debug information object to track the process
    const debug: any = {
        envVars: {
            shortName: process.env.TEMPO_SHORT_NAME,
            bbox: process.env.REGION_BBOX || "-125,24,-66,50",
        },
        timeRange: {},
        requestUrl: "",
        responseStatus: "",
        responseData: null,
    };

    // Try a more common product name if the one from settings isn't working
    // TEMPO_L1B_RD is a Level 1B Radiance product that's more likely to have data
    const shortName = debugSettings.productName || "TEMPO_L1B_RD";

    // Update debug info to show the actual product name being used
    debug.envVars.shortName = shortName;
    debug.productNameSource = debugSettings.productName
        ? "debug settings"
        : "default fallback";

    const bbox = process.env.REGION_BBOX || "-125,24,-66,50";

    // Create a more flexible time range strategy
    const now = new Date();
    // Use the time range from debug settings - default to 60 days for better results
    const timeRangeDays = debugSettings.timeRange || 60;

    // Go back enough days to ensure we find data - more historical data is more likely to be available
    const start = new Date(now.getTime() - timeRangeDays * 24 * 60 * 60 * 1000);

    // Use an open-ended temporal query for better results
    const temporal = `${start.toISOString()},`; // Open-ended search (up to present)

    // Set an explicit end date for debugging purposes
    const end = new Date(); // Just use current time for logs

    // Store time range info for debugging
    debug.timeRange = {
        days: timeRangeDays,
        start: start.toISOString(),
        end: "open-ended (to present)",
        humanReadable: {
            start: start.toLocaleString(),
            end: "up to current date",
            strategy:
                "Using open-ended search with extended historical range (60 days)",
        },
    };

    const url =
        `${CMR}?short_name=${encodeURIComponent(shortName)}` +
        `&temporal=${encodeURIComponent(temporal)}` +
        `&bounding_box=${bbox}` +
        `&sort_key=-start_date&page_size=1`;

    // Store request URL for debugging
    debug.requestUrl = url;

    console.log("Making NASA CMR API request:", debug);

    const res = await fetch(url, { headers: { Accept: "application/json" } });
    debug.responseStatus = `${res.status} ${res.statusText}`;

    if (!res.ok) {
        const text = await res.text();
        console.error("CMR query failed:", { status: res.status, text });
        return NextResponse.json(
            {
                error: "CMR query failed",
                detail: text,
                debug,
            },
            { status: 502 }
        );
    }

    const data = await res.json();
    // Store response data for debugging
    debug.responseData = {
        hasEntries: !!data?.feed?.entry?.length,
        entryCount: data?.feed?.entry?.length || 0,
        feedSummary: data?.feed
            ? {
                  id: data.feed.id,
                  title: data.feed.title,
                  updated: data.feed.updated,
              }
            : null,
    };

    console.log("CMR response data:", debug.responseData);

    const entry = data?.feed?.entry?.[0];
    if (!entry) {
        console.error("❌ No recent TEMPO granules found:", debug);

        // Try to fetch a list of available products for this provider
        console.log("🔍 Attempting to discover available TEMPO products...");
        const providerUrl =
            "https://cmr.earthdata.nasa.gov/search/collections.json?provider=LARC_ASDC&page_size=50";
        let availableProducts = [];

        try {
            const providerRes = await fetch(providerUrl);
            if (providerRes.ok) {
                const providerData = await providerRes.json();
                availableProducts = (providerData?.feed?.entry || [])
                    .map((e: any) => e.short_name)
                    .filter((name: string) => name.includes("TEMPO"));

                console.log("📋 Available TEMPO products:", availableProducts);
            } else {
                console.log("❌ Failed to fetch available products");
            }
        } catch (e) {
            console.error("Error fetching available products:", e);
        }

        return NextResponse.json(
            {
                error: "No recent TEMPO granules",
                debug,
                tip: "We've tried a more aggressive search strategy but found no data.",
                details: {
                    searchPeriod: `${start.toLocaleDateString()} to present`,
                    currentProduct: shortName,
                    searchStrategy: "Open-ended historical search",
                    availableProducts: availableProducts.length
                        ? availableProducts
                        : undefined,
                    suggestedFixes: [
                        "Try other potential products: TEMPO_L2_NO2, TEMPO_L2_O3PR, TEMPO-COLLGR, TEMPO-L1B-DC",
                        "Try accessing the CMR API directly via browser to check if authentication is required",
                        "For testing, consider using a static demo dataset instead of live data",
                        "NASA data often has delays - the satellite may be too new for wide data availability",
                    ],
                },
            },
            { status: 404 }
        );
    }

    // Pick a downloadable data link (exclude metadata links)
    const link = (entry.links || []).find(
        (l: any) => l.href && !String(l.rel || "").includes("metadata")
    );
    if (!link) {
        console.error("No data link on granule:", { entry, debug });
        return NextResponse.json(
            {
                error: "No data link on granule",
                entryInfo: {
                    id: entry.id,
                    title: entry.title,
                    updated: entry.updated,
                    linksCount: (entry.links || []).length,
                },
                debug,
            },
            { status: 502 }
        );
    }

    // Log successful granule found
    console.log("TEMPO granule found:", {
        granuleId: entry.id,
        timeStart: entry.time_start,
        dataLink: link.href,
    });

    return NextResponse.json({
        granuleId: entry.id,
        href: link.href,
        time_start: entry.time_start,
        updated: entry.updated,
        title: entry.title,
        debug: debug, // Include debug info in the response
    });
}
