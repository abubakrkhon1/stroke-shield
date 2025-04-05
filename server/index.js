const express = require('express');
const path = require('path');
const cors = require('cors');
const { createMemoryDb } = require('./memoryDb');

// Initialize the app
const app = express();
const PORT = process.env.PORT || 8000;

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
