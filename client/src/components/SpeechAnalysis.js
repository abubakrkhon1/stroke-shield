import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

/**
 * Speech Analysis component for stroke detection
 * Uses the Web Speech API for voice recognition and the Gemini API for analysis
 */
const SpeechAnalysis = ({ onSpeechAnalyzed, facialMetrics }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [speechResults, setSpeechResults] = useState(null);
  const [selectedPrompt, setSelectedPrompt] = useState(0);
  const [audioStatus, setAudioStatus] = useState('idle'); // 'idle', 'permission-error', 'recording', 'recorded'
  const recognitionRef = useRef(null);
  const hasInitializedRef = useRef(false);

  // Sample prompts for speech testing
  const speechPrompts = [
    "The early bird catches the worm, but the second mouse gets the cheese.",
    "You can't teach an old dog new tricks, but you can teach a new dog old tricks.",
    "The sky is blue in Cincinnati, and the grass is always greener on the other side.",
    "She sells seashells by the seashore, and Peter Piper picked a peck of pickled peppers.",
    "How much wood would a woodchuck chuck if a woodchuck could chuck wood?"
  ];

  // Rotate through prompts
  const changePrompt = () => {
    setSelectedPrompt((selectedPrompt + 1) % speechPrompts.length);
  };

  // Check microphone permissions
  const checkMicrophonePermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // If we get here, permission was granted
      setAudioStatus('idle');
      
      // Always stop the stream after checking
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (err) {
      console.error('Microphone permission error:', err);
      setAudioStatus('permission-error');
      setError('Microphone access denied. Please allow microphone access in your browser settings.');
      return false;
    }
  };

  // Initialize speech recognition
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    
    // First check microphone permissions
    checkMicrophonePermissions().then(hasPermission => {
      if (!hasPermission) return;
      
      try {
        // Check if browser supports speech recognition
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
          setError('Speech recognition is not supported in this browser. Try Chrome or Edge.');
          return;
        }

        // Create recognition instance
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        
        // Configure recognition
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        
        // Set up event handlers
        recognitionRef.current.onresult = (event) => {
          try {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript;
            
            setTranscript(prevTranscript => {
              // If this is a new final result, append it 
              if (event.results[current].isFinal) {
                return prevTranscript + ' ' + transcript;
              }
              return prevTranscript;
            });
          } catch (e) {
            console.error('Error processing speech result:', e);
            setError('Error processing speech. Please try again.');
          }
        };
        
        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error, event);
          
          if (event.error === 'not-allowed') {
            setAudioStatus('permission-error');
            setError('Microphone access denied. Please allow microphone access in your browser settings.');
          } else if (event.error === 'audio-capture') {
            setAudioStatus('permission-error');
            setError('No microphone detected. Please connect a microphone and try again.');
          } else if (event.error === 'network') {
            setError('Network error. Please check your internet connection.');
          } else if (event.error === 'aborted') {
            // This is normal when stopping
            setError('');
          } else {
            setError(`Speech recognition error: ${event.error || 'Unknown error'}`);
          }
          
          setIsListening(false);
        };
        
        recognitionRef.current.onstart = () => {
          setAudioStatus('recording');
          setIsListening(true);
        };
        
        recognitionRef.current.onend = () => {
          // Only restart if we're still in listening mode and no errors
          if (isListening && recognitionRef.current && audioStatus !== 'permission-error') {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.error('Error restarting speech recognition:', e);
              setIsListening(false);
              setAudioStatus('idle');
              setError('Error with speech recognition. Please refresh the page and try again.');
            }
          } else {
            setIsListening(false);
            if (transcript) {
              setAudioStatus('recorded');
            } else {
              setAudioStatus('idle');
            }
          }
        };
      } catch (e) {
        console.error('Error setting up speech recognition:', e);
        setError('Failed to initialize speech recognition. Please refresh the page and try again.');
      }
    });

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error('Error stopping recognition on cleanup:', e);
        }
      }
    };
  }, []);

  // Start/stop listening
  const toggleListening = async () => {
    if (isListening) {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        setIsListening(false);
        setAudioStatus('recorded');
      } catch (e) {
        console.error('Error stopping speech recognition:', e);
        setError('Failed to stop recording. Please refresh the page and try again.');
      }
    } else {
      // Check permissions first if not already recording
      const hasPermission = await checkMicrophonePermissions();
      if (!hasPermission) return;
      
      setError('');
      if (recognitionRef.current) {
        try {
          setTranscript('');
          recognitionRef.current.start();
          setIsListening(true);
          setAudioStatus('recording');
        } catch (e) {
          console.error('Error starting speech recognition:', e, recognitionRef.current);
          
          // Try re-initializing
          try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';
            recognitionRef.current.start();
            setIsListening(true);
            setAudioStatus('recording');
          } catch (retryError) {
            console.error('Failed to reinitialize speech recognition:', retryError);
            setError('Failed to start recording. Please refresh the page and try again.');
          }
        }
      } else {
        setError('Speech recognition not initialized. Please refresh the page.');
      }
    }
  };

  // Analyze speech with Gemini API
  const analyzeSpeech = async () => {
    if (!transcript || transcript.trim() === '') {
      setError('Please record some speech first.');
      return;
    }

    try {
      setIsAnalyzing(true);
      setError('');

      console.log('Sending speech for analysis:', { 
        transcription: transcript,
        facialMetrics: facialMetrics || {}
      });

      const response = await axios.post('/api/analyze-speech', {
        transcription: transcript,
        facialMetrics: facialMetrics || {}
      });

      console.log('Speech analysis response:', response.data);

      if (response.data && response.data.analysis) {
        setSpeechResults(response.data.analysis);
        
        // Only call the callback if it exists
        if (typeof onSpeechAnalyzed === 'function') {
          onSpeechAnalyzed(response.data.analysis);
        }
      } else {
        setError('Invalid response from speech analysis service.');
      }
    } catch (err) {
      console.error('Error analyzing speech:', err);
      
      // More detailed error handling
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const errorMsg = err.response.data?.error || err.response.data?.message || err.message;
        setError(`Server error analyzing speech: ${errorMsg} (Status: ${err.response.status})`);
      } else if (err.request) {
        // The request was made but no response was received
        setError('No response from server. Please check your internet connection and try again.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(`Error processing speech: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Manually test audio to provide better diagnostics
  const testAudio = async () => {
    try {
      setError('');
      console.log('Testing audio input...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create an audio context to analyze the stream
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      
      source.connect(analyser);
      
      // Create a buffer to store audio data
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      // Check for audio levels
      let soundDetected = false;
      const checkSound = () => {
        analyser.getByteFrequencyData(dataArray);
        
        // Check if there's significant audio
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        
        if (average > 5) {
          soundDetected = true;
          setError('Audio input detected! Your microphone appears to be working.');
          
          // Cleanup
          stream.getTracks().forEach(track => track.stop());
          audioContext.close();
        } else if (!soundDetected) {
          // Keep checking if no sound detected yet
          setTimeout(checkSound, 100);
        }
      };
      
      // Start checking
      checkSound();
      
      // Stop checking after 3 seconds if no sound detected
      setTimeout(() => {
        if (!soundDetected) {
          stream.getTracks().forEach(track => track.stop());
          audioContext.close();
          setError('No audio input detected. Please check if your microphone is properly connected and try making some noise near it.');
        }
      }, 3000);
      
    } catch (err) {
      console.error('Audio test error:', err);
      setError(`Audio test failed: ${err.message || 'Unknown error'}`);
    }
  };

  // Render explanation for FAST protocol
  const renderFastExplanation = () => (
    <div>
      <h3 className="text-lg font-semibold mb-2">FAST Protocol: Speech Test</h3>
      <p className="mb-2">
        The 'S' in FAST stands for Speech. This test helps detect speech abnormalities that might
        indicate a stroke.
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>Try saying:</strong> "The sky is blue in Cincinnati" or "You can't teach an old dog new tricks"
        </li>
        <li>
          <strong>Watch for:</strong> Slurred speech, trouble speaking, or difficulty understanding speech
        </li>
      </ul>
    </div>
  );

  // Render results
  const renderResults = () => {
    if (!speechResults) return null;
    
    const { 
      slurredSpeech, 
      speechCoherence, 
      possibleStrokeIndicators, 
      confidence, 
      clarity,
      fluency,
      analysis 
    } = speechResults;

    return (
      <div className="mt-6 border rounded-lg p-4 bg-white shadow-sm">
        <h3 className="text-lg font-semibold mb-3">Speech Analysis Results</h3>
        
        <div className={`p-3 mb-4 rounded-lg ${
          possibleStrokeIndicators 
            ? 'bg-red-100 text-red-700 border border-red-200' 
            : 'bg-green-100 text-green-700 border border-green-200'
        }`}>
          <div className="font-bold mb-1">
            {possibleStrokeIndicators 
              ? '⚠️ Possible stroke indicators detected' 
              : '✓ No significant speech abnormalities detected'}
          </div>
          <div className="text-sm">
            {possibleStrokeIndicators 
              ? 'Please consult medical help as soon as possible.' 
              : 'Speech patterns are within normal parameters.'}
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="border rounded p-3 bg-gray-50">
            <div className="text-gray-500 text-sm">Slurred Speech</div>
            <div className={`text-lg font-bold ${slurredSpeech ? 'text-red-600' : 'text-green-600'}`}>
              {slurredSpeech ? 'Detected' : 'Not detected'}
            </div>
          </div>
          
          <div className="border rounded p-3 bg-gray-50">
            <div className="text-gray-500 text-sm">Speech Clarity</div>
            <div className={`text-lg font-bold ${clarity < 70 ? 'text-red-600' : 'text-green-600'}`}>
              {clarity}%
            </div>
          </div>
          
          <div className="border rounded p-3 bg-gray-50">
            <div className="text-gray-500 text-sm">Speech Fluency</div>
            <div className={`text-lg font-bold ${fluency < 70 ? 'text-red-600' : 'text-green-600'}`}>
              {fluency}%
            </div>
          </div>
          
          <div className="border rounded p-3 bg-gray-50">
            <div className="text-gray-500 text-sm">Analysis Confidence</div>
            <div className="text-lg font-bold">{confidence}%</div>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">AI Analysis:</h4>
          <p className="text-gray-700">{analysis}</p>
        </div>
      </div>
    );
  };

  // Render troubleshooting section if needed
  const renderTroubleshooting = () => {
    if (audioStatus !== 'permission-error' && !error) return null;
    
    return (
      <div className="mt-4 p-4 border border-orange-200 bg-orange-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Troubleshooting</h3>
        
        <ul className="list-disc pl-5 mb-3">
          <li>Make sure your microphone is properly connected and unmuted</li>
          <li>Allow microphone access in your browser settings</li>
          <li>Try using a different browser (Chrome or Edge recommended)</li>
          <li>Check that no other application is using your microphone</li>
        </ul>
        
        <button 
          onClick={testAudio}
          className="px-4 py-2 bg-orange-500 text-white rounded font-bold hover:bg-orange-600"
        >
          Test Microphone
        </button>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Speech Analysis</h2>
      
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        {renderFastExplanation()}
      </div>
      
      {/* Speech Prompt for User */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Read This Prompt</h3>
          <button 
            onClick={changePrompt}
            className="text-blue-500 hover:text-blue-700 text-sm font-medium"
          >
            Change Prompt
          </button>
        </div>
        
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-lg text-center font-medium">
          "{speechPrompts[selectedPrompt]}"
        </div>
      </div>
      
      {/* Recording Status Indicator */}
      <div className="mb-4 flex items-center">
        <div className={`w-3 h-3 rounded-full mr-2 ${
          isListening 
            ? 'bg-red-500 animate-pulse' 
            : audioStatus === 'recorded' 
              ? 'bg-green-500' 
              : 'bg-gray-300'
        }`}></div>
        <span className="text-sm font-medium">
          {isListening 
            ? 'Recording speech...' 
            : audioStatus === 'recorded' 
              ? 'Speech recorded - ready for analysis' 
              : 'Ready to record'}
        </span>
      </div>
      
      {/* Recording Controls */}
      <div className="flex items-center gap-3 mb-4">
        <button 
          className={`px-4 py-2 rounded font-bold ${
            isListening ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
          }`}
          onClick={toggleListening}
          disabled={isAnalyzing}
        >
          {isListening ? 'Stop Recording' : 'Start Recording'}
        </button>
        
        <button 
          className={`px-4 py-2 rounded font-bold ${
            isAnalyzing 
              ? 'bg-gray-400 text-white' 
              : transcript 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-300 text-gray-500'
          }`}
          onClick={analyzeSpeech}
          disabled={isListening || isAnalyzing || !transcript}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Speech'}
        </button>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      {/* Transcript Display */}
      {transcript && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Speech Transcript</h3>
          <div className="p-3 bg-gray-100 rounded-lg min-h-[60px] border border-gray-200">
            {transcript || 'No speech recorded yet...'}
          </div>
        </div>
      )}
      
      {/* Troubleshooting Help */}
      {renderTroubleshooting()}
      
      {/* Analysis Results */}
      {renderResults()}
    </div>
  );
};

export default SpeechAnalysis;