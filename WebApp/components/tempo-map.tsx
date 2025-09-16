"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import type { HeatmapPoint } from "../app/api/tempo/types";

// Dynamically import HeatmapLayer to avoid SSR issues
const HeatmapLayer = dynamic(() => import("./HeatmapLayer"), {
    ssr: false,
    loading: () => <div>Loading heatmap...</div>,
});

// Dynamically import MapLegend to avoid SSR issues
const MapLegend = dynamic(() => import("./map-legend"), {
    ssr: false,
});

// Fix Leaflet icon issues
const defaultIcon = L.icon({
    iconUrl: "/leaflet/marker-icon.png",
    shadowUrl: "/leaflet/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

interface TempoMapProps {
    date?: string;
}

export default function TempoMap({ date }: TempoMapProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);

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
                        style={{ height: "100%", width: "100%" }}
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
