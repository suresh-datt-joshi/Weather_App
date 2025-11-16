// api/forecast.js
module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { lat, lon } = req.query;
    const apiKey = process.env.WEATHER_API_KEY || "e9ee5766a9354a5378740036b37f6a87";
    
    if (!lat || !lon) {
        return res.status(400).json({ message: 'Latitude and longitude are required.' });
    }

    const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    try {
        const forecastResponse = await fetch(apiUrl);
        const forecastData = await forecastResponse.json();
        if (!forecastResponse.ok) {
            throw new Error(forecastData.message || 'Failed to fetch forecast data');
        }
        res.status(200).json(forecastData);
    } catch (error) {
        console.error('Forecast API Error:', error);
        res.status(500).json({ message: error.message });
    }
};

