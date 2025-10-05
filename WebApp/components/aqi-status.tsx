"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock } from "lucide-react";
import { useState, useEffect } from "react";

interface AQIData {
    value: number;
    level: string;
    location: string;
    lastUpdated: string;
    pollutants: {
        pm25: number;
        pm10: number;
        o3: number;
        no2: number;
    };
}

interface AQIStatusProps {
    location?: string;
}

export function AQIStatus({ location }: AQIStatusProps) {
    const [aqiData, setAqiData] = useState<AQIData>({
        value: 42,
        level: "Good",
        location: location || "San Francisco, CA",
        lastUpdated: new Date().toLocaleTimeString(),
        pollutants: {
            pm25: 8.2,
            pm10: 15.1,
            o3: 45.3,
            no2: 12.7,
        },
    });

    const getAQIColor = (value: number) => {
        if (value <= 50) return "bg-green-500";
        if (value <= 100) return "bg-yellow-500";
        if (value <= 150) return "bg-orange-500";
        if (value <= 200) return "bg-red-500";
        if (value <= 300) return "bg-purple-500";
        return "bg-red-900";
    };

    const getAQILevel = (value: number) => {
        if (value <= 50) return "Good";
        if (value <= 100) return "Moderate";
        if (value <= 150) return "Unhealthy for Sensitive Groups";
        if (value <= 200) return "Unhealthy";
        if (value <= 300) return "Very Unhealthy";
        return "Hazardous";
    };

    // Update data when location changes
    useEffect(() => {
        if (location) {
            (async () => {
                try {
                    const res = await fetch(
                        `/api/pollution?pollutant=aqi&location=${encodeURIComponent(location)}`
                    );
                    if (!res.ok) throw new Error("Failed to fetch");
                    const json = await res.json();

                    // Our pollution API returns a simple array of cities with pollution data
                    if (json && json.length > 0) {
                        // Find the matching city (case-insensitive)
                        const cityData = json.find((city: any) => 
                            city.name.toLowerCase().includes(location.toLowerCase()) || 
                            location.toLowerCase().includes(city.name.toLowerCase())
                        );

                        if (cityData) {
                            const aqiVal = cityData.aqi || 0;
                            
                            setAqiData({
                                value: aqiVal,
                                level: getAQILevel(aqiVal),
                                location: cityData.name,
                                lastUpdated: new Date().toLocaleTimeString(),
                                pollutants: {
                                    pm25: cityData.pm25 || 0,
                                    pm10: cityData.pm10 || 0,
                                    o3: cityData.o3 || 0,
                                    no2: cityData.no2 || 0,
                                },
                            });
                            return;
                        }
                    }

                    // Fallback if no data found
                    setAqiData({
                        value: 0,
                        level: "No Data",
                        location: location,
                        lastUpdated: new Date().toLocaleTimeString(),
                        pollutants: { pm25: 0, pm10: 0, o3: 0, no2: 0 },
                    });
                } catch (e) {
                    console.error(e);
                }
            })();
        }
    }, [location]);

    useEffect(() => {
        const interval = setInterval(() => {
            setAqiData((prev) => ({
                ...prev,
                lastUpdated: new Date().toLocaleTimeString(),
            }));
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <MapPin className="h-5 w-5" />
                    Current Air Quality
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Main AQI Display */}
                <div className="text-center space-y-4">
                    <div className="relative">
                        <div
                            className={`w-32 h-32 mx-auto rounded-full ${getAQIColor(
                                aqiData.value
                            )} flex items-center justify-center`}
                        >
                            <span className="text-4xl font-bold text-white">
                                {aqiData.value}
                            </span>
                        </div>
                        <Badge
                            variant="secondary"
                            className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
                        >
                            {getAQILevel(aqiData.value)}
                        </Badge>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-2xl font-semibold text-foreground">
                            {aqiData.location}
                        </h3>
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            Last updated: {aqiData.lastUpdated}
                        </div>
                    </div>
                </div>

                {/* Pollutant Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 rounded-lg border border-border">
                        <div className="text-lg font-semibold text-foreground">
                            {aqiData.pollutants.pm25}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            PM2.5 μg/m³
                        </div>
                    </div>
                    <div className="text-center p-3 rounded-lg border border-border">
                        <div className="text-lg font-semibold text-foreground">
                            {aqiData.pollutants.pm10}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            PM10 μg/m³
                        </div>
                    </div>
                    <div className="text-center p-3 rounded-lg border border-border">
                        <div className="text-lg font-semibold text-foreground">
                            {aqiData.pollutants.o3}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            O₃ μg/m³
                        </div>
                    </div>
                    <div className="text-center p-3 rounded-lg border border-border">
                        <div className="text-lg font-semibold text-foreground">
                            {aqiData.pollutants.no2}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            NO₂ μg/m³
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
