const { reportsCollection } = require('./firebaseService');
const { getTrafficFlow, getTrafficIncidents } = require('./tomtomService');
const { getCurrentWeather, calculateWeatherSafetyFactor } = require('./weatherService');

/**
 * Calculate Incident Safety Coefficient (ISC) for a route segment
 * ISC = Σ wᵢ × Fᵢ
 * 
 * Factors:
 * - lighting (w1 = 0.2)
 * - weather (w2 = 0.2)
 * - crowd (w3 = 0.15)
 * - reports (w4 = 0.3)
 * - traffic (w5 = 0.15)
 */
async function calculateISC(segment, timeOfDay = null, filters = {}) {
  const weights = {
    lighting: 0.2,
    weather: 0.2,
    crowd: 0.15,
    reports: 0.3,
    traffic: 0.15
  };

  // 1. Lighting factor (0-1, where 1 is safest)
  const lightingFactor = calculateLightingFactor(segment, timeOfDay);

  // 2. Weather factor
  const weather = await getCurrentWeather(segment.center.lat, segment.center.lon);
  const weatherFactor = calculateWeatherSafetyFactor(weather);

  // 3. Crowd factor (estimated based on time and area type)
  const crowdFactor = calculateCrowdFactor(segment, timeOfDay);

  // 4. Reports factor (from Firestore)
  const reportsFactor = await calculateReportsFactor(segment);

  // 5. Traffic factor (from TomTom)
  const trafficFactor = await calculateTrafficFactor(segment);

  // Calculate weighted ISC
  const isc = 
    weights.lighting * lightingFactor +
    weights.weather * weatherFactor +
    weights.crowd * crowdFactor +
    weights.reports * reportsFactor +
    weights.traffic * trafficFactor;

  return {
    isc: Math.max(0, Math.min(1, isc)),
    breakdown: {
      lighting: lightingFactor,
      weather: weatherFactor,
      crowd: crowdFactor,
      reports: reportsFactor,
      traffic: trafficFactor
    }
  };
}

/**
 * Calculate lighting factor based on time of day and area type
 */
function calculateLightingFactor(segment, timeOfDay) {
  if (!timeOfDay) {
    const now = new Date();
    timeOfDay = now.getHours();
  }

  // Assume well-lit areas during day (6 AM - 8 PM)
  if (timeOfDay >= 6 && timeOfDay < 20) {
    return 1.0; // Daytime - well lit
  } else if (timeOfDay >= 20 || timeOfDay < 6) {
    // Nighttime - assume residential areas have better lighting
    // This is a simplified model - in production, use actual lighting data
    return 0.6; // Moderate lighting at night
  }
  return 0.7; // Default
}

/**
 * Calculate crowd factor (more people = safer)
 */
function calculateCrowdFactor(segment, timeOfDay) {
  if (!timeOfDay) {
    const now = new Date();
    timeOfDay = now.getHours();
  }

  // Peak hours (7-9 AM, 5-7 PM) have more people
  const isPeakHour = (timeOfDay >= 7 && timeOfDay <= 9) || (timeOfDay >= 17 && timeOfDay <= 19);
  
  // Residential areas might have fewer people at night
  if (timeOfDay >= 22 || timeOfDay < 6) {
    return 0.5; // Low crowd at night
  } else if (isPeakHour) {
    return 0.9; // High crowd during peak hours
  }
  return 0.7; // Moderate crowd
}

/**
 * Calculate reports factor based on recent safety reports
 */
