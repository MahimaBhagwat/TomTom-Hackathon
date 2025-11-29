# SafeWalk Backend API

Node.js + Express.js backend for SafeWalk Route Safety Companion.

## Required APIs & Services

To run the backend, you need to configure the following external APIs:

### 1. **TomTom API** (Required)
- **Purpose**: Route calculation, traffic flow data, and traffic incidents
- **Get API Key**: https://developer.tomtom.com/
- **TomTom APIs Currently Used**:
  - **Routing API** - Calculate pedestrian routes between points
  - **Traffic API** - Real-time traffic flow data and incident detection
- **Available TomTom Products** (from your subscription):
  - Map Display API, Assets API, MCP Server, Routing API, Matrix Routing v2 API, Waypoint Optimization API, Extended Routing API, Search API, Geocoding API, Reverse Geocoding API, Batch Search API, EV Charging Stations Availability API, Traffic API, Geofencing API, Location History API, Notifications API, Snap to Roads API
- **Environment Variable**: `TOMTOM_API_KEY`

### 2. **OpenWeather API** (Required)
- **Purpose**: Weather data for safety calculations
- **Get API Key**: https://openweathermap.org/api
- **Usage**: Current weather conditions and forecasts for route safety scoring
- **Environment Variable**: `OPENWEATHER_API_KEY`

### 3. **Firebase** (Required)
- **Purpose**: Database for reports, users, and panic logs (Firestore)
- **Environment Variable**: `FIREBASE_SERVICE_ACCOUNT` (JSON string)

#### Detailed Firebase Setup Instructions:

**📍 Visual Guide - Where to Click:**

From the Firebase Project Overview page (where you are now):

1. **For Firestore Database:**
   - Look at the **left sidebar** → Find **"Build"** section (expand it if collapsed with ▶️)
   - **IMPORTANT**: Click **"Firestore Database"** (NOT "Data Connect")
   - You'll see two similar options:
     - ✅ **"Firestore Database"** ← Click this one (this is what your backend uses)
     - ❌ **"Data Connect"** ← Don't click this (different service)
   - Then click **"Create database"** button

2. **For Service Account Key:**
   - Look at the **top of the left sidebar** → See **"Project Overview"** with a **⚙️ gear icon**
   - Click the **⚙️ gear icon** → Select **"Project settings"**
   - Click the **"Service accounts"** tab at the top
   - Click **"Generate new private key"** button

---

**Step 1: Create a Firebase Project**
1. Go to https://console.firebase.google.com/
2. Click **"Add project"** or **"Create a project"**
3. Enter a project name (e.g., "safewalk" or "katalyst")
4. (Optional) Enable Google Analytics (you can skip this)
5. Click **"Create project"**
6. Wait for the project to be created, then click **"Continue"**

**Step 2: Enable Firestore Database**
⚠️ **Important**: You need **Firestore Database** (not Data Connect). They are different services!

