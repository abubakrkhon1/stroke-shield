/**
 * Analyzes facial landmarks to detect asymmetry
 * The face mesh provides 468 3D landmarks
 * We'll focus on key points around eyes, mouth, and overall face symmetry
 */

// Helper to calculate distance between two points
const calculateDistance = (point1, point2) => {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

// Helper to calculate horizontal ratio difference (asymmetry)
const calculateAsymmetryRatio = (leftDistance, rightDistance) => {
  const maxDistance = Math.max(leftDistance, rightDistance);
  const minDistance = Math.min(leftDistance, rightDistance);
  
  // Avoid division by zero
  if (maxDistance === 0) return 0;
  
  // Calculate how different the two sides are (0 = perfectly symmetric, 1 = completely asymmetric)
  return 1 - (minDistance / maxDistance);
};

// Main analysis function
const analyzeFacialAsymmetry = (landmarks) => {
  if (!landmarks || landmarks.length < 468) {
    return {
      eyeAsymmetry: 0,
      mouthAsymmetry: 0,
      eyebrowAsymmetry: 0,
      overallAsymmetry: 0
    };
  }
  
  // Key landmark indices
  // Face midline points
  const noseTip = landmarks[4];
  const foreheadMid = landmarks[151];
  const chinBottom = landmarks[199];
  
  // Eye landmarks
  const leftEyeOuter = landmarks[33];
  const leftEyeInner = landmarks[133];
  const rightEyeOuter = landmarks[263];
  const rightEyeInner = landmarks[362];
  
  // Eye openness measurement
  const leftEyeTop = landmarks[159];
  const leftEyeBottom = landmarks[145];
  const rightEyeTop = landmarks[386];
  const rightEyeBottom = landmarks[374];
  
  // Mouth landmarks
  const mouthLeft = landmarks[61];
  const mouthRight = landmarks[291];
  const upperLipMid = landmarks[13];
  const lowerLipMid = landmarks[14];
  
  // Eyebrow landmarks
  const leftEyebrowOuter = landmarks[70];
  const leftEyebrowInner = landmarks[107];
  const rightEyebrowOuter = landmarks[300];
  const rightEyebrowInner = landmarks[336];
  
  // Calculate midline (vertical line through center of face)
  const midline = {
    x: (foreheadMid.x + noseTip.x + chinBottom.x) / 3,
    y: 0  // We only care about x-coordinate for horizontal symmetry
  };
  
  // 1. Analyze eye symmetry
  const leftEyeWidth = calculateDistance(leftEyeOuter, leftEyeInner);
  const rightEyeWidth = calculateDistance(rightEyeOuter, rightEyeInner);
  const eyeWidthAsymmetry = calculateAsymmetryRatio(leftEyeWidth, rightEyeWidth);
  
  const leftEyeHeight = calculateDistance(leftEyeTop, leftEyeBottom);
  const rightEyeHeight = calculateDistance(rightEyeTop, rightEyeBottom);
  const eyeHeightAsymmetry = calculateAsymmetryRatio(leftEyeHeight, rightEyeHeight);
  
  // Distance from eyes to midline
  const leftEyeToMidline = Math.abs(midline.x - ((leftEyeOuter.x + leftEyeInner.x) / 2));
  const rightEyeToMidline = Math.abs(midline.x - ((rightEyeOuter.x + rightEyeInner.x) / 2));
  const eyePositionAsymmetry = calculateAsymmetryRatio(leftEyeToMidline, rightEyeToMidline);
  
  // Combined eye asymmetry
  const eyeAsymmetry = (eyeWidthAsymmetry + eyeHeightAsymmetry + eyePositionAsymmetry) / 3;
  
  // 2. Analyze mouth symmetry
  const mouthWidth = calculateDistance(mouthLeft, mouthRight);
  const mouthLeftSide = calculateDistance(mouthLeft, {x: midline.x, y: mouthLeft.y});
  const mouthRightSide = calculateDistance(mouthRight, {x: midline.x, y: mouthRight.y});
  const mouthAsymmetry = calculateAsymmetryRatio(mouthLeftSide, mouthRightSide);
  
  // 3. Analyze eyebrow symmetry
  const leftEyebrowLength = calculateDistance(leftEyebrowOuter, leftEyebrowInner);
  const rightEyebrowLength = calculateDistance(rightEyebrowOuter, rightEyebrowInner);
  const eyebrowLengthAsymmetry = calculateAsymmetryRatio(leftEyebrowLength, rightEyebrowLength);
  
  const leftEyebrowHeight = (leftEyebrowOuter.y + leftEyebrowInner.y) / 2;
  const rightEyebrowHeight = (rightEyebrowOuter.y + rightEyebrowInner.y) / 2;
  const eyebrowHeightDiff = Math.abs(leftEyebrowHeight - rightEyebrowHeight);
  // Normalize by face height
  const faceHeight = calculateDistance(foreheadMid, chinBottom);
  const eyebrowHeightAsymmetry = faceHeight > 0 ? eyebrowHeightDiff / faceHeight : 0;
  
  const eyebrowAsymmetry = (eyebrowLengthAsymmetry + eyebrowHeightAsymmetry) / 2;
  
  // 4. Calculate overall asymmetry (weighted average)
  const overallAsymmetry = (
    (eyeAsymmetry * 0.4) + 
    (mouthAsymmetry * 0.4) + 
    (eyebrowAsymmetry * 0.2)
  );
  
  return {
    eyeAsymmetry,
    mouthAsymmetry,
    eyebrowAsymmetry,
    overallAsymmetry
  };
};

export default analyzeFacialAsymmetry;
