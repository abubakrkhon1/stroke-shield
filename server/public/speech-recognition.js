// Speech Recognition Implementation
let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let transcript = "";
let recordingStream = null;

// Sample reading passages for stroke assessment
const readingPassages = [
  "The quick brown fox jumps over the lazy dog. Please call Stella and ask her to bring these things with her from the store: Six spoons of fresh snow peas, five thick slabs of blue cheese, and maybe a snack for her brother Bob.",
  
  "You wish to know all about my grandfather. Well, he is nearly ninety-three years old, yet he still thinks as swiftly as ever. He dresses himself in an old black frock coat, usually several buttons missing.",
  
  "The rainbow is a division of white light into many beautiful colors. These take the shape of a long round arch, with its path high above, and its two ends apparently beyond the horizon.",
  
  "She sells seashells by the seashore. The shells she sells are surely seashells. So if she sells shells on the seashore, I'm sure she sells seashore shells.",
  
  "Kindly pick the dry red rose. The sky was clear, and the stars were twinkling brightly. Please fetch my reading glasses from the kitchen table.",
  
  "It was a dark and stormy night with heavy rain. My father enjoys cooking pasta with homemade tomato sauce. We needed to get milk, bread, and butter from the grocery store."
];

document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const startRecordingBtn = document.getElementById('start-recording');
  const stopRecordingBtn = document.getElementById('stop-recording');
  const recordingStatus = document.getElementById('recording-status');
  const transcriptEl = document.getElementById('transcript');
  const readingPassageEl = document.getElementById('reading-passage');
  const newPassageBtn = document.getElementById('new-passage');
  
  // Set initial reading passage
  setRandomPassage();

  // Check if browser supports audio recording API
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    // Event listeners for recording buttons
    if (startRecordingBtn && stopRecordingBtn) {
      startRecordingBtn.addEventListener('click', startRecording);
      stopRecordingBtn.addEventListener('click', stopRecording);
    }
  } else {
    recordingStatus.textContent = "Audio recording not supported in this browser.";
    startRecordingBtn.disabled = true;
    stopRecordingBtn.disabled = true;
  }
  
  // Function to start recording
  async function startRecording() {
    try {
      transcript = "";
      transcriptEl.innerHTML = "";
      audioChunks = [];
      
      // Request access to the microphone
      recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create media recorder
      mediaRecorder = new MediaRecorder(recordingStream);
      
      // Listen for dataavailable event to collect audio chunks
      mediaRecorder.addEventListener('dataavailable', event => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      });
      
      // Listen for stop event to process the complete recording
      mediaRecorder.addEventListener('stop', processRecording);
      
      // Start recording
      mediaRecorder.start();
      
      // Update UI
      isRecording = true;
      recordingStatus.textContent = "Recording... Speak now.";
      recordingStatus.style.color = "red";
      startRecordingBtn.disabled = true;
      stopRecordingBtn.disabled = false;
      
    } catch (error) {
      console.error('Error starting recording:', error);
      recordingStatus.textContent = "Error: Could not access microphone. " + error.message;
      recordingStatus.style.color = "red";
    }
  }
  
  // Function to stop recording
  function stopRecording() {
    if (mediaRecorder && isRecording) {
      // Stop the media recorder
      mediaRecorder.stop();
      
      // Stop all audio tracks
      if (recordingStream) {
        recordingStream.getTracks().forEach(track => track.stop());
        recordingStream = null;
      }
      
      // Update UI
      isRecording = false;
      recordingStatus.textContent = "Processing audio...";
      startRecordingBtn.disabled = true;
      stopRecordingBtn.disabled = true;
    }
  }
  
  // Process the recording and send to AssemblyAI
  async function processRecording() {
    try {
      // Create audio blob from chunks
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      
      recordingStatus.textContent = "Uploading audio...";
      
      // Upload the audio file to the server
      const uploadResponse = await fetch('/api/upload-audio', {
        method: 'POST',
        body: audioBlob,
        headers: {
          'Content-Type': 'audio/wav'
        }
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status: ${uploadResponse.status}`);
      }
      
      const uploadData = await uploadResponse.json();
      
      // Transcribe the uploaded audio
      recordingStatus.textContent = "Transcribing speech...";
      
      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ audioUrl: uploadData.upload_url })
      });
      
      if (!transcribeResponse.ok) {
        throw new Error(`Transcription failed with status: ${transcribeResponse.status}`);
      }
      
      const transcriptionData = await transcribeResponse.json();
      
      // Display the transcript
      transcript = transcriptionData.transcript || "";
      transcriptEl.innerHTML = sanitizeHTML(transcript);
      
      // Analyze the speech if we have a transcript
      if (transcript.trim().length > 0) {
        analyzeSpeech(transcript);
      } else {
        recordingStatus.textContent = "No speech detected. Please try again.";
        startRecordingBtn.disabled = false;
      }
      
    } catch (error) {
      console.error('Error processing recording:', error);
      recordingStatus.textContent = "Error processing speech: " + error.message;
      recordingStatus.style.color = "red";
      startRecordingBtn.disabled = false;
    }
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
    
    // Get the current reading passage text
    const readingPassage = readingPassageEl.textContent.trim();
    
    try {
      const response = await fetch('/api/analyze-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          transcript,
          readingPassage
        })
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
      
      // Add information about reading passage or free speech
      const analysisType = analysis.readingPassage 
        ? `<span class="text-xs font-medium text-blue-600">Reading Assessment</span>` 
        : `<span class="text-xs font-medium text-purple-600">Free Speech</span>`;
        
      analysisEl.innerHTML = `
        <div class="flex justify-between items-center">
          <div>
            <span class="font-semibold">${formattedDate}</span>
            ${analysisType}
          </div>
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
  
  // Function to set a random reading passage
  function setRandomPassage() {
    const randomIndex = Math.floor(Math.random() * readingPassages.length);
    readingPassageEl.textContent = readingPassages[randomIndex];
  }
  
  // Event listener for new passage button
  newPassageBtn.addEventListener('click', setRandomPassage);
});