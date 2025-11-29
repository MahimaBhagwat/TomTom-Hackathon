import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import api from '../config/api';
import { searchLocation } from '../services/geocoding';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }) {
  const map = useMap();

  useEffect(() => {
    map.locate();
    map.on('locationfound', (e) => {
      setPosition([e.latlng.lat, e.latlng.lng]);
      map.flyTo(e.latlng, map.getZoom());
    });
  }, [map, setPosition]);

  return position ? <Marker position={position} /> : null;
}

function DestinationMarker({ position }) {
  if (!position) return null;
  return <Marker position={position} />;
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    }
  });
  return null;
}

export default function Home() {
  const [currentLocation, setCurrentLocation] = useState([40.7128, -74.0060]); // Default: NYC
  const [destination, setDestination] = useState('');
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [alpha, setAlpha] = useState(0.7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [routeOptions, setRouteOptions] = useState(null);
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation([position.coords.latitude, position.coords.longitude]);
        },
        (err) => {
          console.error('Geolocation error:', err);
        }
      );
    }
  }, []);

  // Handle clicks outside suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        searchRef.current &&
        !searchRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search for locations as user types
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (destination && destination.length >= 3) {
        const results = await searchLocation(destination);
        setSuggestions(results);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(searchTimeout);
  }, [destination]);

  const handleSuggestionClick = (suggestion) => {
    setDestination(suggestion.displayName);
    setDestinationCoords([suggestion.lat, suggestion.lon]);
    setShowSuggestions(false);
  };

  const handleMapClick = (coords) => {
    setDestinationCoords(coords);
    // Optionally reverse geocode to get address
    setDestination(`${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`);
  };

  const handleFindRoute = async () => {
    if (!destinationCoords) {
      setError('Please select a destination by searching or clicking on the map');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/route/safest', {
        origin: {
          lat: currentLocation[0],
          lon: currentLocation[1]
        },
        destination: {
          lat: destinationCoords[0],
          lon: destinationCoords[1]
        },
        alpha: alpha
      });

      // Check if we have multiple routes (new format) or single route (old format)
      if (response.data.routes) {
        // New format: Show route selection screen
        setRouteOptions({
          routes: response.data.routes,
          summary: response.data.summary,
          origin: currentLocation,
          destination: destinationCoords
        });
      } else {
        // Old format: Navigate directly to route viewer
        navigate('/route', { 
          state: { 
            route: response.data.route, 
            origin: currentLocation, 
            destination: destinationCoords 
          } 
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to find route');
      console.error('Route error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRouteSelect = (routeKey, route) => {
    navigate('/route', {
      state: {
        route: route,
        routeType: route.type,
        origin: routeOptions.origin,
        destination: routeOptions.destination,
        allRoutes: routeOptions.routes // Keep all routes for comparison
      }
    });
  };

  // Show route selection screen if routes are available
  if (routeOptions) {
    const { routes, summary } = routeOptions;
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Choose Your Route</h1>
          <p className="text-gray-600 mb-6">We've found 3 route options for you. Select the one that best fits your needs.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Route A: Shortest */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-200 hover:border-blue-400 transition">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-blue-600">Route A</h2>
                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">Shortest</span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Distance:</span>
                  <span className="font-semibold">{routes.routeA.distanceKm} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Safety Score:</span>
                  <span className="font-semibold text-orange-600">{routes.routeA.safetyScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Est. Time:</span>
                  <span className="font-semibold">{routes.routeA.eta} min</span>
                </div>
                {routes.routeA.unsafeSegments && routes.routeA.unsafeSegments.length > 0 && (
                  <div className="text-xs text-red-600">
                    ⚠️ {routes.routeA.unsafeSegments.length} unsafe segment(s)
                  </div>
                )}
              </div>
              <button
                onClick={() => handleRouteSelect('routeA', routes.routeA)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
              >
                Select This Route
              </button>
            </div>

            {/* Route B: Safest */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-green-200 hover:border-green-400 transition">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-green-600">Route B</h2>
                <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">Safest</span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Distance:</span>
                  <span className="font-semibold">{routes.routeB.distanceKm} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Safety Score:</span>
                  <span className="font-semibold text-green-600">{routes.routeB.safetyScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Est. Time:</span>
                  <span className="font-semibold">{routes.routeB.eta} min</span>
                </div>
                {routes.routeB.unsafeSegments && routes.routeB.unsafeSegments.length > 0 && (
                  <div className="text-xs text-red-600">
                    ⚠️ {routes.routeB.unsafeSegments.length} unsafe segment(s)
                  </div>
                )}
              </div>
              <button
                onClick={() => handleRouteSelect('routeB', routes.routeB)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
              >
                Select This Route
              </button>
            </div>

            {/* Route C: Balanced */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-purple-200 hover:border-purple-400 transition">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-purple-600">Route C</h2>
                <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded">Balanced</span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Distance:</span>
                  <span className="font-semibold">{routes.routeC.distanceKm} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Safety Score:</span>
                  <span className="font-semibold text-purple-600">{routes.routeC.safetyScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Est. Time:</span>
                  <span className="font-semibold">{routes.routeC.eta} min</span>
                </div>
                {routes.routeC.unsafeSegments && routes.routeC.unsafeSegments.length > 0 && (
                  <div className="text-xs text-red-600">
                    ⚠️ {routes.routeC.unsafeSegments.length} unsafe segment(s)
                  </div>
                )}
              </div>
              <button
                onClick={() => handleRouteSelect('routeC', routes.routeC)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md"
              >
                Select This Route
              </button>
            </div>
          </div>

          <button
            onClick={() => setRouteOptions(null)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md"
          >
            ← Find Different Route
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Find Your Safest Route</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="space-y-4">
            <div className="relative" ref={searchRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destination
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  if (!e.target.value) {
                    setDestinationCoords(null);
                  }
                }}
                placeholder="Search for a place or address (e.g., Times Square, New York)"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                onFocus={() => {
                  if (suggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
              />
              
              {/* Autocomplete Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div 
                  ref={suggestionsRef}
                  className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                >
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{suggestion.displayName}</div>
                      {suggestion.address.city && (
                        <div className="text-sm text-gray-500">
                          {[suggestion.address.city, suggestion.address.country]
                            .filter(Boolean)
                            .join(', ')}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <p className="mt-1 text-sm text-gray-500">
                Type an address or click on the map to select a destination
              </p>
              
              {destinationCoords && (
                <p className="mt-1 text-xs text-green-600">
                  ✓ Destination selected: {destinationCoords[0].toFixed(6)}, {destinationCoords[1].toFixed(6)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Safety Preference: {Math.round(alpha * 100)}% Safety, {Math.round((1 - alpha) * 100)}% Distance
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={alpha}
                onChange={(e) => setAlpha(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Prioritize Distance</span>
                <span>Prioritize Safety</span>
              </div>
            </div>

            <button
              onClick={handleFindRoute}
              disabled={loading || !destinationCoords}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Finding safest route...' : 'Find Safest Route'}
            </button>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: '600px' }}>
          <MapContainer
            center={currentLocation}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={currentLocation} setPosition={setCurrentLocation} />
            <DestinationMarker position={destinationCoords} />
            <MapClickHandler onMapClick={handleMapClick} />
          </MapContainer>
        </div>
      </div>
    </div>
  );
}