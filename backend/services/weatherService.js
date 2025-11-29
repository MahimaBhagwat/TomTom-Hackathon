const axios = require('axios');

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * Get current weather for a location
 */
async function getCurrentWeather(lat, lon) {
  try {
    const url = `${BASE_URL}/weather`;
    const params = {
      lat,
      lon,
      appid: OPENWEATHER_API_KEY,
      units: 'metric'
    };

    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    console.error('OpenWeather API error:', error.message);
    return null; // Return null if weather unavailable
  }
}

/**
 * Get weather conditions for multiple points along a route
 */
async function getRouteWeather(routePoints) {
  try {
    const weatherPromises = routePoints.map(point => 
      getCurrentWeather(point.lat, point.lon)
    );
    const weatherData = await Promise.all(weatherPromises);
    return weatherData.filter(w => w !== null);
  } catch (error) {
    console.error('Error fetching route weather:', error.message);
    return [];
  }
}

/**
 * Calculate weather safety factor (0-1, where 1 is safest)
 */
function calculateWeatherSafetyFactor(weather) {
  if (!weather) return 0.5; // Default neutral if no weather data

  const { main, weather: conditions, visibility, wind } = weather;
  
  let safety = 1.0;
  
  // Temperature factor (optimal: 15-25°C)
  const temp = main.temp;
  if (temp < 0 || temp > 35) safety *= 0.7;
  else if (temp < 5 || temp > 30) safety *= 0.85;
  
  // Visibility factor
  if (visibility < 1000) safety *= 0.6; // Very poor visibility
  else if (visibility < 2000) safety *= 0.75;
  else if (visibility < 5000) safety *= 0.9;
  
  // Weather condition factor
  const condition = conditions[0]?.main?.toLowerCase();
  if (condition === 'thunderstorm') safety *= 0.5;
  else if (condition === 'rain' || condition === 'drizzle') safety *= 0.8;
  else if (condition === 'snow') safety *= 0.6;
  else if (condition === 'fog' || condition === 'mist') safety *= 0.7;
  
  // Wind factor
  if (wind?.speed > 20) safety *= 0.85; // Strong wind
  
  return Math.max(0.1, Math.min(1.0, safety));
}

module.exports = {
  getCurrentWeather,
  getRouteWeather,
  calculateWeatherSafetyFactor
};

