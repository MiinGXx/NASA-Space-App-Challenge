"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from "recharts";
import { TrendingUp, Calendar, Clock } from "lucide-react";
import { useState, useEffect } from "react";

interface ForecastData {
    date: string;
    day: string;
    aqi: number;
    level: string;
    temperature: number;
    humidity: number;
    windSpeed: number;
}

interface HourlyData {
    time: string;
    aqi: number;
    pm25: number;
    pm10: number;
    o3: number;
}

interface ForecastPanelProps {
    location?: string;
}

export function ForecastPanel({ location }: ForecastPanelProps) {
    // State for forecast data
    const [weeklyForecast, setWeeklyForecast] = useState<ForecastData[]>([]);

    // Hourly data for charts
    const [hourlyForecast, setHourlyForecast] = useState<HourlyData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Update forecast data when location changes (or on mount). If no location is provided,
    // call the API without a query so the server can use its default.
    useEffect(() => {
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const url = location
                    ? `/api/weather?q=${encodeURIComponent(location)}`
                    : `/api/weather`;
                const res = await fetch(url);
                if (!res.ok) throw new Error("Failed to fetch weather");
                const data = await res.json();

                // Hourly (weather + air quality)
                const hourly = data.weather.hourly || {};
                const times: string[] = hourly.time || [];
                const temps: number[] = hourly.temperature_2m || [];
                const hums: number[] = hourly.relative_humidity_2m || [];
                const winds: number[] = hourly.wind_speed_10m || [];

                // air quality hourly arrays live in data.air_quality.hourly
                const airHourly = data.air_quality?.hourly || {};
                const aqTimes: string[] = airHourly.time || [];
                const aqPm25: number[] = airHourly.pm2_5 || [];
                const aqPm10: number[] = airHourly.pm10 || [];
                // prefer provider us_aqi, fall back to computed aqi if available
                const aqAqi: (number | null)[] =
                    airHourly.us_aqi || airHourly.aqi || [];

                // If the air-quality times exist and differ from weather times, prefer air times
                const timeSource = aqTimes && aqTimes.length ? aqTimes : times;

                const newHourly: HourlyData[] = timeSource
                    .slice(0, 24)
                    .map((t: string, i: number) => {
                        // try to find matching weather index by timestamp
                        let weatherIdx = i;
                        if (times && times.length && t && times[0]) {
                            const iso = t.length > 10 ? t.slice(0, 19) : t;
                            const found = times.indexOf(t);
                            if (found >= 0) weatherIdx = found;
                        }

                        return {
                            time: new Date(t).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            }),
                            aqi: aqAqi?.[i] != null ? Number(aqAqi[i]) : 0,
                            pm25: Math.round((aqPm25?.[i] || 0) * 10) / 10,
                            pm10: Math.round((aqPm10?.[i] || 0) * 10) / 10,
                            o3:
                                Math.round((airHourly.ozone?.[i] || 0) * 10) /
                                10,
                        };
                    });

                setHourlyForecast(newHourly);

                // Daily
                const daily = data.weather.daily || {};
                const dTimes: string[] = daily.time || [];
                const tMax: number[] = daily.temperature_2m_max || [];
                const tMin: number[] = daily.temperature_2m_min || [];

                // helper to get YYYY-MM-DD from ISO string
                const isoDay = (iso: string) => iso.slice(0, 10);

                const newWeekly: ForecastData[] = dTimes
                    .slice(0, 7)
                    .map((d: string, i: number) => {
                        // find hourly indices that match this day in air quality times
                        const dayKey = d;
                        const indices = aqTimes
                            .map((at, idx) => ({ at, idx }))
                            .filter(({ at }) => isoDay(at) === dayKey)
                            .map(({ idx }) => idx);

                        // compute daily AQI as the max AQI value for the day (or 0)
                        let dayAqi = 0;
                        if (indices.length && aqAqi && aqAqi.length) {
                            const vals = indices.map((ii) =>
                                aqAqi[ii] != null ? Number(aqAqi[ii]) : 0
                            );
                            dayAqi = vals.length ? Math.max(...vals) : 0;
                        }

                        // map AQI to level
                        const getAQILevelLocal = (value: number) => {
                            if (value <= 50) return "Good";
                            if (value <= 100) return "Moderate";
                            if (value <= 150)
                                return "Unhealthy for Sensitive Groups";
                            if (value <= 200) return "Unhealthy";
                            if (value <= 300) return "Very Unhealthy";
                            return "Hazardous";
                        };

                        return {
                            date: d,
                            day:
                                i === 0
                                    ? "Today"
                                    : new Date(d).toLocaleDateString(
                                          undefined,
                                          { weekday: "short" }
                                      ),
                            aqi: dayAqi,
                            level: getAQILevelLocal(dayAqi),
                            temperature: Math.round(
                                ((tMax[i] || 0) + (tMin[i] || 0)) / 2
                            ),
                            humidity: Math.round(hums?.[i] || 0),
                            windSpeed: Math.round(winds?.[i] || 0),
                        };
                    });

                // Sort so Sunday is first, Saturday is last
                const weekDays = [
                    "Sunday",
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                ];
                const sortedWeekly = [...newWeekly].sort((a, b) => {
                    const aIdx = weekDays.indexOf(
                        a.day === "Today"
                            ? new Date(a.date).toLocaleDateString(undefined, {
                                  weekday: "long",
                              })
                            : a.day
                    );
                    const bIdx = weekDays.indexOf(
                        b.day === "Today"
                            ? new Date(b.date).toLocaleDateString(undefined, {
                                  weekday: "long",
                              })
                            : b.day
                    );
                    return aIdx - bIdx;
                });
                setWeeklyForecast(sortedWeekly);

                setWeeklyForecast(newWeekly);
            } catch (e: any) {
                console.error(e);
                setError(e.message || "Failed to load data");
            } finally {
                setLoading(false);
            }
        })();
    }, [location]);

    const getAQIColor = (value: number) => {
        if (value <= 50) return "#10b981"; // green-500
        if (value <= 100) return "#f59e0b"; // yellow-500
        if (value <= 150) return "#f97316"; // orange-500
        if (value <= 200) return "#ef4444"; // red-500
        if (value <= 300) return "#8b5cf6"; // purple-500
        return "#7f1d1d"; // red-900
    };

    const getAQIBadgeColor = (value: number) => {
        if (value <= 50) return "bg-green-500";
        if (value <= 100) return "bg-yellow-500";
        if (value <= 150) return "bg-orange-500";
        if (value <= 200) return "bg-red-500";
        if (value <= 300) return "bg-purple-500";
        return "bg-red-900";
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-card border rounded-lg p-3 shadow-lg">
                    <p className="font-medium text-foreground">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p
                            key={index}
                            className="text-sm"
                            style={{ color: entry.color }}
                        >
                            {entry.name}: {entry.value}
                            {entry.name === "AQI"
                                ? ""
                                : entry.name.includes("PM") ||
                                  entry.name.includes("O")
                                ? " μg/m³"
                                : ""}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Air Quality Forecast
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="weekly" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger
                            value="weekly"
                            className="flex items-center gap-2"
                        >
                            <Calendar className="h-4 w-4" />
                            Forecast
                        </TabsTrigger>
                        <TabsTrigger
                            value="hourly"
                            className="flex items-center gap-2"
                        >
                            <Clock className="h-4 w-4" />
                            Today's Hourly
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="weekly" className="space-y-6">
                        {/* Weekly Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 md:gap-4">
                            {weeklyForecast.map((day, index) => {
                                const isNoForecast = day.aqi === 0;
                                return (
                                    <Card
                                        key={index}
                                        className={`
                                            ${
                                                index === 0
                                                    ? "ring-1 ring-primary"
                                                    : ""
                                            }
                                            ${
                                                isNoForecast
                                                    ? "opacity-60 grayscale bg-muted border-dashed border-muted-foreground/40"
                                                    : ""
                                            }
                                        `}
                                    >
                                        <CardContent className="py-2 px-5 md:p-5 flex md:flex-col md:space-y-3 items-center md:items-center justify-between md:justify-center h-full">
                                            {/* AQI - Left on mobile, centered on desktop */}
                                            <div
                                                className={`order-1 md:order-2 w-12 h-12 md:w-16 md:h-16 rounded-full ${
                                                    isNoForecast
                                                        ? "bg-muted-foreground/30"
                                                        : getAQIBadgeColor(
                                                              day.aqi
                                                          )
                                                } flex items-center justify-center shadow-sm md:ml-0 shrink-0`}
                                            >
                                                <span
                                                    className={`text-base md:text-lg lg:text-xl font-bold ${
                                                        isNoForecast
                                                            ? "text-muted-foreground"
                                                            : "text-white"
                                                    }`}
                                                >
                                                    {day.aqi}
                                                </span>
                                            </div>

                                            {/* Day and Date - Middle on mobile, top on desktop */}
                                            <div className="order-2 md:order-1 flex flex-col items-start md:items-center md:ml-0 min-w-[56px] w-16 md:w-20 lg:w-24 md:mx-0 ml-4">
                                                <div
                                                    className={`text-sm md:text-base lg:text-lg font-medium ${
                                                        isNoForecast
                                                            ? "text-muted-foreground"
                                                            : "text-foreground"
                                                    }`}
                                                >
                                                    {day.day}
                                                </div>
                                                <div className="text-xs md:text-sm lg:text-base text-muted-foreground">
                                                    {day.date.slice(5)}
                                                </div>
                                            </div>

                                            {/* Status and Temperature - Right on mobile, bottom on desktop */}
                                            <div className="order-3 flex flex-col items-end md:items-center min-h-[32px] md:min-h-0 shrink-0 w-[64px] md:w-full text-center">
                                                <div
                                                    className={`text-xs md:text-m lg:text-base ${
                                                        isNoForecast
                                                            ? "text-muted-foreground"
                                                            : "text-muted-foreground"
                                                    }`}
                                                >
                                                    {isNoForecast
                                                        ? "No forecast"
                                                        : day.level}
                                                </div>
                                                <div
                                                    className={`text-xs md:text-sm lg:text-base ${
                                                        isNoForecast
                                                            ? "text-muted-foreground"
                                                            : "text-muted-foreground"
                                                    }`}
                                                >
                                                    {isNoForecast
                                                        ? "--"
                                                        : `${day.temperature}°C`}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        {/* Weekly Chart */}
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={weeklyForecast}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        className="opacity-30"
                                    />
                                    <XAxis dataKey="day" className="text-xs" />
                                    <YAxis className="text-xs" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line
                                        type="monotone"
                                        dataKey="aqi"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        dot={{
                                            fill: "#6366f1",
                                            strokeWidth: 2,
                                            r: 4,
                                        }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </TabsContent>

                    <TabsContent value="hourly" className="space-y-6">
                        {/* Hourly AQI Chart */}
                        <div className="h-64">
                            <h4 className="text-sm font-medium text-foreground mb-4">
                                AQI Throughout the Day
                            </h4>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={hourlyForecast}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        className="opacity-30"
                                    />
                                    <XAxis dataKey="time" className="text-xs" />
                                    <YAxis className="text-xs" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line
                                        type="monotone"
                                        dataKey="aqi"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        dot={{
                                            fill: "#10b981",
                                            strokeWidth: 2,
                                            r: 3,
                                        }}
                                        name="AQI"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Pollutant Breakdown Chart */}
                        <div className="h-64">
                            <h4 className="text-sm font-medium text-foreground mb-4">
                                Pollutant Levels (μg/m³)
                            </h4>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={hourlyForecast}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        className="opacity-30"
                                    />
                                    <XAxis dataKey="time" className="text-xs" />
                                    <YAxis className="text-xs" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar
                                        dataKey="pm25"
                                        fill="#f59e0b"
                                        name="PM2.5"
                                    />
                                    <Bar
                                        dataKey="pm10"
                                        fill="#ef4444"
                                        name="PM10"
                                    />
                                    <Bar
                                        dataKey="o3"
                                        fill="#8b5cf6"
                                        name="O₃"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Current Conditions Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                                <CardContent className="p-4 text-center">
                                    <div className="text-2xl font-bold text-foreground">
                                        65%
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Humidity
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 text-center">
                                    <div className="text-2xl font-bold text-foreground">
                                        12
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Wind Speed (km/h)
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 text-center">
                                    <div className="text-2xl font-bold text-foreground">
                                        18°C
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Temperature
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