1. In your Firebase project dashboard, look at the **left sidebar**
2. Find the **"Build"** section (it may be collapsed - click the dropdown arrow ▶️ to expand it)
3. Look for **"Firestore Database"** in the left sidebar (it's under the Build section, separate from "Data Connect")
   - **Firestore Database** = What you need ✅
   - **Data Connect** = Different service (not what you need) ❌
4. Click on **"Firestore Database"** 
5. You'll see a page with "Get started with Cloud Firestore" - click the **"Create database"** button
6. Choose **"Start in test mode"** (for development) or **"Start in production mode"** (for production)
   - **Test mode**: Allows read/write access for 30 days (good for development)
   - **Production mode**: Requires security rules (recommended for production)
7. Select a location for your database (choose the closest to your users)
8. Click **"Enable"**
9. Wait for Firestore to be created (this takes a few seconds)

**Step 3: Create a Service Account**
1. In your Firebase project, look at the **left sidebar** at the top
2. You'll see **"Project Overview"** with a **gear icon (⚙️)** next to it
3. Click the **gear icon (⚙️)** 
4. A dropdown menu will appear - click **"Project settings"**
5. A new page will open with multiple tabs at the top
6. Click on the **"Service accounts"** tab
7. You'll see a section with "Firebase Admin SDK" and a button that says **"Generate new private key"**
8. Click the **"Generate new private key"** button
9. A dialog will appear warning you to keep the key secure - click **"Generate key"**
10. A JSON file will be automatically downloaded to your computer (e.g., `safe-firebase-adminsdk-xxxxx.json`)

**Step 4: Convert JSON to Environment Variable Format**
The downloaded JSON file looks like this:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

**Option A: Single-line JSON String (Recommended)**
1. Open the downloaded JSON file in a text editor
2. Remove all line breaks and extra spaces
3. Convert it to a single line
4. Escape any double quotes inside the JSON (though the standard Firebase JSON should already be properly formatted)
5. Add it to your `.env` file as:
   ```env
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/..."}
   ```

**Option B: Using a Script (Easier)**
You can use Node.js to convert the JSON file to a single-line string:
```bash
node -e "console.log(JSON.stringify(require('./your-firebase-key.json')))"
```
Copy the output and paste it as the value for `FIREBASE_SERVICE_ACCOUNT` in your `.env` file.

**Option C: Using Online Tool**
1. Use an online JSON minifier (e.g., https://jsonformatter.org/json-minify)
2. Paste your JSON file content
3. Copy the minified single-line output
4. Add it to your `.env` file

**Important Notes:**
- ⚠️ **Never commit the JSON file or `.env` file to version control** (already in `.gitignore`)
- ⚠️ Keep your service account key secure - it has full access to your Firebase project
- The `private_key` field contains newlines (`\n`) - make sure these are preserved in the JSON string
- If you're having issues, you can also place the JSON file in your project and reference it, but the environment variable method is more secure

### 4. **PostgreSQL** (Optional - for Python FastAPI backend)
- **Purpose**: Database for the Python FastAPI backend (if using)
- **Environment Variable**: `DATABASE_URL`

## Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# TomTom API
TOMTOM_API_KEY=EvoQqLc6Tw0HMYGqzM31qXFce3R1Zytd

# OpenWeather API
OPENWEATHER_API_KEY=your_openweather_api_key_here

# Firebase Configuration
# IMPORTANT: This must be a single-line JSON string (minified JSON)
# Use one of the methods described in the Firebase setup section above
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project.iam.gserviceaccount.com"}

# Database (for Python FastAPI backend)
DATABASE_URL=postgresql://user:password@localhost:5432/safewalk
SECRET_KEY=your-secret-key-here
```

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file with the required API keys:
   - **TomTom API Key**: Get from https://developer.tomtom.com/
   - **OpenWeather API Key**: Get from https://openweathermap.org/api
   - **Firebase Service Account**: Follow detailed instructions above (Step 1-4)

3. Start server:
   ```bash
   npm run dev  # Development with nodemon
   # or
   npm start    # Production
   ```

## Firebase Quick Reference

**Firebase Collections Used:**
- `reports` - Safety incident reports
- `users` - User data
- `panic_logs` - Emergency panic button logs

**Firebase Security Rules:**
Make sure to set up proper Firestore security rules in your Firebase console. For development, you can use test mode, but for production, implement proper rules based on your authentication requirements.

## API Documentation

### POST /api/route/safest
Find the safest route between two points.

**Request:**
```json
{
  "origin": { "lat": 40.7128, "lon": -74.0060 },
  "destination": { "lat": 40.7589, "lon": -73.9851 },
  "alpha": 0.7
}
```

**Response:**
```json
{
  "success": true,
  "route": {
    "polyline": [[lat, lon], ...],
    "distance": 5000,
    "distanceKm": "5.00",
    "eta": 10,
    "isc": 0.75,
    "safetyScore": "75.0",
    "unsafeSegments": [...],
    "segments": [...]
  }
}
```

### POST /api/report
Create a safety report.

**Request:**
```json
{
  "type": "incident",
  "location": { "lat": 40.7128, "lon": -74.0060 },
  "description": "Suspicious activity",
  "userId": "user123"
}
```

### GET /api/report
Get all active reports (not expired).

### POST /api/panic
Trigger emergency alert.

**Request:**
```json
{
  "userId": "user123",
  "location": { "lat": 40.7128, "lon": -74.0060 },
  "message": "Emergency! Need help!"
}
```

### GET /api/zone-status
Get zone safety level.

**Query Params:**
- `lat` - Latitude
- `lon` - Longitude

**Response:**
```json
{
  "success": true,
  "location": { "lat": 40.7128, "lon": -74.0060 },
  "isc": "0.750",
  "status": "green",
  "breakdown": {
    "lighting": 1.0,
    "weather": 0.8,
    "crowd": 0.7,
    "reports": 1.0,
    "traffic": 0.9
  }
}
```

