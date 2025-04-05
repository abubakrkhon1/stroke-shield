import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const ResultsPanel = ({ asymmetryMetrics, postureMetrics, riskLevel, assessmentFindings }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  
  // Format a metric value to 2 decimal places and add a % sign
  const formatMetric = (value) => {
    if (value === undefined || value === null) return 'N/A';
    return `${(value * 100).toFixed(2)}%`;
  };
  
  // Get color based on risk level
  const getRiskColor = (level) => {
    switch (level) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };
  
  // Create or update chart when metrics change
  useEffect(() => {
    if (!chartRef.current) return;
    
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    // Prepare data for chart
    const asymmetryValues = [
      asymmetryMetrics.eyeAsymmetry || 0,
      asymmetryMetrics.mouthAsymmetry || 0,
      asymmetryMetrics.eyebrowAsymmetry || 0,
      asymmetryMetrics.overallAsymmetry || 0
    ];
    
    const postureValues = [
      postureMetrics.shoulderImbalance || 0,
      postureMetrics.headTilt || 0,
      postureMetrics.bodyLean || 0
    ];
    
    // Create chart
    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [
          'Eye Asymmetry', 
          'Mouth Asymmetry', 
          'Eyebrow Asymmetry', 
          'Overall Facial Asymmetry',
          'Shoulder Imbalance',
          'Head Tilt',
          'Body Lean'
        ],
        datasets: [{
          label: 'Asymmetry Metrics (%)',
          data: [...asymmetryValues.map(v => v * 100), ...postureValues.map(v => v * 100)],
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(199, 199, 199, 0.6)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(199, 199, 199, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Asymmetry (%)'
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.raw.toFixed(2)}%`;
              }
            }
          }
        }
      }
    });
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [asymmetryMetrics, postureMetrics]);
  
  return (
    <div className="results-container">
      <h2 className="text-xl font-bold mb-4">Detection Results</h2>
      
      {/* Risk Level Indicator */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Risk Assessment</h3>
        <div className={`px-4 py-2 rounded text-white font-bold text-center ${getRiskColor(riskLevel)}`}>
          {riskLevel === 'high' && 'High Risk - Seek Medical Attention'}
          {riskLevel === 'medium' && 'Medium Risk - Consider Medical Consultation'}
          {riskLevel === 'low' && 'Low Risk - Continue Monitoring'}
          {!riskLevel && 'Awaiting Analysis'}
        </div>
      </div>
      
      {/* Visualization */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Asymmetry Metrics</h3>
        <div className="bg-white rounded-lg p-2 shadow-inner">
          <canvas ref={chartRef} height="200"></canvas>
        </div>
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="metric-card">
          <div className="metric-label">Eye Asymmetry</div>
          <div className="metric-value">{formatMetric(asymmetryMetrics.eyeAsymmetry)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Mouth Asymmetry</div>
          <div className="metric-value">{formatMetric(asymmetryMetrics.mouthAsymmetry)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Eyebrow Asymmetry</div>
          <div className="metric-value">{formatMetric(asymmetryMetrics.eyebrowAsymmetry)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Overall Asymmetry</div>
          <div className="metric-value">{formatMetric(asymmetryMetrics.overallAsymmetry)}</div>
        </div>
      </div>
      
      {/* Posture Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="metric-card">
          <div className="metric-label">Shoulder Imbalance</div>
          <div className="metric-value">{formatMetric(postureMetrics.shoulderImbalance)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Head Tilt</div>
          <div className="metric-value">{formatMetric(postureMetrics.headTilt)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Body Lean</div>
          <div className="metric-value">{formatMetric(postureMetrics.bodyLean)}</div>
        </div>
      </div>
      
      {/* Findings */}
      {assessmentFindings.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Key Findings</h3>
          <ul className="list-disc pl-5">
            {assessmentFindings.map((finding, index) => (
              <li key={index} className="mb-1">{finding}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Disclaimer */}
      <div className="mt-6 text-sm text-gray-600 bg-gray-100 p-3 rounded">
        <strong>Disclaimer:</strong> This tool is not a medical device and should not be used for medical diagnosis. 
        If you suspect a stroke, call emergency services immediately (911 in the US). 
        Remember the FAST method: Facial drooping, Arm weakness, Speech difficulties, Time to call emergency services.
      </div>
    </div>
  );
};

export default ResultsPanel;
