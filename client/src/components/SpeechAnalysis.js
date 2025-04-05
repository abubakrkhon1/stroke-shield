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
  const recognitionRef = useRef(null);

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

  // Initialize speech recognition
  useEffect(() => {
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
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError('Microphone access denied. Please allow microphone access in your browser settings.');
        } else if (event.error === 'audio-capture') {
          setError('No microphone detected. Please connect a microphone and try again.');
        } else {
          setError(`Speech recognition error: ${event.error}`);
        }
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        // Only restart if we're still in listening mode
        if (isListening && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.error('Error restarting speech recognition:', e);
            setIsListening(false);
            setError('Error with speech recognition. Please refresh the page and try again.');
          }
        }
      };
    } catch (e) {
      console.error('Error setting up speech recognition:', e);
      setError('Failed to initialize speech recognition. Please refresh the page and try again.');
    }

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
  const toggleListening = () => {
    try {
      if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      } else {
        setTranscript('');
        setError('');
        recognitionRef.current.start();
        setIsListening(true);
      }
    } catch (e) {
      console.error('Error toggling speech recognition:', e);
      setError('Failed to control speech recognition. Please refresh the page and try again.');
      setIsListening(false);
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
      setError(`Failed to analyze speech: ${err.message || 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
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
      <div className="mt-6 border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Speech Analysis Results</h3>
        
        <div className={`p-3 mb-4 rounded-lg ${
          possibleStrokeIndicators 
            ? 'bg-red-100 text-red-700' 
            : 'bg-green-100 text-green-700'
        }`}>
          {possibleStrokeIndicators 
            ? 'Possible stroke indicators detected' 
            : 'No significant speech abnormalities detected'}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="border rounded p-3">
            <div className="text-gray-500 text-sm">Slurred Speech</div>
            <div className={`text-lg font-bold ${slurredSpeech ? 'text-red-600' : 'text-green-600'}`}>
              {slurredSpeech ? 'Detected' : 'Not detected'}
            </div>
          </div>
          
          <div className="border rounded p-3">
            <div className="text-gray-500 text-sm">Speech Clarity</div>
            <div className={`text-lg font-bold ${clarity < 70 ? 'text-red-600' : 'text-green-600'}`}>
              {clarity}%
            </div>
          </div>
          
          <div className="border rounded p-3">
            <div className="text-gray-500 text-sm">Speech Fluency</div>
            <div className={`text-lg font-bold ${fluency < 70 ? 'text-red-600' : 'text-green-600'}`}>
              {fluency}%
            </div>
          </div>
          
          <div className="border rounded p-3">
            <div className="text-gray-500 text-sm">Analysis Confidence</div>
            <div className="text-lg font-bold">{confidence}%</div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">AI Analysis:</h4>
          <p className="text-gray-700">{analysis}</p>
        </div>
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
            isAnalyzing ? 'bg-gray-400' : 'bg-green-500 text-white'
          }`}
          onClick={analyzeSpeech}
          disabled={isListening || isAnalyzing || !transcript}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Speech'}
        </button>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      {/* Transcript Display */}
      {transcript && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Speech Transcript</h3>
          <div className="p-3 bg-gray-100 rounded-lg min-h-[60px]">
            {transcript || 'No speech recorded yet...'}
          </div>
        </div>
      )}
      
      {/* Analysis Results */}
      {renderResults()}
    </div>
  );
};

export default SpeechAnalysis;