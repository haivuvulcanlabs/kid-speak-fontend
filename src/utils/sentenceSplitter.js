// src/utils/sentenceSplitter.js

/**
 * Split text into sentences for better TTS control
 * @param {string} text - The text to split
 * @returns {Array<string>} - Array of sentences
 */
export function splitIntoSentences(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // Remove extra whitespace and normalize
  const normalizedText = text.trim().replace(/\s+/g, ' ');
  
  // Split by sentence endings, but preserve the punctuation
  const sentences = normalizedText
    .split(/(?<=[.!?])\s+/)
    .filter(sentence => sentence.trim().length > 0)
    .map(sentence => sentence.trim());

  // If no sentences found, return the original text as single sentence
  if (sentences.length === 0) {
    return [normalizedText];
  }

  return sentences;
}

/**
 * Add pauses between sentences for better comprehension
 * @param {Array<string>} sentences - Array of sentences
 * @param {number} pauseDuration - Pause duration in milliseconds
 * @returns {Array<Object>} - Array with sentences and pause objects
 */
export function addPausesBetweenSentences(sentences, pauseDuration = 1000) {
  const result = [];
  
  sentences.forEach((sentence, index) => {
    result.push({
      type: 'sentence',
      content: sentence,
      index: index
    });
    
    // Add pause after each sentence except the last one
    if (index < sentences.length - 1) {
      result.push({
        type: 'pause',
        duration: pauseDuration,
        index: index + 0.5
      });
    }
  });
  
  return result;
}

/**
 * Calculate appropriate pause duration based on sentence complexity
 * @param {string} sentence - The sentence to analyze
 * @param {number} basePause - Base pause duration in milliseconds
 * @returns {number} - Calculated pause duration
 */
export function calculatePauseDuration(sentence, basePause = 1000) {
  const wordCount = sentence.split(' ').length;
  const hasNumbers = /\d/.test(sentence);
  const hasQuestion = sentence.includes('?');
  const hasExclamation = sentence.includes('!');
  
  let multiplier = 1;
  
  // Longer sentences need more pause
  if (wordCount > 10) multiplier += 0.5;
  if (wordCount > 15) multiplier += 0.5;
  
  // Questions need more pause for thinking
  if (hasQuestion) multiplier += 0.3;
  
  // Exclamations need more pause for emphasis
  if (hasExclamation) multiplier += 0.2;
  
  // Numbers need more pause for processing
  if (hasNumbers) multiplier += 0.4;
  
  return Math.round(basePause * multiplier);
}

/**
 * Get speech rate based on student level
 * @param {string} level - Student level (beginner, intermediate, advanced)
 * @returns {number} - Speech rate (0.1 to 2.0)
 */
export function getSpeechRateForLevel(level = 'beginner') {
  const rates = {
    'beginner': 0.7,      // Slower for beginners
    'intermediate': 0.9,  // Normal speed
    'advanced': 1.1       // Slightly faster for advanced
  };
  
  return rates[level] || rates['beginner'];
}

/**
 * Format text for better TTS pronunciation
 * @param {string} text - The text to format
 * @returns {string} - Formatted text
 */
export function formatTextForTTS(text) {
  return text
    // Add pauses for numbers
    .replace(/(\d+)/g, ' $1 ')
    // Add pauses for punctuation
    .replace(/([.!?])/g, '$1 ')
    // Clean up extra spaces
    .replace(/\s+/g, ' ')
    .trim();
}
