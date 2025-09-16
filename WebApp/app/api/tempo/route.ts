import { NextResponse } from "next/server";
import { CMREntry, CMRResponse, HarmonyResponse, HeatmapPoint } from "./types";
import { generateHeatmapPoints } from "./heatmap";

// NASA CMR API endpoint for TEMPO data
const CMR_API_URL = "https://cmr.earthdata.nasa.gov/search/granules.json";
// NASA Harmony API endpoint for TEMPO data processing
const HARMONY_API_URL = "https://harmony.earthdata.nasa.gov/";

/**
 * Handles requests to the TEMPO API
 * GET: Fetches TEMPO data based on query parameters
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "heatmap";
    const date = searchParams.get("date") || getTodayDateString();

    try {
        // Fetch TEMPO granules from NASA CMR API
        const granules = await fetchTEMPOGranules(date);

        if (granules.length === 0) {
            return NextResponse.json(
                {
                    error: "No TEMPO data available for the specified date",
                },
                { status: 404 }
            );
        }

        // Process the data based on the requested mode
        if (mode === "heatmap") {
            // Generate heatmap points from the first granule
            const heatmapData = generateHeatmapPoints(granules[0]);
            return NextResponse.json({
                date,
                granuleId: granules[0].id,
                heatmapData,
            });
        } else if (mode === "raw") {
            // Return raw granule data
            return NextResponse.json({ date, granules });
        }

        // Default fallback
        return NextResponse.json(
            {
                error: "Invalid mode specified. Supported modes: heatmap, raw",
            },
            { status: 400 }
        );
    } catch (error) {
        console.error("Error fetching TEMPO data:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch TEMPO data",
            },
            { status: 500 }
        );
    }
}

/**
 * Fetches TEMPO granules from NASA CMR API
 */
async function fetchTEMPOGranules(date: string): Promise<CMREntry[]> {
    // In a real implementation, this would make actual API calls
    // For now, we'll return mock data

    // Mock data representing a TEMPO granule
    const mockGranule: CMREntry = {
        id: "G" + Date.now(),
        title: `TEMPO L2 NO2 Data for ${date}`,
        time_start: `${date}T00:00:00Z`,
        time_end: `${date}T23:59:59Z`,
        links: [
            {
                rel: "data",
                href: "https://example.com/tempo-data.nc",
            },
        ],
        boxes: [["24.396308 -125.0 49.384358 -66.93457"]],
    };

    return [mockGranule];
}

/**
 * Gets today's date in YYYY-MM-DD format
 */
function getTodayDateString(): string {
    const today = new Date();
    return today.toISOString().split("T")[0];
}
