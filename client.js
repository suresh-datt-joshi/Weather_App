// client.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("Weather App initialized.");

    // --- Global State ---
    const state = {
        serverUrl: '', // Use relative paths for Vercel deployment
        recentSearches: JSON.parse(localStorage.getItem('recentSearches') || '[]'),
        maxRecentSearches: 5,
        favorites: JSON.parse(localStorage.getItem('favorites') || '[]'),
        currentCity: null,
        currentCoords: null,
        hourlyForecastLimit: 12
    };

    // --- Element Selectors ---
    const locationInput = document.getElementById('location-input');
    const searchButton = document.getElementById('search-button');
    const geolocationButton = document.getElementById('geolocation-button');
    const dismissErrorButton = document.getElementById('dismiss-error-button');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const recentSearchesDiv = document.getElementById('recent-searches');
    const recentSearchesList = document.getElementById('recent-searches-list');
    const favoriteButton = document.getElementById('favorite-button');
    const favoriteIcon = document.getElementById('favorite-icon');
    const favoriteText = document.getElementById('favorite-text');
    const shareButton = document.getElementById('share-button');
    const favoritesToggle = document.getElementById('favorites-toggle');
    const favoritesCount = document.getElementById('favorites-count');
    const favoritesSidebar = document.getElementById('favorites-sidebar');
    const closeFavorites = document.getElementById('close-favorites');
    const favoritesOverlay = document.getElementById('favorites-overlay');
    const favoritesList = document.getElementById('favorites-list');
    const noFavorites = document.getElementById('no-favorites');
    const toggleHourly = document.getElementById('toggle-hourly');
    const weatherMapLink = document.getElementById('weather-map-link');
    
    // API endpoints - use relative paths for Vercel deployment
    const apiBaseUrl = state.serverUrl || '';

    // --- Theme Toggle ---
    const applyTheme = (isDark) => {
        const htmlElement = document.documentElement;
        if (isDark) {
            htmlElement.classList.add('dark');
            if (themeIcon) themeIcon.textContent = '☀️';
        } else {
            htmlElement.classList.remove('dark');
            if (themeIcon) themeIcon.textContent = '🌙';
        }
    };

    const initTheme = () => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        const isDark = savedTheme === 'dark';
        applyTheme(isDark);
    };

    if (themeToggle && themeIcon) {
        themeToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const htmlElement = document.documentElement;
            const isCurrentlyDark = htmlElement.classList.contains('dark');
            const newTheme = !isCurrentlyDark;
            
            applyTheme(newTheme);
            localStorage.setItem('theme', newTheme ? 'dark' : 'light');
            
            console.log('Theme changed to:', newTheme ? 'dark' : 'light');
        });
    } else {
        console.warn('Theme toggle button not found');
    }

    // Initialize theme on page load
    initTheme();

    // --- Helper Functions ---
    const setButtonLoading = (button, isLoading, originalText) => {
        button.disabled = isLoading;
        button.textContent = isLoading ? 'Loading...' : originalText;
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const formatSunTime = (timestamp) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const getWindDirection = (degrees) => {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const index = Math.round(degrees / 22.5) % 16;
        return directions[index];
    };

    const addToRecentSearches = (cityName) => {
        if (!cityName) return;
        const city = cityName.trim();
        // Remove if already exists
        state.recentSearches = state.recentSearches.filter(s => s.toLowerCase() !== city.toLowerCase());
        // Add to beginning
        state.recentSearches.unshift(city);
        // Keep only max recent searches
        state.recentSearches = state.recentSearches.slice(0, state.maxRecentSearches);
        localStorage.setItem('recentSearches', JSON.stringify(state.recentSearches));
        updateRecentSearchesDisplay();
    };

    const updateRecentSearchesDisplay = () => {
        if (state.recentSearches.length === 0) {
            recentSearchesDiv.classList.add('hidden');
            return;
        }
        recentSearchesDiv.classList.remove('hidden');
        recentSearchesList.innerHTML = state.recentSearches.map(city => `
            <button class="recent-search-btn px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors" data-city="${city}">
                ${city}
            </button>
        `).join('');
        
        // Add event listeners to recent search buttons
        recentSearchesList.querySelectorAll('.recent-search-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const city = btn.getAttribute('data-city');
                locationInput.value = city;
                fetchWeatherData(`${apiBaseUrl}/api/weather?city=${encodeURIComponent(city)}`);
            });
        });
    };

    // --- Weather Fetching Functions ---
    const fetchWeatherData = async (url) => {
        document.getElementById('loader').classList.remove('hidden');
        document.getElementById('error-message').classList.add('hidden');
        document.getElementById('weather-display').classList.add('hidden', 'opacity-0');
        setWeatherButtonsDisabled(true);
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "City not found. Please check spelling.");
            }
            const data = await response.json();
            addToRecentSearches(data.name);
            state.currentCity = data.name;
            state.currentCoords = { lat: data.coord.lat, lon: data.coord.lon };
            displayWeather(data);
            updateFavoriteButton();
            updateWeatherMapLink(data.coord.lat, data.coord.lon);
            
            // Fetch 5-day forecast
            fetchForecastData(data.coord.lat, data.coord.lon);
        } catch (error) {
            showWeatherError(error.message);
        } finally {
            document.getElementById('loader').classList.add('hidden');
            setWeatherButtonsDisabled(false);
        }
    };

    const fetchForecastData = async (lat, lon) => {
        try {
            const response = await fetch(`${apiBaseUrl}/api/forecast?lat=${lat}&lon=${lon}`);
            if (!response.ok) throw new Error('Failed to fetch forecast');
            const data = await response.json();
            displayForecast(data);
            displayHourlyForecast(data);
        } catch (error) {
            console.error('Forecast fetch error:', error);
        }
    };

    // --- Display Functions ---
    const displayWeather = (data) => {
        const weatherDisplay = document.getElementById('weather-display');
        weatherDisplay.classList.remove('hidden', 'opacity-0');
        
        // Basic info
        document.getElementById('city-name').textContent = `${data.name}, ${data.sys.country}`;
        document.getElementById('weather-description').textContent = data.weather[0].description;
        document.getElementById('date-time').textContent = formatDate(data.dt);
        
        // Temperature
        document.getElementById('temperature').textContent = `${Math.round(data.main.temp)}°C`;
        document.getElementById('temp-range').textContent = `H: ${Math.round(data.main.temp_max)}° L: ${Math.round(data.main.temp_min)}°`;
        
        // Weather icon
        document.getElementById('weather-icon').src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
        document.getElementById('weather-icon').alt = data.weather[0].description;
        
        // Main details
        document.getElementById('feels-like').textContent = `${Math.round(data.main.feels_like)}°C`;
        document.getElementById('humidity').textContent = `${data.main.humidity}%`;
        const windDir = data.wind.deg ? getWindDirection(data.wind.deg) : '';
        document.getElementById('wind-speed').textContent = `${data.wind.speed} m/s ${windDir}`;
        document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;
        
        // Additional details
        document.getElementById('visibility').textContent = data.visibility ? `${(data.visibility / 1000).toFixed(1)} km` : 'N/A';
        document.getElementById('cloudiness').textContent = `${data.clouds.all}%`;
        document.getElementById('sun-times').textContent = `🌅 ${formatSunTime(data.sys.sunrise)} / 🌇 ${formatSunTime(data.sys.sunset)}`;
        
        // Animate display
        setTimeout(() => {
            weatherDisplay.style.opacity = '1';
        }, 100);
    };

    const displayForecast = (data) => {
        const forecastContainer = document.getElementById('forecast-container');
        forecastContainer.innerHTML = '';
        
        // Use daily field if available (from Open-Meteo), otherwise group from list
        let forecastDays;
        if (data.daily && Array.isArray(data.daily)) {
            forecastDays = data.daily.slice(0, 5);
        } else {
            // Group forecasts by date and get one per day
            const dailyForecasts = {};
            data.list.forEach(item => {
                const date = new Date(item.dt * 1000).toDateString();
                if (!dailyForecasts[date] || new Date(item.dt * 1000).getHours() === 12) {
                    dailyForecasts[date] = item;
                }
            });
            forecastDays = Object.values(dailyForecasts).slice(0, 5);
        }
        forecastDays.forEach((day, index) => {
            const date = new Date(day.dt * 1000);
            const dayName = index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
            
            const forecastCard = document.createElement('div');
            forecastCard.className = 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 p-4 rounded-xl shadow-md text-center';
            forecastCard.innerHTML = `
                <p class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">${dayName}</p>
                <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="${day.weather[0].description}" class="w-16 h-16 mx-auto mb-2">
                <p class="text-lg font-bold text-gray-800 dark:text-white">${Math.round(day.main.temp)}°C</p>
                <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">${Math.round(day.main.temp_max)}° / ${Math.round(day.main.temp_min)}°</p>
                <p class="text-xs text-gray-500 dark:text-gray-500 mt-2 capitalize">${day.weather[0].description}</p>
            `;
            forecastContainer.appendChild(forecastCard);
        });
        };

        const showWeatherError = (message) => {
            document.getElementById('error-text').textContent = message;
            document.getElementById('error-message').classList.remove('hidden');
        };
        
        const setWeatherButtonsDisabled = (disabled) => {
            searchButton.disabled = disabled;
            geolocationButton.disabled = disabled;
        };

    // --- Event Listeners ---
        searchButton.addEventListener('click', () => {
            const city = locationInput.value.trim();
        if (city) {
            fetchWeatherData(`${apiBaseUrl}/api/weather?city=${encodeURIComponent(city)}`);
        } else {
            showWeatherError("Please enter a city name.");
        }
    });

    locationInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchButton.click();
        }
        });

        geolocationButton.addEventListener('click', () => {
        if (!navigator.geolocation) {
            showWeatherError("Geolocation is not supported by your browser.");
            return;
        }
            navigator.geolocation.getCurrentPosition(
            pos => fetchWeatherData(`${apiBaseUrl}/api/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`),
            () => showWeatherError("Geolocation permission denied. Please allow location access.")
            );
        });

        dismissErrorButton.addEventListener('click', () => {
            document.getElementById('error-message').classList.add('hidden');
        });

    // --- Hourly Forecast Display ---
    const displayHourlyForecast = (data) => {
        const hourlyContainer = document.getElementById('hourly-forecast-scroll');
        hourlyContainer.innerHTML = '';
        
        const hourlyData = data.list.slice(0, state.hourlyForecastLimit);
        
        hourlyData.forEach((item, index) => {
            // Use dt_txt if available (includes timezone info), otherwise use dt timestamp
            let date;
            if (item.dt_txt) {
                date = new Date(item.dt_txt);
            } else {
                date = new Date(item.dt * 1000);
            }
            
            const hour = date.getHours();
            const minutes = date.getMinutes();
            let timeStr;
            if (hour === 0) {
                timeStr = '12 AM';
            } else if (hour < 12) {
                timeStr = `${hour} AM`;
            } else if (hour === 12) {
                timeStr = '12 PM';
            } else {
                timeStr = `${hour - 12} PM`;
            }
            
            const hourlyCard = document.createElement('div');
            hourlyCard.className = 'flex flex-col items-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 p-4 rounded-xl shadow-md min-w-[100px]';
            
            // Handle precipitation probability - convert from decimal (0-1) to percentage (0-100)
            let popValue = 0;
            if (item.pop !== undefined && item.pop !== null && !isNaN(item.pop)) {
                popValue = Math.round(item.pop * 100);
            }
            
            hourlyCard.innerHTML = `
                <p class="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">${timeStr}</p>
                <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" alt="${item.weather[0].description}" class="w-12 h-12 mb-2">
                <p class="text-lg font-bold text-gray-800 dark:text-white">${Math.round(item.main.temp)}°</p>
                <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">${Math.round(item.main.feels_like)}°</p>
                <p class="text-xs text-blue-600 dark:text-blue-400 mt-1">${popValue}%</p>
            `;
            hourlyContainer.appendChild(hourlyCard);
        });
    };

    // --- Favorites Management ---
    const updateFavoriteButton = () => {
        if (!state.currentCity) return;
        
        const isFavorite = state.favorites.some(fav => fav.name.toLowerCase() === state.currentCity.toLowerCase());
        
        if (isFavorite) {
            favoriteIcon.textContent = '⭐';
            favoriteText.textContent = 'Remove from Favorites';
            favoriteButton.classList.add('bg-yellow-200', 'dark:bg-yellow-900/50');
        } else {
            favoriteIcon.textContent = '☆';
            favoriteText.textContent = 'Add to Favorites';
            favoriteButton.classList.remove('bg-yellow-200', 'dark:bg-yellow-900/50');
        }
    };

    const toggleFavorite = () => {
        if (!state.currentCity || !state.currentCoords) return;
        
        const existingIndex = state.favorites.findIndex(fav => fav.name.toLowerCase() === state.currentCity.toLowerCase());
        
        if (existingIndex >= 0) {
            state.favorites.splice(existingIndex, 1);
        } else {
            state.favorites.push({
                name: state.currentCity,
                lat: state.currentCoords.lat,
                lon: state.currentCoords.lon
            });
        }
        
        localStorage.setItem('favorites', JSON.stringify(state.favorites));
        updateFavoriteButton();
        updateFavoritesCount();
        renderFavoritesList();
    };

    const updateFavoritesCount = () => {
        const count = state.favorites.length;
        if (count > 0) {
            favoritesCount.textContent = count;
            favoritesCount.classList.remove('hidden');
        } else {
            favoritesCount.classList.add('hidden');
        }
    };

    const renderFavoritesList = () => {
        favoritesList.innerHTML = '';
        
        if (state.favorites.length === 0) {
            noFavorites.classList.remove('hidden');
            return;
        }
        
        noFavorites.classList.add('hidden');
        
        state.favorites.forEach((fav, index) => {
            const favCard = document.createElement('div');
            favCard.className = 'bg-gray-50 dark:bg-gray-700 p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer';
            favCard.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex-1" data-city="${fav.name}" data-lat="${fav.lat}" data-lon="${fav.lon}">
                        <h3 class="font-bold text-gray-800 dark:text-white">${fav.name}</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400">Click to view weather</p>
                    </div>
                    <button class="remove-favorite text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" data-index="${index}">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            `;
            
            // Click to view weather
            favCard.querySelector('[data-city]').addEventListener('click', () => {
                fetchWeatherData(`${apiBaseUrl}/api/weather?lat=${fav.lat}&lon=${fav.lon}`);
                closeFavoritesSidebar();
            });
            
            // Remove favorite
            favCard.querySelector('.remove-favorite').addEventListener('click', (e) => {
                e.stopPropagation();
                state.favorites.splice(index, 1);
                localStorage.setItem('favorites', JSON.stringify(state.favorites));
                updateFavoritesCount();
                renderFavoritesList();
                updateFavoriteButton();
            });
            
            favoritesList.appendChild(favCard);
        });
    };

    const openFavoritesSidebar = () => {
        favoritesSidebar.classList.remove('translate-x-full');
        favoritesOverlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    };

    const closeFavoritesSidebar = () => {
        favoritesSidebar.classList.add('translate-x-full');
        favoritesOverlay.classList.add('hidden');
        document.body.style.overflow = '';
    };

    // --- Share Functionality ---
    const shareWeather = async () => {
        if (!state.currentCity) return;
        
        const shareData = {
            title: `Weather in ${state.currentCity}`,
            text: `Check out the weather in ${state.currentCity}!`,
            url: window.location.href
        };
        
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback: copy to clipboard
                await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                alert('Link copied to clipboard!');
            }
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    // --- Weather Map Link ---
    const updateWeatherMapLink = (lat, lon) => {
        weatherMapLink.href = `https://www.google.com/maps/@${lat},${lon},12z`;
    };

    // --- Event Listeners for New Features ---
    if (favoriteButton) {
        favoriteButton.addEventListener('click', toggleFavorite);
    }

    if (shareButton) {
        shareButton.addEventListener('click', shareWeather);
    }

    if (favoritesToggle) {
        favoritesToggle.addEventListener('click', openFavoritesSidebar);
    }

    if (closeFavorites) {
        closeFavorites.addEventListener('click', closeFavoritesSidebar);
    }

    if (favoritesOverlay) {
        favoritesOverlay.addEventListener('click', closeFavoritesSidebar);
    }

    if (toggleHourly) {
        toggleHourly.addEventListener('click', () => {
            if (state.hourlyForecastLimit === 12) {
                state.hourlyForecastLimit = 24;
                toggleHourly.textContent = 'Show Less';
            } else {
                state.hourlyForecastLimit = 12;
                toggleHourly.textContent = 'Show All';
            }
            if (state.currentCoords) {
                fetchForecastData(state.currentCoords.lat, state.currentCoords.lon);
            }
        });
    }

    // Initialize recent searches display
    updateRecentSearchesDisplay();
    
    // Initialize favorites
    updateFavoritesCount();
    renderFavoritesList();

    // Initial fetch for a default city
    fetchWeatherData(`${apiBaseUrl}/api/weather?city=Bengaluru`);
});
