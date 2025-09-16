/**
 * Generates heatmap points based on the bounding box of a TEMPO granule
 * This is a synthetic data generator for visualization purposes
 */
import { CMREntry, HarmonyLink } from "./types";
import type { HeatmapPoint } from "./types";

/**
 * Generates synthetic NO2 concentration data for visualization
 * In reality, this would be replaced with actual TEMPO data
 * processed from the NetCDF files
 */
export function generateHeatmapPoints(
    entry: CMREntry,
    resolution = 0.1
): HeatmapPoint[] {
    // Extract bounding box from TEMPO granule
    const bbox = getBoundingBox(entry);
    if (!bbox) {
        return [];
    }

    const { minLat, minLng, maxLat, maxLng } = bbox;
    const points: HeatmapPoint[] = [];

    // Generate a grid of points within the bounding box
    for (let lat = minLat; lat <= maxLat; lat += resolution) {
        for (let lng = minLng; lng <= maxLng; lng += resolution) {
            // Generate synthetic NO2 concentration values
            // Higher values near the center of the bounding box, simulating urban areas
            const distFromCenter = Math.sqrt(
                Math.pow(lat - (minLat + maxLat) / 2, 2) +
                    Math.pow(lng - (minLng + maxLng) / 2, 2)
            );

            // Random variations + distance-based falloff
            const baseValue = Math.random() * 0.5; // Random base value
            const distanceFactor =
                1 - distFromCenter / Math.max(maxLat - minLat, maxLng - minLng);
            const value = baseValue + distanceFactor * 0.5;

            // Add hotspots randomly
            const isHotspot = Math.random() > 0.95;
            const hotspotValue = isHotspot
                ? value * (1 + Math.random() * 2)
                : value;

            points.push({
                lat,
                lng,
                value: Math.min(1, hotspotValue), // Normalize to 0-1 range
            });
        }
    }

    return points;
}

/**
 * Extracts bounding box from a TEMPO granule entry
 */
function getBoundingBox(entry: CMREntry) {
    // Try to get bounding box from the entry's boxes field
    if (entry.boxes && entry.boxes.length > 0 && entry.boxes[0].length > 0) {
        const boxCoords = entry.boxes[0][0].split(" ").map(Number);
        if (boxCoords.length >= 4) {
            return {
                minLat: boxCoords[0],
                minLng: boxCoords[1],
                maxLat: boxCoords[2],
                maxLng: boxCoords[3],
            };
        }
    }

    // Default bounding box covering the continental US if no box is available
    return {
        minLat: 24.396308,
        minLng: -125.0,
        maxLat: 49.384358,
        maxLng: -66.93457,
    };
}
