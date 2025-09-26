// src/services/ttsService.js
import axios from 'axios';
import { splitIntoSentences, addPausesBetweenSentences, calculatePauseDuration, getSpeechRateForLevel, formatTextForTTS } from '../utils/sentenceSplitter';
import { API_BASE_URL } from '../config/api';

/**
 * Convert text to speech using OpenAI's TTS API via backend
 * @param {string} text - The text to convert to speech
 * @param {string} voice - The voice to use (alloy, echo, fable, onyx, nova, shimmer)
 * @param {string} model - The model to use (tts-1, tts-1-hd)
 * @returns {Promise<Blob>} - Audio blob
 */
export async function textToSpeech(text, voice = 'alloy', model = 'tts-1') {
  try {
    if (!text || text.trim().length === 0) {
      throw new Error('Text is required for TTS');
    }

    const response = await axios.post(`${API_BASE_URL}/text-to-speech`, {
      text,
      voice,
      model
    }, {
      responseType: 'blob',
      timeout: 30000 // 30 second timeout for TTS generation
    });

    return response.data;
  } catch (error) {
    console.error('TTS Service Error:', error);
    throw new Error(`TTS generation failed: ${error.response?.data?.error || error.message}`);
  }
}

/**
 * Play audio blob with custom rate and controls
 * @param {Blob} audioBlob - The audio blob to play
 * @param {Object} options - Playback options
 * @returns {Promise<void>}
 */
export function playAudioWithControls(audioBlob, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // Set playback options
      audio.playbackRate = options.rate || 1.0;
      audio.volume = options.volume || 1.0;
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      
      audio.onerror = (error) => {
        URL.revokeObjectURL(audioUrl);
        reject(error);
      };
      
      audio.play().catch(reject);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Play text sentence by sentence with pauses
 * @param {string} text - The text to play
 * @param {Object} options - Playback options
 * @returns {Promise<void>}
 */
export async function playTextSentenceBySentence(text, options = {}) {
  const {
    voice = 'alloy',
    model = 'tts-1',
    rate = 0.8,
    pauseDuration = 500,
    onSentenceStart = null,
    onSentenceEnd = null,
    onPause = null
  } = options;

  try {
    // Split text into sentences
    const sentences = splitIntoSentences(text);
    
    if (sentences.length === 0) {
      return;
    }

    // Play each sentence with pauses
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      
      // Notify sentence start
      if (onSentenceStart) {
        onSentenceStart(sentence, i);
      }

      // Generate TTS for this sentence
      const audioBlob = await textToSpeech(sentence, voice, model);
      
      // Play with custom rate
      await playAudioWithControls(audioBlob, { rate });
      
      // Notify sentence end
      if (onSentenceEnd) {
        onSentenceEnd(sentence, i);
      }

      // Add pause between sentences (except after the last one)
      if (i < sentences.length - 1) {
        const calculatedPause = calculatePauseDuration(sentence, pauseDuration);
        
        if (onPause) {
          onPause(calculatedPause, i);
        }
        
        await new Promise(resolve => setTimeout(resolve, calculatedPause));
      }
    }
  } catch (error) {
    console.error('Error in sentence-by-sentence playback:', error);
    throw error;
  }
}

/**
 * Convert text to speech and play it with sentence control
 * @param {string} text - The text to convert to speech
 * @param {string} voice - The voice to use
 * @param {string} model - The model to use
 * @param {Object} options - Additional options
 * @returns {Promise<void>}
 */
export async function speakTextWithSentenceControl(text, voice = 'alloy', model = 'tts-1', options = {}) {
  const {
    useSentenceControl = true,
    rate = 0.8,
    pauseDuration = 1000,
    onSentenceStart = null,
    onSentenceEnd = null,
    onPause = null
  } = options;

  try {
    if (useSentenceControl) {
      await playTextSentenceBySentence(text, {
        voice,
        model,
        rate,
        pauseDuration,
        onSentenceStart,
        onSentenceEnd,
        onPause
      });
    } else {
      // Fallback to regular playback
      const audioBlob = await textToSpeech(text, voice, model);
      await playAudioWithControls(audioBlob, { rate });
    }
  } catch (error) {
    console.error('Speak Text Error:', error);
    // Fallback to browser's speech synthesis if OpenAI TTS fails
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = rate;
      window.speechSynthesis.speak(utterance);
    } else {
      throw error;
    }
  }
}

/**
 * Convert text to speech and play it
 * @param {string} text - The text to convert to speech
 * @param {string} voice - The voice to use
 * @param {string} model - The model to use
 * @returns {Promise<void>}
 */
export async function speakText(text, voice = 'alloy', model = 'tts-1') {
  try {
    const audioBlob = await textToSpeech(text, voice, model);
    await playAudioWithControls(audioBlob);
  } catch (error) {
    console.error('Speak Text Error:', error);
    // Fallback to browser's speech synthesis if OpenAI TTS fails
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    } else {
      throw error;
    }
  }
}

/**
 * Get available TTS options from backend
 * @returns {Promise<Object>} - Available voices and models
 */
export async function getTTSOptions() {
  try {
    const response = await axios.get(`${API_BASE_URL}/tts-options`);
    return response.data;
  } catch (error) {
    console.error('Error getting TTS options:', error);
    return {
      voices: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
      models: ['tts-1', 'tts-1-hd']
    };
  }
}
