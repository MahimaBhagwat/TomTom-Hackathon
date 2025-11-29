import React, { useState } from 'react';

export default function RouteFilterPanel({ filters, onFilterChange, isCollapsed, onToggleCollapse }) {
  const [expandedSection, setExpandedSection] = useState({
    safety: true,
    environmental: false,
    preferences: false,
    accessibility: false,
    weights: false
  });

  const toggleSection = (section) => {
    setExpandedSection(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleToggle = (filterName) => {
    onFilterChange({
      ...filters,
      [filterName]: !filters[filterName]
    });
  };

  const handleSliderChange = (filterName, value) => {
    onFilterChange({
      ...filters,
      [filterName]: parseFloat(value)
    });
  };

  const handleSelectChange = (filterName, value) => {
    onFilterChange({
      ...filters,
      [filterName]: value
    });
  };

  const handleWeightChange = (weightName, value) => {
    onFilterChange({
      ...filters,
      [weightName]: parseFloat(value)
    });
  };

  const handleCustomTimeChange = (value) => {
    onFilterChange({
      ...filters,
      custom_time: parseInt(value)
    });
  };

  const handleViaPointsChange = (index, field, value) => {
    const viaPoints = filters.via_points ? [...filters.via_points] : [];
    if (!viaPoints[index]) {
      viaPoints[index] = { lat: 0, lng: 0 };
    }
    viaPoints[index][field] = parseFloat(value);
    onFilterChange({
      ...filters,
      via_points: viaPoints
    });
  };

  const addViaPoint = () => {
    const viaPoints = filters.via_points ? [...filters.via_points] : [];
    viaPoints.push({ lat: 0, lng: 0 });
    onFilterChange({
      ...filters,
      via_points: viaPoints
    });
  };

  const removeViaPoint = (index) => {
    const viaPoints = filters.via_points ? [...filters.via_points] : [];
    viaPoints.splice(index, 1);
    onFilterChange({
      ...filters,
      via_points: viaPoints.length > 0 ? viaPoints : undefined
    });
  };

  if (isCollapsed) {
    return (
      <div className="fixed left-0 top-0 h-screen bg-white shadow-lg z-40 flex items-center">
        <button
          onClick={onToggleCollapse}
          className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center rounded-r-lg"
          title="Expand filters"
        >
          <span className="text-xl">→</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white shadow-lg overflow-y-auto flex flex-col h-screen fixed left-0 top-0 z-40">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Route Filters</h2>
        <button
          onClick={onToggleCollapse}
          className="p-1 hover:bg-gray-100 rounded"
          title="Collapse filters"
        >
          <span className="text-xl">←</span>
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Safety Filters */}
        <div className="mb-4">
          <button
            onClick={() => toggleSection('safety')}
            className="w-full flex items-center justify-between p-3 bg-red-50 hover:bg-red-100 rounded-lg font-semibold text-red-900 transition"
          >
            <span>🛡️ Safety Filters</span>
            <span>{expandedSection.safety ? '▼' : '▶'}</span>
          </button>
          
          {expandedSection.safety && (
            <div className="mt-2 space-y-3 ml-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.avoid_red_zones || false}
                  onChange={() => handleToggle('avoid_red_zones')}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-700">Avoid Red Zones</span>
              </label>

              <label className="flex flex-col space-y-1">
                <span className="text-sm font-medium text-gray-700">
                  Min Lighting Score: {(filters.min_lighting_score || 0.5).toFixed(1)}
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={filters.min_lighting_score || 0.5}
                  onChange={(e) => handleSliderChange('min_lighting_score', e.target.value)}
                  className="w-full"
                />
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.avoid_isolated_segments || false}
                  onChange={() => handleToggle('avoid_isolated_segments')}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-700">Avoid Isolated Segments</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.avoid_recent_incidents || false}
                  onChange={() => handleToggle('avoid_recent_incidents')}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-700">Avoid Recent Incidents</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.prefer_police_zones || false}
                  onChange={() => handleToggle('prefer_police_zones')}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-700">Prefer Police Zones</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.prefer_open_spaces || false}
                  onChange={() => handleToggle('prefer_open_spaces')}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-700">Prefer Open Spaces</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.require_streetlights || false}
                  onChange={() => handleToggle('require_streetlights')}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-700">Require Streetlights</span>
              </label>
            </div>
          )}
        </div>

        {/* Environmental Filters */}
        <div className="mb-4">
          <button
            onClick={() => toggleSection('environmental')}
            className="w-full flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-lg font-semibold text-green-900 transition"
          >
            <span>🌍 Environmental Filters</span>
            <span>{expandedSection.environmental ? '▼' : '▶'}</span>
          </button>
          
          {expandedSection.environmental && (
            <div className="mt-2 space-y-3 ml-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.avoid_flood_prone_areas || false}
                  onChange={() => handleToggle('avoid_flood_prone_areas')}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-700">Avoid Flood-Prone Areas</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.avoid_construction || false}
                  onChange={() => handleToggle('avoid_construction')}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-700">Avoid Construction</span>
              </label>

              <label className="flex flex-col space-y-1">
                <span className="text-sm font-medium text-gray-700">
                  Min Weather Score: {(filters.min_weather_score || 0.5).toFixed(1)}
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={filters.min_weather_score || 0.5}
                  onChange={(e) => handleSliderChange('min_weather_score', e.target.value)}
                  className="w-full"
                />
              </label>
            </div>
          )}
        </div>

        {/* Route Preferences */}
        <div className="mb-4">
          <button
            onClick={() => toggleSection('preferences')}
            className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg font-semibold text-blue-900 transition"
          >
            <span>🛣️ Route Preferences</span>
            <span>{expandedSection.preferences ? '▼' : '▶'}</span>
          </button>
          
          {expandedSection.preferences && (
            <div className="mt-2 space-y-3 ml-2">
              <label className="flex flex-col space-y-1">
                <span className="text-sm font-medium text-gray-700">
                  Max Distance Extra (%): {(filters.max_distance_extra_percent || 10).toFixed(0)}%
                </span>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={filters.max_distance_extra_percent || 10}
                  onChange={(e) => handleSliderChange('max_distance_extra_percent', e.target.value)}
                  className="w-full"
                />
              </label>

              <label className="flex flex-col space-y-1">
                <span className="text-sm font-medium text-gray-700">Time of Travel:</span>
                <select
                  value={filters.time_of_travel || 'now'}
                  onChange={(e) => handleSelectChange('time_of_travel', e.target.value)}
                  className="p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="now">Now</option>
                  <option value="day">Day (12:00 PM)</option>
                  <option value="night">Night (10:00 PM)</option>
                  <option value="custom">Custom Time</option>
                </select>
              </label>

              {filters.time_of_travel === 'custom' && (
                <label className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-gray-700">Custom Hour (0-23):</span>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={filters.custom_time || 12}
                    onChange={(e) => handleCustomTimeChange(e.target.value)}
                    className="p-2 border border-gray-300 rounded text-sm"
                  />
                </label>
              )}
            </div>
          )}
        </div>

        {/* Accessibility & Audio */}
        <div className="mb-4">
          <button
            onClick={() => toggleSection('accessibility')}
            className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg font-semibold text-purple-900 transition"
          >
            <span>♿ Accessibility</span>
            <span>{expandedSection.accessibility ? '▼' : '▶'}</span>
          </button>
          
          {expandedSection.accessibility && (
            <div className="mt-2 space-y-3 ml-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.accessible_route_only || false}
                  onChange={() => handleToggle('accessible_route_only')}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-700">Accessible Route Only</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.audio_friendly || false}
                  onChange={() => handleToggle('audio_friendly')}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-700">Audio-Friendly Route</span>
              </label>
            </div>
          )}
        </div>

        {/* Route Weights */}
        <div className="mb-4">
          <button
            onClick={() => toggleSection('weights')}
            className="w-full flex items-center justify-between p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg font-semibold text-yellow-900 transition"
          >
            <span>⚖️ Route Weights</span>
            <span>{expandedSection.weights ? '▼' : '▶'}</span>
          </button>
          
          {expandedSection.weights && (
            <div className="mt-2 space-y-3 ml-2">
              <label className="flex flex-col space-y-1">
                <span className="text-sm font-medium text-gray-700">
                  Weight Distance: {(filters.weight_distance || 0.3).toFixed(1)}
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={filters.weight_distance || 0.3}
                  onChange={(e) => handleWeightChange('weight_distance', e.target.value)}
                  className="w-full"
                />
              </label>

              <label className="flex flex-col space-y-1">
                <span className="text-sm font-medium text-gray-700">
                  Weight Safety: {(filters.weight_safety || 0.5).toFixed(1)}
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={filters.weight_safety || 0.5}
                  onChange={(e) => handleWeightChange('weight_safety', e.target.value)}
                  className="w-full"
                />
              </label>

              <label className="flex flex-col space-y-1">
                <span className="text-sm font-medium text-gray-700">
                  Weight Speed: {(filters.weight_speed || 0.2).toFixed(1)}
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={filters.weight_speed || 0.2}
                  onChange={(e) => handleWeightChange('weight_speed', e.target.value)}
                  className="w-full"
                />
              </label>

              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                Weights will be normalized to sum to 1.0
              </div>
            </div>
          )}
        </div>

        {/* Via Points (Advanced) */}
        <div className="mb-4">
          <button
            onClick={() => toggleSection('via_points')}
            className="w-full flex items-center justify-between p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg font-semibold text-indigo-900 transition"
          >
            <span>📍 Via Points</span>
            <span>
              {expandedSection.via_points ? '▼' : '▶'}
              {filters.via_points && filters.via_points.length > 0 && (
                <span className="ml-2 bg-indigo-200 text-indigo-900 text-xs px-2 py-1 rounded">
                  {filters.via_points.length}
                </span>
              )}
            </span>
          </button>
          
          {expandedSection.via_points && (
            <div className="mt-2 space-y-2 ml-2">
              {filters.via_points && filters.via_points.map((point, index) => (
                <div key={index} className="bg-gray-50 p-2 rounded space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">Point {index + 1}</span>
                    <button
                      onClick={() => removeViaPoint(index)}
                      className="text-xs bg-red-100 text-red-700 hover:bg-red-200 px-2 py-1 rounded"
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    type="number"
                    placeholder="Latitude"
                    value={point.lat || ''}
                    onChange={(e) => handleViaPointsChange(index, 'lat', e.target.value)}
                    className="w-full p-1 text-xs border border-gray-300 rounded"
                  />
                  <input
                    type="number"
                    placeholder="Longitude"
                    value={point.lng || ''}
                    onChange={(e) => handleViaPointsChange(index, 'lng', e.target.value)}
                    className="w-full p-1 text-xs border border-gray-300 rounded"
                  />
                </div>
              ))}
              
              <button
                onClick={addViaPoint}
                className="w-full mt-2 p-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 text-xs font-medium rounded transition"
              >
                + Add Via Point
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-3 text-xs text-gray-500">
        Filters are applied automatically. Changes will update the route in ~400ms.
      </div>
    </div>
  );
}
