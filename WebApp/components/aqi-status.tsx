"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import {
    PushNotification,
    useNotifications,
} from "@/components/push-notification";

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
    onAQIUpdate?: (aqi: number) => void;
}

export function AQIStatus({ location, onAQIUpdate }: AQIStatusProps) {
    const [loading, setLoading] = useState(false);
    const [aqiData, setAqiData] = useState<AQIData | null>(null);
    const [city, setCity] = useState<string | undefined>(location);
    const { notification, showNotification, hideNotification } =
        useNotifications();
    const lastNotifiedCity = useRef<string | null>(null);

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

    // Keep city state synced with incoming prop
    useEffect(() => {
        if (location && location !== city) {
            setCity(location);
        }
    }, [location, city]);

    // Fetch AQI data for the current city, falling back to browser geolocation
    useEffect(() => {
        let cancelled = false;

        const fetchAQI = async (targetCity: string) => {
            setLoading(true);
            try {
                const res = await fetch(
                    `/api/weather?q=${encodeURIComponent(targetCity)}`
                );
                if (!res.ok) throw new Error("Failed to fetch");
                const json = await res.json();

                if (cancelled) return;

                const air = json.air_quality || null;
                // Prefer provider's US AQI when present (air.current.us_aqi or air.hourly.us_aqi)
                if (air) {
                    const currentUsAqi = air.current?.us_aqi ?? null;
                    const usHourly = air.hourly?.us_aqi ?? null;
                    if (
                        currentUsAqi != null ||
                        (Array.isArray(usHourly) && usHourly.length)
                    ) {
                        let aqiVal: number | null = null;
                        let pm25 = 0;
                        let pm10 = 0;

                        if (currentUsAqi != null) {
                            aqiVal = Number(currentUsAqi);
                        }

                        let nearestIdx = 0;
                        if (
                            Array.isArray(usHourly) &&
                            Array.isArray(air.hourly.time)
                        ) {
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
                            pm25 =
                                Math.round(
                                    (air.hourly.pm2_5?.[nearestIdx] || 0) * 10
                                ) / 10;
                            pm10 =
                                Math.round(
                                    (air.hourly.pm10?.[nearestIdx] || 0) * 10
                                ) / 10;
                            if (aqiVal == null) {
                                const usVal =
                                    air.hourly.us_aqi?.[nearestIdx] ?? null;
                                aqiVal = usVal != null ? Number(usVal) : null;
                            }
                        }

                        if (cancelled) return;

                        const finalAqi =
                            aqiVal == null ? 0 : Math.min(500, Number(aqiVal));
                        setAqiData({
                            value: finalAqi,
                            level: getAQILevel(finalAqi),
                            location: targetCity,
                            lastUpdated: new Date().toLocaleTimeString(),
                            pollutants: {
                                pm25,
                                pm10,
                                o3:
                                    Math.round(
                                        (air.hourly?.ozone?.[nearestIdx] || 0) *
                                            10
                                    ) / 10,
                                no2:
                                    Math.round(
                                        (air.hourly?.nitrogen_dioxide?.[
                                            nearestIdx
                                        ] || 0) * 10
                                    ) / 10,
                            },
                        });

                        // Update audio based on AQI
                        if (onAQIUpdate) {
                            onAQIUpdate(finalAqi);
                        }

                        if (lastNotifiedCity.current !== targetCity) {
                            showNotification({
                                title: "Air quality data loaded",
                                message: `Showing data for ${targetCity}`,
                                type: "success",
                                duration: 4000,
                            });
                            lastNotifiedCity.current = targetCity;
                        }
                        return;
                    }
                }

                if (
                    air &&
                    (air.aqi_current !== undefined ||
                        (air.hourly && air.hourly.aqi))
                ) {
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
                        pm25 =
                            Math.round(
                                (air.hourly.pm2_5?.[nearestIdx] || 0) * 10
                            ) / 10;
                        pm10 =
                            Math.round(
                                (air.hourly.pm10?.[nearestIdx] || 0) * 10
                            ) / 10;
                    }

                    if (cancelled) return;

                    const finalAqi =
                        aqiVal == null ? 0 : Math.min(500, Number(aqiVal));
                    setAqiData({
                        value: finalAqi,
                        level: getAQILevel(finalAqi),
                        location: targetCity,
                        lastUpdated: new Date().toLocaleTimeString(),
                        pollutants: {
                            pm25,
                            pm10,
                            o3:
                                Math.round(
                                    (air.hourly?.ozone?.[nearestIdx] || 0) * 10
                                ) / 10,
                            no2:
                                Math.round(
                                    (air.hourly?.nitrogen_dioxide?.[
                                        nearestIdx
                                    ] || 0) * 10
                                ) / 10,
                        },
                    });

                    // Update audio based on AQI
                    if (onAQIUpdate) {
                        onAQIUpdate(finalAqi);
                    }

                    if (lastNotifiedCity.current !== targetCity) {
                        showNotification({
                            title: "Air quality data loaded",
                            message: `Showing data for ${targetCity}`,
                            type: "success",
                            duration: 4000,
                        });
                        lastNotifiedCity.current = targetCity;
                    }
                    return;
                }

                if (cancelled) return;

                // Fallback: previous heuristic if no air quality data available
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
                    location: targetCity,
                    lastUpdated: new Date().toLocaleTimeString(),
                    pollutants: { pm25, pm10, o3, no2 },
                });

                // Update audio based on AQI
                if (onAQIUpdate) {
                    onAQIUpdate(aqiVal);
                }

                if (lastNotifiedCity.current !== targetCity) {
                    showNotification({
                        title: "Air quality data loaded",
                        message: `Showing data for ${targetCity}`,
                        type: "success",
                        duration: 4000,
                    });
                    lastNotifiedCity.current = targetCity;
                }
            } catch (e) {
                if (!cancelled) {
                    console.error(e);
                    setAqiData(null);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        if (!city) {
            setAqiData(null);

            if (typeof navigator === "undefined" || !navigator.geolocation) {
                console.error(
                    "Geolocation is not available in this environment."
                );
                return;
            }

            setLoading(true);
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    if (cancelled) return;
                    const { latitude, longitude } = pos.coords;
                    try {
                        const res = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                        );
                        if (!res.ok)
                            throw new Error("Failed to reverse geocode");
                        const data = await res.json();
                        if (cancelled) return;

                        const address = data.address || {};
                        const derivedCity =
                            address.city ||
                            address.town ||
                            address.village ||
                            address.county ||
                            address.state ||
                            data.display_name;

                        setCity(derivedCity);
                    } catch (err) {
                        if (!cancelled) {
                            console.error(err);
                            setLoading(false);
                        }
                    }
                },
                (error) => {
                    if (!cancelled) {
                        console.error(error);
                        setLoading(false);
                    }
                }
            );

            return () => {
                cancelled = true;
            };
        }

        fetchAQI(city);

        return () => {
            cancelled = true;
        };
    }, [city]);

    useEffect(() => {
        const interval = setInterval(() => {
            setAqiData((prev) =>
                prev
                    ? {
                          ...prev,
                          lastUpdated: new Date().toLocaleTimeString(),
                      }
                    : prev
            );
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative">
            {loading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <svg
                        className="animate-spin h-16 w-16 text-white"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                    </svg>
                </div>
            )}
            <PushNotification
                notification={notification}
                onClose={hideNotification}
            />
            <div className={loading ? "blur-sm pointer-events-none" : ""}>
                {aqiData ? (
                    <Card className="w-full h-[520px]">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <MapPin className="h-5 w-5" />
                                Current Air Quality
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col justify-center h-full space-y-8">
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
                                <div className="text-center p-3 rounded-lg border border-white/50">
                                    <div className="text-lg font-semibold text-foreground">
                                        {aqiData.pollutants.pm25}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        PM2.5 μg/m³
                                    </div>
                                </div>
                                <div className="text-center p-3 rounded-lg border border-white/50">
                                    <div className="text-lg font-semibold text-foreground">
                                        {aqiData.pollutants.pm10}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        PM10 μg/m³
                                    </div>
                                </div>
                                <div className="text-center p-3 rounded-lg border border-white/50">
                                    <div className="text-lg font-semibold text-foreground">
                                        {aqiData.pollutants.o3}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        O₃ μg/m³
                                    </div>
                                </div>
                                <div className="text-center p-3 rounded-lg border border-white/50">
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
                ) : (
                    <div className="flex flex-col items-center justify-center min-h-[520px] rounded-lg border border-dashed border-muted-foreground/40 text-center">
                        <span className="text-muted-foreground text-lg">
                            {loading
                                ? "Getting air quality data..."
                                : "Air quality data unavailable for this location."}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
