// src/pages/ChatPage.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import ChatBubble from '../components/ChatBubble';
import TopicSelection from '../components/TopicSelection';
import { speakText, getTTSOptions, speakTextWithSentenceControl } from '../services/ttsService';
import { splitIntoSentences } from '../utils/sentenceSplitter';
import './ChatPage.css'; // Tạo file ChatPage.css

const API_BASE_URL = 'http://localhost:5000/api/chat'; // Địa chỉ backend

function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsOptions, setTtsOptions] = useState({ voices: ['alloy'], models: ['tts-1'] });
  const [selectedVoice, setSelectedVoice] = useState('alloy');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [showTopicSelection, setShowTopicSelection] = useState(true);
  const [speechRate, setSpeechRate] = useState(0.8);
  const [currentSentence, setCurrentSentence] = useState('');
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [totalSentences, setTotalSentences] = useState(0);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const currentAudioRef = useRef(null);
  const timeoutRef = useRef(null);
  const lastInteractionRef = useRef(Date.now());

  // Load TTS options on component mount
  useEffect(() => {
    const loadTTSOptions = async () => {
      try {
        const options = await getTTSOptions();
        setTtsOptions(options);
      } catch (error) {
        console.error('Failed to load TTS options:', error);
      }
    };
    loadTTSOptions();
  }, []);

  // Enhanced speak function with OpenAI TTS and sentence control
  const speakTextWithTTS = async (text) => {
    try {
      setIsSpeaking(true);
      setCurrentSentence('');
      setSentenceIndex(0);
      
      // Calculate total sentences for progress display
      const sentences = splitIntoSentences(text);
      setTotalSentences(sentences.length);
      
      await speakTextWithSentenceControl(text, selectedVoice, 'tts-1', {
        rate: speechRate,
        pauseDuration: 1200, // 1.2 seconds pause between sentences
        onSentenceStart: (sentence, index) => {
          setCurrentSentence(sentence);
          setSentenceIndex(index);
        },
        onSentenceEnd: (sentence, index) => {
          // Sentence completed
        },
        onPause: (duration, index) => {
          // Show pause indicator
          setCurrentSentence('⏸️ Pausing...');
        }
      });
    } catch (error) {
      console.error('TTS Error:', error);
      // Fallback to browser speech synthesis
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = speechRate;
        window.speechSynthesis.speak(utterance);
      }
    } finally {
      setIsSpeaking(false);
      setCurrentSentence('');
      setSentenceIndex(0);
      setTotalSentences(0);
    }
  };

  // Stop current speech
  const stopSpeaking = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Reset timeout timer
  const resetTimeout = () => {
    lastInteractionRef.current = Date.now();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // Set new timeout for 30 seconds
    timeoutRef.current = setTimeout(() => {
      handleAutoPrompt();
    }, 30000); // 30 seconds
  };

  // Handle auto-prompt when student doesn't respond
  const handleAutoPrompt = async () => {
    try {
      // Check if the last message was from AI (teacher)
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.sender === 'ai') {
        // Send a special message to trigger teacher's re-engagement
        const response = await axios.post(`${API_BASE_URL}/send-message`, {
          message: "[AUTO_PROMPT] The student hasn't responded for 30 seconds. Please re-engage them with an encouraging question or suggest a new activity to continue the lesson.",
        });
        const aiResponseText = response.data.response;
        const aiMessage = { sender: 'ai', text: aiResponseText };
        setMessages((prev) => [...prev, aiMessage]);
        speakTextWithTTS(aiResponseText);
        resetTimeout(); // Reset timeout for next interaction
      }
    } catch (error) {
      console.error('Error in auto-prompt:', error);
    }
  };

  // Clear timeout on component unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Handle topic selection
  const handleTopicSelect = async (topic) => {
    setSelectedTopic(topic);
    setShowTopicSelection(false);
    
    // Start the lesson with the selected topic
    const topicGreeting = `Hello! I'm Professor Wise-Owl, your English teacher! Today we're going to learn about ${topic.title.toLowerCase()}! ${topic.description} Let's start by learning some new words. What do you know about ${topic.title.toLowerCase()}?`;
    
    setMessages([{ sender: 'ai', text: topicGreeting }]);
    speakTextWithTTS(topicGreeting);
    
    // Start timeout after topic greeting
    setTimeout(() => {
      resetTimeout();
    }, 1000);
  };

  // Handle changing topic
  const handleChangeTopic = () => {
    setShowTopicSelection(true);
    setSelectedTopic(null);
    setMessages([]);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const sendMessage = useCallback(async (messageToSend = inputMessage) => {
    if (!messageToSend.trim()) return;

    const userMessage = { sender: 'user', text: messageToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage(''); // Xóa nội dung input
    
    // Reset timeout when user sends a message
    resetTimeout();

    try {
      const response = await axios.post(`${API_BASE_URL}/send-message`, {
        message: messageToSend,
        topic: selectedTopic ? {
          id: selectedTopic.id,
          title: selectedTopic.title,
          vocabulary: selectedTopic.vocabulary,
          description: selectedTopic.description
        } : null
      });
      const aiResponseText = response.data.response;
      const aiMessage = { sender: 'ai', text: aiResponseText };
      setMessages((prev) => [...prev, aiMessage]);
      speakTextWithTTS(aiResponseText); // Đọc to phản hồi của AI với OpenAI TTS
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [...prev, { sender: 'ai', text: 'Oops! Something went wrong. Please try again.' }]);
    }
  }, [inputMessage]);

  // Cuộn xuống cuối tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Khởi tạo SpeechRecognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; // Ngừng nghe sau khi phát hiện một câu nói
      recognitionRef.current.interimResults = false; // Chỉ trả về kết quả cuối cùng
      recognitionRef.current.lang = 'en-US'; // Ngôn ngữ tiếng Anh

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript); // Đặt transcript vào ô input
        sendMessage(transcript); // Gửi tin nhắn sau khi nhận dạng
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      console.warn('Speech Recognition API not supported in this browser.');
      // Có thể hiển thị thông báo cho người dùng
    }
  }, [sendMessage]);

  const handleSpeakClick = () => {
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInputMessage('Listening...'); // Hiển thị trạng thái đang nghe
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Ngăn xuống dòng trong textarea nếu có
      sendMessage();
    }
  };

  return (
    <div className="chat-page-container">
      <Header />
      
      {showTopicSelection ? (
        <TopicSelection 
          onTopicSelect={handleTopicSelect}
          selectedAge={7}
        />
      ) : (
        <>
          {/* Topic Info and Controls */}
          <div className="topic-info-bar">
            <div className="current-topic">
              <span className="topic-icon">{selectedTopic?.icon}</span>
              <span className="topic-title">Learning: {selectedTopic?.title}</span>
            </div>
            <button 
              className="change-topic-button"
              onClick={handleChangeTopic}
              title="Change Topic"
            >
              🔄 Change Topic
            </button>
          </div>

          {/* TTS Controls */}
          <div className="tts-controls">
            <div className="voice-selector">
              <label htmlFor="voice-select">Voice:</label>
              <select 
                id="voice-select"
                value={selectedVoice} 
                onChange={(e) => setSelectedVoice(e.target.value)}
                disabled={isSpeaking}
              >
                {ttsOptions.voices.map(voice => (
                  <option key={voice} value={voice}>
                    {voice.charAt(0).toUpperCase() + voice.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="speech-rate-control">
              <label htmlFor="rate-slider">Speed:</label>
              <input
                id="rate-slider"
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                disabled={isSpeaking}
                className="rate-slider"
              />
              <span className="rate-value">{speechRate.toFixed(1)}x</span>
            </div>
            
            <button
              className={`stop-speech-button ${isSpeaking ? 'speaking' : ''}`}
              onClick={stopSpeaking}
              disabled={!isSpeaking}
              title="Stop Speech"
            >
              {isSpeaking ? '🔇 Stop Speech' : '🔊 Speech'}
            </button>
          </div>

          {/* Current Sentence Display */}
          {isSpeaking && currentSentence && (
            <div className="current-sentence-display">
              <div className="sentence-progress">
                <span className="sentence-counter">
                  {sentenceIndex + 1} / {totalSentences || '?'}
                </span>
              </div>
              <div className="current-sentence-text">
                {currentSentence}
              </div>
            </div>
          )}

          <div className="chat-area">
            {messages.map((msg, index) => (
              <ChatBubble 
                key={index} 
                sender={msg.sender} 
                message={msg.text}
                onSpeak={() => msg.sender === 'ai' && speakTextWithTTS(msg.text)}
                isSpeaking={isSpeaking && msg.sender === 'ai'}
              />
            ))}
            <div ref={messagesEndRef} /> {/* Dùng để cuộn */}
          </div>
          <div className="chat-input-area">
            <button
              className={`speak-button ${isListening ? 'listening' : ''}`}
              onClick={handleSpeakClick}
              title={isListening ? 'Stop Speaking' : 'Speak'}
            >
              {isListening ? '🔴 Stop' : '🎤 Speak'}
            </button>
            <input
              type="text"
              className="message-input"
              placeholder="Type your answer or ask a question..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className="send-button" onClick={() => sendMessage()}>
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ChatPage;