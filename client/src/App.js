import React, { useState, useRef, useEffect } from 'react';
import Webcam from './components/Webcam';
import DetectionView from './components/DetectionView';
import ResultsPanel from './components/ResultsPanel';
import FaceMeshDetection from './components/FaceMeshDetection';
import PoseDetection from './components/PoseDetection';
import StrokeAssessment from './components/StrokeAssessment';

function App() {
  const [faceMeshResults, setFaceMeshResults] = useState(null);
  const [poseResults, setPoseResults] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [asymmetryMetrics, setAsymmetryMetrics] = useState({});
  const [postureMetrics, setPostureMetrics] = useState({});
  const [riskLevel, setRiskLevel] = useState('low');
  const [assessmentFindings, setAssessmentFindings] = useState([]);
  
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  
  const toggleDetection = () => {
    setIsDetecting(!isDetecting);
  };
  
  const clearResults = () => {
    setFaceMeshResults(null);
    setPoseResults(null);
    setAsymmetryMetrics({});
    setPostureMetrics({});
    setRiskLevel('low');
    setAssessmentFindings([]);
  };
  
  useEffect(() => {
    // Initialize feather icons
    if (window.feather) {
      window.feather.replace();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold">Stroke Detection System</h1>
          <p className="mt-2">Real-time analysis of facial asymmetry and body posture</p>
        </div>
      </header>
      
      <main className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h2 className="text-xl font-bold mb-4">Camera Input</h2>
            <div className="detection-container">
              <Webcam 
                ref={webcamRef} 
                isDetecting={isDetecting}
              />
              <DetectionView 
                ref={canvasRef} 
                faceMeshResults={faceMeshResults}
                poseResults={poseResults}
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button 
                onClick={toggleDetection}
                className={`px-4 py-2 rounded font-bold ${isDetecting ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
              >
                {isDetecting ? 'Stop Detection' : 'Start Detection'}
              </button>
              <button 
                onClick={clearResults}
                className="px-4 py-2 bg-gray-300 rounded font-bold"
              >
                Clear Results
              </button>
            </div>
          </div>
          
          <div>
            <ResultsPanel 
              asymmetryMetrics={asymmetryMetrics}
              postureMetrics={postureMetrics}
              riskLevel={riskLevel}
              assessmentFindings={assessmentFindings}
            />
          </div>
        </div>
        
        {/* Hidden components for detection logic */}
        <FaceMeshDetection 
          webcamRef={webcamRef}
          isDetecting={isDetecting}
          onResults={setFaceMeshResults}
          onMetricsUpdate={setAsymmetryMetrics}
        />
        <PoseDetection 
          webcamRef={webcamRef}
          isDetecting={isDetecting}
          onResults={setPoseResults}
          onMetricsUpdate={setPostureMetrics}
        />
        <StrokeAssessment 
          asymmetryMetrics={asymmetryMetrics}
          postureMetrics={postureMetrics}
          onRiskUpdate={setRiskLevel}
          onFindingsUpdate={setAssessmentFindings}
        />
      </main>
      
      <footer className="bg-gray-800 text-white p-4 mt-8">
        <div className="container mx-auto text-center">
          <p>Stroke Detection Application</p>
          <p className="text-sm mt-2">Disclaimer: This tool is for educational purposes only and not a medical diagnostic device.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
