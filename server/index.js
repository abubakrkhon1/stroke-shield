const express = require('express');
const path = require('path');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createMemoryDb } = require('./memoryDb');

// Initialize the app
const app = express();
const PORT = process.env.PORT || 8000;

// Initialize Google Generative AI
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);

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
    const { transcript } = req.body;
    
    if (!transcript) {
      return res.status(400).json({ error: 'Missing speech transcript' });
    }
    
    // Configure the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Analyze speech for stroke indicators
    const prompt = `
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
    
    try {
      // Extract the JSON from the response text (could be wrapped in ```json or code blocks)
      let jsonStr = text.trim();
      
      // Remove code block formatting if present
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json\n|```\n|```/g, '');
      }
      
      // Parse JSON
      const analysisData = JSON.parse(jsonStr);
      
      // Save the analysis to the database
      const id = Date.now().toString();
      const speechAnalysis = {
        id,
        transcript,
        ...analysisData,
        timestamp: new Date().toISOString()
      };
      
      // Add to database
      db.addSpeechAnalysis(speechAnalysis);
      
      res.json(analysisData);
      
    } catch (jsonError) {
      console.error('Error parsing AI response:', jsonError);
      res.status(500).json({ 
        error: 'Failed to parse speech analysis',
        rawResponse: text
      });
    }
    
  } catch (error) {
    console.error('Error analyzing speech:', error);
    res.status(500).json({ error: 'Failed to analyze speech' });
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
