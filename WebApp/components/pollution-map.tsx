"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import PollutionLoading from "./pollution-loading";
import type { PollutionPoint, PollutantType } from "./PollutionHeatmapLayer";

// Dynamically import all Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const CircleMarker = dynamic(() => import("react-leaflet").then(mod => mod.CircleMarker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });

// Dynamically import PollutionHeatmapLayer to avoid SSR issues
const PollutionHeatmapLayer = dynamic(() => import("./PollutionHeatmapLayer"), {
    ssr: false,
    loading: () => <div>Loading pollution heatmap...</div>,
});

// Dynamically import MapLegend to avoid SSR issues
const MapLegend = dynamic(() => import("./map-legend"), {
    ssr: false,
});

interface PollutionMapProps {
    location?: string;
}

// Pollutant configuration
const POLLUTANT_CONFIG: Record<PollutantType, { 
    label: string; 
    unit: string; 
    description: string;
    colors: string[];
}> = {
    pm25: {
        label: "PM2.5",
        unit: "μg/m³",
        description: "Fine particulate matter",
        colors: ["#00ff00", "#ffff00", "#ff8000", "#ff0000", "#8000ff", "#800000"],
    },
    pm10: {
        label: "PM10",
        unit: "μg/m³",
        description: "Coarse particulate matter",
        colors: ["#00ff00", "#ffff00", "#ff8000", "#ff0000", "#8000ff"],
    },
    o3: {
        label: "Ozone",
        unit: "μg/m³",
        description: "Ground-level ozone",
        colors: ["#00ff80", "#ffff00", "#ff8000", "#ff0000", "#8000ff"],
    },
    no2: {
        label: "NO₂",
        unit: "μg/m³",
        description: "Nitrogen dioxide",
        colors: ["#0080ff", "#00ff00", "#ffff00", "#ff8000", "#ff0000"],
    },
    aqi: {
        label: "AQI",
        unit: "",
        description: "Air Quality Index",
        colors: ["#00e400", "#ffff00", "#ff7e00", "#ff0000", "#8f3f97", "#7e0023"],
    },
};

