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
                    const res = await fetch(`/api/weather?q=${encodeURIComponent(location)}`);
                    if (!res.ok) throw new Error('Failed to fetch');
                    const json = await res.json();

                    const air = json.air_quality || null;
                    // Prefer provider's US AQI when present (air.current.us_aqi or air.hourly.us_aqi)
                    if (air) {
                        // check direct current us_aqi
                        const currentUsAqi = air.current?.us_aqi ?? null;
                        const usHourly = air.hourly?.us_aqi ?? null;
                        if (currentUsAqi != null || (Array.isArray(usHourly) && usHourly.length)) {
                            let aqiVal: number | null = null;
                            let pm25 = 0;
                            let pm10 = 0;

                            if (currentUsAqi != null) {
                                aqiVal = Number(currentUsAqi);
                            }

                            let nearestIdx = 0;
                            if (Array.isArray(usHourly) && Array.isArray(air.hourly.time)) {
                                // find nearest index
                                const times: string[] = air.hourly.time || [];
                                const now = new Date();
                                let minDiff = Infinity;
                                for (let i = 0; i < times.length; i++) {
                                    const t = new Date(times[i]).getTime();
                                    const diff = Math.abs(t - now.getTime());
                                    if (diff < minDiff) {
                                        minDiff = diff;
                                        nearestIdx = i;
                                    }
                                }
                                pm25 = Math.round((air.hourly.pm2_5?.[nearestIdx] || 0) * 10) / 10;
                                pm10 = Math.round((air.hourly.pm10?.[nearestIdx] || 0) * 10) / 10;
                                if (aqiVal == null) {
                                    const usVal = air.hourly.us_aqi?.[nearestIdx] ?? null;
                                    aqiVal = usVal != null ? Number(usVal) : null;
                                }
                            }

                            const finalAqi = aqiVal == null ? 0 : Math.min(500, Number(aqiVal));
                            setAqiData({
                                value: finalAqi,
                                level: getAQILevel(finalAqi),
                                location: location,
                                lastUpdated: new Date().toLocaleTimeString(),
                                pollutants: {
                                    pm25,
                                    pm10,
                                    o3: Math.round((air.hourly?.ozone?.[nearestIdx] || 0) * 10) / 10,
                                    no2: Math.round((air.hourly?.nitrogen_dioxide?.[nearestIdx] || 0) * 10) / 10,
                                },
                            });
                            return;
                        }
                    }

                    // If API provided computed AQI, use it directly
                    if (air && (air.aqi_current !== undefined || (air.hourly && air.hourly.aqi))) {
                        let aqiVal = null;
                        let pm25 = 0;
                        let pm10 = 0;

                        if (air.aqi_current !== undefined) {
                            aqiVal = air.aqi_current;
                        }

                        let nearestIdx = 0;
                        if (air.hourly && Array.isArray(air.hourly.time)) {
                            const times: string[] = air.hourly.time || [];
                            const now = new Date();
                            let minDiff = Infinity;
                            for (let i = 0; i < times.length; i++) {
                                const t = new Date(times[i]).getTime();
                                const diff = Math.abs(t - now.getTime());
                                if (diff < minDiff) {
                                    minDiff = diff;
                                    nearestIdx = i;
                                }
                            }
                            pm25 = Math.round((air.hourly.pm2_5?.[nearestIdx] || 0) * 10) / 10;
                            pm10 = Math.round((air.hourly.pm10?.[nearestIdx] || 0) * 10) / 10;
                            if (aqiVal == null && air.hourly.aqi) {
                                aqiVal = air.hourly.aqi[nearestIdx] ?? null;
                            }
                        }

                        const finalAqi = aqiVal == null ? 0 : Math.min(500, Number(aqiVal));
                        setAqiData({
                            value: finalAqi,
                            level: getAQILevel(finalAqi),
                            location: location,
                            lastUpdated: new Date().toLocaleTimeString(),
                               pollutants: {
                                   pm25,
                                   pm10,
                                   o3: Math.round((air.hourly?.ozone?.[nearestIdx] || 0) * 10) / 10,
                                   no2: Math.round((air.hourly?.nitrogen_dioxide?.[nearestIdx] || 0) * 10) / 10,
                               },
                        });
                        return;
                    }

                    // Fallback: previous heuristic if no air quality data available
                    {
                        const current = json.weather.current_weather || {};
                        const temp = current.temperature || 0;
                        const wind = current.windspeed || 0;
                        const pm25 = Math.round(Math.max(1, temp * 0.3) * 10) / 10;
                        const pm10 = Math.round(Math.max(1, temp * 0.6) * 10) / 10;
                        const o3 = Math.round(Math.max(1, temp * 1.0) * 10) / 10;
                        const no2 = Math.round(Math.max(1, wind * 0.5) * 10) / 10;

                        const aqiVal = Math.min(500, Math.round(pm25 * 3 + pm10 * 0.5));
                        setAqiData({
                            value: aqiVal,
                            level: getAQILevel(aqiVal),
                            location: location,
                            lastUpdated: new Date().toLocaleTimeString(),
                            pollutants: { pm25, pm10, o3, no2 },
                        });
                        return;
                    }
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
                    <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-lg font-semibold text-foreground">
                            {aqiData.pollutants.pm25}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            PM2.5 μg/m³
                        </div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-lg font-semibold text-foreground">
                            {aqiData.pollutants.pm10}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            PM10 μg/m³
                        </div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-lg font-semibold text-foreground">
                            {aqiData.pollutants.o3}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            O₃ μg/m³
                        </div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
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
