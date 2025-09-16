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
    const [weeklyForecast, setWeeklyForecast] = useState<ForecastData[]>([
        {
            date: "2024-01-15",
            day: "Today",
            aqi: 42,
            level: "Good",
            temperature: 18,
            humidity: 65,
            windSpeed: 12,
        },
        {
            date: "2024-01-16",
            day: "Tue",
            aqi: 38,
            level: "Good",
            temperature: 20,
            humidity: 60,
            windSpeed: 15,
        },
        {
            date: "2024-01-17",
            day: "Wed",
            aqi: 55,
            level: "Moderate",
            temperature: 22,
            humidity: 58,
            windSpeed: 8,
        },
        {
            date: "2024-01-18",
            day: "Thu",
            aqi: 48,
            level: "Good",
            temperature: 19,
            humidity: 70,
            windSpeed: 18,
        },
        {
            date: "2024-01-19",
            day: "Fri",
            aqi: 62,
            level: "Moderate",
            temperature: 21,
            humidity: 55,
            windSpeed: 10,
        },
        {
            date: "2024-01-20",
            day: "Sat",
            aqi: 35,
            level: "Good",
            temperature: 17,
            humidity: 75,
            windSpeed: 20,
        },
        {
            date: "2024-01-21",
            day: "Sun",
            aqi: 41,
            level: "Good",
            temperature: 16,
            humidity: 80,
            windSpeed: 14,
        },
    ]);

    // Mock hourly data for today
    const [hourlyForecast, setHourlyForecast] = useState<HourlyData[]>([
        { time: "00:00", aqi: 38, pm25: 8.2, pm10: 15.1, o3: 45.3 },
        { time: "03:00", aqi: 35, pm25: 7.8, pm10: 14.2, o3: 42.1 },
        { time: "06:00", aqi: 42, pm25: 9.1, pm10: 16.8, o3: 48.7 },
        { time: "09:00", aqi: 48, pm25: 10.5, pm10: 18.3, o3: 52.2 },
        { time: "12:00", aqi: 52, pm25: 11.2, pm10: 19.7, o3: 55.8 },
        { time: "15:00", aqi: 45, pm25: 9.8, pm10: 17.4, o3: 49.6 },
        { time: "18:00", aqi: 40, pm25: 8.7, pm10: 15.9, o3: 46.2 },
        { time: "21:00", aqi: 36, pm25: 7.9, pm10: 14.5, o3: 43.8 },
    ]);

    // Update forecast data when location changes
    useEffect(() => {
        if (location) {
            // In a real app, this would fetch forecast data for the new location
            // For now, we'll simulate with random data

            // Generate new weekly forecast
            const newWeeklyForecast = Array.from({ length: 7 }).map(
                (_, index) => {
                    const randomAQI = Math.floor(Math.random() * 80) + 20;
                    const level =
                        randomAQI <= 50
                            ? "Good"
                            : randomAQI <= 100
                            ? "Moderate"
                            : randomAQI <= 150
                            ? "Unhealthy for Sensitive Groups"
                            : "Unhealthy";

                    return {
                        date: new Date(Date.now() + index * 24 * 60 * 60 * 1000)
                            .toISOString()
                            .split("T")[0],
                        day:
                            index === 0
                                ? "Today"
                                : [
                                      "Mon",
                                      "Tue",
                                      "Wed",
                                      "Thu",
                                      "Fri",
                                      "Sat",
                                      "Sun",
                                  ][
                                      new Date(
                                          Date.now() +
                                              index * 24 * 60 * 60 * 1000
                                      ).getDay()
                                  ],
                        aqi: randomAQI,
                        level,
                        temperature: Math.floor(Math.random() * 10) + 15, // 15-25°C
                        humidity: Math.floor(Math.random() * 30) + 50, // 50-80%
                        windSpeed: Math.floor(Math.random() * 15) + 5, // 5-20 km/h
                    };
                }
            );

            setWeeklyForecast(newWeeklyForecast);

            // Generate new hourly forecast
            const newHourlyForecast = Array.from({ length: 8 }).map(
                (_, index) => {
                    const hour = index * 3;
                    const hourString = `${hour.toString().padStart(2, "0")}:00`;
                    const randomAQI = Math.floor(Math.random() * 30) + 30;

                    return {
                        time: hourString,
                        aqi: randomAQI,
                        pm25: Math.round(randomAQI * 0.2 * 10) / 10,
                        pm10: Math.round(randomAQI * 0.4 * 10) / 10,
                        o3: Math.round(randomAQI * 1.1 * 10) / 10,
                    };
                }
            );

            setHourlyForecast(newHourlyForecast);
        }
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
                            7-Day Forecast
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
                            {weeklyForecast.map((day, index) => (
                                <Card
                                    key={index}
                                    className={`${
                                        index === 0 ? "ring-1 ring-primary" : ""
                                    }`}
                                >
                                    <CardContent className="py-2 px-5 md:p-5 flex md:flex-col md:space-y-3 items-center md:items-center justify-between md:justify-center h-full">
                                        {/* AQI - Left on mobile, centered on desktop */}
                                        <div
                                            className={`order-1 md:order-2 w-12 h-12 md:w-16 md:h-16 rounded-full ${getAQIBadgeColor(
                                                day.aqi
                                            )} flex items-center justify-center shadow-sm md:ml-0 shrink-0`}
                                        >
                                            <span className="text-base md:text-lg lg:text-xl font-bold text-white">
                                                {day.aqi}
                                            </span>
                                        </div>

                                        {/* Day and Date - Middle on mobile, top on desktop */}
                                        <div className="order-2 md:order-1 flex flex-col items-start md:items-center md:ml-0 min-w-[56px] w-16 md:w-20 lg:w-24 md:mx-0 ml-4">
                                            <div className="text-sm md:text-base lg:text-lg font-medium text-foreground">
                                                {day.day}
                                            </div>
                                            <div className="text-xs md:text-sm lg:text-base text-muted-foreground">
                                                {day.date.slice(5)}
                                            </div>
                                        </div>

                                        {/* Status and Temperature - Right on mobile, bottom on desktop */}
                                        <div className="order-3 flex flex-col items-end md:items-center min-h-[32px] md:min-h-0 shrink-0 w-[64px] md:w-full text-center">
                                            <div className="text-xs md:text-m lg:text-base text-muted-foreground">
                                                {day.level}
                                            </div>
                                            <div className="text-xs md:text-sm lg:text-base text-muted-foreground">
                                                {day.temperature}°C
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
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
