import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import api from '../config/api';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function RouteViewer() {
  const location = useLocation();
  const navigate = useNavigate();
  const [route, setRoute] = useState(location.state?.route);
  const [origin] = useState(location.state?.origin || [40.7128, -74.0060]);
  const [destination] = useState(location.state?.destination || [40.7589, -73.9851]);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [zoneStatus, setZoneStatus] = useState(null);

  useEffect(() => {
    if (!route) {
      navigate('/');
      return;
    }

    // Check for unsafe segments and show alerts
    if (route.unsafeSegments && route.unsafeSegments.length > 0) {
      const hasRedZone = route.unsafeSegments.some(s => s.isc < 0.4);
      if (hasRedZone) {
        alert('⚠️ Unsafe area ahead — rerouting…');
      }
    }

    // Monitor current location for red zones
    const checkZoneStatus = async () => {
      if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
          async (position) => {
            try {
              const response = await api.get('/api/zone-status', {
                params: {
                  lat: position.coords.latitude,
                  lon: position.coords.longitude
                }
              });
              setZoneStatus(response.data);
              
              if (response.data.status === 'red') {
                alert('🚨 Unsafe area ahead — rerouting…');
              }
            } catch (error) {
              console.error('Zone status error:', error);
            }
          },
          (err) => console.error('Geolocation error:', err),
          { enableHighAccuracy: true }
        );
      }
    };

    checkZoneStatus();
  }, [route, navigate]);

  const getSegmentColor = (isc) => {
    if (isc < 0.4) return 'red';
    if (isc < 0.6) return 'orange';
    return 'green';
  };

  const getPolylineColor = (isc) => {
    if (isc < 0.4) return '#ef4444';
    if (isc < 0.6) return '#f59e0b';
    return '#10b981';
  };

  if (!route) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">No route data available</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const allSegments = route.segments || [];
  const bounds = L.latLngBounds([origin, destination, ...route.polyline]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Safest Route</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Distance</div>
              <div className="text-2xl font-bold text-blue-600">{route.distanceKm} km</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Safety Score</div>
              <div className="text-2xl font-bold text-green-600">{route.safetyScore}%</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Estimated Time</div>
              <div className="text-2xl font-bold text-purple-600">{route.eta} min</div>
            </div>
          </div>

          {route.unsafeSegments && route.unsafeSegments.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <span className="text-yellow-600 text-xl mr-2">⚠️</span>
                <div>
                  <div className="font-medium text-yellow-800">
                    {route.unsafeSegments.length} unsafe segment(s) detected
                  </div>
                  <div className="text-sm text-yellow-700">
                    Exercise caution in these areas
                  </div>
                </div>
              </div>
            </div>
          )}

          {zoneStatus && (
            <div className={`p-4 rounded-lg mb-4 ${
              zoneStatus.status === 'red' ? 'bg-red-50 border border-red-200' :
              zoneStatus.status === 'yellow' ? 'bg-yellow-50 border border-yellow-200' :
              'bg-green-50 border border-green-200'
            }`}>
              <div className="font-medium">
                Current Zone Status: <span className="uppercase">{zoneStatus.status}</span>
              </div>
              <div className="text-sm">{zoneStatus.message}</div>
            </div>
          )}

          {selectedSegment && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h3 className="font-bold mb-2">Segment Safety Breakdown</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Lighting: {(selectedSegment.breakdown.lighting * 100).toFixed(0)}%</div>
                <div>Weather: {(selectedSegment.breakdown.weather * 100).toFixed(0)}%</div>
                <div>Crowd: {(selectedSegment.breakdown.crowd * 100).toFixed(0)}%</div>
                <div>Reports: {(selectedSegment.breakdown.reports * 100).toFixed(0)}%</div>
                <div>Traffic: {(selectedSegment.breakdown.traffic * 100).toFixed(0)}%</div>
                <div className="font-bold">ISC: {(selectedSegment.isc * 100).toFixed(1)}%</div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: '600px' }}>
          <MapContainer
            bounds={bounds}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <Marker position={origin}>
              <Popup>Origin</Popup>
            </Marker>
            
            <Marker position={destination}>
              <Popup>Destination</Popup>
            </Marker>

            {/* Draw full continuous route as base */}
            {route.polyline && route.polyline.length > 0 && (
              <Polyline
                positions={route.polyline}
                color="#3b82f6"
                weight={8}
                opacity={1}
                dashArray={null}
                lineCap="round"
                lineJoin="round"
              />
            )}

            {/* Draw colored segments on top for safety visualization */}
            {allSegments.map((segment, index) => {
              const segmentPolyline = [
                [segment.start.latitude, segment.start.longitude],
                [segment.end.latitude, segment.end.longitude]
              ];
              
              return (
                <Polyline
                  key={index}
                  positions={segmentPolyline}
                  color="#3b82f6"
                  weight={8}
                  opacity={1}
                  dashArray={null}
                  lineCap="round"
                  lineJoin="round"
                  eventHandlers={{
                    click: () => setSelectedSegment(segment)
                  }}
                />
              );
            })}
          </MapContainer>
        </div>

        <div className="mt-4 flex justify-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md"
          >
            Find New Route
          </button>
        </div>
      </div>
    </div>
  );
}