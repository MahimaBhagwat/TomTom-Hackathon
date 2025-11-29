import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const { currentUser } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={currentUser?.email || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Privacy</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Location Sharing</div>
                <div className="text-sm text-gray-500">Share location for route safety</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">About SafeWalk</h2>
          <div className="space-y-2 text-gray-700">
            <p>
              SafeWalk is a route safety companion that helps you find the safest path to your destination.
            </p>
            <p className="text-sm text-gray-500">
              Version 1.0.0
            </p>
            <div className="mt-4">
              <h3 className="font-medium mb-2">Features:</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>AI-powered route safety scoring</li>
                <li>Real-time traffic and incident data</li>
                <li>Emergency alert system</li>
                <li>Community-based safety reports</li>
                <li>Weather-aware routing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

