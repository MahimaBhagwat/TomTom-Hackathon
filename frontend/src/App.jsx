import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import RouteViewer from './pages/RouteViewer';
import Reports from './pages/Reports';
import Emergency from './pages/Emergency';
import Settings from './pages/Settings';
import Navbar from './components/Navbar';

function PrivateRoute({ children }) {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }
  
  return currentUser ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        }
      />
      <Route
        path="/route"
        element={
          <PrivateRoute>
            <RouteViewer />
          </PrivateRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <PrivateRoute>
            <Reports />
          </PrivateRoute>
        }
      />
      <Route
        path="/emergency"
        element={
          <PrivateRoute>
            <Emergency />
          </PrivateRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <Settings />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <AppRoutes />
          {/* Firebase warning banner */}
          {!import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === 'demo' ? (
            <div className="fixed bottom-0 left-0 right-0 bg-yellow-500 text-white p-2 text-center text-sm z-50">
              ⚠️ Demo Mode: Firebase not configured. Some features may not work. Add Firebase config to .env file.
            </div>
          ) : null}
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

