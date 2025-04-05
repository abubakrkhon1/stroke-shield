import React, { useState, useEffect } from 'react';

/**
 * Component for displaying overall stroke assessment results
 * Combines facial asymmetry, posture, and speech analysis
 */
const StrokeAssessment = ({ facialAsymmetry, postureAnalysis, speechAnalysis }) => {
  const [riskLevel, setRiskLevel] = useState('low');
  const [riskScore, setRiskScore] = useState(0);
  const [assessmentTime, setAssessmentTime] = useState(new Date());
  
  useEffect(() => {
    // Calculate overall risk based on facial asymmetry, posture, and speech
    const calculateOverallRisk = () => {
      // Start with base score from facial asymmetry (0-1)
      let overallScore = facialAsymmetry.overallAsymmetry || 0;
      
      // Add weight from posture if available (0-0.5)
      if (postureAnalysis && postureAnalysis.shoulderImbalance) {
        overallScore += postureAnalysis.shoulderImbalance * 0.3;
      }
      
      // Add weight from speech analysis if available (0-0.5)
      if (speechAnalysis) {
        if (speechAnalysis.slurredSpeech) {
          overallScore += 0.3;
        }
        
        // Add score based on clarity and fluency
        if (speechAnalysis.clarity !== undefined) {
          overallScore += (100 - speechAnalysis.clarity) / 100 * 0.15;
        }
        
        if (speechAnalysis.fluency !== undefined) {
          overallScore += (100 - speechAnalysis.fluency) / 100 * 0.15;
        }
      }
      
      // Clamp score between 0-1
      overallScore = Math.min(Math.max(overallScore, 0), 1);
      
      // Update risk level based on score
      let level = 'low';
      if (overallScore > 0.7) {
        level = 'high';
      } else if (overallScore > 0.3) {
        level = 'medium';
      }
      
      setRiskScore(overallScore);
      setRiskLevel(level);
      setAssessmentTime(new Date());
    };
    
    calculateOverallRisk();
  }, [facialAsymmetry, postureAnalysis, speechAnalysis]);
  
  // Different messages based on risk level
  const getRiskMessage = () => {
    switch (riskLevel) {
      case 'high':
        return 'SEEK IMMEDIATE MEDICAL ATTENTION';
      case 'medium':
        return 'Contact a healthcare provider promptly';
      default:
        return 'Low risk indicators';
    }
  };
  
  // Render risk level indicator with different styles
  return (
    <div className="assessment-panel">
      <h2>Stroke Risk Assessment</h2>
      <div className={`risk-indicator ${riskLevel}-risk`}>
        <div className="risk-level">{riskLevel.toUpperCase()} RISK</div>
        <div className="risk-message">{getRiskMessage()}</div>
        <div className="risk-score">Score: {(riskScore * 100).toFixed(1)}%</div>
        <div className="risk-time">
          Assessed at: {assessmentTime.toLocaleTimeString()}
        </div>
      </div>
      <div className="assessment-details">
        <div className="detail-item">
          <span>Facial Asymmetry:</span>
          <span>{((facialAsymmetry?.overallAsymmetry || 0) * 100).toFixed(1)}%</span>
        </div>
        {postureAnalysis && (
          <div className="detail-item">
            <span>Posture Imbalance:</span>
            <span>{((postureAnalysis?.shoulderImbalance || 0) * 100).toFixed(1)}%</span>
          </div>
        )}
        {speechAnalysis && (
          <div className="detail-item">
            <span>Speech Analysis:</span>
            <span>
              {speechAnalysis.slurredSpeech ? 'Slurred' : 'Normal'} 
              {' '}(Clarity: {speechAnalysis.clarity || 0}%, Fluency: {speechAnalysis.fluency || 0}%)
            </span>
          </div>
        )}
      </div>
      
      {/* FAST indicators section */}
      <div className="fast-indicators">
        <h3>FAST Indicators</h3>
        <div className="fast-grid">
          <div className={`fast-item ${(facialAsymmetry?.overallAsymmetry || 0) > 0.2 ? 'active' : ''}`}>
            <div className="fast-letter">F</div>
            <div className="fast-description">
              <strong>Face:</strong> {(facialAsymmetry?.overallAsymmetry || 0) > 0.2 ? 'Asymmetry detected' : 'Normal'}
            </div>
          </div>
          
          <div className={`fast-item ${(postureAnalysis?.armDrop || 0) > 0.2 ? 'active' : ''}`}>
            <div className="fast-letter">A</div>
            <div className="fast-description">
              <strong>Arms:</strong> {(postureAnalysis?.armDrop || 0) > 0.2 ? 'Weakness detected' : 'Normal'}
            </div>
          </div>
          
          <div className={`fast-item ${
            speechAnalysis?.slurredSpeech || 
            (speechAnalysis?.clarity && speechAnalysis.clarity < 70) || 
            (speechAnalysis?.fluency && speechAnalysis.fluency < 70) ? 
            'active' : ''}`}>
            <div className="fast-letter">S</div>
            <div className="fast-description">
              <strong>Speech:</strong> {
                speechAnalysis?.slurredSpeech || 
                (speechAnalysis?.clarity && speechAnalysis.clarity < 70) || 
                (speechAnalysis?.fluency && speechAnalysis.fluency < 70) ? 
                'Impaired' : 'Normal'
              }
            </div>
          </div>
          
          <div className="fast-item time">
            <div className="fast-letter">T</div>
            <div className="fast-description">
              <strong>Time:</strong> {riskLevel === 'high' ? 'Call 911 immediately' : 'Track symptoms'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Disclaimer */}
      <div className="disclaimer">
        This is not a medical diagnosis. If you suspect a stroke, call emergency services immediately.
      </div>
    </div>
  );
};

export default StrokeAssessment;