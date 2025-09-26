// src/components/TopicSelection.js
import React from 'react';
import './TopicSelection.css';

const TOPICS = [
  {
    id: 'animals',
    title: 'Animals',
    icon: '🐶',
    description: 'Learn about pets, farm animals, and wild animals',
    vocabulary: ['dog', 'cat', 'bird', 'fish', 'cow', 'pig', 'lion', 'elephant'],
    ageRange: '6-11'
  },
  {
    id: 'colors',
    title: 'Colors',
    icon: '🌈',
    description: 'Discover all the beautiful colors around us',
    vocabulary: ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black'],
    ageRange: '6-8'
  },
  {
    id: 'family',
    title: 'Family',
    icon: '👨‍👩‍👧‍👦',
    description: 'Meet your family members and relatives',
    vocabulary: ['mother', 'father', 'sister', 'brother', 'grandmother', 'grandfather', 'baby'],
    ageRange: '6-9'
  },
  {
    id: 'food',
    title: 'Food',
    icon: '🍎',
    description: 'Explore delicious foods and drinks',
    vocabulary: ['apple', 'banana', 'bread', 'milk', 'water', 'cake', 'pizza', 'rice'],
    ageRange: '6-11'
  },
  {
    id: 'numbers',
    title: 'Numbers',
    icon: '🔢',
    description: 'Count from 1 to 20 and learn basic math',
    vocabulary: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
    ageRange: '6-8'
  },
  {
    id: 'body',
    title: 'Body Parts',
    icon: '👤',
    description: 'Learn about your body and how to take care of it',
    vocabulary: ['head', 'eyes', 'nose', 'mouth', 'hands', 'feet', 'ears', 'legs'],
    ageRange: '7-10'
  },
  {
    id: 'clothes',
    title: 'Clothes',
    icon: '👕',
    description: 'Dress up and learn about different clothes',
    vocabulary: ['shirt', 'pants', 'dress', 'shoes', 'hat', 'socks', 'jacket', 'skirt'],
    ageRange: '7-11'
  },
  {
    id: 'weather',
    title: 'Weather',
    icon: '☀️',
    description: 'Talk about sunny, rainy, and snowy days',
    vocabulary: ['sunny', 'rainy', 'cloudy', 'windy', 'hot', 'cold', 'warm', 'cool'],
    ageRange: '8-11'
  },
  {
    id: 'school',
    title: 'School',
    icon: '🎒',
    description: 'Learn about school, teachers, and friends',
    vocabulary: ['teacher', 'student', 'book', 'pencil', 'desk', 'chair', 'classroom', 'playground'],
    ageRange: '6-11'
  },
  {
    id: 'toys',
    title: 'Toys',
    icon: '🧸',
    description: 'Play with your favorite toys and games',
    vocabulary: ['doll', 'ball', 'car', 'toy', 'game', 'puzzle', 'blocks', 'teddy bear'],
    ageRange: '6-9'
  }
];

function TopicSelection({ onTopicSelect, selectedAge = 7 }) {
  // Filter topics based on age appropriateness
  const filteredTopics = TOPICS.filter(topic => {
    const [minAge, maxAge] = topic.ageRange.split('-').map(Number);
    return selectedAge >= minAge && selectedAge <= maxAge;
  });

  return (
    <div className="topic-selection-container">
      <div className="topic-selection-header">
        <h2>🎯 Choose Your Learning Topic!</h2>
        <p>Pick a topic you'd like to learn about today. We'll have fun exploring it together!</p>
      </div>
      
      <div className="topics-grid">
        {filteredTopics.map(topic => (
          <div 
            key={topic.id}
            className="topic-card"
            onClick={() => onTopicSelect(topic)}
          >
            <div className="topic-icon">{topic.icon}</div>
            <h3 className="topic-title">{topic.title}</h3>
            <p className="topic-description">{topic.description}</p>
            <div className="topic-vocabulary">
              <span className="vocab-label">Words you'll learn:</span>
              <div className="vocab-words">
                {topic.vocabulary.slice(0, 4).map(word => (
                  <span key={word} className="vocab-word">{word}</span>
                ))}
                {topic.vocabulary.length > 4 && (
                  <span className="vocab-more">+{topic.vocabulary.length - 4} more</span>
                )}
              </div>
            </div>
            <div className="topic-age">Ages {topic.ageRange}</div>
          </div>
        ))}
      </div>
      
      <div className="topic-selection-footer">
        <p>💡 Don't worry! You can change topics anytime during your lesson.</p>
      </div>
    </div>
  );
}

export default TopicSelection;
