import openmeteo_requests

import pandas as pd
import requests
import requests_cache
from retry_requests import retry
import sys
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo


# --- Geocode a place name (default: Los Angeles) using Open-Meteo Geocoding API ---
def geocode_place(place_name: str, count: int = 1, language: str = "en"):
	geocode_url = "https://geocoding-api.open-meteo.com/v1/search"
	params = {"name": place_name, "count": count, "language": language, "format": "json"}
	r = requests.get(geocode_url, params=params, timeout=10)
	r.raise_for_status()
	data = r.json()
	results = data.get("results") or []
	if not results:
		raise RuntimeError(f"No geocoding results for '{place_name}'")
	top = results[0]
	return float(top["latitude"]), float(top["longitude"]), top


# Setup the Open-Meteo API client with cache and retry on error
cache_session = requests_cache.CachedSession('.cache', expire_after=3600)
retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
openmeteo = openmeteo_requests.Client(session=retry_session)


# Determine place name from CLI args (default to Los Angeles)
place = "Los Angeles"
if len(sys.argv) > 1:
	place = " ".join(sys.argv[1:])

try:
	lat, lon, place_meta = geocode_place(place, count=1, language="en")
except Exception as e:
	print(f"Geocoding failed: {e}")
	raise

print(f"Geocoded place: {place} -> {lat}, {lon}")

# Make sure all required weather variables are listed here
# The order of variables in hourly or daily is important to assign them correctly below
url = "https://api.open-meteo.com/v1/forecast"
params = {
	"latitude": lat,
	"longitude": lon,
	"daily": ["weather_code", "temperature_2m_max", "temperature_2m_min"],
	"hourly": ["temperature_2m", "relative_humidity_2m", "wind_speed_10m", "wind_speed_80m"],
	"current": ["is_day", "rain", "precipitation", "temperature_2m"],
	"timezone": "auto",
}
responses = openmeteo.weather_api(url, params=params)

# Process first location. Add a for-loop for multiple locations or weather models
response = responses[0]
print(f"Coordinates: {response.Latitude()}°N {response.Longitude()}°E")
print(f"Elevation: {response.Elevation()} m asl")

# Decode timezone name and abbreviation (some clients return bytes)
raw_tz = response.Timezone()
raw_tz_abbr = response.TimezoneAbbreviation()
tz_name = raw_tz.decode() if isinstance(raw_tz, (bytes, bytearray)) else raw_tz
tz_abbr = raw_tz_abbr.decode() if isinstance(raw_tz_abbr, (bytes, bytearray)) else raw_tz_abbr
print(f"Timezone: {tz_name} {tz_abbr}")
print(f"Timezone difference to GMT+0: {response.UtcOffsetSeconds()}s")

# Process current data. The order of variables needs to be the same as requested.
current = response.Current()
current_is_day = current.Variables(0).Value()
current_rain = current.Variables(1).Value()
current_precipitation = current.Variables(2).Value()
current_temperature_2m = current.Variables(3).Value()

# current.Time() is epoch seconds (UTC). Convert to readable local datetime.
try:
	utc_ts = int(current.Time())
except Exception:
	utc_ts = int(float(current.Time()))

utc_dt = datetime.fromtimestamp(utc_ts, tz=timezone.utc)

# Determine a tz name for conversion; fall back to fixed offset if necessary
tz_for_pandas = None
local_dt = utc_dt
try:
	if tz_name:
		local_dt = utc_dt.astimezone(ZoneInfo(tz_name))
		tz_for_pandas = tz_name
except Exception:
	try:
		offset_seconds = int(response.UtcOffsetSeconds())
		local_tz = timezone(timedelta(seconds=offset_seconds))
		local_dt = utc_dt.astimezone(local_tz)
		tz_for_pandas = None
	except Exception:
		local_dt = utc_dt
		tz_for_pandas = None

print(f"\nData timestamp (epoch): {utc_ts}")
print(f"Data timestamp (UTC): {utc_dt.isoformat()}")
print(f"Data timestamp (local): {local_dt.isoformat()}")
# Use system clock for a "current" time display so users see 'now'
system_now = datetime.now().astimezone()
print(f"Current time (system): {system_now.isoformat()}")
print(f"Current is_day: {current_is_day}")
print(f"Current rain: {current_rain}")
print(f"Current precipitation: {current_precipitation}")
print(f"Current temperature_2m: {current_temperature_2m}")

# Diagnostic: compare API local time to system local time (keep for debugging)
sys_local_dt = system_now
try:
	# difference in seconds (api_local - system_local)
	delta = (local_dt - sys_local_dt).total_seconds()
	print(f"\nSystem local time: {sys_local_dt.isoformat()}")
	print(f"API data timestamp (local): {local_dt.isoformat()}")
	print(f"Time difference (API data - system) in seconds: {delta}")
