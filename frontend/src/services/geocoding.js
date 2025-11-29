// Geocoding service using OpenStreetMap Nominatim (free, no API key needed)
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

/**
 * Search for locations by address/place name
 */
export async function searchLocation(query) {
  if (!query || query.trim().length < 3) {
    return [];
  }

  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'SafeWalk App' // Required by Nominatim
        }
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data = await response.json();
    return data.map(item => ({
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      address: item.address || {}
    }));
  } catch (error) {
    console.error('Geocoding error:', error);
    return [];
  }
}

/**
 * Reverse geocode - get address from coordinates
 */
export async function reverseGeocode(lat, lon) {
  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${lat}&lon=${lon}`,
      {
        headers: {
          'User-Agent': 'SafeWalk App'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }

    const data = await response.json();
    return {
      displayName: data.display_name,
      address: data.address || {}
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

