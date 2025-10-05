import { NextRequest, NextResponse } from "next/server";

// US State Capitals with coordinates
const US_STATE_CAPITALS = [
    { name: "Montgomery, Alabama", lat: 32.361538, lng: -86.279118 },
    { name: "Juneau, Alaska", lat: 58.301935, lng: -134.419740 },
    { name: "Phoenix, Arizona", lat: 33.448457, lng: -112.073844 },
    { name: "Little Rock, Arkansas", lat: 34.736009, lng: -92.331122 },
    { name: "Sacramento, California", lat: 38.576668, lng: -121.493629 },
    { name: "Denver, Colorado", lat: 39.739236, lng: -104.990251 },
    { name: "Hartford, Connecticut", lat: 41.767, lng: -72.677 },
    { name: "Dover, Delaware", lat: 39.161921, lng: -75.526755 },
    { name: "Tallahassee, Florida", lat: 30.4518, lng: -84.27277 },
    { name: "Atlanta, Georgia", lat: 33.76, lng: -84.39 },
    { name: "Honolulu, Hawaii", lat: 21.30895, lng: -157.826182 },
    { name: "Boise, Idaho", lat: 43.613739, lng: -116.237651 },
    { name: "Springfield, Illinois", lat: 39.78325, lng: -89.650373 },
    { name: "Indianapolis, Indiana", lat: 39.790942, lng: -86.147685 },
    { name: "Des Moines, Iowa", lat: 41.590939, lng: -93.620866 },
    { name: "Topeka, Kansas", lat: 39.04, lng: -95.69 },
    { name: "Frankfort, Kentucky", lat: 38.194, lng: -84.86311 },
    { name: "Baton Rouge, Louisiana", lat: 30.45809, lng: -91.140229 },
    { name: "Augusta, Maine", lat: 44.323535, lng: -69.765261 },
    { name: "Annapolis, Maryland", lat: 38.972945, lng: -76.501157 },
    { name: "Boston, Massachusetts", lat: 42.2352, lng: -71.0275 },
    { name: "Lansing, Michigan", lat: 42.354558, lng: -84.955255 },
    { name: "Saint Paul, Minnesota", lat: 44.95, lng: -93.094 },
    { name: "Jackson, Mississippi", lat: 32.320, lng: -90.207 },
    { name: "Jefferson City, Missouri", lat: 38.572954, lng: -92.189283 },
    { name: "Helena, Montana", lat: 46.595805, lng: -112.027031 },
    { name: "Lincoln, Nebraska", lat: 40.809868, lng: -96.675345 },
    { name: "Carson City, Nevada", lat: 39.161921, lng: -119.767409 },
    { name: "Concord, New Hampshire", lat: 43.220093, lng: -71.549896 },
    { name: "Trenton, New Jersey", lat: 40.221741, lng: -74.756138 },
    { name: "Santa Fe, New Mexico", lat: 35.667231, lng: -105.964575 },
    { name: "Albany, New York", lat: 42.659829, lng: -73.781339 },
    { name: "Raleigh, North Carolina", lat: 35.771, lng: -78.638 },
    { name: "Bismarck, North Dakota", lat: 46.813343, lng: -100.779004 },
    { name: "Columbus, Ohio", lat: 39.961176, lng: -82.998794 },
    { name: "Oklahoma City, Oklahoma", lat: 35.482309, lng: -97.534994 },
    { name: "Salem, Oregon", lat: 44.931109, lng: -123.029159 },
    { name: "Harrisburg, Pennsylvania", lat: 40.269789, lng: -76.875613 },
    { name: "Providence, Rhode Island", lat: 41.82355, lng: -71.422132 },
    { name: "Columbia, South Carolina", lat: 34.000, lng: -81.035 },
    { name: "Pierre, South Dakota", lat: 44.367966, lng: -100.336378 },
    { name: "Nashville, Tennessee", lat: 36.165, lng: -86.784 },
    { name: "Austin, Texas", lat: 30.266667, lng: -97.75 },
    { name: "Salt Lake City, Utah", lat: 40.777477, lng: -111.888237 },
    { name: "Montpelier, Vermont", lat: 44.26639, lng: -72.58133 },
    { name: "Richmond, Virginia", lat: 37.54, lng: -77.46 },
    { name: "Olympia, Washington", lat: 47.042418, lng: -122.893077 },
    { name: "Charleston, West Virginia", lat: 38.349497, lng: -81.633294 },
    { name: "Madison, Wisconsin", lat: 43.074722, lng: -89.384444 },
    { name: "Cheyenne, Wyoming", lat: 41.145548, lng: -104.802042 }
];

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const pollutant = searchParams.get("pollutant") || "aqi";
        const location = searchParams.get("location");
        const debug = searchParams.get("debug") === "true";

        console.log(`🌍 Pollution API called: pollutant=${pollutant}, location=${location || 'all'}, debug=${debug}`);
        console.log(`📊 Total state capitals available: ${US_STATE_CAPITALS.length}`);

        // Fetch real pollution data from Open Meteo for US state capitals
        const pollutionData = await fetchOpenMeteoPollutionData(pollutant, location);

        const response = {
            success: true,
            pollutionData,
            metadata: {
                pollutant,
                location,
                timestamp: new Date().toISOString(),
                source: "open_meteo_air_quality",
                totalRequested: location ? 
                    US_STATE_CAPITALS.filter(capital => 
                        capital.name.toLowerCase().includes(location.toLowerCase())
                    ).length : US_STATE_CAPITALS.length,
                totalReceived: pollutionData.length
            },
        };

        if (debug) {
            console.log(`📈 Debug info:`, response.metadata);
            console.log(`📍 Sample data points:`, pollutionData.slice(0, 3));
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error("❌ Error fetching pollution data:", error);
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

async function fetchOpenMeteoPollutionData(pollutant: string, location?: string | null) {
    // Helper function to calculate AQI from PM values (same logic as weather API)
    function aqiFromPM25(c: number): number | null {
        if (c === null || c === undefined || isNaN(c)) return null;
        const pm25Breakpoints: Array<[number, number, number, number]> = [
            [0.0, 12.0, 0, 50],
            [12.1, 35.4, 51, 100],
            [35.5, 55.4, 101, 150],
            [55.5, 150.4, 151, 200],
            [150.5, 250.4, 201, 300],
            [250.5, 350.4, 301, 400],
            [350.5, 500.4, 401, 500],
        ];
        
        if (c > 500.4) return 500;
        
        for (const [Clow, Chigh, Ilow, Ihigh] of pm25Breakpoints) {
            if (c >= Clow && c <= Chigh) {
                return Math.round(((Ihigh - Ilow) / (Chigh - Clow)) * (c - Clow) + Ilow);
            }
        }
        return null;
    }

    function aqiFromPM10(c: number): number | null {
        if (c === null || c === undefined || isNaN(c)) return null;
        const pm10Breakpoints: Array<[number, number, number, number]> = [
            [0, 54, 0, 50],
            [55, 154, 51, 100],
            [155, 254, 101, 150],
            [255, 354, 151, 200],
            [355, 424, 201, 300],
            [425, 504, 301, 400],
            [505, 604, 401, 500],
        ];
        
        if (c > 604) return 500;
        
        for (const [Clow, Chigh, Ilow, Ihigh] of pm10Breakpoints) {
            if (c >= Clow && c <= Chigh) {
                return Math.round(((Ihigh - Ilow) / (Chigh - Clow)) * (c - Clow) + Ilow);
            }
        }
        return null;
    }

    // Filter state capitals by location if specified
    let capitalsList = US_STATE_CAPITALS;
    if (location) {
        capitalsList = US_STATE_CAPITALS.filter(capital => 
            capital.name.toLowerCase().includes(location.toLowerCase())
        );
        if (capitalsList.length === 0) {
            capitalsList = US_STATE_CAPITALS; // Fall back to all capitals if no match
        }
    }

    // Fetch air quality data for each state capital
    console.log(`Fetching pollution data for ${capitalsList.length} capitals...`);
    
    // Add delays between batches to avoid rate limiting
    const batchSize = 10;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    const results: any[] = [];
    
    for (let i = 0; i < capitalsList.length; i += batchSize) {
        const batch = capitalsList.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (capital) => {
            try {
                const params = new URLSearchParams({
                    latitude: String(capital.lat),
                    longitude: String(capital.lng),
                    current: ["us_aqi", "pm10", "pm2_5", "nitrogen_dioxide", "ozone"].join(","),
                    timezone: "auto",
                });

                const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`;
                
                // Create a timeout promise
                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error('Request timeout')), 8000);
                });
                
                const fetchPromise = fetch(aqUrl, {
                    headers: {
                        'User-Agent': 'NASA-Space-App-Challenge/1.0'
                    }
                });
                
                const response = await Promise.race([fetchPromise, timeoutPromise]);
                
                if (!response.ok) {
                    if (response.status === 429) {
                        console.warn(`⏳ Rate limited for ${capital.name}, will retry in next batch`);
                    } else {
                        console.warn(`❌ Failed to fetch data for ${capital.name}: ${response.status} ${response.statusText}`);
                    }
                    return null;
                }
                
                const data = await response.json();
                
                if (data.current) {
                    const currentData = data.current;
                    
                    // Extract pollutant values
                    const pm25 = currentData.pm2_5 || null;
                    const pm10 = currentData.pm10 || null;
                    const no2 = currentData.nitrogen_dioxide || null;
                    const o3 = currentData.ozone || null;
                    let aqi = currentData.us_aqi || null;
                    
                    // Calculate AQI if not provided
                    if (!aqi && (pm25 || pm10)) {
                        const aqi25 = pm25 ? aqiFromPM25(pm25) : null;
                        const aqi10 = pm10 ? aqiFromPM10(pm10) : null;
                        aqi = Math.max(aqi25 || 0, aqi10 || 0) || null;
                    }
                    
                    // Get the value for the requested pollutant
                    let value = 0;
                    switch (pollutant) {
                        case "pm25":
                            value = pm25 || 0;
                            break;
                        case "pm10":
                            value = pm10 || 0;
                            break;
                        case "no2":
                            value = no2 || 0;
                            break;
                        case "o3":
                            value = o3 || 0;
                            break;
                        case "aqi":
                        default:
                            value = aqi || 0;
                            break;
                    }
                    
                    console.log(`✓ Successfully fetched data for ${capital.name}: ${pollutant}=${value}`);
                    
                    return {
                        lat: capital.lat,
                        lng: capital.lng,
                        value: value,
                        pollutantType: pollutant,
                        location: capital.name,
                        timestamp: new Date().toISOString(),
                        rawData: {
                            pm25,
                            pm10,
                            no2,
                            o3,
                            aqi
                        }
                    };
                } else {
                    console.warn(`⚠️ No current data available for ${capital.name}`);
                    return null;
                }
            } catch (error) {
                console.error(`❌ Error fetching data for ${capital.name}:`, error);
                return null;
            }
        });

        // Wait for this batch to complete
        const batchResults = await Promise.allSettled(batchPromises);
        
        // Extract successful results
        const successfulBatchResults = batchResults
            .filter((result): result is PromiseFulfilledResult<any> => 
                result.status === 'fulfilled' && result.value !== null
            )
            .map(result => result.value);
        
        results.push(...successfulBatchResults);
        
        // Add delay between batches to avoid rate limiting (except for last batch)
        if (i + batchSize < capitalsList.length) {
            console.log(`⏸️ Waiting 1 second before next batch...`);
            await delay(1000);
        }
    }
    
    console.log(`✅ Successfully fetched data for ${results.length}/${capitalsList.length} capitals`);
    
    // Log any failures
    const failedCount = capitalsList.length - results.length;
    if (failedCount > 0) {
        console.warn(`⚠️ Failed to fetch data for ${failedCount} capitals (likely due to rate limiting)`);
    }

    return results;
}