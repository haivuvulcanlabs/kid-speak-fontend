// src/components/ChatBubble.js
import React from 'react';
import './ChatBubble.css'; // Tạo file ChatBubble.css

function ChatBubble({ sender, message, onSpeak, isSpeaking }) {
  const isUser = sender === 'user';
  const isAI = sender === 'ai';
  
  return (
    <div className={`chat-bubble-wrapper ${isUser ? 'user' : 'ai'}`}>
      <div className="chat-bubble">
        {message}
        {isAI && onSpeak && (
          <button 
            className={`speak-message-button ${isSpeaking ? 'speaking' : ''}`}
            onClick={onSpeak}
            disabled={isSpeaking}
            title={isSpeaking ? 'Speaking...' : 'Listen to this message'}
          >
            {isSpeaking ? '🔊' : '🔈'}
          </button>
        )}
      </div>
    </div>
  );
}

export default ChatBubble;