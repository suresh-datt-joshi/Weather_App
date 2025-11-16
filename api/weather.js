// api/weather.js
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

    const { city, lat, lon } = req.query;
    const apiKey = process.env.WEATHER_API_KEY || "e9ee5766a9354a5378740036b37f6a87";
    let apiUrl;

    if (city) {
        apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
    } else if (lat && lon) {
        apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    } else {
        return res.status(400).json({ message: 'City or coordinates are required.' });
    }

    try {
        const weatherResponse = await fetch(apiUrl);
        const weatherData = await weatherResponse.json();
        if (!weatherResponse.ok) {
            throw new Error(weatherData.message || 'Failed to fetch weather data');
        }
        res.status(200).json(weatherData);
    } catch (error) {
        console.error('Weather API Error:', error);
        res.status(500).json({ message: error.message });
    }
};

