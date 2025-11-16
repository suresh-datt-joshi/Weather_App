// Netlify Function for Weather API
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

    // Get query parameters
    const { city, lat, lon } = event.queryStringParameters || {};
    const apiKey = process.env.WEATHER_API_KEY || "e9ee5766a9354a5378740036b37f6a87";
    let apiUrl;

    if (city) {
        apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
    } else if (lat && lon) {
        apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    } else {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: 'City or coordinates are required.' })
        };
    }

    try {
        const weatherResponse = await fetch(apiUrl);
        const weatherData = await weatherResponse.json();
        
        if (!weatherResponse.ok) {
            throw new Error(weatherData.message || 'Failed to fetch weather data');
        }

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

