import React, { useEffect, useState } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import analyzeFacialAsymmetry from '../utils/facialAsymmetryDetector';

const FaceMeshDetection = ({ webcamRef, isDetecting, onResults, onMetricsUpdate }) => {
  const [faceMesh, setFaceMesh] = useState(null);
  const [camera, setCamera] = useState(null);
  
  useEffect(() => {
    if (!webcamRef.current) return;
    
    // Initialize FaceMesh
    const initializeFaceMesh = async () => {
      const mesh = new FaceMesh({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }
      });
      
      mesh.setOptions({
        maxNumFaces: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        refineLandmarks: true
      });
      
      mesh.onResults((results) => {
        onResults(results);
        
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
          const metrics = analyzeFacialAsymmetry(results.multiFaceLandmarks[0]);
          onMetricsUpdate(metrics);
        }
      });
      
      setFaceMesh(mesh);
      
      // Initialize camera
      if (webcamRef.current) {
        const cam = new Camera(webcamRef.current, {
          onFrame: async () => {
            if (webcamRef.current && isDetecting) {
              await mesh.send({ image: webcamRef.current });
            }
          },
          width: 640,
          height: 480
        });
        
        setCamera(cam);
      }
    };
    
    initializeFaceMesh();
    
    return () => {
      if (faceMesh) {
        faceMesh.close();
      }
      if (camera) {
        camera.stop();
      }
    };
  }, [webcamRef, onResults, onMetricsUpdate]);
  
  useEffect(() => {
    if (camera && isDetecting) {
      camera.start();
    } else if (camera && !isDetecting) {
      camera.stop();
    }
  }, [camera, isDetecting]);
  
  return null; // This component doesn't render anything
};

export default FaceMeshDetection;