async function calculateReportsFactor(segment) {
  try {
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    // Get reports within 100m of segment center
    const reportsSnapshot = await reportsCollection
      .where('timestamp', '>', thirtyMinutesAgo)
      .get();

    if (reportsSnapshot.empty) {
      return 1.0; // No reports = safe
    }

    let nearbyReports = 0;
    const radius = 0.001; // ~100m in degrees (approximate)

    reportsSnapshot.forEach(doc => {
      const report = doc.data();
      if (report.location) {
        const distance = calculateDistance(
          segment.center.lat,
          segment.center.lon,
          report.location.lat,
          report.location.lon
        );
        if (distance < radius) {
          nearbyReports++;
        }
      }
    });

    // More reports = lower safety factor
    // 0 reports = 1.0, 1 report = 0.7, 2+ reports = 0.4
    if (nearbyReports === 0) return 1.0;
    if (nearbyReports === 1) return 0.7;
    return 0.4;
  } catch (error) {
    console.error('Error calculating reports factor:', error);
    return 0.8; // Default safe if error
  }
}

/**
 * Calculate traffic factor (moderate traffic = safer, too much = dangerous)
 */
async function calculateTrafficFactor(segment) {
  try {
    const bbox = {
      center: segment.center,
      minLat: segment.center.lat - 0.01,
      maxLat: segment.center.lat + 0.01,
      minLon: segment.center.lon - 0.01,
      maxLon: segment.center.lon + 0.01
    };

    const trafficFlow = await getTrafficFlow(bbox);
    if (!trafficFlow || !trafficFlow.flowSegmentData) {
      return 0.7; // Default moderate safety
    }

    const currentSpeed = trafficFlow.flowSegmentData.currentSpeed || 0;
    const freeFlowSpeed = trafficFlow.flowSegmentData.freeFlowSpeed || 50;

    // Moderate traffic (50-80% of free flow) is safest for pedestrians
    const speedRatio = currentSpeed / freeFlowSpeed;
    if (speedRatio > 0.8) {
      return 0.6; // Fast traffic = less safe
    } else if (speedRatio > 0.5) {
      return 0.9; // Moderate traffic = safer
    } else {
      return 0.7; // Slow/heavy traffic = moderate safety
    }
  } catch (error) {
    console.error('Error calculating traffic factor:', error);
    return 0.7; // Default
  }
}

/**
 * Calculate distance between two lat/lon points (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

/**
 * Calculate optimal route cost: α × Safety + (1 − α) × Distance
 * Can be enhanced with custom weights for distance, safety, and speed
 */
function calculateOptimalCost(safetyScore, distance, alpha, customWeights = null) {
  // Normalize distance (assume max route is 10km = 10000m)
  const normalizedDistance = Math.min(1, distance / 10000);
  
  // Safety score is already 0-1 (ISC)
  // Lower cost is better, so we invert distance
  if (customWeights && (customWeights.weight_distance || customWeights.weight_safety || customWeights.weight_speed)) {
    const wD = customWeights.weight_distance || 0.3;
    const wS = customWeights.weight_safety || 0.5;
    const wSp = customWeights.weight_speed || 0.2;
    
    // Normalize weights
    const totalWeight = wD + wS + wSp;
    const nwD = wD / totalWeight;
    const nwS = wS / totalWeight;
    const nwSp = wSp / totalWeight;
    
    // Estimated speed factor (normalized distance / estimated time)
    const speedFactor = 1.0; // Base speed is assumed optimal
    
    const cost = nwD * normalizedDistance + 
                 nwS * (1 - safetyScore) + 
                 nwSp * (1 - speedFactor);
    return cost;
  }
  
  const cost = alpha * (1 - safetyScore) + (1 - alpha) * normalizedDistance;
  return cost;
}

/**
 * Apply filters to ISC score
 * Dynamically adjusts ISC based on user preferences and environmental filters
 */
