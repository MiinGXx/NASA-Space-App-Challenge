import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "Kuala Lumpur";

  // 1) Geocode
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    q
  )}&count=1&language=en&format=json`;
  const geoRes = await fetch(geoUrl);
  if (!geoRes.ok) return NextResponse.json({ error: "Geocoding failed" }, { status: 500 });
  const geo = await geoRes.json();
  const first = (geo.results && geo.results[0]) || null;
  if (!first) return NextResponse.json({ error: "No geocoding results" }, { status: 404 });

  const lat = first.latitude;
  const lon = first.longitude;

  // 2) Forecast
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: ["temperature_2m", "relative_humidity_2m", "wind_speed_10m"].join(","),
    daily: ["temperature_2m_max", "temperature_2m_min", "weathercode"].join(","),
    current_weather: "true",
    timezone: "auto",
  });

  const forecastUrl = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  const weatherRes = await fetch(forecastUrl);
  if (!weatherRes.ok) return NextResponse.json({ error: "Forecast fetch failed" }, { status: 500 });
  const weather = await weatherRes.json();

  // 3) Air quality (request pm10, pm2_5 and us_aqi when available)
  const aqParams = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    // request additional pollutants: nitrogen_dioxide, carbon_monoxide, ozone
    hourly: [
      "pm10",
      "pm2_5",
      "us_aqi",
      "nitrogen_dioxide",
      "carbon_monoxide",
      "ozone",
    ].join(","),
    // request a US AQI value in the `current` block if available and UV indices
    current: ["us_aqi", "uv_index", "uv_index_clear_sky"].join(","),
    // include a short forecast window
    forecast_days: "1",
    timezone: "auto",
  });
  const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?${aqParams.toString()}`;
  const aqRes = await fetch(aqUrl);
  let air_quality = null;
  if (aqRes.ok) {
    air_quality = await aqRes.json();
  }

  // --- EPA AQI calculation helpers (PM2.5 and PM10) ---
  function computeAQIFromBreakpoints(c: number, breakpoints: Array<[number, number, number, number]>) {
    // breakpoints: [Clow, Chigh, Ilow, Ihigh]
    if (c === null || c === undefined || isNaN(c)) return null;
    // Cap to maximum supported concentration
    const last = breakpoints[breakpoints.length - 1];
    const maxC = last[1];
    if (c > maxC) return 500;

    for (const [Clow, Chigh, Ilow, Ihigh] of breakpoints) {
      if (c >= Clow && c <= Chigh) {
        const aqi = Math.round(((Ihigh - Ilow) / (Chigh - Clow)) * (c - Clow) + Ilow);
        return aqi;
      }
    }
    return null;
  }

  function aqiFromPM25(c: number) {
    const pm25Breakpoints: Array<[number, number, number, number]> = [
      [0.0, 12.0, 0, 50],
      [12.1, 35.4, 51, 100],
      [35.5, 55.4, 101, 150],
      [55.5, 150.4, 151, 200],
      [150.5, 250.4, 201, 300],
      [250.5, 350.4, 301, 400],
      [350.5, 500.4, 401, 500],
    ];
    return computeAQIFromBreakpoints(c, pm25Breakpoints);
  }

  function aqiFromPM10(c: number) {
    const pm10Breakpoints: Array<[number, number, number, number]> = [
      [0, 54, 0, 50],
      [55, 154, 51, 100],
      [155, 254, 101, 150],
      [255, 354, 151, 200],
      [355, 424, 201, 300],
      [425, 504, 301, 400],
      [505, 604, 401, 500],
    ];
    return computeAQIFromBreakpoints(c, pm10Breakpoints);
  }

  // If we have hourly pollutant series or precomputed US AQI, compute/attach an hourly AQI.
  if (air_quality && air_quality.hourly && Array.isArray(air_quality.hourly.time)) {
    const times: string[] = air_quality.hourly.time;

    // If the API returned a US AQI series, prefer that directly
    const usAqiArr: (number | null)[] | undefined = air_quality.hourly.us_aqi;
    if (usAqiArr && Array.isArray(usAqiArr) && usAqiArr.length === times.length) {
      // normalize to numbers or nulls
      air_quality.hourly.aqi = usAqiArr.map((v: any) => (v == null ? null : Number(v)));
      // prefer current.us_aqi if present
      const aqiCurrentFromCurrent = air_quality.current?.us_aqi ?? null;
      if (aqiCurrentFromCurrent != null) {
        (air_quality as any).aqi_current = Number(aqiCurrentFromCurrent);
      } else {
        // find nearest hour index
        let nearestIdx = 0;
        let minDiff = Infinity;
        const now = Date.now();
        for (let i = 0; i < times.length; i++) {
          const t = Date.parse(times[i]);
          if (isNaN(t)) continue;
          const diff = Math.abs(t - now);
          if (diff < minDiff) {
            minDiff = diff;
            nearestIdx = i;
          }
        }
        (air_quality as any).aqi_current = air_quality.hourly.aqi[nearestIdx] ?? null;
      }
    } else {
      // Fall back to computing AQI from pm2_5 and pm10 if us_aqi isn't available
      const pm25Arr: (number | null)[] | undefined = air_quality.hourly.pm2_5;
      const pm10Arr: (number | null)[] | undefined = air_quality.hourly.pm10;

      const aqiHourly: (number | null)[] = times.map((_, i) => {
        const c25 = pm25Arr && pm25Arr[i] != null ? Number(pm25Arr[i]) : null;
        const c10 = pm10Arr && pm10Arr[i] != null ? Number(pm10Arr[i]) : null;
        const a25 = c25 != null ? aqiFromPM25(c25) : null;
        const a10 = c10 != null ? aqiFromPM10(c10) : null;
        if (a25 == null && a10 == null) return null;
        return Math.max(a25 ?? 0, a10 ?? 0);
      });

      // find nearest hour index to now
      let nearestIdx = 0;
      let minDiff = Infinity;
      const now = Date.now();
      for (let i = 0; i < times.length; i++) {
        const t = Date.parse(times[i]);
        if (isNaN(t)) continue;
        const diff = Math.abs(t - now);
        if (diff < minDiff) {
          minDiff = diff;
          nearestIdx = i;
        }
      }

      const aqiCurrent = aqiHourly[nearestIdx] ?? null;

      // attach
      air_quality.hourly.aqi = aqiHourly;
      (air_quality as any).aqi_current = aqiCurrent;
    }
  }

  const payload = {
    query: q,
    geocoding: first,
    weather,
    air_quality,
  };

  return NextResponse.json(payload);
}
