/**
 * Simple in-memory database for the Stroke Detection application
 * Provides basic storage for assessment data
 */

const createMemoryDb = () => {
  // Database structure
  const db = {
    assessments: [],
    stats: {
      totalAssessments: 0,
      highRiskCount: 0,
      mediumRiskCount: 0,
      lowRiskCount: 0
    }
  };
  
  // Helper methods (if needed)
  const updateStats = () => {
    db.stats.totalAssessments = db.assessments.length;
    db.stats.highRiskCount = db.assessments.filter(a => a.riskLevel === 'high').length;
    db.stats.mediumRiskCount = db.assessments.filter(a => a.riskLevel === 'medium').length;
    db.stats.lowRiskCount = db.assessments.filter(a => a.riskLevel === 'low').length;
  };
  
  // Add a method to clear all data (useful for testing)
  const clearAll = () => {
    db.assessments = [];
    updateStats();
  };
  
  // Add a method to add an assessment and update stats
  const addAssessment = (assessment) => {
    db.assessments.push(assessment);
    updateStats();
    return assessment.id;
  };
  
  // Return the database object with any helper methods
  return {
    ...db,
    clearAll,
    addAssessment
  };
};

module.exports = { createMemoryDb };
