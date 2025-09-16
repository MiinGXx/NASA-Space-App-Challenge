// app/api/tempo/stats/route.ts
import { NextRequest } from "next/server";
import * as GeoTIFF from "geotiff";

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const cogUrl = url.searchParams.get("url");
        if (!cogUrl)
            return new Response(JSON.stringify({ error: "Missing url" }), {
                status: 400,
            });

        // Open with HTTP range requests
        const tiff = await GeoTIFF.fromUrl(cogUrl);
        const image = await tiff.getImage();

        // Read a small, uniformly resampled 256x256 window over full image bounds
        const bbox = image.getBoundingBox(); // [minX,minY,maxX,maxY] in geog coords
        const raster = await image.readRasters({
            bbox,
            width: 256,
            height: 256,
            interleave: true,
        });

        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;
        let validCount = 0;
        const arr = raster as
            | Float32Array
            | Float64Array
            | Uint16Array
            | Int16Array
            | any;

        for (let i = 0; i < arr.length; i++) {
            const v = arr[i];
            if (Number.isFinite(v)) {
                if (v < min) min = v;
                if (v > max) max = v;
                validCount++;
            }
        }

        if (!validCount || !isFinite(min) || !isFinite(max)) {
            return new Response(JSON.stringify({ min: 0, max: 1, p95: 1 }), {
                headers: { "Content-Type": "application/json" },
            });
        }

        // simple 95th percentile clip to reduce outliers
        const sorted = Array.from(arr)
            .filter(Number.isFinite)
            .sort((a, b) => a - b);
        const p95 = sorted[Math.floor(sorted.length * 0.95)];

        return new Response(JSON.stringify({ min, max, p95 }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (e: any) {
        return new Response(
            JSON.stringify({ error: e?.message || "stats failed" }),
            { status: 500 }
        );
    }
}
