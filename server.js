// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Helper function to get coordinates from city name using Open-Meteo Geocoding API
async function getCoordinatesFromCity(cityName) {
    try {
        const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;
        const response = await fetch(geocodeUrl);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            return {
                lat: data.results[0].latitude,
                lon: data.results[0].longitude,
                name: data.results[0].name,
                country: data.results[0].country_code?.toUpperCase() || 'US'
            };
        }
        throw new Error('City not found');
    } catch (error) {
        throw new Error(`Failed to find city: ${error.message}`);
    }
}

// Helper function to convert Open-Meteo weather code to OpenWeatherMap icon
function getWeatherIcon(code) {
    // Open-Meteo WMO Weather interpretation codes to OpenWeatherMap icons
    const iconMap = {
        0: '01d',   // Clear sky
        1: '02d',   // Mainly clear
        2: '03d',   // Partly cloudy
        3: '04d',   // Overcast
        45: '50d',  // Fog
        48: '50d',  // Depositing rime fog
        51: '09d',  // Light drizzle
        53: '09d',  // Moderate drizzle
        55: '09d',  // Dense drizzle
        56: '09d',  // Light freezing drizzle
        57: '09d',  // Dense freezing drizzle
        61: '10d',  // Slight rain
        63: '10d',  // Moderate rain
        65: '10d',  // Heavy rain
        66: '09d',  // Light freezing rain
        67: '09d',  // Heavy freezing rain
        71: '13d',  // Slight snow
        73: '13d',  // Moderate snow
        75: '13d',  // Heavy snow
        77: '13d',  // Snow grains
        80: '09d',  // Slight rain showers
        81: '09d',  // Moderate rain showers
        82: '09d',  // Violent rain showers
        85: '13d',  // Slight snow showers
        86: '13d',  // Heavy snow showers
        95: '11d',  // Thunderstorm
        96: '11d',  // Thunderstorm with slight hail
        99: '11d'   // Thunderstorm with heavy hail
    };
    return iconMap[code] || '02d';
}

function getWeatherDescription(code) {
    const descMap = {
        0: 'clear sky',
        1: 'mainly clear',
        2: 'partly cloudy',
        3: 'overcast',
        45: 'fog',
        48: 'depositing rime fog',
        51: 'light drizzle',
        53: 'moderate drizzle',
        55: 'dense drizzle',
        61: 'slight rain',
        63: 'moderate rain',
        65: 'heavy rain',
        71: 'slight snow',
        73: 'moderate snow',
        75: 'heavy snow',
        80: 'slight rain showers',
        81: 'moderate rain showers',
        82: 'violent rain showers',
        95: 'thunderstorm',
        96: 'thunderstorm with slight hail',
        99: 'thunderstorm with heavy hail'
    };
    return descMap[code] || 'partly cloudy';
}

// Convert Open-Meteo format to OpenWeatherMap format
function convertToOpenWeatherFormat(openMeteoData, coords, cityName, country) {
    const current = openMeteoData.current;
    const daily = openMeteoData.daily;
    
    return {
        coord: {
            lat: coords.lat,
            lon: coords.lon
        },
        weather: [{
            id: current.weather_code,
            main: getWeatherDescription(current.weather_code).split(' ')[0],
            description: getWeatherDescription(current.weather_code),
            icon: getWeatherIcon(current.weather_code)
        }],
        base: 'stations',
        main: {
            temp: current.temperature_2m,
            feels_like: current.apparent_temperature || current.temperature_2m,
            temp_min: daily.temperature_2m_min[0],
            temp_max: daily.temperature_2m_max[0],
            pressure: Math.round(current.surface_pressure || 1013), // Pressure in hPa
            humidity: current.relative_humidity_2m || 50,
            sea_level: Math.round(current.surface_pressure || 1013),
            grnd_level: Math.round(current.surface_pressure || 1013)
        },
        visibility: current.visibility ? current.visibility * 1000 : 10000, // Convert to meters
        wind: {
            speed: current.wind_speed_10m || 0,
            deg: current.wind_direction_10m || 0,
            gust: current.wind_gusts_10m || 0
        },
        clouds: {
            all: current.cloud_cover || 0
        },
        dt: Math.floor(Date.now() / 1000),
        sys: {
            type: 1,
            id: 0,
            country: country,
            sunrise: daily.sunrise ? new Date(daily.sunrise[0]).getTime() / 1000 : Math.floor(Date.now() / 1000),
            sunset: daily.sunset ? new Date(daily.sunset[0]).getTime() / 1000 : Math.floor(Date.now() / 1000)
        },
        timezone: openMeteoData.timezone || 'UTC',
        id: 0,
        name: cityName,
        cod: 200
    };
}

