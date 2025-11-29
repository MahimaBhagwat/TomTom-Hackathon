import React from 'react';
import L from 'leaflet';

// Create custom icon for police zones
export const PoliceZoneIcon = L.divIcon({
  html: `<div style="background-color: #3b82f6; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">🚔</div>`,
  iconSize: [24, 24],
  className: 'police-zone-icon'
});

// Create custom icon for safe spots
export const SafeSpotIcon = L.divIcon({
  html: `<div style="background-color: #10b981; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">✓</div>`,
  iconSize: [24, 24],
  className: 'safe-spot-icon'
});

// Create custom icon for isolated segments warning
export const IsolatedSegmentIcon = L.divIcon({
  html: `<div style="background-color: #ef4444; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">!</div>`,
  iconSize: [24, 24],
  className: 'isolated-segment-icon'
});

export default {
  PoliceZoneIcon,
  SafeSpotIcon,
  IsolatedSegmentIcon
};
