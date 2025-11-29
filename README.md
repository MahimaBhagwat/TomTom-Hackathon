# SafeWalk – Route Safety Companion (Web Version)

A production-ready web application that provides the safest route using TomTom APIs, real-time risk assessment, and community reporting.

## 🎯 Features

- 🛡️ **Safest–Nearest Route** - Optimal route calculation using weighted safety formula
- 🗺️ **Real-Time Alerts** - Automatic red zone detection and rerouting suggestions
- 🚨 **Panic Button** - Emergency alert system with location sharing to trusted contacts
- 📱 **Crowdsourced Reports** - Community-based safety reports with 30-minute auto-expiration
- 🌦️ **Dynamic Safety Score** - ISC calculation based on lighting, weather, crowd, reports, and traffic
- 📊 **Heatmap Visualization** - Visual representation of recent safety incidents

## 🛠️ Tech Stack

### Frontend (Web)
- **React.js** - UI framework
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **Leaflet.js** - Map UI
- **TomTom Maps SDK** - Map tiles and services
- **Axios** - API calls
- **Firebase Authentication** - User authentication
- **Vite** - Build tool

### Backend
- **Node.js + Express.js** - Server framework
- **Firestore** - Database (with TTL for auto-expiring reports)
- **TomTom Routing API** - Route calculation
- **TomTom Traffic API** - Traffic flow data
- **OpenWeather API** - Weather conditions
- **Firebase Admin SDK** - Server-side Firebase operations
- **Nodemailer** - Email notifications (for panic alerts)
- **Twilio** - SMS notifications (optional, for panic alerts)

## 📋 Prerequisites

