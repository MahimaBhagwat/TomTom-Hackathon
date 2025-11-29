import React from 'react';

export default function AppliedFilters({ filters }) {
  if (!filters || Object.keys(filters).length === 0) {
    return null;
  }

  const getFilterLabel = (key) => {
    const labels = {
      avoid_red_zones: '🛑 Avoid Red Zones',
      min_lighting_score: `💡 Min Lighting ${(filters[key]).toFixed(1)}`,
      avoid_isolated_segments: '👥 Avoid Isolated Segments',
      avoid_recent_incidents: '⚠️ Avoid Recent Incidents',
      prefer_police_zones: '🚔 Prefer Police Zones',
      prefer_open_spaces: '🌳 Prefer Open Spaces',
      require_streetlights: '🛣️ Require Streetlights',
      avoid_flood_prone_areas: '💧 Avoid Flood-Prone Areas',
      avoid_construction: '🚧 Avoid Construction',
      min_weather_score: `☀️ Min Weather ${(filters[key]).toFixed(1)}`,
      max_distance_extra_percent: `📏 Max +${(filters[key]).toFixed(0)}%`,
      time_of_travel: `🕐 Time: ${filters[key]}`,
      accessible_route_only: '♿ Accessible Only',
      audio_friendly: '🔊 Audio-Friendly',
      weight_distance: `⚖️ Distance ${(filters[key]).toFixed(1)}`,
      weight_safety: `⚖️ Safety ${(filters[key]).toFixed(1)}`,
      weight_speed: `⚖️ Speed ${(filters[key]).toFixed(1)}`
    };
    return labels[key] || key;
  };

  const activeFilters = Object.entries(filters)
    .filter(([_, value]) => value === true || (typeof value === 'number' && value !== 0.5 && value !== 0.3 && value !== 0.2))
    .map(([key, _]) => key);

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
      <div className="text-xs font-semibold text-blue-900 mb-2">Applied Filters:</div>
      <div className="flex flex-wrap gap-2">
        {activeFilters.map((filter) => (
          <span
            key={filter}
            className="inline-flex items-center bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full"
          >
            {getFilterLabel(filter)}
          </span>
        ))}
      </div>
    </div>
  );
}
