// components/interactive-map.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { DeckGL } from "@deck.gl/react";
import { BitmapLayer } from "@deck.gl/layers";

// MapLibre needs to be loaded client-side
const ReactMapGL = dynamic(
    () => import("react-map-gl/maplibre").then((m) => m.default),
    { ssr: false }
);

type Props = { location?: string };

type TempoGranule = {
    href: string;
    time_start?: string;
    updated?: string;
    title?: string;
};

export function InteractiveMap({ location }: Props) {
    const [status, setStatus] = useState<
        "idle" | "loading" | "ready" | "error"
    >("idle");
    const [error, setError] = useState<string | null>(null);
    const [cogUrl, setCogUrl] = useState<string | null>(null);
    const [domain, setDomain] = useState<[number, number] | null>(null);
    const [obsTime, setObsTime] = useState<string | undefined>(undefined);
    const [debugInfo, setDebugInfo] = useState<any>(null);
    const [productName, setProductName] = useState<string>("TEMPO_L1B_RD");
    const [timeRange, setTimeRange] = useState<number>(60);
    const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

    // Function to handle debug settings changes
    const handleSettingsChange = async (settings: {
        productName: string;
        timeRange: number;
        resetTriedProducts?: boolean;
    }) => {
        try {
            setStatus("loading");
            
            // Update local state directly (API is optional)
            setProductName(settings.productName);
            setTimeRange(settings.timeRange);

            // Try to update via API if available, but don't fail if it's not
            try {
                const response = await fetch("/api/tempo/debug-settings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(settings),
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log("Updated settings via API:", data);
                }
            } catch (apiError) {
                console.log("API not available, using local settings only");
            }

            // Trigger a refresh of the data
            setRefreshTrigger((prev) => prev + 1);

            // Reset states
            setStatus("idle");
            setError(null);
            setCogUrl(null);
            setDomain(null);
            setObsTime(undefined);
            setDebugInfo(null);
        } catch (err: any) {
            console.error("Error updating debug settings:", err);
            setError(`Failed to update settings: ${err.message}`);
            setStatus("error");
        }
    };

    // Default view (CONUS). If you later geocode `location`, update this.
    const initialViewState = useMemo(
        () => ({
            longitude: -96,
            latitude: 39,
            zoom: 4,
        }),
        []
    );

    // Fetch initial debug settings when component mounts
    useEffect(() => {
        async function fetchInitialSettings() {
            try {
                console.log("Attempting to fetch initial debug settings...");
                const response = await fetch("/api/tempo/debug-settings");

                if (response.ok) {
                    const settings = await response.json();
                    console.log("Retrieved initial settings:", settings);

                    // Update local state with server settings
                    setProductName(settings.productName);
                    setTimeRange(settings.timeRange);

                    // Force a refresh with these settings
                    setRefreshTrigger((prev) => prev + 1);
                } else {
                    console.log("API not available, using default settings");
                }
            } catch (err) {
                console.log("Debug settings API not available, using defaults:", err);
                // Component will work with default values
            }
        }

        fetchInitialSettings();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                setStatus("loading");
                setError(null);

                // 1) Get latest granule (CMR)
                console.log(
                    `🔍 Fetching TEMPO data with product=${productName}, timeRange=${timeRange} days, refreshTrigger=${refreshTrigger}...`
                );
                const response = await fetch("/api/tempo/latest", {
                    cache: "no-store",
                });

                const data = await response.json();

                // Log helpful information regardless of success/failure
                console.log(`API response status: ${response.status}`);

                // Store debug info if available
                if (data.debug) {
                    console.log("API Debug Info:", data.debug);
                    setDebugInfo(data.debug);

                    // Log the product name being used
                    console.log(
                        `Using product name: ${data.debug.envVars.shortName}`
                    );
                    console.log(
                        `Source: ${data.debug.productNameSource || "unknown"}`
                    );
                    console.log(
                        `Time range: ${data.debug.timeRange.days} days`
                    );
                    
                    // If we have product suggestions, log them
                    if (data.details?.availableProducts) {
                        console.log("Available TEMPO products:", data.details.availableProducts);
                    }
                }

                const g: TempoGranule = data;
                if (!g?.href) {
                    // Check if we have specific error details to display
                    const errorMsg = data.error || "No recent TEMPO granule found";
                    const details = data.details || {};
                    
                    // Log detailed error information for debugging
                    console.error("TEMPO data fetch failed:", {
                        error: errorMsg,
                        details,
                        suggestions: details.suggestedFixes || [],
                        productName: details.currentProduct || productName,
                        searchPeriod: details.searchPeriod,
                    });
                    
                    // If we have available products, try switching to one of them automatically
                    if (data.details?.availableProducts?.length > 0) {
                        const availableProducts = data.details.availableProducts;
                        const randomIndex = Math.floor(Math.random() * availableProducts.length);
                        const nextProduct = availableProducts[randomIndex];
                        
                        console.log(`🔄 Automatically trying a different product: ${nextProduct}`);
                        
                        // Try the new product after a short delay
                        setTimeout(() => {
                            handleSettingsChange({
                                productName: nextProduct,
                                timeRange: timeRange + 30, // Increase time range for better chances
                            });
                        }, 1000);
                    }
                    
                    throw new Error(errorMsg);
                }
                setObsTime(g.time_start);

                // 2) Ask Harmony to produce a COG for our bbox/CRS
                const h = await fetch("/api/tempo/cog", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ granuleHref: g.href }),
                }).then((r) => r.json());
                if (!h?.cogUrl) throw new Error("Harmony COG not available");

                // 3) Build a same-origin proxy URL for range-friendly browser reads
                const proxied = `/api/tempo/cog-file?url=${encodeURIComponent(
                    h.cogUrl
                )}`;
                setCogUrl(proxied);

                // 4) Fetch quick stats to set a sensible color domain
                const s = await fetch(
                    `/api/tempo/stats?url=${encodeURIComponent(h.cogUrl)}`,
                    { cache: "no-store" }
                )
                    .then((r) => r.json())
                    .catch(() => null);

                // Fallback domain if stats fail; adjust for your product.
                const dmin = s?.min ?? 0;
                const dmax = s?.max ?? s?.p95 ?? 1;
                setDomain([dmin, dmax]);

                setStatus("ready");
            } catch (e: any) {
                setError(e?.message || "Unexpected error");
                setStatus("error");
            }
        })();
    }, [location]); // if you later tie bbox to location, this will refresh

    // Simple blue→yellow→red ramp; tweak to AQI colors for your product/domain
    function colorRamp(
        val: number,
        min: number,
        max: number
    ): [number, number, number, number] {
        if (!Number.isFinite(val)) return [0, 0, 0, 0];
        const t = Math.max(
            0,
            Math.min(1, (val - min) / Math.max(1e-12, max - min))
        );
        // 0..0.5: blue->yellow, 0.5..1: yellow->red
        const r = t < 0.5 ? Math.floor(510 * t) : 255;
        const g =
            t < 0.5 ? Math.floor(510 * t) : Math.floor(510 * (1 - (t - 0.5)));
        const b = t < 0.5 ? 255 - Math.floor(510 * t) : 0;
        return [r, g, b, 210];
    }

    const layers = useMemo(() => {
        if (!cogUrl || !domain) return [];
        const [min, max] = domain;

        return [
            new BitmapLayer({
                id: "tempo-bitmap",
                image: cogUrl,
                bounds: [-125, 24, -66, 50], // CONUS bounds from your REGION_BBOX
                opacity: 0.7,
                // BitmapLayer doesn't support colorMap directly, so we'll use a simpler approach
                // You may need to adjust this based on your specific visualization needs
                pickable: false,
            }),
        ];
    }, [cogUrl, domain]);

    return (
        <div className="w-full h-[70vh] rounded-xl overflow-hidden border relative">
            <DeckGL
                layers={layers}
                controller={true}
                initialViewState={initialViewState}
                style={{ position: "relative", width: "100%", height: "100%" }}
                width="100%"
                height="100%"
            >
                <ReactMapGL
                    reuseMaps
                    mapLib={import("maplibre-gl")}
                    mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
                    style={{ width: "100%", height: "100%" }}
                />
            </DeckGL>

            <div className="absolute left-3 bottom-3 text-xs bg-white/80 rounded px-2 py-1 shadow max-w-[90%] max-h-[70%] overflow-auto">
                {status === "loading" && "Loading TEMPO…"}
                {status === "ready" && (
                    <>
                        <span className="font-medium">TEMPO layer</span>
                        {obsTime ? (
                            <> • Obs: {new Date(obsTime).toLocaleString()}</>
                        ) : null}
                        {domain ? (
                            <>
                                {" "}
                                • Domain: [{domain[0].toFixed(2)} —{" "}
                                {domain[1].toFixed(2)}]
                            </>
                        ) : null}
                    </>
                )}
                {status === "error" && (
                    <div className="text-red-600">
                        <p className="font-medium">Error: {error}</p>
                        {debugInfo && (
                            <div className="mt-2 text-xs">
                                <div className="mb-2 p-2 bg-gray-100 rounded">
                                    <p className="font-medium">TEMPO Data Settings:</p>
                                    <p>Product: {debugInfo.envVars?.shortName || productName}</p>
                                    <p>Time Range: {debugInfo.timeRange?.days || timeRange} days</p>
                                    {debugInfo.timeRange?.humanReadable && (
                                        <p>Period: {debugInfo.timeRange.humanReadable.start} to {debugInfo.timeRange.humanReadable.end}</p>
                                    )}
                                </div>
                            
                                <button
                                    className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                                    onClick={() => {
                                        console.log("Debug Info:", debugInfo);
                                        alert("Debug info logged to console");
                                    }}
                                >
                                    Log Debug Info
                                </button>
                                
                                {/* Add product switcher */}
                                <div className="mt-2 p-2 bg-gray-100 rounded">
                                    <p className="font-medium">Try different products:</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {["TEMPO_L1B_RD", "TEMPO_L2_NO2", "TEMPO_L2_O3PR", "TEMPO-COLLGR", "TEMPO-L1B-DC"].map(name => (
                                            <button 
                                                key={name}
                                                className={`px-2 py-1 text-xs rounded ${
                                                    productName === name 
                                                        ? 'bg-blue-600 text-white' 
                                                        : 'bg-gray-200'
                                                }`}
                                                onClick={() => handleSettingsChange({ 
                                                    productName: name, 
                                                    timeRange: timeRange + 30 
                                                })}
                                            >
                                                {name.replace('TEMPO_', '').replace('TEMPO-', '')}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs mt-1">Current search: {timeRange} days</p>
                                    <button
                                        className="mt-1 bg-green-500 text-white px-2 py-1 rounded text-xs"
                                        onClick={() => handleSettingsChange({ 
                                            productName, 
                                            timeRange: timeRange + 90,
                                            resetTriedProducts: true 
                                        })}
                                    >
                                        Expand search (+90 days)
                                    </button>
                                </div>

                                <div className="mt-2">
                                    <p>
                                        <strong>API Request Details:</strong>
                                    </p>
                                    <p>
                                        Product: {debugInfo.envVars?.shortName}
                                    </p>
                                    <p>
                                        Time Range:{" "}
                                        {
                                            debugInfo.timeRange?.humanReadable
                                                ?.start
                                        }{" "}
                                        to{" "}
                                        {
                                            debugInfo.timeRange?.humanReadable
                                                ?.end
                                        }
                                    </p>
                                    {debugInfo.responseData && (
                                        <p>
                                            Found Entries:{" "}
                                            {debugInfo.responseData.entryCount}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