async function applyFiltersToISC(isc, segment, filters = {}) {
  let adjustedISC = isc;
  
  // Safety-related filters
  if (filters.avoid_red_zones && isc < 0.4) {
    adjustedISC *= 0.5; // Heavily penalize red zones
  }
  
  if (filters.min_lighting_score) {
    const minLighting = Math.max(0, Math.min(1, filters.min_lighting_score));
    if (segment.lighting < minLighting) {
      adjustedISC *= 0.6; // Penalize low lighting areas
    }
  }
  
  if (filters.avoid_isolated_segments) {
    // Penalize segments with low crowd factor
    if (segment.crowd && segment.crowd < 0.5) {
      adjustedISC *= 0.7;
    }
  }
  
  if (filters.avoid_recent_incidents) {
    // Penalize segments with recent reports
    if (segment.reports && segment.reports < 0.6) {
      adjustedISC *= 0.65;
    }
  }
  
  if (filters.prefer_police_zones) {
    // Bonus for areas near police stations (mock: check reports high)
    if (segment.reports && segment.reports > 0.8) {
      adjustedISC *= 1.1; // Slightly boost
    }
  }
  
  if (filters.prefer_open_spaces) {
    // Bonus for areas with good crowd factor
    if (segment.crowd && segment.crowd > 0.7) {
      adjustedISC *= 1.05;
    }
  }
  
  if (filters.require_streetlights) {
    // Strictly require good lighting
    if (segment.lighting && segment.lighting < 0.7) {
      adjustedISC *= 0.4; // Very heavy penalization
    }
  }
  
  // Environmental filters
  if (filters.avoid_flood_prone_areas) {
    // Mock: assume weather factor indicates flooding risk
    if (segment.weather && segment.weather < 0.5) {
      adjustedISC *= 0.7;
    }
  }
  
  if (filters.avoid_construction) {
    // Mock: check traffic factor (high traffic could indicate construction)
    if (segment.traffic && segment.traffic < 0.4) {
      adjustedISC *= 0.75;
    }
  }
  
  if (filters.min_weather_score) {
    const minWeather = Math.max(0, Math.min(1, filters.min_weather_score));
    if (segment.weather && segment.weather < minWeather) {
      adjustedISC *= 0.65;
    }
  }
  
  // Route preference filters
  if (filters.accessible_route_only) {
    // Mock: penalize routes without accessibility data
    // In production, check actual accessibility data
    adjustedISC *= 0.95; // Slight penalty to encourage choosing verified accessible routes
  }
  
  if (filters.audio_friendly) {
    // Bonus for well-lit, safe areas that would be easier to navigate audio-only
    if (segment.lighting && segment.lighting > 0.8 && segment.crowd && segment.crowd > 0.6) {
      adjustedISC *= 1.05;
    }
  }
  
  return Math.max(0, Math.min(1, adjustedISC));
}

/**
 * Check if segment passes all filter constraints
 */
async function passesFilterConstraints(segment, filters = {}) {
  // Hard constraints (segment must pass or be filtered out)
  if (filters.avoid_red_zones && segment.isc < 0.3) return false;
  if (filters.require_streetlights && segment.lighting < 0.7) return false;
  if (filters.min_lighting_score && segment.lighting < filters.min_lighting_score) return false;
  if (filters.min_weather_score && segment.weather < filters.min_weather_score) return false;
  
  return true;
}

/**
 * Normalize custom weight parameters
 */
function normalizeWeights(filters) {
  const weights = {
    weight_distance: filters.weight_distance || 0.3,
    weight_safety: filters.weight_safety || 0.5,
    weight_speed: filters.weight_speed || 0.2
  };
  
  const total = weights.weight_distance + weights.weight_safety + weights.weight_speed;
  return {
    weight_distance: weights.weight_distance / total,
    weight_safety: weights.weight_safety / total,
    weight_speed: weights.weight_speed / total
  };
}

/**
 * Extract time of day from filter
 */
function getTimeOfDay(filters) {
  if (filters.time_of_travel) {
    if (filters.time_of_travel === 'day') return 12; // Noon
    if (filters.time_of_travel === 'night') return 22; // 10 PM
    if (filters.time_of_travel === 'custom' && filters.custom_time) return filters.custom_time;
    // 'now' uses current time (handled in caller)
  }
  return null;
}

module.exports = {
  calculateISC,
  calculateOptimalCost,
  calculateDistance,
  applyFiltersToISC,
  passesFilterConstraints,
  normalizeWeights,
  getTimeOfDay
};

