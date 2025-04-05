import React, { useEffect, forwardRef } from 'react';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { FACEMESH_TESSELATION, FACEMESH_RIGHT_EYE, FACEMESH_LEFT_EYE, FACEMESH_RIGHT_EYEBROW, FACEMESH_LEFT_EYEBROW, FACEMESH_FACE_OVAL, FACEMESH_LIPS } from '@mediapipe/face_mesh';
import { POSE_CONNECTIONS } from '@mediapipe/pose';

const DetectionView = forwardRef(({ faceMeshResults, poseResults }, ref) => {
  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Draw face mesh if results are available
    if (faceMeshResults && faceMeshResults.multiFaceLandmarks) {
      for (const landmarks of faceMeshResults.multiFaceLandmarks) {
        // Draw face tesselation (mesh)
        drawConnectors(ctx, landmarks, FACEMESH_TESSELATION, { color: '#C0C0C070', lineWidth: 0.5 });
        
        // Draw eyes
        drawConnectors(ctx, landmarks, FACEMESH_RIGHT_EYE, { color: '#FF3030', lineWidth: 1 });
        drawConnectors(ctx, landmarks, FACEMESH_LEFT_EYE, { color: '#30FF30', lineWidth: 1 });
        
        // Draw eyebrows
        drawConnectors(ctx, landmarks, FACEMESH_RIGHT_EYEBROW, { color: '#FF3030', lineWidth: 1 });
        drawConnectors(ctx, landmarks, FACEMESH_LEFT_EYEBROW, { color: '#30FF30', lineWidth: 1 });
        
        // Draw lips
        drawConnectors(ctx, landmarks, FACEMESH_LIPS, { color: '#E0E0E0', lineWidth: 1 });
        
        // Draw face oval
        drawConnectors(ctx, landmarks, FACEMESH_FACE_OVAL, { color: '#E0E0E0', lineWidth: 1 });
        
        // Draw landmarks
        drawLandmarks(ctx, landmarks, { color: '#30FF30', lineWidth: 0.5, radius: 1 });
      }
    }
    
    // Draw pose if results are available
    if (poseResults && poseResults.poseLandmarks) {
      // Draw pose connections
      drawConnectors(ctx, poseResults.poseLandmarks, POSE_CONNECTIONS, { color: '#00FFFF', lineWidth: 2 });
      
      // Draw landmarks
      drawLandmarks(ctx, poseResults.poseLandmarks, { 
        color: '#FF0000', 
        lineWidth: 1,
        radius: 3,
        fillColor: '#FFFFFF'
      });
    }
  }, [faceMeshResults, poseResults, ref]);
  
  return (
    <canvas
      ref={ref}
      className="detection-canvas"
      width={640}
      height={480}
    />
  );
});

export default DetectionView;
