// app/api/tempo/cog/route.ts
import { NextRequest, NextResponse } from "next/server";

const HARMONY = "https://harmony.earthdata.nasa.gov";
const EDL_TOKEN = process.env.EDL_TOKEN!;
const BBOX = (process.env.REGION_BBOX || "-125,24,-66,50")
    .split(",")
    .map(Number); // [minX,minY,maxX,maxY]

export async function POST(req: NextRequest) {
    const { granuleHref } = await req.json();
    if (!granuleHref)
        return NextResponse.json(
            { error: "granuleHref required" },
            { status: 400 }
        );

    // 1) Submit a Harmony job for subsetting + reprojection + Cloud-Optimized GeoTIFF
    const submit = await fetch(`${HARMONY}/jobs`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${EDL_TOKEN}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            granuleUrls: [granuleHref],
            spatial: { bbox: BBOX }, // subset
            crs: "EPSG:3857", // web maps
            format: "image/tiff; application=geotiff; profile=cloud-optimized",
        }),
    });

    if (!submit.ok) {
        const t = await submit.text();
        return NextResponse.json(
            { error: "Harmony submit failed", detail: t },
            { status: 502 }
        );
    }
    const job = await submit.json();

    // 2) Poll job status (simple polling for hackathon)
    let status = "running";
    let jobDetail: any = job;
    for (let i = 0; i < 60; i++) {
        const poll = await fetch(`${HARMONY}/jobs/${job.jobID}`, {
            headers: { Authorization: `Bearer ${EDL_TOKEN}` },
            cache: "no-store",
        });
        jobDetail = await poll.json();
        status = jobDetail?.status;
        if (status === "successful") break;
        if (status === "failed" || status === "canceled") {
            return NextResponse.json(
                { error: "Harmony job failed", detail: jobDetail },
                { status: 502 }
            );
        }
        await new Promise((r) => setTimeout(r, 5000)); // 5s
    }
    if (status !== "successful") {
        return NextResponse.json(
            { error: "Harmony timeout", detail: jobDetail },
            { status: 504 }
        );
    }

    // 3) Extract first COG link from job output
    const links = jobDetail?.links || [];
    const cog = links.find(
        (l: any) =>
            typeof l.href === "string" && l.href.match(/\.tif(f)?(\?|$)/i)
    )?.href;
    if (!cog)
        return NextResponse.json(
            { error: "No COG in Harmony output", detail: jobDetail },
            { status: 502 }
        );

    return NextResponse.json({ cogUrl: cog, jobID: job.jobID });
}
