import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';

export default function WalkWithMe({ onSOSTrigger }) {
  const { currentUser } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState('');
  const [checkInCountdown, setCheckInCountdown] = useState(0);
  
  const recognitionRef = useRef(null);
  const checkInIntervalRef = useRef(null);
  const periodicMessageIntervalRef = useRef(null);
  const noResponseTimeoutRef = useRef(null);
  const checkInCountdownIntervalRef = useRef(null);
  const statusRef = useRef('');

  const handleSOSTrigger = useCallback(async (reason) => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (checkInIntervalRef.current) {
      clearInterval(checkInIntervalRef.current);
    }
    if (periodicMessageIntervalRef.current) {
      clearInterval(periodicMessageIntervalRef.current);
    }
    if (noResponseTimeoutRef.current) {
      clearTimeout(noResponseTimeoutRef.current);
    }
    if (checkInCountdownIntervalRef.current) {
      clearInterval(checkInCountdownIntervalRef.current);
    }
    window.speechSynthesis.cancel();

    setIsActive(false);
    statusRef.current = '';
    setStatus('');
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(`Emergency alert triggered. ${reason}`);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
    
    if (onSOSTrigger && location) {
      await onSOSTrigger(location, reason);
    }
  }, [onSOSTrigger, location]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    // Get location
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          setLocation([position.coords.latitude, position.coords.longitude]);
        },
        (err) => console.error('Geolocation error:', err),
        { enableHighAccuracy: true }
      );
    }

    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
        console.log('Heard:', transcript);

        // Check for "I'm scared" trigger
        if (transcript.includes("i'm scared") || transcript.includes("im scared") || transcript.includes("i am scared")) {
          handleSOSTrigger('User said "I\'m scared"');
        }

        // Check for response to "Are you okay?"
        if (statusRef.current === 'checking' && (
          transcript.includes('yes') || 
          transcript.includes('okay') || 
          transcript.includes('ok') || 
          transcript.includes('fine') ||
          transcript.includes('good') ||
          transcript.includes('alright')
        )) {
          clearTimeout(noResponseTimeoutRef.current);
          setStatus('active');
          setCheckInCountdown(0);
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance('Good to hear you are okay. I will continue monitoring.');
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
          }
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
      };
    } else {
      console.warn('Speech recognition not supported in this browser');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (checkInIntervalRef.current) {
        clearInterval(checkInIntervalRef.current);
      }
      if (periodicMessageIntervalRef.current) {
        clearInterval(periodicMessageIntervalRef.current);
      }
      if (noResponseTimeoutRef.current) {
        clearTimeout(noResponseTimeoutRef.current);
      }
      if (checkInCountdownIntervalRef.current) {
        clearInterval(checkInCountdownIntervalRef.current);
      }
      window.speechSynthesis.cancel();
    };
  }, [handleSOSTrigger]);

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startPeriodicMessages = () => {
    const messages = [
      'I am here with you. You are not alone.',
      'Stay aware of your surroundings.',
      'Remember, help is just a word away.',
      'I am monitoring your safety.',
      'You are doing great. Keep going.'
    ];

    let messageIndex = 0;
    periodicMessageIntervalRef.current = setInterval(() => {
      if (isActive && status !== 'checking') {
        speak(messages[messageIndex % messages.length]);
        messageIndex++;
      }
    }, 30000); // Every 30 seconds
  };

  const startCheckIns = () => {
    checkInIntervalRef.current = setInterval(() => {
      if (isActive && status !== 'checking') {
        setStatus('checking');
        setCheckInCountdown(10);
        speak('Are you okay? Please respond with yes or okay.');

        // Start countdown
        checkInCountdownIntervalRef.current = setInterval(() => {
          setCheckInCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(checkInCountdownIntervalRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        // Set timeout for no response
        noResponseTimeoutRef.current = setTimeout(() => {
          handleSOSTrigger('No response to safety check-in');
        }, 10000); // 10 seconds to respond
      }
    }, 120000); // Check in every 2 minutes
  };

  const cleanup = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (checkInIntervalRef.current) {
      clearInterval(checkInIntervalRef.current);
    }
    if (periodicMessageIntervalRef.current) {
      clearInterval(periodicMessageIntervalRef.current);
    }
    if (noResponseTimeoutRef.current) {
      clearTimeout(noResponseTimeoutRef.current);
    }
    if (checkInCountdownIntervalRef.current) {
      clearInterval(checkInCountdownIntervalRef.current);
    }
    window.speechSynthesis.cancel();
  };

  const handleToggle = () => {
    if (isActive) {
      // Stop
      cleanup();
      setIsActive(false);
      setStatus('');
      setCheckInCountdown(0);
      speak('Walk with me mode deactivated. Stay safe.');
    } else {
      // Start
      if (!location) {
        alert('Location not available. Please enable location services.');
        return;
      }

      setIsActive(true);
      setStatus('active');
      speak('Walk with me mode activated. I will monitor your safety. Say "I am scared" at any time to trigger an emergency alert.');

      // Start speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.error('Error starting recognition:', error);
        }
      }

      // Start periodic messages
      startPeriodicMessages();

      // Start check-ins
      startCheckIns();
    }
  };

  return (
    <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-6">
      <div className="text-center">
        <div className="text-4xl mb-4">🚶</div>
        <h2 className="text-2xl font-bold text-blue-700 mb-2">Walk With Me</h2>
        <p className="text-gray-700 mb-4 text-sm">
          Your virtual companion will monitor your safety and check in periodically.
          Say "I'm scared" at any time to trigger an emergency alert.
        </p>

        {isActive && (
          <div className="mb-4 space-y-2">
            <div className={`text-lg font-semibold ${
              status === 'checking' ? 'text-red-600' : 'text-green-600'
            }`}>
              {status === 'checking' ? '⏰ Checking in...' : '✅ Active'}
            </div>
            {status === 'checking' && checkInCountdown > 0 && (
              <div className="text-red-600 font-bold">
                Respond in {checkInCountdown} seconds
              </div>
            )}
            {status === 'active' && (
              <div className="text-sm text-gray-600">
                Listening for "I'm scared"...
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleToggle}
          disabled={!location}
          className={`w-full font-bold py-4 px-8 rounded-lg text-xl disabled:opacity-50 disabled:cursor-not-allowed ${
            isActive
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isActive ? 'Stop Walk With Me' : 'Start Walk With Me'}
        </button>

        {!location && (
          <p className="text-sm text-red-600 mt-2">
            Location required. Please enable location services.
          </p>
        )}
      </div>
    </div>
  );
}

