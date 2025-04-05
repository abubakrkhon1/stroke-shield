/**
 * Analyzes body posture using MediaPipe Pose landmarks
 * Focuses on:
 * 1. Shoulder imbalance (drooping on one side)
 * 2. Head tilt
 * 3. Body lean
 */

// Helper to calculate the angle between three points
const calculateAngle = (p1, p2, p3) => {
  const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
  let angle = Math.abs(radians * 180.0 / Math.PI);
  
  // Normalize angle to be between 0-180
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  
  return angle;
};

// Helper to calculate the slope of a line between two points
const calculateSlope = (p1, p2) => {
  if (p2.x - p1.x === 0) return Number.MAX_VALUE; // Vertical line
  return (p2.y - p1.y) / (p2.x - p1.x);
};

// Helper to normalize a value to a 0-1 range
const normalizeValue = (value, maxValue) => {
  return Math.min(Math.abs(value) / maxValue, 1);
};

const analyzePosture = (poseLandmarks) => {
  if (!poseLandmarks || poseLandmarks.length < 33) {
    return {
      shoulderImbalance: 0,
      headTilt: 0,
      bodyLean: 0
    };
  }
  
  // Extract relevant landmarks
  // Shoulders
  const leftShoulder = poseLandmarks[11];
  const rightShoulder = poseLandmarks[12];
  
  // Hips
  const leftHip = poseLandmarks[23];
  const rightHip = poseLandmarks[24];
  
  // Head/Ears/Eyes
  const leftEar = poseLandmarks[7];
  const rightEar = poseLandmarks[8];
  const nose = poseLandmarks[0];
  
  // 1. Calculate shoulder imbalance
  const shoulderSlope = calculateSlope(leftShoulder, rightShoulder);
  // Normalize: 20 degrees (0.36 radians) is a significant shoulder imbalance
  const shoulderImbalance = normalizeValue(Math.atan(shoulderSlope), 0.36);
  
  // 2. Calculate head tilt
  const earMidpoint = {
    x: (leftEar.x + rightEar.x) / 2,
    y: (leftEar.y + rightEar.y) / 2
  };
  
  // Calculate angle between vertical line from ear midpoint and nose
  const verticalPoint = { x: earMidpoint.x, y: earMidpoint.y - 0.1 }; // Point directly above ear midpoint
  const headAngle = calculateAngle(verticalPoint, earMidpoint, nose);
  // Normalize: 15 degrees is a significant head tilt
  const headTilt = normalizeValue(headAngle, 15);
  
  // 3. Calculate body lean
  // First, find midpoints of shoulders and hips
  const shoulderMidpoint = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2
  };
  
  const hipMidpoint = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2
  };
  
  // Calculate angle of spine relative to vertical
  const verticalFromHips = { x: hipMidpoint.x, y: hipMidpoint.y - 0.1 }; // Point directly above hips
  const spineAngle = calculateAngle(verticalFromHips, hipMidpoint, shoulderMidpoint);
  // Normalize: 10 degrees is a significant body lean
  const bodyLean = normalizeValue(spineAngle, 10);
  
  return {
    shoulderImbalance,
    headTilt,
    bodyLean
  };
};

export default analyzePosture;
