import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const pollutant = searchParams.get("pollutant") || "aqi";
        const location = searchParams.get("location");

        // For demonstration purposes, we'll generate mock data
        // In a real application, you would fetch data from air quality APIs like:
        // - OpenWeatherMap Air Pollution API
        // - IQAir API
        // - PurpleAir API
        // - EPA AirNow API

        const pollutionData = await generatePollutionData(pollutant, location);

        return NextResponse.json({
            success: true,
            pollutionData,
            metadata: {
                pollutant,
                location,
                timestamp: new Date().toISOString(),
                source: "mock_data", // In real app: "openweathermap", "iqair", etc.
            },
        });
    } catch (error) {
        console.error("Error fetching pollution data:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch pollution data",
                pollutionData: [],
            },
            { status: 500 }
        );
    }
}

async function generatePollutionData(pollutant: string, location?: string | null) {
    // Define base values for different pollutants and cities
    const cities = [
        // Major US cities with typical pollution levels
        { name: "Los Angeles", lat: 34.0522, lng: -118.2437, 
          pollution: { pm25: 25, pm10: 40, o3: 120, no2: 45, aqi: 85 } },
        { name: "New York", lat: 40.7128, lng: -74.0060, 
          pollution: { pm25: 18, pm10: 30, o3: 95, no2: 38, aqi: 68 } },
        { name: "Chicago", lat: 41.8781, lng: -87.6298, 
          pollution: { pm25: 15, pm10: 25, o3: 85, no2: 32, aqi: 58 } },
        { name: "Houston", lat: 29.7604, lng: -95.3698, 
          pollution: { pm25: 22, pm10: 35, o3: 110, no2: 42, aqi: 78 } },
        { name: "Phoenix", lat: 33.4484, lng: -112.0740, 
          pollution: { pm25: 20, pm10: 45, o3: 105, no2: 28, aqi: 72 } },
        { name: "Philadelphia", lat: 39.9526, lng: -75.1652, 
          pollution: { pm25: 16, pm10: 28, o3: 88, no2: 35, aqi: 62 } },
        { name: "San Antonio", lat: 29.4241, lng: -98.4936, 
          pollution: { pm25: 14, pm10: 22, o3: 92, no2: 25, aqi: 55 } },
        { name: "San Diego", lat: 32.7157, lng: -117.1611, 
          pollution: { pm25: 12, pm10: 18, o3: 78, no2: 22, aqi: 48 } },
        { name: "Dallas", lat: 32.7767, lng: -96.7970, 
          pollution: { pm25: 19, pm10: 32, o3: 98, no2: 36, aqi: 65 } },
        { name: "San Jose", lat: 37.3382, lng: -121.8863, 
          pollution: { pm25: 13, pm10: 20, o3: 82, no2: 24, aqi: 52 } },
        { name: "Austin", lat: 30.2672, lng: -97.7431, 
          pollution: { pm25: 16, pm10: 26, o3: 89, no2: 29, aqi: 58 } },
        { name: "Jacksonville", lat: 30.3322, lng: -81.6557, 
          pollution: { pm25: 11, pm10: 17, o3: 75, no2: 20, aqi: 45 } },
        { name: "San Francisco", lat: 37.7749, lng: -122.4194, 
          pollution: { pm25: 10, pm10: 15, o3: 70, no2: 18, aqi: 42 } },
        { name: "Columbus", lat: 39.9612, lng: -82.9988, 
          pollution: { pm25: 14, pm10: 23, o3: 84, no2: 27, aqi: 54 } },
        { name: "Fort Worth", lat: 32.7555, lng: -97.3308, 
          pollution: { pm25: 18, pm10: 30, o3: 95, no2: 34, aqi: 63 } },
        { name: "Charlotte", lat: 35.2271, lng: -80.8431, 
          pollution: { pm25: 13, pm10: 21, o3: 81, no2: 26, aqi: 51 } },
        { name: "Seattle", lat: 47.6062, lng: -122.3321, 
          pollution: { pm25: 9, pm10: 14, o3: 68, no2: 16, aqi: 38 } },
        { name: "Denver", lat: 39.7392, lng: -104.9903, 
          pollution: { pm25: 12, pm10: 19, o3: 95, no2: 21, aqi: 49 } },
        { name: "El Paso", lat: 31.7619, lng: -106.4850, 
          pollution: { pm25: 17, pm10: 38, o3: 88, no2: 23, aqi: 61 } },
        { name: "Detroit", lat: 42.3314, lng: -83.0458, 
          pollution: { pm25: 16, pm10: 27, o3: 86, no2: 31, aqi: 59 } },
    ];

    const pollutionData = [];

    // If a specific location is requested, focus on that area
    if (location) {
        const targetCity = cities.find(city => 
            city.name.toLowerCase().includes(location.toLowerCase()) ||
            location.toLowerCase().includes(city.name.toLowerCase())
        );

        if (targetCity) {
            // Generate detailed data around the target city
            for (let i = 0; i < 20; i++) {
                const offsetLat = (Math.random() - 0.5) * 0.5; // ±0.25 degrees
                const offsetLng = (Math.random() - 0.5) * 0.5;
                const variance = 0.7 + Math.random() * 0.6; // 0.7-1.3 multiplier
                
                pollutionData.push({
                    lat: targetCity.lat + offsetLat,
                    lng: targetCity.lng + offsetLng,
                    value: targetCity.pollution[pollutant as keyof typeof targetCity.pollution] * variance,
                    pollutantType: pollutant,
                    location: i === 0 ? targetCity.name : undefined,
                    timestamp: new Date().toISOString(),
                });
            }
        }
    }

    // Always include data for major cities
    cities.forEach(city => {
        // Add main city point
        pollutionData.push({
            lat: city.lat,
            lng: city.lng,
            value: city.pollution[pollutant as keyof typeof city.pollution],
            pollutantType: pollutant,
            location: city.name,
            timestamp: new Date().toISOString(),
        });

        // Add surrounding points for better heatmap visualization
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * 2 * Math.PI;
            const distance = 0.1 + Math.random() * 0.3; // 0.1-0.4 degrees
            const offsetLat = Math.sin(angle) * distance;
            const offsetLng = Math.cos(angle) * distance;
            const variance = 0.6 + Math.random() * 0.8; // 0.6-1.4 multiplier
            
            pollutionData.push({
                lat: city.lat + offsetLat,
                lng: city.lng + offsetLng,
                value: city.pollution[pollutant as keyof typeof city.pollution] * variance,
                pollutantType: pollutant,
                timestamp: new Date().toISOString(),
            });
        }
    });

    // Add some random points across the US for broader coverage
    for (let i = 0; i < 30; i++) {
        const lat = 25 + Math.random() * 20; // Roughly US latitude range
        const lng = -125 + Math.random() * 55; // Roughly US longitude range
        
        // Base pollution values for rural/random areas
        const basePollution = {
            pm25: 5 + Math.random() * 15,
            pm10: 8 + Math.random() * 20,
            o3: 60 + Math.random() * 40,
            no2: 10 + Math.random() * 20,
            aqi: 30 + Math.random() * 40,
        };

        pollutionData.push({
            lat,
            lng,
            value: basePollution[pollutant as keyof typeof basePollution],
            pollutantType: pollutant,
            timestamp: new Date().toISOString(),
        });
    }

    return pollutionData;
}