- **Node.js** 16+ and npm
- **Firebase account** - For Authentication and Firestore
- **TomTom API key** - [Get one here](https://developer.tomtom.com/)
- **OpenWeather API key** - [Get one here](https://openweathermap.org/api)
- **Twilio account** (optional) - For SMS panic alerts
- **SMTP credentials** (optional) - For email panic alerts

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd katalyst
```

### 2. Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file (copy from `.env.example` if available):
   ```bash
   # Create .env file with the following variables:
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   
   # TomTom API
   TOMTOM_API_KEY=your_tomtom_api_key_here
   
   # OpenWeather API
   OPENWEATHER_API_KEY=your_openweather_api_key_here
   
   # Firebase Service Account (JSON as string)
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
   
   # Email Configuration (optional, for panic alerts)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   SMTP_FROM=safewalk@example.com
   
   # Twilio Configuration (optional, for SMS panic alerts)
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

4. Set up Firebase:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use existing one
   - Enable Authentication (Email/Password)
   - Create Firestore database
   - Go to Project Settings > Service Accounts
   - Generate new private key and add to `FIREBASE_SERVICE_ACCOUNT` in `.env`
   - Deploy Firestore rules from `firebase/firestore.rules`

5. Start the backend server:
   ```bash
   npm run dev
   # or
   npm start
   ```

   Backend will run on `http://localhost:5000`

### 3. Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```bash
   # Create .env file with the following variables:
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   
   VITE_API_BASE_URL=http://localhost:5000
   ```

   Get these values from Firebase Console > Project Settings > General > Your apps

4. Start the development server:
   ```bash
   npm run dev
   ```

   Frontend will run on `http://localhost:3000`

### 4. Firestore Setup

1. Deploy Firestore security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
   
   Or manually copy rules from `firebase/firestore.rules` to Firebase Console > Firestore Database > Rules

2. Enable TTL (Time To Live) for reports collection:
   - Go to Firestore Database > Indexes
   - Create a TTL policy for `expiresAt` field in `reports` collection
   - This will auto-delete reports after 30 minutes

## 📡 API Endpoints

### Route Safety
- **POST** `/api/route/safest`
  - Find the safest route between origin and destination
  - Body: `{ origin: {lat, lon}, destination: {lat, lon}, alpha: 0.7 }`
  - Returns: Route polyline, distance, ETA, ISC score, unsafe segments

### Reports
- **POST** `/api/report`
  - Create a safety report
  - Body: `{ type, location: {lat, lon}, description, userId }`
  
- **GET** `/api/report`
  - Get all active (not expired) reports

### Emergency
- **POST** `/api/panic`
  - Trigger emergency alert
  - Body: `{ userId, location: {lat, lon}, message }`
  - Sends notifications to trusted contacts

### Zone Status
- **GET** `/api/zone-status?lat=40.7128&lon=-74.0060`
  - Get zone safety level (green/yellow/red)
  - Returns: ISC score, status, breakdown

## 🎨 Frontend Pages

1. **Login / Signup** - Firebase Authentication
2. **Home** - Map with destination search and safety preference slider
3. **Route Viewer** - Display safest route with color-coded risk levels
4. **Reports** - Submit reports and view heatmap
5. **Emergency** - Panic button and trusted contacts management
6. **Settings** - Profile and app information

## 🔐 Safety Score Calculation (ISC)

The Incident Safety Coefficient (ISC) is calculated using weighted factors:

```
ISC = Σ wᵢ × Fᵢ
```

Where:
- **Lighting** (w₁ = 0.2) - Based on time of day
- **Weather** (w₂ = 0.2) - From OpenWeather API
- **Crowd** (w₃ = 0.15) - Estimated based on time and area
- **Reports** (w₄ = 0.3) - From community reports (within 100m, last 30 min)
- **Traffic** (w₅ = 0.15) - From TomTom Traffic API

## 🛣️ Route Optimization

Routes are optimized using:

```
OptimalCost = α × Safety + (1 − α) × Distance
```

Where:
- `α` (alpha) = Safety weight (0-1, user preference)
- Safety = 1 - ISC (lower ISC = higher cost)
- Distance = Normalized distance

## 📁 Project Structure

```
katalyst/
├── backend/
│   ├── server.js              # Express server entry point
│   ├── package.json
│   ├── routes/                # API routes
│   │   ├── route.js
│   │   ├── report.js
│   │   ├── panic.js
│   │   └── zone.js
│   ├── controllers/           # Route handlers
│   │   ├── routeController.js
│   │   ├── reportController.js
│   │   ├── panicController.js
│   │   └── zoneController.js
│   └── services/              # Business logic
│       ├── firebaseService.js
│       ├── tomtomService.js
│       ├── weatherService.js
│       └── safetyService.js
├── frontend/
│   ├── src/
│   │   ├── pages/             # React pages
│   │   │   ├── Login.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── RouteViewer.jsx
│   │   │   ├── Reports.jsx
│   │   │   ├── Emergency.jsx
│   │   │   └── Settings.jsx
│   │   ├── components/        # Reusable components
│   │   │   └── Navbar.jsx
│   │   ├── contexts/          # React contexts
│   │   │   └── AuthContext.jsx
│   │   ├── config/            # Configuration
│   │   │   ├── firebase.js
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── firebase/
│   └── firestore.rules        # Firestore security rules
└── README.md
```

## 🔧 Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-reload
```

### Frontend Development
```bash
cd frontend
npm run dev  # Vite dev server with HMR
```

## 🚢 Production Build

### Frontend
```bash
cd frontend
npm run build
npm run preview  # Preview production build
```

### Backend
```bash
cd backend
NODE_ENV=production npm start
```

## 📝 Environment Variables Summary

### Backend (.env)
- `PORT` - Server port (default: 5000)
- `TOMTOM_API_KEY` - TomTom API key (required)
- `OPENWEATHER_API_KEY` - OpenWeather API key (required)
- `FIREBASE_SERVICE_ACCOUNT` - Firebase service account JSON (required)
- `SMTP_*` - Email configuration (optional)
- `TWILIO_*` - SMS configuration (optional)

### Frontend (.env)
- `VITE_FIREBASE_*` - Firebase configuration (required)
- `VITE_API_BASE_URL` - Backend API URL (default: http://localhost:5000)

## 🐛 Troubleshooting

1. **Firebase Authentication not working**
   - Check Firebase config in `.env`
   - Ensure Email/Password auth is enabled in Firebase Console

2. **Routes not loading**
   - Verify TomTom API key is correct
   - Check backend logs for API errors

3. **Reports not showing on map**
   - Ensure Firestore rules are deployed
   - Check browser console for errors

4. **Panic button not sending alerts**
   - Verify SMTP/Twilio credentials if using email/SMS
   - Check Firestore for panic logs

## 📄 License

MIT

## 🙏 Acknowledgments

- TomTom for mapping and routing APIs
- OpenWeather for weather data
- Firebase for authentication and database
- Leaflet for map visualization
