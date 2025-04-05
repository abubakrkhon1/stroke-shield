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
app.use(express.static(path.join(__dirname, '../client/build')));

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
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
