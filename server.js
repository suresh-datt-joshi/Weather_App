// server.js
require('dotenv').config();

// Import required packages
const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize the Express app
const app = express();
const PORT = 3000;

// --- Middleware ---
app.use(cors()); 
app.use(express.json()); 
app.use(express.static(path.join(__dirname)));

// Root Route to serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Weather API Route
app.get('/api/weather', async (req, res) => {
    const { city, lat, lon } = req.query;
    const apiKey = process.env.WEATHER_API_KEY || "e9ee5766a9354a5378740036b37f6a87";
    let apiUrl;

    if (city) {
        apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
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
});

// Forecast API Route
app.get('/api/forecast', async (req, res) => {
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
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
