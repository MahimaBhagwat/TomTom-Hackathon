const axios = require('axios');

const BASE_URL = 'https://api.tomtom.com';

// Function to get API key (loads from env dynamically)
function getApiKey() {
  return process.env.TOMTOM_API_KEY;
}

/**
 * Get route from TomTom Routing API
 */
async function getRoute(origin, destination, options = {}) {
  try {
    const TOMTOM_API_KEY = getApiKey();
    if (!TOMTOM_API_KEY) {
      throw new Error('TomTom API key is not configured. Please check your .env file.');
    }

    const { lat: originLat, lon: originLon } = origin;
    const { lat: destLat, lon: destLon } = destination;
    
    // Use TomTom Routing API v2 for better real-time data
    const url = `${BASE_URL}/routing/2/calculateRoute/${originLat},${originLon}:${destLat},${destLon}/json`;
    
    const params = {
      key: TOMTOM_API_KEY,
      instructionsType: 'text',
      routeType: 'fastest', // Use 'fastest' as base, we'll filter for pedestrian-friendly routes
      traffic: true,
      computeTravelTimeFor: 'all', // Get real-time travel time
      routeRepresentation: 'polyline', // Get polyline for route
      ...options
    };

    const response = await axios.get(url, { 
      params,
      timeout: 10000 // 10 second timeout
    });
    
    return response.data;
  } catch (error) {
    if (error.response) {
      // API returned an error response
      const status = error.response.status;
      const data = error.response.data;
      console.error('TomTom Routing API error:', {
        status,
        statusText: error.response.statusText,
        data: data || 'No error details'
      });
      
      if (status === 403) {
        throw new Error('TomTom API key is invalid or does not have access to Routing API. Please check your API key and ensure Routing API is enabled in your TomTom account.');
      } else if (status === 401) {
        throw new Error('TomTom API key is unauthorized. Please verify your API key.');
      } else if (status === 400) {
        throw new Error(`TomTom API request error: ${data?.error?.message || 'Invalid request parameters'}`);
      }
      throw new Error(`TomTom API error (${status}): ${data?.error?.message || error.response.statusText}`);
    } else if (error.request) {
      // Request was made but no response received
      console.error('TomTom Routing API error: No response received', error.message);
      throw new Error('TomTom API is not responding. Please check your internet connection.');
    } else {
      // Error setting up the request
      console.error('TomTom Routing API error:', error.message);
      throw new Error(`Failed to fetch route from TomTom: ${error.message}`);
    }
  }
}

/**
 * Get multiple route alternatives with real-time traffic data
 * Tries v2 first, falls back to v1 if v2 is not available
 */
