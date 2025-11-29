const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file BEFORE importing other modules
dotenv.config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const routeRoutes = require('./routes/route');
const reportRoutes = require('./routes/report');
const panicRoutes = require('./routes/panic');
const zoneRoutes = require('./routes/zone');
const uploadRoutes = require('./routes/upload');

// Verify critical environment variables
console.log('Environment check:');
console.log('- TOMTOM_API_KEY:', process.env.TOMTOM_API_KEY ? '✓ Loaded' : '✗ Missing');
console.log('- OPENWEATHER_API_KEY:', process.env.OPENWEATHER_API_KEY && process.env.OPENWEATHER_API_KEY !== 'your_openweather_api_key_here' ? '✓ Loaded' : '⚠ Not configured');
console.log('- FIREBASE_SERVICE_ACCOUNT:', process.env.FIREBASE_SERVICE_ACCOUNT ? '✓ Loaded' : '✗ Missing');
console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? '✓ Loaded' : '⚠ Not configured');
console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Loaded' : '⚠ Not configured');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route - API information
app.get('/', (req, res) => {
  res.json({
    message: 'SafeWalk Backend API',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      route: '/api/route/safest',
      report: '/api/report',
      panic: '/api/panic',
      zoneStatus: '/api/zone-status'
    },
    frontend: 'Access the web app at http://localhost:3000',
    docs: 'See backend/README.md for API documentation'
  });
});

// Routes
app.use('/api/route', routeRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/panic', panicRoutes);
app.use('/api/zone-status', zoneRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SafeWalk API is running' });
});

// Test TomTom API connection
app.get('/api/test/tomtom', async (req, res) => {
  try {
    const { getRoute } = require('./services/tomtomService');
    // Test with a simple route (New York to nearby point)
    const testRoute = await getRoute(
      { lat: 40.7128, lon: -74.0060 },
      { lat: 40.7589, lon: -73.9851 }
    );
    res.json({ 
      status: 'success', 
      message: 'TomTom API is working correctly',
      hasRoutes: testRoute.routes && testRoute.routes.length > 0
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'TomTom API test failed',
      error: error.message 
    });
  }
});

// Test Supabase Storage connection
app.get('/api/test/supabase', async (req, res) => {
  try {
    const { getSupabaseAdmin, listFiles } = require('./services/supabaseService');
    const admin = getSupabaseAdmin();
    
    // Test by listing buckets or files
    const { data: buckets, error } = await admin.storage.listBuckets();
    
    if (error) {
      throw error;
    }
    
    res.json({ 
      status: 'success', 
      message: 'Supabase Storage is working correctly',
      buckets: buckets?.map(b => b.name) || [],
      configured: true
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Supabase Storage test failed',
      error: error.message,
      configured: false
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`🚀 SafeWalk API server running on port ${PORT}`);
});

module.exports = app;