export default function PollutionMap({ location }: PollutionMapProps) {
    const [loading, setLoading] = useState(true);
    const [loadingStage, setLoadingStage] = useState<"initial" | "fetching" | "processing" | "rendering">("initial");
    const [error, setError] = useState<string | null>(null);
    const [pollutionData, setPollutionData] = useState<PollutionPoint[]>([]);
    const [selectedPollutant, setSelectedPollutant] = useState<PollutantType>("aqi");
    const [mapCenter, setMapCenter] = useState<[number, number]>([39.8283, -98.5795]); // US center

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

    // Update map center when location changes
    useEffect(() => {
        if (location) {
            // For demo purposes, we'll use some predefined locations
            // In a real app, you'd geocode the location
            const locationCoords: Record<string, [number, number]> = {
                "Los Angeles": [34.0522, -118.2437],
                "New York": [40.7128, -74.0060],
                "Chicago": [41.8781, -87.6298],
                "Houston": [29.7604, -95.3698],
                "Phoenix": [33.4484, -112.0740],
                "San Francisco": [37.7749, -122.4194],
            };

            const coords = locationCoords[location] || [39.8283, -98.5795];
            setMapCenter(coords);
        }
    }, [location]);

    // Fetch pollution data
    useEffect(() => {
        const fetchPollutionData = async () => {
            try {
                setLoading(true);
                setLoadingStage("initial");
                setError(null);

                // Stage 1: Connecting
                await new Promise(resolve => setTimeout(resolve, 800));
                setLoadingStage("fetching");

                const apiUrl = `/api/pollution?pollutant=${selectedPollutant}${
                    location ? `&location=${encodeURIComponent(location)}` : ""
                }`;
                const response = await fetch(apiUrl);

                if (!response.ok) {
                    throw new Error(
                        `Failed to fetch pollution data: ${response.statusText}`
                    );
                }

                // Stage 2: Processing data
                setLoadingStage("processing");
                await new Promise(resolve => setTimeout(resolve, 600));

                const data = await response.json();
                
                // Stage 3: Rendering
                setLoadingStage("rendering");
                await new Promise(resolve => setTimeout(resolve, 400));
                
                setPollutionData(data.pollutionData || []);
            } catch (err) {
                console.error("Error fetching pollution data:", err);
                
                // For now, generate some mock data for demonstration
                console.log("Using mock data for demonstration");
                setLoadingStage("processing");
                await new Promise(resolve => setTimeout(resolve, 500));
                generateMockData();
            } finally {
                setLoading(false);
            }
        };

        fetchPollutionData();
    }, [selectedPollutant, location]);

    // Generate mock pollution data for demonstration
    const generateMockData = () => {
        const mockData: PollutionPoint[] = [];
        const cities = [
            { name: "Los Angeles", lat: 34.0522, lng: -118.2437, baseValue: 0.7 },
            { name: "New York", lat: 40.7128, lng: -74.0060, baseValue: 0.6 },
            { name: "Chicago", lat: 41.8781, lng: -87.6298, baseValue: 0.5 },
            { name: "Houston", lat: 29.7604, lng: -95.3698, baseValue: 0.8 },
            { name: "Phoenix", lat: 33.4484, lng: -112.0740, baseValue: 0.6 },
            { name: "San Francisco", lat: 37.7749, lng: -122.4194, baseValue: 0.4 },
            { name: "Philadelphia", lat: 39.9526, lng: -75.1652, baseValue: 0.5 },
            { name: "San Antonio", lat: 29.4241, lng: -98.4936, baseValue: 0.5 },
            { name: "San Diego", lat: 32.7157, lng: -117.1611, baseValue: 0.4 },
            { name: "Dallas", lat: 32.7767, lng: -96.7970, baseValue: 0.6 },
        ];

        // Generate data points around each city
        cities.forEach(city => {
            // Add main city point
            const maxValues: Record<PollutantType, number> = {
                pm25: 150,
                pm10: 250,
                o3: 200,
                no2: 100,
                aqi: 300,
            };

            const value = city.baseValue * maxValues[selectedPollutant] + 
                         (Math.random() - 0.5) * 20;

            mockData.push({
                lat: city.lat,
                lng: city.lng,
                value: Math.max(0, value),
                pollutantType: selectedPollutant,
                location: city.name,
                timestamp: new Date().toISOString(),
            });

            // Add surrounding points for better heatmap effect
            for (let i = 0; i < 5; i++) {
                const offsetLat = (Math.random() - 0.5) * 1; // ±0.5 degrees
                const offsetLng = (Math.random() - 0.5) * 1;
                const intensity = city.baseValue * (0.5 + Math.random() * 0.5);
                
                mockData.push({
                    lat: city.lat + offsetLat,
                    lng: city.lng + offsetLng,
                    value: Math.max(0, intensity * maxValues[selectedPollutant]),
                    pollutantType: selectedPollutant,
                    timestamp: new Date().toISOString(),
                });
            }
        });

        setPollutionData(mockData);
    };

    const currentConfig = POLLUTANT_CONFIG[selectedPollutant];

    return (
        <Card className="w-full h-[600px]">
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="text-2xl font-bold">
                        Pollution Heatmap - {currentConfig.label}
                        {currentConfig.unit && (
                            <span className="text-sm font-normal text-muted-foreground ml-2">
                                ({currentConfig.unit})
                            </span>
                        )}
                    </CardTitle>
                    
                    {/* Pollutant selector */}
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(POLLUTANT_CONFIG).map(([key, config]) => (
                            <Button
                                key={key}
                                variant={selectedPollutant === key ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedPollutant(key as PollutantType)}
                                className="text-xs"
                            >
                                {config.label}
                            </Button>
                        ))}
                    </div>
                </div>
                
                <p className="text-sm text-muted-foreground">
                    {currentConfig.description}
                    {location && (
                        <span className="ml-2">
                            • Showing data for {location}
                        </span>
                    )}
                </p>
            </CardHeader>
            
            <CardContent className="p-0 h-[calc(100%-120px)]">
                {loading ? (
                    <PollutionLoading 
                        stage={loadingStage}
                        message={loadingStage === "fetching" ? "Downloading air quality data from 51 monitoring stations..." : undefined}
                    />
                ) : error ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-red-500">{error}</p>
                    </div>
                ) : (
                    <MapContainer
                        key={`${mapCenter[0]}-${mapCenter[1]}`}
                        center={mapCenter}
                        zoom={4}
                        scrollWheelZoom={false}
                        doubleClickZoom={false}
                        touchZoom={false}
                        keyboard={false}
                        zoomControl={false}
                        dragging={true}
                        style={{ height: "100%", width: "100%", minHeight: "400px" }}
                        className="rounded-lg overflow-hidden"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {/* Render pollution heatmap layer if data is available */}
                        {pollutionData.length > 0 && (
                            <PollutionHeatmapLayer
                                points={pollutionData}
                                pollutantType={selectedPollutant}
                                radius={60}
                                blur={15}
                                max={1.2}
                            />
                        )}

                        {/* Add simple dot markers for major data points */}
                        {pollutionData
                            .filter(point => point.location)
                            .map((point, index) => {
                                try {
                                    // Calculate color based on pollution value
                                    const intensity = Math.min(point.value / 100, 1); // Normalize to 0-1
                                    const colors = currentConfig.colors;
                                    const colorIndex = Math.floor(intensity * (colors.length - 1));
                                    const markerColor = colors[colorIndex] || colors[0];

                                    return (
                                        <CircleMarker
                                            key={`dot-marker-${index}-${point.location}`}
                                            center={[point.lat, point.lng]}
                                            radius={6}
                                            fillColor={markerColor}
                                            color="white"
                                            weight={1.5}
                                            opacity={1}
                                            fillOpacity={0.9}
                                        >
                                            <Popup>
                                                <div className="p-2">
                                                    <h4 className="font-semibold">{point.location}</h4>
                                                    <p className="text-sm">
                                                        {currentConfig.label}: {point.value.toFixed(1)} {currentConfig.unit}
                                                    </p>
                                                    {point.timestamp && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Updated: {new Date(point.timestamp).toLocaleTimeString()}
                                                        </p>
                                                    )}
                                                </div>
                                            </Popup>
                                        </CircleMarker>
                                    );
                                } catch (error) {
                                    console.warn(`Failed to render marker for ${point.location}:`, error);
                                    return null;
                                }
                            })}

                        {/* Map Legend */}
                        <MapLegend
                            title="AQI Index"
                            gradientColors={currentConfig.colors}
                            minLabel="Low"
                            maxLabel="High"
                            position="bottomright"
                            width={450}
                            height={12}
                            fontSize={11}
                            aqiLabels={
                                selectedPollutant === "aqi" 
                                    ? ["0-50", "51-100", "101-150", "151-200", "201-300", "300+"]
                                    : selectedPollutant === "pm25"
                                    ? ["0-12", "13-35", "36-55", "56-150", "151+"]
                                    : selectedPollutant === "pm10"
                                    ? ["0-54", "55-154", "155-254", "255-354", "355+"]
                                    : selectedPollutant === "o3"
                                    ? ["0-54", "55-70", "71-85", "86-105", "106+"]
                                    : selectedPollutant === "no2"
                                    ? ["0-53", "54-100", "101-360", "361-649", "650+"]
                                    : ["Low", "Moderate", "High", "Very High", "Extreme"]
                            }
                        />
                    </MapContainer>
                )}
            </CardContent>
        </Card>
    );
}