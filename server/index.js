const express = require('express');
const path = require('path');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AssemblyAI } = require('assemblyai');
const { createMemoryDb } = require('./memoryDb');

// Initialize the app
const app = express();
const PORT = process.env.PORT || 8000;

// Initialize Google Generative AI
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);

// Initialize AssemblyAI
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
const assemblyai = new AssemblyAI({
  apiKey: ASSEMBLYAI_API_KEY
});

// Create in-memory database
const db = createMemoryDb();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files - first try the React build, then fall back to static public folder
app.use(express.static(path.join(__dirname, '../client/build')));
app.use(express.static(path.join(__dirname, 'public')));

// API endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Save assessment data
app.post('/api/assessments', (req, res) => {
  try {
    const { asymmetryMetrics, postureMetrics, riskLevel, timestamp } = req.body;
    
    if (!asymmetryMetrics || !postureMetrics || !riskLevel) {
      return res.status(400).json({ error: 'Missing required data' });
    }
    
    const id = Date.now().toString();
    const assessment = {
      id,
      asymmetryMetrics,
      postureMetrics,
      riskLevel,
      timestamp: timestamp || new Date().toISOString()
    };
    
    db.assessments.push(assessment);
    
    res.status(201).json({ id, message: 'Assessment saved successfully' });
  } catch (error) {
    console.error('Error saving assessment:', error);
    res.status(500).json({ error: 'Failed to save assessment' });
  }
});

// Get recent assessments
app.get('/api/assessments/recent', (req, res) => {
  try {
    // Sort by timestamp descending and get most recent 10
    const recentAssessments = [...db.assessments]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);
      
    res.json(recentAssessments);
  } catch (error) {
    console.error('Error fetching recent assessments:', error);
    res.status(500).json({ error: 'Failed to fetch recent assessments' });
  }
});