async function getRouteAlternatives(origin, destination, maxAlternatives = 3) {
  try {
    const TOMTOM_API_KEY = getApiKey();
    if (!TOMTOM_API_KEY) {
      throw new Error('TomTom API key is not configured. Please check your .env file.');
    }

    const { lat: originLat, lon: originLon } = origin;
    const { lat: destLat, lon: destLon } = destination;
    
    // Try Routing API v2 first (for real-time data)
    let url = `${BASE_URL}/routing/2/calculateRoute/${originLat},${originLon}:${destLat},${destLon}/json`;
    
    let params = {
      key: TOMTOM_API_KEY,
      instructionsType: 'text',
      routeType: 'fastest', // Base route type, will be optimized for safety
      traffic: true,
      computeTravelTimeFor: 'all', // Real-time travel time
      routeRepresentation: 'polyline',
      maxAlternatives: maxAlternatives,
      avoid: 'unpavedRoads'
    };

    try {
      const response = await axios.get(url, { 
        params,
        timeout: 15000
      });
      
      return response.data;
    } catch (v2Error) {
      // If v2 fails with 403/404/400, try v1 (some subscriptions only have v1)
      if (v2Error.response && (v2Error.response.status === 403 || v2Error.response.status === 404 || v2Error.response.status === 400)) {
        console.log('Routing API v2 not available or failed, trying v1...');
        
        try {
          url = `${BASE_URL}/routing/1/calculateRoute/${originLat},${originLon}:${destLat},${destLon}/json`;
          
          // v1 API uses different parameters - use 'fastest' for walking routes
          params = {
            key: TOMTOM_API_KEY,
            instructionsType: 'text',
            routeType: 'fastest', // v1 doesn't support 'pedestrian'
            traffic: true,
            maxAlternatives: maxAlternatives,
            computeBestOrder: false
          };

          const v1Response = await axios.get(url, { 
            params,
            timeout: 15000
          });
          
          console.log('✅ Successfully using Routing API v1');
          return v1Response.data;
        } catch (v1Error) {
          // If v1 also fails, throw the v1 error (not v2)
          console.error('Routing API v1 also failed:', v1Error.response?.data || v1Error.message);
          throw v1Error;
        }
      } else {
        throw v2Error; // Re-throw if it's a different error
      }
    }
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      console.error('TomTom Routing API error:', {
        status,
        statusText: error.response.statusText,
        data: data || 'No error details',
        url: error.config?.url
      });
      
      if (status === 403) {
        console.error(error.stack);
        throw new Error('TomTom API key is invalid or does not have access to Routing API. Please check your API key and ensure Routing API is enabled in your TomTom account.');
      } else if (status === 401) {
        throw new Error('TomTom API key is unauthorized. Please verify your API key.');
      } else if (status === 400) {
        throw new Error(`TomTom API request error: ${data?.error?.message || 'Invalid request parameters'}`);
      }
      throw new Error(`TomTom API error (${status}): ${data?.error?.message || error.response.statusText}`);
    } else if (error.request) {
      console.error('TomTom Routing API error: No response received', error.message);
      throw new Error('TomTom API is not responding. Please check your internet connection.');
    } else {
      console.error('TomTom Routing API error:', error.message);
      throw new Error(`Failed to fetch route alternatives from TomTom: ${error.message}`);
    }
  }
}

/**
 * Get real-time traffic flow data for a point
 */
async function getTrafficFlow(bbox) {
  try {
    const TOMTOM_API_KEY = getApiKey();
    if (!TOMTOM_API_KEY) {
      return null;
    }

    // Use Traffic Flow API v4 for real-time data
    const url = `${BASE_URL}/traffic/services/4/flowSegmentData/absolute/10/json`;
    
    const params = {
      key: TOMTOM_API_KEY,
      point: `${bbox.center.lat},${bbox.center.lon}`,
      unit: 'KMPH',
      zoom: 10 // Zoom level for detail
    };

    const response = await axios.get(url, { 
      params,
      timeout: 5000
    });
    
    return response.data;
  } catch (error) {
    // Traffic data is optional, so we don't throw errors
    if (error.response) {
      console.warn('TomTom Traffic API error:', error.response.status, error.response.statusText);
    } else {
      console.warn('TomTom Traffic API error:', error.message);
    }
    return null; // Return null if traffic data unavailable
  }
}

/**
 * Get real-time traffic incidents in an area
 */
async function getTrafficIncidents(bbox) {
  try {
    const TOMTOM_API_KEY = getApiKey();
    if (!TOMTOM_API_KEY) {
      return null;
    }

    // Use Traffic Incidents API for real-time incident data
    const url = `${BASE_URL}/traffic/services/4/incidentDetails`;
    
    const params = {
      key: TOMTOM_API_KEY,
      bbox: `${bbox.minLat},${bbox.minLon},${bbox.maxLat},${bbox.maxLon}`,
      fields: '{incidents{type,geometry,properties{iconCategory,severity}}}',
      language: 'en-US'
    };

    const response = await axios.get(url, { 
      params,
      timeout: 5000
    });
    
    return response.data;
  } catch (error) {
    // Traffic incidents are optional
    if (error.response) {
      console.warn('TomTom Traffic Incidents API error:', error.response.status);
    } else {
      console.warn('TomTom Traffic Incidents API error:', error.message);
    }
    return null;
  }
}

module.exports = {
  getRoute,
  getRouteAlternatives,
  getTrafficFlow,
  getTrafficIncidents
};