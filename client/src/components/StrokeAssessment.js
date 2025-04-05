import React, { useEffect } from 'react';

const StrokeAssessment = ({ asymmetryMetrics, postureMetrics, onRiskUpdate, onFindingsUpdate }) => {
  useEffect(() => {
    // Skip assessment if metrics aren't available
    if (Object.keys(asymmetryMetrics).length === 0 || Object.keys(postureMetrics).length === 0) {
      return;
    }
    
    // Extract metrics
    const { eyeAsymmetry, mouthAsymmetry, eyebrowAsymmetry, overallAsymmetry } = asymmetryMetrics;
    const { shoulderImbalance, headTilt, bodyLean } = postureMetrics;
    
    // Initialize findings array
    const findings = [];
    
    // Define thresholds
    const LOW_THRESHOLD = 0.1; // 10%
    const MEDIUM_THRESHOLD = 0.2; // 20%
    const HIGH_THRESHOLD = 0.3; // 30%
    
    // Calculate risk score (weighted average of metrics)
    let riskScore = 0;
    let highRiskIndicators = 0;
    
    // Assess facial asymmetry (higher weight)
    if (eyeAsymmetry > HIGH_THRESHOLD) {
      findings.push("Significant eye asymmetry detected - possible facial drooping");
      riskScore += 3;
      highRiskIndicators++;
    } else if (eyeAsymmetry > MEDIUM_THRESHOLD) {
      findings.push("Moderate eye asymmetry detected");
      riskScore += 2;
    } else if (eyeAsymmetry > LOW_THRESHOLD) {
      findings.push("Mild eye asymmetry detected");
      riskScore += 1;
    }
    
    if (mouthAsymmetry > HIGH_THRESHOLD) {
      findings.push("Significant mouth asymmetry detected - possible facial drooping");
      riskScore += 3;
      highRiskIndicators++;
    } else if (mouthAsymmetry > MEDIUM_THRESHOLD) {
      findings.push("Moderate mouth asymmetry detected");
      riskScore += 2;
    } else if (mouthAsymmetry > LOW_THRESHOLD) {
      findings.push("Mild mouth asymmetry detected");
      riskScore += 1;
    }
    
    if (eyebrowAsymmetry > HIGH_THRESHOLD) {
      findings.push("Significant eyebrow asymmetry detected");
      riskScore += 2;
    } else if (eyebrowAsymmetry > MEDIUM_THRESHOLD) {
      findings.push("Moderate eyebrow asymmetry detected");
      riskScore += 1;
    }
    
    if (overallAsymmetry > HIGH_THRESHOLD) {
      findings.push("High overall facial asymmetry detected");
      riskScore += 3;
      highRiskIndicators++;
    } else if (overallAsymmetry > MEDIUM_THRESHOLD) {
      findings.push("Moderate overall facial asymmetry");
      riskScore += 2;
    }
    
    // Assess posture (lower weight)
    if (shoulderImbalance > HIGH_THRESHOLD) {
      findings.push("Significant shoulder imbalance detected - possible weakness on one side");
      riskScore += 2;
      highRiskIndicators++;
    } else if (shoulderImbalance > MEDIUM_THRESHOLD) {
      findings.push("Moderate shoulder imbalance detected");
      riskScore += 1;
    }
    
    if (headTilt > HIGH_THRESHOLD) {
      findings.push("Significant head tilt detected");
      riskScore += 2;
    } else if (headTilt > MEDIUM_THRESHOLD) {
      findings.push("Moderate head tilt detected");
      riskScore += 1;
    }
    
    if (bodyLean > HIGH_THRESHOLD) {
      findings.push("Significant body leaning detected - possible balance issues");
      riskScore += 2;
    } else if (bodyLean > MEDIUM_THRESHOLD) {
      findings.push("Moderate body leaning detected");
      riskScore += 1;
    }
    
    // Determine overall risk level
    let riskLevel = 'low';
    if (riskScore >= 6 || highRiskIndicators >= 2) {
      riskLevel = 'high';
      findings.push("Multiple high-risk indicators detected. Consider seeking immediate medical evaluation.");
    } else if (riskScore >= 3) {
      riskLevel = 'medium';
      findings.push("Some concerning asymmetry detected. Consider consulting a healthcare provider.");
    } else {
      findings.push("No significant asymmetry indicators detected at this time.");
    }
    
    // Add stroke awareness information
    findings.push("Remember FAST for stroke: Face drooping, Arm weakness, Speech difficulty, Time to call emergency services.");
    
    // Update risk level and findings
    onRiskUpdate(riskLevel);
    onFindingsUpdate(findings);
    
  }, [asymmetryMetrics, postureMetrics, onRiskUpdate, onFindingsUpdate]);
  
  return null; // This component doesn't render anything
};

export default StrokeAssessment;