except Exception as e:
	print(f"Could not compute time delta: {e}")

# Process hourly data. The order of variables needs to be the same as requested.
hourly = response.Hourly()
hourly_temperature_2m = hourly.Variables(0).ValuesAsNumpy()
hourly_relative_humidity_2m = hourly.Variables(1).ValuesAsNumpy()
hourly_wind_speed_10m = hourly.Variables(2).ValuesAsNumpy()
hourly_wind_speed_80m = hourly.Variables(3).ValuesAsNumpy()

hourly_data = {"date": pd.date_range(
	start = pd.to_datetime(hourly.Time(), unit = "s", utc = True),
	end = pd.to_datetime(hourly.TimeEnd(), unit = "s", utc = True),
	freq = pd.Timedelta(seconds = hourly.Interval()),
	inclusive = "left"
)}

hourly_data["temperature_2m"] = hourly_temperature_2m
hourly_data["relative_humidity_2m"] = hourly_relative_humidity_2m
hourly_data["wind_speed_10m"] = hourly_wind_speed_10m
hourly_data["wind_speed_80m"] = hourly_wind_speed_80m

hourly_dataframe = pd.DataFrame(data = hourly_data)
# Convert hourly 'date' to local timezone if we have a tz name suitable for pandas
if tz_for_pandas:
	try:
		hourly_dataframe["date"] = hourly_dataframe["date"].dt.tz_convert(tz_for_pandas)
	except Exception:
		pass
print("\nHourly data\n", hourly_dataframe)

# Process daily data. The order of variables needs to be the same as requested.
daily = response.Daily()
daily_weather_code = daily.Variables(0).ValuesAsNumpy()
daily_temperature_2m_max = daily.Variables(1).ValuesAsNumpy()
daily_temperature_2m_min = daily.Variables(2).ValuesAsNumpy()

daily_data = {"date": pd.date_range(
	start = pd.to_datetime(daily.Time(), unit = "s", utc = True),
	end = pd.to_datetime(daily.TimeEnd(), unit = "s", utc = True),
	freq = pd.Timedelta(seconds = daily.Interval()),
	inclusive = "left"
)}

daily_data["weather_code"] = daily_weather_code
daily_data["temperature_2m_max"] = daily_temperature_2m_max
daily_data["temperature_2m_min"] = daily_temperature_2m_min

daily_dataframe = pd.DataFrame(data = daily_data)
if tz_for_pandas:
	try:
		daily_dataframe["date"] = daily_dataframe["date"].dt.tz_convert(tz_for_pandas)
	except Exception:
		pass
print("\nDaily data\n", daily_dataframe)

# --- Fetch air quality data (pm10, pm2_5) from Open-Meteo Air Quality API ---
try:
	aq_url = "https://air-quality-api.open-meteo.com/v1/air-quality"
	# Request additional pollutants and US AQI when available, plus UV/current data and a short forecast
	aq_params = {
		"latitude": lat,
		"longitude": lon,
		"hourly": ",".join(["pm10", "pm2_5", "us_aqi", "nitrogen_dioxide", "carbon_monoxide", "ozone"]),
		"current": ",".join(["us_aqi", "uv_index", "uv_index_clear_sky"]),
		"forecast_days": 7,
		"timezone": "auto",
	}
	aq_resp = requests.get(aq_url, params=aq_params, timeout=15)
	aq_resp.raise_for_status()
	aq_json = aq_resp.json()

	# Build a pandas DataFrame for hourly AQ
	aq_hourly = aq_json.get("hourly", {})
	aq_times = aq_hourly.get("time", [])
	aq_pm10 = aq_hourly.get("pm10", [])
	aq_pm25 = aq_hourly.get("pm2_5", [])
	aq_ozone = aq_hourly.get("ozone", [])
	aq_no2 = aq_hourly.get("nitrogen_dioxide", [])
	aq_co = aq_hourly.get("carbon_monoxide", [])
	aq_us_aqi = aq_hourly.get("us_aqi", [])

	if aq_times and (aq_pm10 or aq_pm25 or aq_ozone or aq_no2 or aq_co or aq_us_aqi):
		aq_df = pd.DataFrame({
			"date": pd.to_datetime(aq_times, utc=True),
			"pm10": aq_pm10,
			"pm2_5": aq_pm25,
			"ozone": aq_ozone,
			"nitrogen_dioxide": aq_no2,
			"carbon_monoxide": aq_co,
			"us_aqi": aq_us_aqi,
		})

		# If we have a tz name, convert the datetimes to local tz
		if tz_for_pandas:
			try:
				aq_df["date"] = aq_df["date"].dt.tz_convert(tz_for_pandas)
			except Exception:
				pass

		print("\nAir quality (hourly)\n", aq_df.head(24))
	else:
		print("\nAir quality: no hourly data returned by API\n")
except Exception as e:
	print(f"Failed to fetch air quality data: {e}")