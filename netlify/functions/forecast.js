// Netlify Function for Forecast API - Using Open-Meteo (free, no API key required)
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

    // Helper functions
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

    // Get query parameters
    const { lat, lon } = event.queryStringParameters || {};
    
    if (!lat || !lon) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: 'Latitude and longitude are required.' })
        };
    }

    try {
        // Fetch forecast data from Open-Meteo
        const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,precipitation_probability&daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset&timezone=auto&forecast_days=5`;
        
        const forecastResponse = await fetch(forecastUrl);
        if (!forecastResponse.ok) {
            throw new Error('Failed to fetch forecast data');
        }
        
        const openMeteoData = await forecastResponse.json();
        
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
                clouds: { all: 0 },
                wind: {
                    speed: hourIdx < hourly.wind_speed_10m.length ? hourly.wind_speed_10m[hourIdx] : 0,
                    deg: 0,
                    gust: 0
                },
                visibility: 10000,
                pop: 0,
                sys: { pod: 'd' },
                dt_txt: daily.time[i] + ' 12:00:00'
            });
        }
        
        // Also create hourly forecast entries
        // Find the first hour that's in the future
        const now = new Date();
        let startIndex = 0;
        
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
            list: hourlyList,
            city: {
                id: 0,
                name: '',
                coord: { lat: parseFloat(lat), lon: parseFloat(lon) },
                country: '',
                population: 0,
                timezone: openMeteoData.timezone_offset || 0,
                sunrise: daily.sunrise ? Math.floor(new Date(daily.sunrise[0]).getTime() / 1000) : 0,
                sunset: daily.sunset ? Math.floor(new Date(daily.sunset[0]).getTime() / 1000) : 0
            },
            daily: list
        };
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(forecastData)
        };
    } catch (error) {
        console.error('Forecast API Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: error.message })
        };
    }
};