// Analyze speech using Google AI
app.post('/api/analyze-speech', async (req, res) => {
  try {
    const { transcript, readingPassage } = req.body;
    
    if (!transcript) {
      return res.status(400).json({ error: 'Missing speech transcript' });
    }
    
    // Configure the generative model - use the latest available model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Create a prompt based on whether we have a reading passage or not
    let promptText;
    
    if (readingPassage) {
      // If we have both the transcript and the reading passage, we can do a comparison
      promptText = `
      Analyze the following speech transcript for potential stroke symptoms. The person was asked to read a specific passage, so compare their speech with the expected text:
      
      Expected reading passage: "${readingPassage}"
      
      Actual transcript: "${transcript}"
      
      Focus on:
      1. Speech coherence and clarity
      2. Word-finding difficulties (missing, substituted, or incorrect words)
      3. Slurred speech patterns
      4. Pronunciation errors that could indicate stroke
      5. Sentence completion and flow
      6. Omissions or additions compared to the expected reading passage
      
      Provide an analysis with:
      - A coherence score (0-100) - how well their speech matches the expected passage
      - A slurred speech score (0-100) - indication of slurring or unclear pronunciation
      - Word finding difficulty score (0-100) - measure of word substitutions or omissions
      - Overall stroke risk based on speech (low, medium, high)
      - Key observations including specific words or phrases that show potential issues
      `;
    } else {
      // Fall back to general speech analysis if no reading passage is provided
      promptText = `
      Analyze the following speech transcript for potential stroke symptoms:
      "${transcript}"
      
      Focus on:
      1. Speech coherence and clarity
      2. Word-finding difficulties
      3. Slurred speech patterns
      4. Grammatical errors beyond normal speech
      5. Repetition or confusion
      
      Provide an analysis with:
      - A coherence score (0-100)
      - A slurred speech score (0-100)
      - Word finding difficulty score (0-100)
      - Overall stroke risk based on speech (low, medium, high)
      - Key observations
      `;
    }
    
    // Add the response format instructions
    const prompt = `${promptText}
    
    Format the response as a JSON object with these exact fields: 
    {
      "coherenceScore": number,
      "slurredSpeechScore": number,
      "wordFindingScore": number, 
      "overallRisk": "low"|"medium"|"high",
      "observations": string[]
    }
    
    Return only the JSON, no additional text.
    `;
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Process the AI response text to get valid JSON
    let jsonStr = text.trim();
    
    // Remove code block formatting if present
    if (jsonStr.startsWith('```')) {
      // Handle various code block formats
      jsonStr = jsonStr.replace(/```json\n|```\n|```/g, '').trim();
    }
    
    // Clean the string to handle potential JSON formatting issues
    jsonStr = jsonStr.replace(/,\s*}/g, '}');  // Remove trailing commas in objects
    jsonStr = jsonStr.replace(/,\s*]/g, ']');  // Remove trailing commas in arrays
    
    console.log('Processing JSON response:', jsonStr);
    
    let analysisData;
    
    try {
      // Parse JSON
      analysisData = JSON.parse(jsonStr);
      
      // Validate the format to make sure it has all required fields
      if (!analysisData.coherenceScore || !analysisData.slurredSpeechScore || 
          !analysisData.wordFindingScore || !analysisData.overallRisk) {
        throw new Error('Missing required fields in analysis data');
      }
      
      // Make sure observations is an array
      if (!Array.isArray(analysisData.observations)) {
        analysisData.observations = [analysisData.observations].filter(Boolean);
      }
      
      // Save the analysis to the database
      const id = Date.now().toString();
      const speechAnalysis = {
        id,
        transcript,
        readingPassage, // Store the reading passage if available
        ...analysisData,
        timestamp: new Date().toISOString()
      };
      
      // Add to database
      db.addSpeechAnalysis(speechAnalysis);
      
      // Send the analysis back to the client
      res.json(analysisData);
      
    } catch (jsonError) {
      console.error('Error parsing or processing JSON:', jsonError);
      res.status(500).json({ 
        error: 'Failed to process speech analysis',
        message: jsonError.message,
        rawResponse: text
      });
    }
    
  } catch (error) {
    console.error('Error analyzing speech:', error);
    res.status(500).json({ error: 'Failed to analyze speech' });
  }
});

// Transcribe audio with AssemblyAI
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audioUrl } = req.body;
    
    if (!audioUrl) {
      return res.status(400).json({ error: 'Missing audio URL' });
    }
    
    // Create transcription request with AssemblyAI
    const transcript = await assemblyai.transcripts.transcribe({
      audio: audioUrl,
      language_code: 'en',
    });
    
    res.json({ 
      transcript: transcript.text,
      status: 'completed'
    });
    
  } catch (error) {
    console.error('Error transcribing audio:', error);
    res.status(500).json({ error: 'Failed to transcribe audio', details: error.message });
  }
});

// Upload audio to AssemblyAI
app.post('/api/upload-audio', express.raw({ type: 'audio/*', limit: '50mb' }), async (req, res) => {
  try {
    // Upload the audio data to AssemblyAI
    const uploadResponse = await assemblyai.files.upload(req.body, {
      // You can provide optional parameters here if needed
      // data_format: 'wav',
    });
    
    // Return the URL of the uploaded audio file
    res.json({ 
      upload_url: uploadResponse.url 
    });
    
  } catch (error) {
    console.error('Error uploading audio:', error);
    res.status(500).json({ error: 'Failed to upload audio', details: error.message });
  }
});

// Get recent speech analyses
app.get('/api/speech-analyses/recent', (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 5;
    const recentAnalyses = db.getRecentSpeechAnalyses(limit);
    res.json(recentAnalyses);
  } catch (error) {
    console.error('Error fetching recent speech analyses:', error);
    res.status(500).json({ error: 'Failed to fetch recent speech analyses' });
  }
});

// Serve the static files from React app for any other routes
app.get('*', (req, res) => {
  // Try to serve the React build first, then fall back to public folder
  const reactBuildPath = path.join(__dirname, '../client/build', 'index.html');
  const publicPath = path.join(__dirname, 'public', 'index.html');
  
  // Check if React build exists, otherwise serve from public
  if (require('fs').existsSync(reactBuildPath)) {
    res.sendFile(reactBuildPath);
  } else {
    res.sendFile(publicPath);
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
