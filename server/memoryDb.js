/**
 * Simple in-memory database for the Stroke Detection application
 * Provides basic storage for assessment data
 */

const createMemoryDb = () => {
  // Database structure
  const db = {
    assessments: [],
    speechAssessments: [],
    stats: {
      totalAssessments: 0,
      highRiskCount: 0,
      mediumRiskCount: 0,
      lowRiskCount: 0,
      speechAssessmentCount: 0,
      speechIndicatorsCount: 0
    }
  };
  
  // Helper methods (if needed)
  const updateStats = () => {
    db.stats.totalAssessments = db.assessments.length;
    db.stats.highRiskCount = db.assessments.filter(a => a.riskLevel === 'high').length;
    db.stats.mediumRiskCount = db.assessments.filter(a => a.riskLevel === 'medium').length;
    db.stats.lowRiskCount = db.assessments.filter(a => a.riskLevel === 'low').length;
    db.stats.speechAssessmentCount = db.speechAssessments?.length || 0;
    db.stats.speechIndicatorsCount = db.speechAssessments?.filter(
      s => s.analysis && s.analysis.possibleStrokeIndicators === true
    ).length || 0;
  };
  
  // Add a method to clear all data (useful for testing)
  const clearAll = () => {
    db.assessments = [];
    db.speechAssessments = [];
    updateStats();
  };
  
  // Add a method to add an assessment and update stats
  const addAssessment = (assessment) => {
    db.assessments.push(assessment);
    updateStats();
    return assessment.id;
  };
  
  // Add a method to add a speech assessment and update stats
  const addSpeechAssessment = (speechAssessment) => {
    if (!db.speechAssessments) {
      db.speechAssessments = [];
    }
    db.speechAssessments.push(speechAssessment);
    updateStats();
    return speechAssessment.id;
  };
  
  // Return the database object with any helper methods
  return {
    ...db,
    clearAll,
    addAssessment,
    addSpeechAssessment
  };
};

module.exports = { createMemoryDb };
