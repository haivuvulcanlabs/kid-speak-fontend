// src/pages/ChatPage.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import ChatBubble from '../components/ChatBubble';
import TopicSelection from '../components/TopicSelection';
import UserInfo from '../components/UserInfo';
import { speakText, getTTSOptions, speakTextWithSentenceControl } from '../services/ttsService';
import { splitIntoSentences } from '../utils/sentenceSplitter';
import { API_BASE_URL } from '../config/api';
import './ChatPage.css'; // Tạo file ChatPage.css

function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsOptions, setTtsOptions] = useState({ voices: ['alloy'], models: ['tts-1'] });
  const [selectedVoice, setSelectedVoice] = useState('alloy');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [showUserInfo, setShowUserInfo] = useState(true);
  const [showTopicSelection, setShowTopicSelection] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
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
      
      // Start timeout only after teacher finishes speaking
      resetTimeout();
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
    
    // Start timeout when speech is manually stopped
    resetTimeout();
  };

  // Clear timeout without starting a new one
  const clearUserTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Reset timeout timer
  const resetTimeout = () => {
    lastInteractionRef.current = Date.now();
    clearUserTimeout();
    
    // Only start timeout if teacher is not currently speaking
    if (!isSpeaking) {
      // Set new timeout for 30 seconds
      timeoutRef.current = setTimeout(() => {
        handleAutoPrompt();
      }, 30000); // 30 seconds
    }
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
          userInfo: userInfo
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
      clearUserTimeout();
    };
  }, []);

  // Handle user info submission
  const handleUserInfoSubmit = (info) => {
    setUserInfo(info);
    setShowUserInfo(false);
    setShowTopicSelection(true);
  };

  // Handle topic selection
  const handleTopicSelect = async (topic) => {
    setSelectedTopic(topic);
    setShowTopicSelection(false);
    
    // Start the lesson with the selected topic, using student's name
    const topicGreeting = `Hello ${userInfo.name}! I'm Professor Wise-Owl, your English teacher! Today we're going to learn about ${topic.title.toLowerCase()}! ${topic.description} Let's start by learning some new words. What do you know about ${topic.title.toLowerCase()}, ${userInfo.name}?`;
    
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
    clearUserTimeout();
  };

  const sendMessage = useCallback(async (messageToSend = inputMessage) => {
    if (!messageToSend.trim()) return;
    
    // Block user input when teacher is speaking
    if (isSpeaking) {
      console.log('User input blocked: Teacher is currently speaking');
      return;
    }

    console.log('Sending message:', messageToSend); // Debug log
    const userMessage = { sender: 'user', text: messageToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage(''); // Xóa nội dung input
    
    // Clear timeout when user sends a message (will restart after teacher finishes speaking)
    clearUserTimeout();

    try {
      const response = await axios.post(`${API_BASE_URL}/send-message`, {
        message: messageToSend,
        topic: selectedTopic ? {
          id: selectedTopic.id,
          title: selectedTopic.title,
          vocabulary: selectedTopic.vocabulary,
          description: selectedTopic.description
        } : null,
        userInfo: userInfo
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
        console.log('Speech recognition result:', transcript); // Debug log
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
    // Block speech recognition when teacher is speaking
    if (isSpeaking) {
      console.log('Speech recognition blocked: Teacher is currently speaking');
      return;
    }
    
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
      const currentMessage = e.target.value.trim();
      console.log('Enter pressed, current message:', currentMessage); // Debug log
      if (currentMessage) {
        sendMessage(currentMessage);
      }
    }
  };

  return (
    <div className="chat-page-container">
      <Header />
      
      {showUserInfo ? (
        <UserInfo onUserInfoSubmit={handleUserInfoSubmit} />
      ) : showTopicSelection ? (
        <TopicSelection 
          onTopicSelect={handleTopicSelect}
          selectedAge={userInfo?.age || 7}
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

          {/* Teacher Speaking Indicator */}
          {isSpeaking && (
            <div className="teacher-speaking-indicator">
              <div className="speaking-icon">🎤</div>
              <div className="speaking-text">Teacher is speaking... Please wait</div>
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
              className={`speak-button ${isListening ? 'listening' : ''} ${isSpeaking ? 'blocked' : ''}`}
              onClick={handleSpeakClick}
              disabled={isSpeaking}
              title={isSpeaking ? 'Please wait for teacher to finish speaking' : (isListening ? 'Stop Speaking' : 'Speak')}
            >
              {isSpeaking ? '🔇 Blocked' : (isListening ? '🔴 Stop' : '🎤 Speak')}
            </button>
            <input
              type="text"
              className={`message-input ${isSpeaking ? 'blocked' : ''}`}
              placeholder={isSpeaking ? "Please wait for teacher to finish speaking..." : "Type your answer or ask a question..."}
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value);
                // Stop speech recognition if user starts typing
                if (isListening) {
                  recognitionRef.current.stop();
                  setIsListening(false);
                }
              }}
              onKeyDown={handleKeyDown}
              disabled={isSpeaking}
            />
            <button 
              className={`send-button ${isSpeaking ? 'blocked' : ''}`} 
              onClick={() => sendMessage()}
              disabled={isSpeaking}
              title={isSpeaking ? 'Please wait for teacher to finish speaking' : 'Send message'}
            >
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ChatPage;