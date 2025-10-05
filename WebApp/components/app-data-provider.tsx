"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AirQualityData {
    aqi: number;
    level: string;
    location: string;
    pollutants: {
        pm25: number;
        pm10: number;
        o3: number;
        no2: number;
    };
    lastUpdated: string;
}

interface WeatherData {
    temperature: number;
    humidity: number;
    windSpeed: number;
    precipitation: number;
    weatherCode: number;
    location: string;
    lastUpdated: string;
}

interface AppDataContextType {
    currentAirQuality: AirQualityData | null;
    currentWeather: WeatherData | null;
    currentLocation: string;
    setCurrentAirQuality: (data: AirQualityData | null) => void;
    setCurrentWeather: (data: WeatherData | null) => void;
    setCurrentLocation: (location: string) => void;
    getContextualData: () => string;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
    const [currentAirQuality, setCurrentAirQuality] = useState<AirQualityData | null>(null);
    const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
    const [currentLocation, setCurrentLocation] = useState<string>("");

    const getContextualData = (): string => {
        const context = [];
        
        if (currentLocation) {
            context.push(`Current location: ${currentLocation}`);
        }
        
        if (currentAirQuality) {
            context.push(`Air Quality: AQI ${currentAirQuality.aqi} (${currentAirQuality.level})`);
            context.push(`Pollutants - PM2.5: ${currentAirQuality.pollutants.pm25}μg/m³, PM10: ${currentAirQuality.pollutants.pm10}μg/m³, O3: ${currentAirQuality.pollutants.o3}μg/m³, NO2: ${currentAirQuality.pollutants.no2}μg/m³`);
        }
        
        if (currentWeather) {
            context.push(`Weather: ${currentWeather.temperature}°C, ${currentWeather.humidity}% humidity, wind speed ${currentWeather.windSpeed} km/h`);
            if (currentWeather.precipitation > 0) {
                context.push(`Precipitation: ${currentWeather.precipitation}mm`);
            }
        }
        
        return context.length > 0 ? context.join(". ") : "";
    };

    return (
        <AppDataContext.Provider
            value={{
                currentAirQuality,
                currentWeather,
                currentLocation,
                setCurrentAirQuality,
                setCurrentWeather,
                setCurrentLocation,
                getContextualData,
            }}
        >
            {children}
        </AppDataContext.Provider>
    );
}

export function useAppData() {
    const context = useContext(AppDataContext);
    if (context === undefined) {
        throw new Error("useAppData must be used within an AppDataProvider");
    }
    return context;
}