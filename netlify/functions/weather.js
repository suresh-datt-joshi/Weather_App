// Netlify Function for Weather API - Using Open-Meteo (free, no API key required)
exports.handler = async (event, context) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

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
        const iconMap = {
            0: '01d', 1: '02d', 2: '03d', 3: '04d', 45: '50d', 48: '50d',
            51: '09d', 53: '09d', 55: '09d', 56: '09d', 57: '09d',
            61: '10d', 63: '10d', 65: '10d', 66: '09d', 67: '09d',
            71: '13d', 73: '13d', 75: '13d', 77: '13d',
            80: '09d', 81: '09d', 82: '09d', 85: '13d', 86: '13d',
            95: '11d', 96: '11d', 99: '11d'
        };
        return iconMap[code] || '02d';
    }

    function getWeatherDescription(code) {
        const descMap = {
            0: 'clear sky', 1: 'mainly clear', 2: 'partly cloudy', 3: 'overcast',
            45: 'fog', 48: 'depositing rime fog',
            51: 'light drizzle', 53: 'moderate drizzle', 55: 'dense drizzle',
            61: 'slight rain', 63: 'moderate rain', 65: 'heavy rain',
            71: 'slight snow', 73: 'moderate snow', 75: 'heavy snow',
            80: 'slight rain showers', 81: 'moderate rain showers', 82: 'violent rain showers',
            95: 'thunderstorm', 96: 'thunderstorm with slight hail', 99: 'thunderstorm with heavy hail'
        };
        return descMap[code] || 'partly cloudy';
    }

    // Convert Open-Meteo format to OpenWeatherMap format
    function convertToOpenWeatherFormat(openMeteoData, coords, cityName, country) {
        const current = openMeteoData.current;
        const daily = openMeteoData.daily;
        
        return {
            coord: { lat: coords.lat, lon: coords.lon },
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
                pressure: Math.round(current.surface_pressure || 1013),
                humidity: current.relative_humidity_2m || 50,
                sea_level: Math.round(current.surface_pressure || 1013),
                grnd_level: Math.round(current.surface_pressure || 1013)
            },
            visibility: current.visibility ? current.visibility * 1000 : 10000,
            wind: {
                speed: current.wind_speed_10m || 0,
                deg: current.wind_direction_10m || 0,
                gust: current.wind_gusts_10m || 0
            },
            clouds: { all: current.cloud_cover || 0 },
            dt: Math.floor(Date.now() / 1000),
            sys: {
                type: 1, id: 0, country: country,
                sunrise: daily.sunrise ? Math.floor(new Date(daily.sunrise[0]).getTime() / 1000) : Math.floor(Date.now() / 1000),
                sunset: daily.sunset ? Math.floor(new Date(daily.sunset[0]).getTime() / 1000) : Math.floor(Date.now() / 1000)
            },
            timezone: openMeteoData.timezone || 'UTC',
            id: 0,
            name: cityName,
            cod: 200
        };
    }

    // Get query parameters
    const { city, lat, lon } = event.queryStringParameters || {};
    
    let coords, cityName, country;
    
    try {
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
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: 'City or coordinates are required.' })
            };
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
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(weatherData)
        };
    } catch (error) {
        console.error('Weather API Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: error.message })
        };
    }
};
