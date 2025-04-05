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
  
  // Get risk level color
  const getRiskColor = () => {
    switch (riskLevel) {
      case 'high':
        return 'bg-red-100 border-red-400 text-red-800';
      case 'medium':
        return 'bg-yellow-100 border-yellow-400 text-yellow-800';
      default:
        return 'bg-green-100 border-green-400 text-green-800';
    }
  };

  // Render risk level indicator with different styles
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Overall Stroke Assessment</h2>
      
      {/* Risk level indicator */}
      <div className={`border rounded-lg p-4 mb-6 ${getRiskColor()}`}>
        <div className="flex justify-between items-center mb-2">
          <div className="text-xl font-bold">{riskLevel.toUpperCase()} RISK</div>
          <div className="text-sm">Assessment Time: {assessmentTime.toLocaleTimeString()}</div>
        </div>
        <div className="text-lg font-medium mb-2">{getRiskMessage()}</div>
        <div className="text-sm">Risk Score: {(riskScore * 100).toFixed(1)}%</div>
      </div>
      
      {/* FAST indicators section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">FAST Protocol Evaluation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`border rounded-lg p-3 ${(facialAsymmetry?.overallAsymmetry || 0) > 0.2 ? 'bg-red-50 border-red-200' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${(facialAsymmetry?.overallAsymmetry || 0) > 0.2 ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>F</div>
              <div>
                <div className="font-bold">Face</div>
                <div>{(facialAsymmetry?.overallAsymmetry || 0) > 0.2 ? 'Facial asymmetry detected' : 'No significant asymmetry'}</div>
              </div>
            </div>
          </div>
          
          <div className={`border rounded-lg p-3 ${(postureAnalysis?.armDrop || 0) > 0.2 ? 'bg-red-50 border-red-200' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${(postureAnalysis?.armDrop || 0) > 0.2 ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>A</div>
              <div>
                <div className="font-bold">Arms</div>
                <div>{(postureAnalysis?.armDrop || 0) > 0.2 ? 'Arm weakness detected' : 'No significant arm drop'}</div>
              </div>
            </div>
          </div>
          
          <div className={`border rounded-lg p-3 ${
            speechAnalysis?.slurredSpeech || 
            (speechAnalysis?.clarity && speechAnalysis.clarity < 70) || 
            (speechAnalysis?.fluency && speechAnalysis.fluency < 70) ? 
            'bg-red-50 border-red-200' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                speechAnalysis?.slurredSpeech || 
                (speechAnalysis?.clarity && speechAnalysis.clarity < 70) || 
                (speechAnalysis?.fluency && speechAnalysis.fluency < 70) ? 
                'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>S</div>
              <div>
                <div className="font-bold">Speech</div>
                <div>{
                  speechAnalysis?.slurredSpeech || 
                  (speechAnalysis?.clarity && speechAnalysis.clarity < 70) || 
                  (speechAnalysis?.fluency && speechAnalysis.fluency < 70) ? 
                  'Speech abnormalities detected' : 'No significant speech issues'
                }</div>
              </div>
            </div>
          </div>
          
          <div className="border rounded-lg p-3 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">T</div>
              <div>
                <div className="font-bold">Time</div>
                <div className="font-medium">{riskLevel === 'high' ? 'Call 911 immediately' : 'Record time and monitor'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Assessment details */}
      <div className="border rounded-lg p-4 mb-4 bg-gray-50">
        <h3 className="text-lg font-semibold mb-3">Detailed Metrics</h3>
        <div className="space-y-2">
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium">Facial Asymmetry:</span>
            <span className={`font-bold ${(facialAsymmetry?.overallAsymmetry || 0) > 0.2 ? 'text-red-600' : 'text-green-600'}`}>
              {((facialAsymmetry?.overallAsymmetry || 0) * 100).toFixed(1)}%
            </span>
          </div>
          
          {postureAnalysis && (
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">Posture Imbalance:</span>
              <span className={`font-bold ${(postureAnalysis?.shoulderImbalance || 0) > 0.2 ? 'text-red-600' : 'text-green-600'}`}>
                {((postureAnalysis?.shoulderImbalance || 0) * 100).toFixed(1)}%
              </span>
            </div>
          )}
          
          {speechAnalysis && (
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">Speech Analysis:</span>
              <span className={`font-bold ${speechAnalysis.slurredSpeech ? 'text-red-600' : 'text-green-600'}`}>
                {speechAnalysis.slurredSpeech ? 'Slurred' : 'Normal'} 
                (Clarity: {speechAnalysis.clarity || 0}%)
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Disclaimer */}
      <div className="text-center text-sm text-gray-500 italic">
        This is not a medical diagnosis. If you suspect a stroke, call emergency services immediately.
      </div>
    </div>
  );
};

export default StrokeAssessment;