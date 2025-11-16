// Netlify Function for Forecast API
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
    const { lat, lon } = event.queryStringParameters || {};
    const apiKey = process.env.WEATHER_API_KEY || "e9ee5766a9354a5378740036b37f6a87";
    
    if (!lat || !lon) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: 'Latitude and longitude are required.' })
        };
    }

    const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    try {
        const forecastResponse = await fetch(apiUrl);
        const forecastData = await forecastResponse.json();
        
        if (!forecastResponse.ok) {
            throw new Error(forecastData.message || 'Failed to fetch forecast data');
        }

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

