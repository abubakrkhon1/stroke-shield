import React, { useEffect, useState } from 'react';
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import analyzePosture from '../utils/postureAnalyzer';

const PoseDetection = ({ webcamRef, isDetecting, onResults, onMetricsUpdate }) => {
  const [pose, setPose] = useState(null);
  const [camera, setCamera] = useState(null);
  
  useEffect(() => {
    if (!webcamRef.current) return;
    
    // Initialize Pose
    const initializePose = async () => {
      const poseModel = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
      });
      
      poseModel.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      
      poseModel.onResults((results) => {
        onResults(results);
        
        if (results.poseLandmarks) {
          const metrics = analyzePosture(results.poseLandmarks);
          onMetricsUpdate(metrics);
        }
      });
      
      setPose(poseModel);
      
      // We'll use the same camera instance from FaceMeshDetection component
      // But for completeness, initialize a camera if needed
      if (!camera && webcamRef.current) {
        const cam = new Camera(webcamRef.current, {
          onFrame: async () => {
            if (webcamRef.current && isDetecting) {
              await poseModel.send({ image: webcamRef.current });
            }
          },
          width: 640,
          height: 480
        });
        
        setCamera(cam);
      }
    };
    
    initializePose();
    
    return () => {
      if (pose) {
        pose.close();
      }
      // We don't stop the camera here since FaceMeshDetection manages it
    };
  }, [webcamRef, onResults, onMetricsUpdate, camera]);
  
  useEffect(() => {
    if (camera && isDetecting) {
      camera.start();
    } else if (camera && !isDetecting) {
      camera.stop();
    }
  }, [camera, isDetecting]);
  
  return null; // This component doesn't render anything
};

export default PoseDetection;
