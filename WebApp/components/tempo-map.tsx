"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

// Type definition for HeatmapPoint (inline since import is causing issues)
interface HeatmapPoint {
    lat: number;
    lng: number;
    intensity: number;
}

// Dynamically import all Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });

// Dynamically import HeatmapLayer to avoid SSR issues
const HeatmapLayer = dynamic(() => import("./HeatmapLayer"), {
    ssr: false,
    loading: () => <div>Loading heatmap...</div>,
});

// Dynamically import MapLegend to avoid SSR issues
const MapLegend = dynamic(() => import("./map-legend"), {
    ssr: false,
});

interface TempoMapProps {
    date?: string;
}

export default function TempoMap({ date }: TempoMapProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);

    // Fix Leaflet icon issues on client side only
    useEffect(() => {
        if (typeof window !== 'undefined') {
            import('leaflet').then((L) => {
                // Fix default markers by removing the broken _getIconUrl method
                delete (L.default.Icon.Default.prototype as any)._getIconUrl;
                
                // Set up proper icon URLs using the node_modules path
                L.default.Icon.Default.mergeOptions({
                    iconRetinaUrl: '/marker-icon-2x.png',
                    iconUrl: '/marker-icon.png',
                    shadowUrl: '/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                });
            }).catch((error) => {
                console.warn('Could not load Leaflet icons:', error);
            });
        }
    }, []);

    // Fetch TEMPO data
    useEffect(() => {
        const fetchTEMPOData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Construct the API URL with the date parameter if provided
                const apiUrl = `/api/tempo?mode=heatmap${
                    date ? `&date=${date}` : ""
                }`;
                const response = await fetch(apiUrl);

                if (!response.ok) {
                    throw new Error(
                        `Failed to fetch TEMPO data: ${response.statusText}`
                    );
                }

                const data = await response.json();
                setHeatmapData(data.heatmapData || []);
            } catch (err) {
                console.error("Error fetching TEMPO data:", err);
                setError("Failed to load TEMPO data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchTEMPOData();
    }, [date]);

    // US coordinates for initial map view
    const usCenter = [39.8283, -98.5795];
    const zoomLevel = 4;

    return (
        <Card className="w-full h-[600px]">
            <CardHeader>
                <CardTitle>TEMPO NO₂ Concentration</CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[calc(100%-60px)]">
                {loading ? (
                    <Skeleton className="w-full h-full" />
                ) : error ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-red-500">{error}</p>
                    </div>
                ) : (
                    <MapContainer
                        center={usCenter as [number, number]}
                        zoom={zoomLevel}
                        scrollWheelZoom={true}
                        style={{ height: "100%", width: "100%", minHeight: "400px" }}
                        className="rounded-lg overflow-hidden"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {/* Render heatmap layer if data is available */}
                        {heatmapData.length > 0 && (
                            <HeatmapLayer
                                points={heatmapData}
                                radius={25}
                                blur={15}
                                max={1.0}
                                gradient={{
                                    0.4: "blue",
                                    0.6: "lime",
                                    0.7: "yellow",
                                    0.8: "orange",
                                    1.0: "red",
                                }}
                            />
                        )}

                        {/* Map Legend */}
                        <MapLegend
                            title="NO₂ Concentration"
                            gradientColors={[
                                "blue",
                                "lime",
                                "yellow",
                                "orange",
                                "red",
                            ]}
                            minLabel="Low"
                            maxLabel="High"
                            position="bottomright"
                        />
                    </MapContainer>
                )}
            </CardContent>
        </Card>
    );
}
