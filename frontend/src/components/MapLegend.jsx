import React from 'react';

export default function MapLegend({ filters }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 absolute bottom-4 left-4 z-20 max-w-xs text-xs">
      <h3 className="font-bold mb-3 text-gray-900">Map Legend</h3>
      
      {/* Color legend */}
      <div className="mb-3 pb-3 border-b border-gray-200">
        <div className="font-semibold text-gray-700 mb-2">Route Colors:</div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-1 bg-green-500 rounded"></div>
            <span className="text-gray-600">Safe (ISC &gt; 0.6)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-1 bg-yellow-500 rounded"></div>
            <span className="text-gray-600">Moderate (0.4 - 0.6)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-1 bg-red-500 rounded"></div>
            <span className="text-gray-600">Unsafe (ISC &lt; 0.4)</span>
          </div>
          {filters.avoid_red_zones && (
            <div className="flex items-center space-x-2">
              <div className="w-6 h-1 bg-red-600 rounded" style={{ borderTop: '2px dashed #dc2626' }}></div>
              <span className="text-gray-600">Avoided (Filtered)</span>
            </div>
          )}
        </div>
      </div>

      {/* Filters applied */}
      {filters && Object.keys(filters).length > 0 && (
        <div className="pb-3 border-b border-gray-200">
          <div className="font-semibold text-gray-700 mb-2">Active Filters:</div>
          <div className="space-y-1 text-gray-600 max-h-24 overflow-y-auto">
            {filters.avoid_red_zones && <div>✓ Avoid Red Zones</div>}
            {filters.avoid_isolated_segments && <div>✓ Avoid Isolated Segments</div>}
            {filters.prefer_police_zones && <div>✓ Prefer Police Zones</div>}
            {filters.require_streetlights && <div>✓ Require Streetlights</div>}
            {filters.accessible_route_only && <div>✓ Accessible Only</div>}
            {filters.audio_friendly && <div>✓ Audio-Friendly</div>}
            {Object.keys(filters).length > 6 && (
              <div className="text-gray-500 italic">+ {Object.keys(filters).length - 6} more filters</div>
            )}
          </div>
        </div>
      )}

      {/* Markers info */}
      <div>
        <div className="font-semibold text-gray-700 mb-2">Markers:</div>
        <div className="space-y-1 text-gray-600">
          <div className="flex items-center space-x-2">
            <span className="w-4 h-4 bg-blue-100 border border-blue-400 rounded-full flex items-center justify-center text-xs">A</span>
            <span>Origin</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-4 h-4 bg-red-100 border border-red-400 rounded-full flex items-center justify-center text-xs">B</span>
            <span>Destination</span>
          </div>
        </div>
      </div>
    </div>
  );
}
