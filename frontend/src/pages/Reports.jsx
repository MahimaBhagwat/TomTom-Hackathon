import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { uploadToSupabase } from '../services/storageService';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function HeatmapLayer({ reports }) {
  const map = useMap();

  useEffect(() => {
    if (reports.length === 0) return;

    // Create heatmap circles for each report
    reports.forEach((report) => {
      if (report.location) {
        const circle = L.circleMarker([report.location.lat, report.location.lon], {
          radius: 15,
          fillColor: '#ef4444',
          color: '#dc2626',
          weight: 2,
          opacity: 0.7,
          fillOpacity: 0.6
        }).addTo(map);

        circle.bindPopup(`
          <strong>${report.type}</strong><br/>
          ${report.description || 'No description'}<br/>
          <small>${new Date(report.timestamp).toLocaleString()}</small>
        `);
      }
    });
  }, [reports, map]);

  return null;
}

export default function Reports() {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'incident',
    description: '',
    location: null
  });
  const [currentLocation, setCurrentLocation] = useState([40.7128, -74.0060]);
  const [photoFile, setPhotoFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);

  useEffect(() => {
    fetchReports();
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation([position.coords.latitude, position.coords.longitude]);
          setFormData(prev => ({
            ...prev,
            location: {
              lat: position.coords.latitude,
              lon: position.coords.longitude
            }
          }));
        },
        (err) => console.error('Geolocation error:', err)
      );
    }
  }, []);

  const fetchReports = async () => {
    try {
      const response = await api.get('/api/report');
      setReports(response.data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setPhotoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setPhotoPreview(reader.result);
        reader.readAsDataURL(file);
      } else {
        alert('Please select an image file');
      }
    }
  };

  const handleAudioChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        setAudioFile(file);
        setAudioPreview(URL.createObjectURL(file));
      } else {
        alert('Please select an audio file');
      }
    }
  };

  const uploadFile = async (file, bucket, path) => {
    if (!file) {
      return null;
    }
    if (!currentUser || !currentUser.uid) {
      throw new Error('You must be logged in to upload files. Please log in and try again.');
    }
    try {
      return await uploadToSupabase(file, bucket, path, currentUser.uid);
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let photoUrl = null;
      let audioUrl = null;
      let uploadError = null;

      // Check if user is authenticated before uploading
      if (!currentUser || !currentUser.uid) {
        alert('You must be logged in to upload photos or audio. Please log in and try again.');
        setLoading(false);
        return;
      }

      // Upload files if they exist
      if (photoFile) {
        try {
          const photoExtension = photoFile.name.split('.').pop() || 'jpg';
          const photoPath = `${currentUser.uid}/${Date.now()}_photo.${photoExtension}`;
          console.log('Starting photo upload to Supabase...');
          photoUrl = await uploadFile(photoFile, 'reports', photoPath);
          console.log('Photo uploaded successfully:', photoUrl);
        } catch (error) {
          console.error('Photo upload failed:', error);
          uploadError = `Photo upload failed: ${error.message}`;
          // Continue with submission even if photo fails
        }
      }

      if (audioFile) {
        try {
          const audioExtension = audioFile.name.split('.').pop() || 'mp3';
          const audioPath = `${currentUser.uid}/${Date.now()}_audio.${audioExtension}`;
          console.log('Starting audio upload to Supabase...');
          audioUrl = await uploadFile(audioFile, 'reports', audioPath);
          console.log('Audio uploaded successfully:', audioUrl);
        } catch (error) {
          console.error('Audio upload failed:', error);
          uploadError = uploadError 
            ? `${uploadError}\nAudio upload failed: ${error.message}`
            : `Audio upload failed: ${error.message}`;
          // Continue with submission even if audio fails
        }
      }

      // Submit report with or without media
      const reportData = {
        ...formData,
        userId: currentUser?.uid || 'anonymous',
        photoUrl: photoUrl || null,
        audioUrl: audioUrl || null
      };

      console.log('Submitting report with data:', { ...reportData, photoUrl: photoUrl ? 'present' : 'null', audioUrl: audioUrl ? 'present' : 'null' });

      const response = await api.post('/api/report', reportData);
      console.log('Report submitted successfully:', response.data);
      
      // Reset form
      setFormData({
        type: 'incident',
        description: '',
        location: formData.location // Keep current location
      });
      setPhotoFile(null);
      setAudioFile(null);
      setPhotoPreview(null);
      setAudioPreview(null);
      const photoInput = document.getElementById('photo-input');
      const audioInput = document.getElementById('audio-input');
      if (photoInput) photoInput.value = '';
      if (audioInput) audioInput.value = '';
      
      fetchReports();
      
      if (uploadError) {
        alert(`Report submitted, but there were upload issues:\n${uploadError}`);
      } else {
        alert('Report submitted successfully!');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      alert(`Failed to submit report: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Safety Reports</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Submit a Report</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="incident">Incident</option>
                  <option value="accident">Accident</option>
                  <option value="hazard">Hazard</option>
                  <option value="suspicious">Suspicious Activity</option>
                  <option value="broken lighting">Broken Lighting</option>
                  <option value="theft">Theft</option>
                  <option value="poor crowd density">Poor Crowd Density</option>
                  <option value="road condition">Poor Road Condition</option>
                  <option value="urban desertion">Urban Desertion</option>
                  <option value="harassment">Harassment</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe what you observed..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                {formData.location ? (
                  <div className="text-sm text-gray-600">
                    {formData.location.lat.toFixed(6)}, {formData.location.lon.toFixed(6)}
                    <br />
                    <small>Using your current location</small>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Getting your location...</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo (Optional)
                </label>
                <input
                  id="photo-input"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                {photoPreview && (
                  <div className="mt-2">
                    <img src={photoPreview} alt="Preview" className="max-w-full h-32 object-cover rounded" />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview(null);
                        if (document.getElementById('photo-input')) document.getElementById('photo-input').value = '';
                      }}
                      className="mt-1 text-sm text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Audio Recording (Optional)
                </label>
                <input
                  id="audio-input"
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                {audioPreview && (
                  <div className="mt-2">
                    <audio src={audioPreview} controls className="w-full" />
                    <button
                      type="button"
                      onClick={() => {
                        setAudioFile(null);
                        setAudioPreview(null);
                        if (document.getElementById('audio-input')) document.getElementById('audio-input').value = '';
                      }}
                      className="mt-1 text-sm text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !formData.location}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: '500px' }}>
            <MapContainer
              center={currentLocation}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <HeatmapLayer reports={reports} />
            </MapContainer>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Recent Reports ({reports.length})</h2>
          <div className="space-y-2">
            {reports.length === 0 ? (
              <p className="text-gray-500">No recent reports</p>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="border-b border-gray-200 pb-4 mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">{report.type}</span>
                      {report.description && (
                        <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 ml-4">
                      {new Date(report.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-4 mt-2">
                    {report.photoUrl && (
                      <div>
                        <img 
                          src={report.photoUrl} 
                          alt="Report photo" 
                          className="max-w-xs h-32 object-cover rounded cursor-pointer"
                          onClick={() => window.open(report.photoUrl, '_blank')}
                        />
                      </div>
                    )}
                    {report.audioUrl && (
                      <div>
                        <audio src={report.audioUrl} controls className="h-8" />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

