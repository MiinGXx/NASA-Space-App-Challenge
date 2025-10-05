import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");

        if (!query) {
            return NextResponse.json(
                { error: "Location query parameter 'q' is required" },
                { status: 400 }
            );
        }

        console.log(`🌤️ Weather API called for location: ${query}`);

        // Step 1: Geocode the location
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            query
        )}&count=1&language=en&format=json`;

        const geoRes = await fetch(geoUrl);
        if (!geoRes.ok) {
            throw new Error("Geocoding failed");
        }

        const geoData = await geoRes.json();
        const location = geoData.results?.[0];

        if (!location) {
            return NextResponse.json(
                { error: `Location "${query}" not found` },
                { status: 404 }
            );
        }

        const { latitude, longitude, name } = location;
        console.log(`📍 Found location: ${name} (${latitude}, ${longitude})`);

        // Step 2: Fetch weather data from Open-Meteo
        const weatherParams = new URLSearchParams({
            latitude: String(latitude),
            longitude: String(longitude),
            current_weather: "true",
            hourly: [
                "temperature_2m",
                "relative_humidity_2m",
                "precipitation",
                "weather_code",
                "wind_speed_10m",
                "wind_direction_10m",
            ].join(","),
            daily: [
                "temperature_2m_max",
                "temperature_2m_min",
                "precipitation_sum",
                "weather_code",
            ].join(","),
            timezone: "auto",
        });

        const weatherUrl = `https://api.open-meteo.com/v1/forecast?${weatherParams.toString()}`;
        const weatherRes = await fetch(weatherUrl);

        if (!weatherRes.ok) {
            throw new Error("Weather data fetch failed");
        }

        const weatherData = await weatherRes.json();

        // Step 3: Fetch air quality data from Open-Meteo Air Quality API
        const airQualityParams = new URLSearchParams({
            latitude: String(latitude),
            longitude: String(longitude),
            current: [
                "us_aqi",
                "pm10",
                "pm2_5",
                "carbon_monoxide",
                "nitrogen_dioxide",
                "sulphur_dioxide",
                "ozone",
            ].join(","),
            hourly: [
                "pm10",
                "pm2_5",
                "carbon_monoxide",
                "nitrogen_dioxide",
                "sulphur_dioxide",
                "ozone",
                "us_aqi",
            ].join(","),
            timezone: "auto",
        });

        const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?${airQualityParams.toString()}`;
        const airQualityRes = await fetch(airQualityUrl);

        let airQualityData = null;
        if (airQualityRes.ok) {
            airQualityData = await airQualityRes.json();
            console.log(`✅ Air quality data fetched successfully`);
        } else {
            console.warn(
                `⚠️ Air quality data fetch failed, continuing without it`
            );
        }

        // Return combined response
        const response = {
            location: {
                name,
                latitude,
                longitude,
            },
            weather: weatherData,
            air_quality: airQualityData,
            timestamp: new Date().toISOString(),
        };

        console.log(`✅ Weather data fetched successfully for ${name}`);
        return NextResponse.json(response);
    } catch (error: any) {
        console.error("❌ Error fetching weather data:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch weather data",
                message: error.message,
            },
            { status: 500 }
        );
    }
}