// Weather API endpoint - Using Open-Meteo (free, no API key required)
app.get('/api/weather', async (req, res) => {
    try {
        const { city, lat, lon } = req.query;
        
        let coords, cityName, country;
        
        if (city) {
            const geoData = await getCoordinatesFromCity(city);
            coords = { lat: geoData.lat, lon: geoData.lon };
            cityName = geoData.name;
            country = geoData.country;
        } else if (lat && lon) {
            coords = { lat: parseFloat(lat), lon: parseFloat(lon) };
            // Get city name from coordinates using reverse geocoding
            try {
                const reverseGeoUrl = `https://geocoding-api.open-meteo.com/v1/search?latitude=${coords.lat}&longitude=${coords.lon}&count=1&language=en&format=json`;
                const geoResponse = await fetch(reverseGeoUrl);
                const geoData = await geoResponse.json();
                if (geoData.results && geoData.results.length > 0) {
                    cityName = geoData.results[0].name;
                    country = geoData.results[0].country_code?.toUpperCase() || 'US';
                } else {
                    cityName = `${coords.lat.toFixed(2)}, ${coords.lon.toFixed(2)}`;
                    country = 'US';
                }
            } catch {
                cityName = `${coords.lat.toFixed(2)}, ${coords.lon.toFixed(2)}`;
                country = 'US';
            }
        } else {
            return res.status(400).json({ message: 'City or coordinates are required.' });
        }

        // Fetch weather data from Open-Meteo
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure,cloud_cover,visibility&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`;
        
        const weatherResponse = await fetch(weatherUrl);
        if (!weatherResponse.ok) {
            throw new Error('Failed to fetch weather data');
        }
        
        const openMeteoData = await weatherResponse.json();
        
        // Convert to OpenWeatherMap format for compatibility
        const weatherData = convertToOpenWeatherFormat(openMeteoData, coords, cityName, country);
        
        res.json(weatherData);
    } catch (error) {
        console.error('Weather API Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Forecast API endpoint - Using Open-Meteo
app.get('/api/forecast', async (req, res) => {
    try {
        const { lat, lon } = req.query;
        
        if (!lat || !lon) {
            return res.status(400).json({ message: 'Latitude and longitude are required.' });
        }

        // Fetch forecast data from Open-Meteo
        const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,precipitation_probability&daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset&timezone=auto&forecast_days=5`;
        
        const forecastResponse = await fetch(forecastUrl);
        if (!forecastResponse.ok) {
            throw new Error('Failed to fetch forecast data');
        }
        
        const openMeteoData = await forecastResponse.json();
        
        // Debug: Log precipitation_probability availability
        if (openMeteoData.hourly && openMeteoData.hourly.precipitation_probability) {
            console.log('Precipitation probability available:', openMeteoData.hourly.precipitation_probability.slice(0, 5));
        } else {
            console.log('Precipitation probability NOT available in API response');
        }
        
        // Convert to OpenWeatherMap format
        const list = [];
        const hourly = openMeteoData.hourly;
        const daily = openMeteoData.daily;
        
        // Create forecast entries for each day (using noon time for each day)
        for (let i = 0; i < Math.min(5, daily.time.length); i++) {
            const date = new Date(daily.time[i]);
            date.setHours(12, 0, 0, 0);
            const timestamp = Math.floor(date.getTime() / 1000);
            
            // Find closest hourly data point
            const hourIndex = hourly.time.findIndex(time => {
                const hourDate = new Date(time);
                return hourDate.getDate() === date.getDate() && 
                       hourDate.getMonth() === date.getMonth() &&
                       hourDate.getFullYear() === date.getFullYear() &&
                       hourDate.getHours() === 12;
            });
            
            const hourIdx = hourIndex >= 0 ? hourIndex : i * 24;
            
            list.push({
                dt: timestamp,
                main: {
                    temp: daily.temperature_2m_max[i],
                    temp_min: daily.temperature_2m_min[i],
                    temp_max: daily.temperature_2m_max[i],
                    feels_like: daily.temperature_2m_max[i],
                    pressure: 1013,
                    sea_level: 1013,
                    grnd_level: 1013,
                    humidity: hourIdx < hourly.relative_humidity_2m.length ? hourly.relative_humidity_2m[hourIdx] : 50,
                    temp_kf: 0
                },
                weather: [{
                    id: daily.weather_code[i],
                    main: getWeatherDescription(daily.weather_code[i]).split(' ')[0],
                    description: getWeatherDescription(daily.weather_code[i]),
                    icon: getWeatherIcon(daily.weather_code[i])
                }],
                clouds: {
                    all: 0
                },
                wind: {
                    speed: hourIdx < hourly.wind_speed_10m.length ? hourly.wind_speed_10m[hourIdx] : 0,
                    deg: 0,
                    gust: 0
                },
                visibility: 10000,
                pop: 0,
                sys: {
                    pod: 'd'
                },
                dt_txt: daily.time[i] + ' 12:00:00'
            });
        }
        
        // Also create hourly forecast entries
        // Open-Meteo returns times starting from current hour in the location's timezone
        // Find the first hour that's in the future (or start from index 0)
        const now = new Date();
        let startIndex = 0;
        
        // Try to find the first future hour
        for (let i = 0; i < hourly.time.length; i++) {
            const timeDate = new Date(hourly.time[i]);
            if (timeDate > now) {
                startIndex = i;
                break;
            }
        }
        
        const hourlyList = [];
        const hoursToShow = Math.min(24, hourly.time.length - startIndex);
        for (let i = 0; i < hoursToShow; i++) {
            const idx = startIndex + i;
            const timeString = hourly.time[idx];
            // Parse the time string which includes timezone info
            const timestamp = Math.floor(new Date(timeString).getTime() / 1000);
            
            // Handle precipitation_probability - Open-Meteo returns 0-100, convert to 0-1 decimal
            let popValue = 0;
            if (hourly.precipitation_probability && 
                Array.isArray(hourly.precipitation_probability) && 
                idx < hourly.precipitation_probability.length &&
                hourly.precipitation_probability[idx] !== undefined && 
                hourly.precipitation_probability[idx] !== null &&
                !isNaN(hourly.precipitation_probability[idx])) {
                popValue = hourly.precipitation_probability[idx] / 100;
            }
            
            hourlyList.push({
                dt: timestamp,
                main: {
                    temp: hourly.temperature_2m[idx],
                    temp_min: hourly.temperature_2m[idx],
                    temp_max: hourly.temperature_2m[idx],
                    feels_like: hourly.temperature_2m[idx],
                    pressure: 1013,
                    humidity: hourly.relative_humidity_2m[idx] || 50
                },
                weather: [{
                    id: hourly.weather_code[idx],
                    main: getWeatherDescription(hourly.weather_code[idx]).split(' ')[0],
                    description: getWeatherDescription(hourly.weather_code[idx]),
                    icon: getWeatherIcon(hourly.weather_code[idx])
                }],
                wind: {
                    speed: hourly.wind_speed_10m[idx] || 0,
                    deg: 0
                },
                pop: popValue,
                dt_txt: timeString
            });
        }
        
        const forecastData = {
            cod: '200',
            message: 0,
            cnt: hourlyList.length,
            list: hourlyList, // Use hourly data for list (client expects this for hourly forecast)
            city: {
                id: 0,
                name: '',
                coord: {
                    lat: parseFloat(lat),
                    lon: parseFloat(lon)
                },
                country: '',
                population: 0,
                timezone: openMeteoData.timezone_offset || 0,
                sunrise: daily.sunrise ? Math.floor(new Date(daily.sunrise[0]).getTime() / 1000) : 0,
                sunset: daily.sunset ? Math.floor(new Date(daily.sunset[0]).getTime() / 1000) : 0
            },
            daily: list // Store daily forecasts separately for 5-day display
        };
        
        res.json(forecastData);
    } catch (error) {
        console.error('Forecast API Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Open your browser and navigate to http://localhost:${PORT}`);
});

