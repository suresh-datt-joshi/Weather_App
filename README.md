# Weather App - Enhanced

A modern, feature-rich weather application built with Node.js and Express.js. Get real-time weather information, 5-day forecasts, and beautiful UI without any login requirements.

## Features

-   **No Login Required**: Instant access to weather information - no authentication needed!
-   **Real-Time Weather**: Get current weather conditions for any city worldwide
-   **5-Day Forecast**: View extended weather forecasts with detailed daily information
-   **Geolocation Support**: Automatically detect your location for instant weather updates
-   **Recent Searches**: Quick access to your recently searched cities
-   **Enhanced UI**: Modern, responsive design with gradient backgrounds and smooth animations
-   **Dark Mode**: Toggle between light and dark themes
-   **Detailed Weather Info**: 
    - Temperature (current, feels like, min/max)
    - Humidity, Wind Speed, Pressure
    - Visibility, Cloudiness
    - Sunrise/Sunset times
-   **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## Technologies Used

* **Frontend**:
    * HTML, CSS (`style.css`), JavaScript (`client.js`)
    * Tailwind CSS for styling
    * OpenWeatherMap API for weather data
    * LocalStorage for recent searches and theme preferences
* **Backend**:
    * Node.js and Express.js
    * cors for enabling Cross-Origin Resource Sharing
    * dotenv for environment variables

## Prerequisites

-   Node.js (version 14.0 or later recommended)
-   OpenWeatherMap API key (optional - app includes a default key)

## Installation and Setup

1.  **Clone the repository:**
    ```sh
    git clone <repository_url>
    cd Weather_App
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up environment variables (optional):**
    Create a `.env` file in the root directory:
    ```env
    WEATHER_API_KEY=your_openweathermap_api_key_here
    ```
    Note: The app includes a default API key, but you can use your own for better rate limits.

4.  **Start the server:**
    ```sh
    npm start
    ```
    This will start the Express.js server, and you should see the message "Server is running on http://localhost:3000" in your console.

5.  **Access the application:**
    Open your web browser and navigate to `http://localhost:3000`.

## Usage

1. **Search by City**: Enter a city name in the search box and click "Search" or press Enter
2. **Use Your Location**: Click "📍 Use My Location" to get weather for your current location
3. **Recent Searches**: Click on any city in the recent searches section to quickly view its weather
4. **Toggle Theme**: Click the theme toggle button (🌙/☀️) to switch between light and dark modes
5. **View Forecast**: Scroll down to see the 5-day weather forecast

## API Endpoints

-   `GET /api/weather`: Fetches current weather data
    - Query parameters: `city` (city name) or `lat` & `lon` (coordinates)
-   `GET /api/forecast`: Fetches 5-day weather forecast
    - Query parameters: `lat` & `lon` (coordinates)

## Project Structure

```
Weather_App/
├── client.js          # Frontend JavaScript logic
├── server.js          # Express.js server and API routes
├── index.html         # Main HTML file
├── style.css          # Custom CSS styles
├── package.json       # Node.js dependencies
└── README.md          # Project documentation
```

## Features in Detail

### Recent Searches
- Automatically saves your last 5 searched cities
- Stored in browser localStorage
- Click any recent search to instantly view that city's weather

### Dark Mode
- Persistent theme preference (saved in localStorage)
- Smooth transitions between themes
- Optimized colors for both light and dark modes

### Weather Details
- **Current Conditions**: Temperature, description, and weather icon
- **Temperature Range**: High and low temperatures for the day
- **Feels Like**: Perceived temperature
- **Humidity**: Air moisture percentage
- **Wind Speed**: Current wind conditions
- **Pressure**: Atmospheric pressure
- **Visibility**: How far you can see
- **Cloudiness**: Cloud cover percentage
- **Sunrise/Sunset**: Daily sun times

### 5-Day Forecast
- Daily weather predictions
- Temperature ranges for each day
- Weather icons and descriptions
- Organized in an easy-to-read grid layout

## License

ISC

## Version

2.0.0