// For future implementation with real APIs:
/*
async function fetchRealPollutionData(pollutant: string, location?: string | null) {
    // Example implementation for OpenWeatherMap Air Pollution API
    const API_KEY = process.env.OPENWEATHER_API_KEY;
    
    if (!API_KEY) {
        throw new Error("OpenWeatherMap API key not configured");
    }

    // If location is provided, geocode it first
    let coordinates = [];
    if (location) {
        const geocodeResponse = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${API_KEY}`
        );
        const geocodeData = await geocodeResponse.json();
        if (geocodeData.length > 0) {
            coordinates.push({ lat: geocodeData[0].lat, lon: geocodeData[0].lon });
        }
    }

    // Add major US cities
    const majorCities = [
        { lat: 40.7128, lon: -74.0060 }, // New York
        { lat: 34.0522, lon: -118.2437 }, // Los Angeles
        { lat: 41.8781, lon: -87.6298 }, // Chicago
        // ... more cities
    ];

    const pollutionData = [];
    
    for (const coord of [...coordinates, ...majorCities]) {
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/air_pollution?lat=${coord.lat}&lon=${coord.lon}&appid=${API_KEY}`
            );
            const data = await response.json();
            
            if (data.list && data.list.length > 0) {
                const pollution = data.list[0];
                pollutionData.push({
                    lat: coord.lat,
                    lng: coord.lon,
                    value: pollution.components[pollutant] || pollution.main.aqi,
                    pollutantType: pollutant,
                    timestamp: new Date(pollution.dt * 1000).toISOString(),
                });
            }
        } catch (error) {
            console.error(`Error fetching pollution data for ${coord.lat}, ${coord.lon}:`, error);
        }
    }

    return pollutionData;
}
*/