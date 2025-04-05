// Speech Recognition Implementation
let recognition;
let isRecording = false;
let transcript = "";

document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const startRecordingBtn = document.getElementById('start-recording');
  const stopRecordingBtn = document.getElementById('stop-recording');
  const recordingStatus = document.getElementById('recording-status');
  const transcriptEl = document.getElementById('transcript');
  
  // Check if browser supports speech recognition
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onstart = function() {
      isRecording = true;
      recordingStatus.textContent = "Recording... Speak now.";
      recordingStatus.style.color = "red";
      startRecordingBtn.disabled = true;
      stopRecordingBtn.disabled = false;
    };
    
    recognition.onend = function() {
      isRecording = false;
      recordingStatus.textContent = "Recording stopped.";
      recordingStatus.style.color = "";
      startRecordingBtn.disabled = false;
      stopRecordingBtn.disabled = true;
      
      // If transcript is not empty, send it for analysis
      if (transcript.trim().length > 0) {
        analyzeSpeech(transcript);
      }
    };
    
    recognition.onresult = function(event) {
      let interimTranscript = "";
      let finalTranscript = "";
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      transcript = finalTranscript || interimTranscript;
      transcriptEl.innerHTML = sanitizeHTML(transcript);
    };
    
    recognition.onerror = function(event) {
      console.error('Speech recognition error', event.error);
      recordingStatus.textContent = "Error: " + event.error;
      recordingStatus.style.color = "red";
      startRecordingBtn.disabled = false;
      stopRecordingBtn.disabled = true;
    };
  } else {
    recordingStatus.textContent = "Speech recognition not supported in this browser.";
    startRecordingBtn.disabled = true;
    stopRecordingBtn.disabled = true;
  }
  
  // Event listeners for recording buttons
  if (startRecordingBtn && stopRecordingBtn) {
    startRecordingBtn.addEventListener('click', function() {
      transcript = "";
      transcriptEl.innerHTML = "";
      recognition.start();
    });
    
    stopRecordingBtn.addEventListener('click', function() {
      recognition.stop();
    });
  }
  
  // Function to sanitize HTML to prevent XSS
  function sanitizeHTML(text) {
    const element = document.createElement('div');
    element.textContent = text;
    return element.innerHTML;
  }
  
  // Function to analyze speech through the backend API
  async function analyzeSpeech(transcript) {
    recordingStatus.textContent = "Analyzing speech...";
    
    try {
      const response = await fetch('/api/analyze-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transcript })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      displaySpeechAnalysis(data);
      fetchRecentSpeechAnalyses();
    } catch (error) {
      console.error('Error analyzing speech:', error);
      recordingStatus.textContent = 
        "Error analyzing speech. Please try again.";
    }
  }
  
  // Function to display speech analysis results
  function displaySpeechAnalysis(analysis) {
    // Update metrics
    document.getElementById('speech-coherence').textContent = analysis.coherenceScore + "%";
    document.getElementById('slurred-speech').textContent = analysis.slurredSpeechScore + "%";
    document.getElementById('word-finding').textContent = analysis.wordFindingScore + "%";
    
    // Update risk level with appropriate color
    const speechRiskEl = document.getElementById('speech-risk');
    speechRiskEl.textContent = analysis.overallRisk.toUpperCase();
    
    switch (analysis.overallRisk.toLowerCase()) {
      case "low":
        speechRiskEl.style.color = "green";
        break;
      case "medium":
        speechRiskEl.style.color = "orange";
        break;
      case "high":
        speechRiskEl.style.color = "red";
        break;
      default:
        speechRiskEl.style.color = "";
    }
    
    // Display observations
    const observationsList = document.getElementById('speech-observations');
    observationsList.innerHTML = "";
    
    if (analysis.observations && analysis.observations.length > 0) {
      analysis.observations.forEach(observation => {
        const li = document.createElement('li');
        li.textContent = observation;
        observationsList.appendChild(li);
      });
    } else {
      const li = document.createElement('li');
      li.textContent = "No specific observations.";
      observationsList.appendChild(li);
    }
    
    recordingStatus.textContent = "Analysis complete.";
  }
  
  // Function to fetch recent speech analyses
  async function fetchRecentSpeechAnalyses() {
    try {
      const response = await fetch('/api/speech-analyses/recent');
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      displayRecentSpeechAnalyses(data);
    } catch (error) {
      console.error('Error fetching recent speech analyses:', error);
    }
  }
  
  // Function to display recent speech analyses
  function displayRecentSpeechAnalyses(analyses) {
    const recentAnalysesEl = document.getElementById('recent-speech-analyses');
    
    if (!analyses || analyses.length === 0) {
      recentAnalysesEl.innerHTML = "<p>No previous analyses available.</p>";
      return;
    }
    
    recentAnalysesEl.innerHTML = "";
    
    analyses.forEach(analysis => {
      const date = new Date(analysis.timestamp);
      const formattedDate = date.toLocaleDateString() + " " + date.toLocaleTimeString();
      
      const analysisEl = document.createElement('div');
      analysisEl.className = "bg-gray-100 p-3 rounded mb-2";
      
      // Create a short preview of the transcript (first 50 chars)
      const transcriptPreview = analysis.transcript.length > 50 
        ? analysis.transcript.substring(0, 50) + "..." 
        : analysis.transcript;
      
      // Add risk level with appropriate color
      let riskColor;
      switch (analysis.overallRisk.toLowerCase()) {
        case "low":
          riskColor = "text-green-600";
          break;
        case "medium":
          riskColor = "text-yellow-600";
          break;
        case "high":
          riskColor = "text-red-600";
          break;
        default:
          riskColor = "";
      }
      
      analysisEl.innerHTML = `
        <div class="flex justify-between">
          <span class="font-semibold">${formattedDate}</span>
          <span class="font-bold ${riskColor}">${analysis.overallRisk.toUpperCase()}</span>
        </div>
        <p class="text-sm mt-1">${sanitizeHTML(transcriptPreview)}</p>
        <div class="text-xs text-gray-500 mt-1">
          Scores: ${analysis.coherenceScore}% coherence, ${analysis.slurredSpeechScore}% slurred, ${analysis.wordFindingScore}% word finding
        </div>
      `;
      
      recentAnalysesEl.appendChild(analysisEl);
    });
  }
  
  // Fetch recent speech analyses on page load
  fetchRecentSpeechAnalyses();
});