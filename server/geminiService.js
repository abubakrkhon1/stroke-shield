/**
 * Gemini AI integration for stroke detection
 * Provides speech analysis functionality
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configure the model
const modelName = "gemini-1.5-pro";

/**
 * Analyze speech for potential stroke indicators
 * @param {string} transcription - The text transcription of user's speech
 * @param {Object} facialMetrics - Facial asymmetry metrics
 * @returns {Promise<Object>} - Analysis results
 */
async function analyzeSpeech(transcription, facialMetrics) {
  try {
    // Bail early if no transcription
    if (!transcription || transcription.trim() === '') {
      return {
        slurredSpeech: false,
        speechCoherence: 1.0,
        possibleStrokeIndicators: false,
        confidence: 0,
        clarity: 100,
        fluency: 100,
        analysis: "No speech detected to analyze."
      };
    }

    const model = genAI.getGenerativeModel({ model: modelName });

    // Prompt engineering for Gemini
    const prompt = `
As a medical AI assistant for stroke detection, analyze this speech transcription for signs of a stroke.

Speech transcription: "${transcription}"

${facialMetrics ? `Current facial asymmetry metrics:
- Eye asymmetry: ${facialMetrics.eyeRatio || 0}
- Mouth asymmetry: ${facialMetrics.mouthCornerRatio || 0}
- Overall facial asymmetry: ${facialMetrics.overallAsymmetry || 0}` : ''}

Focus on:
1. Slurred speech detection
2. Speech coherence
3. Word-finding difficulties
4. Sentence completion problems
5. Repetition or stuttering
6. Overall fluency

In your analysis, please provide:
- A boolean (true/false) indicator if slurred speech is detected
- A clarity score from 0-100 (where 100 is perfectly clear speech)
- A fluency score from 0-100 (where 100 is perfectly fluent speech)
- A boolean (true/false) for possible stroke indicators in speech
- A confidence score from 0-100
- A brief analysis (2-3 sentences maximum)

Format your response as JSON with the keys: slurredSpeech, clarity, fluency, possibleStrokeIndicators, confidence, analysis
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response 
    let jsonStart = text.indexOf('{');
    let jsonEnd = text.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      const jsonStr = text.substring(jsonStart, jsonEnd + 1);
      try {
        const parsedResult = JSON.parse(jsonStr);
        
        // Format the result to match our frontend expectations
        return {
          slurredSpeech: parsedResult.slurredSpeech || false,
          speechCoherence: parsedResult.speechCoherence || 0.8,
          possibleStrokeIndicators: parsedResult.possibleStrokeIndicators || false,
          confidence: parsedResult.confidence || 50,
          clarity: parsedResult.clarity || 80,
          fluency: parsedResult.fluency || 80,
          analysis: parsedResult.analysis || "Speech analysis completed."
        };
      } catch (e) {
        console.error("Error parsing JSON from Gemini response", e);
        // Try to extract values with regex if JSON parse fails
        return extractValuesWithRegex(text);
      }
    } else {
      // Fallback to regex extraction
      return extractValuesWithRegex(text);
    }
  } catch (error) {
    console.error("Error in Gemini API call:", error);
    return {
      slurredSpeech: false,
      speechCoherence: 0.8,
      possibleStrokeIndicators: false,
      confidence: 50,
      clarity: 80,
      fluency: 80,
      analysis: "Unable to analyze speech due to a technical error. Please try again or consult a medical professional if you have concerns."
    };
  }
}

/**
 * Fallback function to extract values using regex
 */
function extractValuesWithRegex(text) {
  // Default values
  let result = {
    slurredSpeech: false,
    speechCoherence: 0.8,
    possibleStrokeIndicators: false,
    confidence: 50,
    clarity: 80,
    fluency: 80,
    analysis: "Analysis extracted from partial data. Please consult a medical professional for accurate assessment."
  };
  
  // Try to extract values with regex
  const slurredMatch = /slurredSpeech["\s:]+([a-z]+)/i.exec(text);
  if (slurredMatch) {
    result.slurredSpeech = slurredMatch[1].toLowerCase() === 'true';
  }
  
  const coherenceMatch = /speechCoherence["\s:]+([0-9.]+)/i.exec(text);
  if (coherenceMatch) {
    result.speechCoherence = parseFloat(coherenceMatch[1]);
  }
  
  const clarityMatch = /clarity["\s:]+([0-9.]+)/i.exec(text);
  if (clarityMatch) {
    result.clarity = parseFloat(clarityMatch[1]);
  }
  
  const fluencyMatch = /fluency["\s:]+([0-9.]+)/i.exec(text);
  if (fluencyMatch) {
    result.fluency = parseFloat(fluencyMatch[1]);
  }
  
  const indicatorsMatch = /possibleStrokeIndicators["\s:]+([a-z]+)/i.exec(text);
  if (indicatorsMatch) {
    result.possibleStrokeIndicators = indicatorsMatch[1].toLowerCase() === 'true';
  }
  
  const confidenceMatch = /confidence["\s:]+([0-9.]+)/i.exec(text);
  if (confidenceMatch) {
    result.confidence = parseFloat(confidenceMatch[1]);
  }
  
  const analysisMatch = /analysis["\s:]+["'](.+?)["']/i.exec(text);
  if (analysisMatch) {
    result.analysis = analysisMatch[1];
  }
  
  return result;
}

module.exports = {
  analyzeSpeech
};