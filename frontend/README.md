# SafeWalk Frontend

React web application for SafeWalk Route Safety Companion.

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file with Firebase configuration (see `.env.example`)

3. Start development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Pages

- **/** - Home page with map and route finder
- **/route** - Route viewer with safety visualization
- **/reports** - Submit and view safety reports
- **/emergency** - Panic button and trusted contacts
- **/settings** - User settings and profile

## Features

- Firebase Authentication (Email/Password)
- Leaflet.js maps with route visualization
- Real-time safety score calculation
- Heatmap of safety reports
- Emergency alert system

