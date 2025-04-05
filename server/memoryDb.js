/**
 * Simple in-memory database for the Stroke Detection application
 * Provides basic storage for assessment data
 */

const createMemoryDb = () => {
  // Database structure
  const db = {
    assessments: [],
    speechAnalyses: [],
    stats: {
      totalAssessments: 0,
      highRiskCount: 0,
      mediumRiskCount: 0,
      lowRiskCount: 0,
      totalSpeechAnalyses: 0
    }
  };
  
  // Helper methods (if needed)
  const updateStats = () => {
    db.stats.totalAssessments = db.assessments.length;
    db.stats.highRiskCount = db.assessments.filter(a => a.riskLevel === 'high').length;
    db.stats.mediumRiskCount = db.assessments.filter(a => a.riskLevel === 'medium').length;
    db.stats.lowRiskCount = db.assessments.filter(a => a.riskLevel === 'low').length;
    db.stats.totalSpeechAnalyses = db.speechAnalyses.length;
  };
  
  // Add a method to clear all data (useful for testing)
  const clearAll = () => {
    db.assessments = [];
    db.speechAnalyses = [];
    updateStats();
  };
  
  // Add a method to add an assessment and update stats
  const addAssessment = (assessment) => {
    db.assessments.push(assessment);
    updateStats();
    return assessment.id;
  };
  
  // Add a method to add speech analysis
  const addSpeechAnalysis = (analysis) => {
    db.speechAnalyses.push(analysis);
    updateStats();
    return analysis.id;
  };
  
  // Add a method to get recent speech analyses
  const getRecentSpeechAnalyses = (limit = 5) => {
    return [...db.speechAnalyses]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  };
  
  // Return the database object with any helper methods
  return {
    ...db,
    clearAll,
    addAssessment,
    addSpeechAnalysis,
    getRecentSpeechAnalyses
  };
};

module.exports = { createMemoryDb };
