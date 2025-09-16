// app/api/tempo/cog-file/route.ts
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const cogUrl = req.nextUrl.searchParams.get("url");
    if (!cogUrl) return new Response("Missing url", { status: 400 });

    const headers: Record<string, string> = {};
    const range = req.headers.get("range");
    if (range) headers["Range"] = range;

    // Add auth here if your Harmony result requires it:
    // headers["Authorization"] = `Bearer ${process.env.EDL_TOKEN}`;

    const r = await fetch(cogUrl, { headers, cache: "no-store" });

    // forward essential headers; expose content-range for the browser
    const h = new Headers(r.headers);
    h.set("Access-Control-Expose-Headers", "Content-Length, Content-Range");
    return new Response(r.body, { status: r.status, headers: h });
}
