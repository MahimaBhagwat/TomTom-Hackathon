const { getRouteAlternatives } = require('../services/tomtomService');
const { calculateISC, calculateOptimalCost } = require('../services/safetyService');

/**
 * POST /api/route/safest
 * Find the safest route between origin and destination
 */
async function findSafestRoute(req, res) {
  try {
    const { origin, destination, alpha = 0.7 } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ 
        error: 'Origin and destination are required',
        example: {
          origin: { lat: 40.7128, lon: -74.0060 },
          destination: { lat: 40.7589, lon: -73.9851 },
          alpha: 0.7
        }
      });
    }
    // Validate alpha (0-1)
    const safetyWeight = Math.max(0, Math.min(1, parseFloat(alpha)));

    // Get route alternatives from TomTom with real-time data
    const routeData = await getRouteAlternatives(origin, destination, 3);
    
    if (!routeData || !routeData.routes || routeData.routes.length === 0) {
      return res.status(404).json({ 
        error: 'No routes found',
        message: 'Unable to find a route between the specified locations. Please check your origin and destination coordinates.'
      });
    }
    // Process each route alternative
    const processedRoutes = await Promise.all(
      routeData.routes.map(async (route, index) => {
        // Handle both v1 and v2 API response formats
        const leg = route.legs && route.legs[0] ? route.legs[0] : route.legs;
        if (!leg) {
          console.error('Invalid route structure:', route);
          return null;
        }
        // Get points from the route
        let points = [];
        if (leg.points && Array.isArray(leg.points)) {
          points = leg.points;
        } else if (route.sections && Array.isArray(route.sections)) {
          // Handle v2 API format with sections
          points = [];
          route.sections.forEach(section => {
            if (section.points && Array.isArray(section.points)) {
              points = points.concat(section.points);
            }
          });
        }
        if (points.length === 0) {
          console.error('No points found in route:', route);
          return null;
        }
        
        // Calculate ISC for segments (sample every Nth segment to optimize performance)
        const segments = [];
        let totalISC = 0;
        let unsafeSegments = [];
        
        // Sample segments - process every 5th segment to balance accuracy vs performance
        // This gives us representative safety data without processing hundreds of segments
        const segmentStep = Math.max(1, Math.floor(points.length / 50)); // Sample up to 50 segments max
        
        const sampledIndices = [];
        for (let i = 0; i < points.length - 1; i += segmentStep) {
          sampledIndices.push(i);
        }
        // Always include last segment
        if (sampledIndices[sampledIndices.length - 1] !== points.length - 2) {
          sampledIndices.push(points.length - 2);
        }
        // Process segments in parallel batches for better performance
        const batchSize = 10;
        for (let batchStart = 0; batchStart < sampledIndices.length; batchStart += batchSize) {
          const batch = sampledIndices.slice(batchStart, batchStart + batchSize);
          
          const batchResults = await Promise.all(
            batch.map(async (i) => {
              const segment = {
                start: points[i],
                end: points[i + 1],
                center: {
                  lat: (points[i].latitude + points[i + 1].latitude) / 2,
                  lon: (points[i].longitude + points[i + 1].longitude) / 2
                }
              };
              try {
                const iscResult = await calculateISC(segment);
                return {
                  index: i,
                  segment,
                  isc: iscResult.isc,
                  breakdown: iscResult.breakdown
                };
              } catch (error) {
                console.error(`Error calculating ISC for segment ${i}:`, error.message);
                return {
                  index: i,
                  segment,
                  isc: 0.5, // Default safe value on error
                  breakdown: {
                    lighting: 0.7,
                    weather: 0.7,
                    crowd: 0.7,
                    reports: 1.0,
                    traffic: 0.7
                  }
                };
              }
            })
          );
          // Process batch results
          batchResults.forEach((result) => {
            segments.push({
              ...result.segment,
              isc: result.isc,
              breakdown: result.breakdown
            });

            totalISC += result.isc;
            // Mark unsafe segments (ISC < 0.5)
            if (result.isc < 0.5) {
              unsafeSegments.push({
                segment: result.index,
                isc: result.isc,
                location: result.segment.center
              });
            }
          });
        }

        // Average ISC for the route
        const avgISC = segments.length > 0 ? totalISC / segments.length : 0.5;

        // Calculate distance in meters (handle both v1 and v2 formats)
        let distance = 0;
        let travelTime = 0;
        
        if (leg.summary) {
          distance = leg.summary.lengthInMeters || 0;
          travelTime = leg.summary.travelTimeInSeconds || 0;
        } else if (route.summary) {
          distance = route.summary.lengthInMeters || 0;
          travelTime = route.summary.travelTimeInSeconds || 0;
        }
        
        // Calculate optimal cost
        const optimalCost = calculateOptimalCost(avgISC, distance, safetyWeight);

        // Build polyline from points
        const polyline = points.map(p => {
          if (typeof p === 'object' && p.latitude !== undefined) {
            return [p.latitude, p.longitude];
          } else if (Array.isArray(p) && p.length >= 2) {
            return [p[0], p[1]];
          }
          return null;
        }).filter(p => p !== null);
      
        return {
          routeIndex: index,
          distance: distance,
          distanceKm: (distance / 1000).toFixed(2),
          duration: travelTime,
          durationMinutes: Math.round(travelTime / 60),
          isc: avgISC,
          safetyScore: (avgISC * 100).toFixed(1),
          optimalCost,
          unsafeSegments,
          segments,
          polyline: polyline
        };
      })
    );

    // Filter out null routes (invalid routes)
    let validRoutes = processedRoutes.filter(r => r !== null);
    
    if (validRoutes.length === 0) {
      return res.status(500).json({ 
        error: 'Failed to process routes',
        message: 'Unable to process route data from TomTom API'
      });
    }
    
    // Ensure we have distinct routes for each category
    // Sort by distance ascending
    const sortedByDistance = [...validRoutes].sort((a, b) => a.distance - b.distance);
    
    // Sort by safety (ISC) descending
    const sortedBySafety = [...validRoutes].sort((a, b) => b.isc - a.isc);
    
    // Sort by optimal cost (balanced)
    const sortedByOptimalCost = [...validRoutes].sort((a, b) => a.optimalCost - b.optimalCost);
    
    // Pick routes ensuring they are different
    let shortestRoute = sortedByDistance[0];
    let safestRoute = sortedBySafety[0];
    let balancedRoute = sortedByOptimalCost[0];
    
    // If we only have 1-2 routes, use different indices
    if (validRoutes.length === 2) {
      // For 2 routes: shortest (0), safest (1)
      shortestRoute = sortedByDistance[0];
      safestRoute = sortedBySafety[0];
      balancedRoute = sortedByOptimalCost[0]; // Use balanced as middle ground
    } else if (validRoutes.length >= 3) {
      // For 3+ routes: pick the most distinct ones
      // Shortest: first by distance
      shortestRoute = sortedByDistance[0];
      
      // Safest: highest ISC
      safestRoute = sortedBySafety[0];
      
      // Balanced: lowest cost (already sorted this way)
      balancedRoute = sortedByOptimalCost[0];
      
      // Ensure they're not the same route by comparing properties
      const routeIds = new Set();
      routeIds.add(JSON.stringify({d: shortestRoute.distance, i: shortestRoute.isc}));
      
      // If safest is same as shortest, pick the second safest
      if (routeIds.has(JSON.stringify({d: safestRoute.distance, i: safestRoute.isc}))) {
        safestRoute = sortedBySafety[1] || sortedBySafety[0];
      }
      
      // If balanced is same as either, pick a different route
      const balancedId = JSON.stringify({d: balancedRoute.distance, i: balancedRoute.isc});
      if (balancedId === JSON.stringify({d: shortestRoute.distance, i: shortestRoute.isc}) ||
          balancedId === JSON.stringify({d: safestRoute.distance, i: safestRoute.isc})) {
        // Pick a route with medium distance and medium safety
        const median = Math.floor(validRoutes.length / 2);
        balancedRoute = validRoutes[median];
      }
    }

    // Build response with all three route options
    const routes = {
      routeA: {
        name: 'Route A (Shortest)',
        type: 'shortest',
        polyline: shortestRoute.polyline,
        distance: shortestRoute.distance,
        distanceKm: shortestRoute.distanceKm,
        eta: shortestRoute.durationMinutes,
        isc: shortestRoute.isc,
        safetyScore: shortestRoute.safetyScore,
        unsafeSegments: shortestRoute.unsafeSegments,
        segments: shortestRoute.segments
      },
      routeB: {
        name: 'Route B (Safest)',
        type: 'safest',
        polyline: safestRoute.polyline,
        distance: safestRoute.distance,
        distanceKm: safestRoute.distanceKm,
        eta: safestRoute.durationMinutes,
        isc: safestRoute.isc,
        safetyScore: safestRoute.safetyScore,
        unsafeSegments: safestRoute.unsafeSegments,
        segments: safestRoute.segments
      },
      routeC: {
        name: 'Route C (Balanced)',
        type: 'balanced',
        polyline: balancedRoute.polyline,
        distance: balancedRoute.distance,
        distanceKm: balancedRoute.distanceKm,
        eta: balancedRoute.durationMinutes,
        isc: balancedRoute.isc,
        safetyScore: balancedRoute.safetyScore,
        unsafeSegments: balancedRoute.unsafeSegments,
        segments: balancedRoute.segments
      }
    };

    res.json({
      success: true,
      routes: routes,
      route: {
        polyline: balancedRoute.polyline,
        distance: balancedRoute.distance,
        distanceKm: balancedRoute.distanceKm,
        eta: balancedRoute.durationMinutes,
        isc: balancedRoute.isc,
        safetyScore: balancedRoute.safetyScore,
        unsafeSegments: balancedRoute.unsafeSegments,
        segments: balancedRoute.segments
      },
      summary: {
        shortest: {
          distanceKm: shortestRoute.distanceKm,
          safetyScore: shortestRoute.safetyScore
        },
        safest: {
          distanceKm: safestRoute.distanceKm,
          safetyScore: safestRoute.safetyScore
        },
        balanced: {
          distanceKm: balancedRoute.distanceKm,
          safetyScore: balancedRoute.safetyScore
        }
      }
    });

  } catch (error) {
    console.error('Error finding safest route:', error);
    res.status(500).json({ 
      error: 'Failed to find safest route',
      message: error.message 
    });
  }
}

module.exports = {
  findSafestRoute
};