// src/components/Header.js
import React from 'react';
import './Header.css'; // Tạo file Header.css cho style này

function Header() {
  return (
    <header className="app-header">
      <h1>KidsSpeak English Tutor</h1>
      {/* Có thể thêm logo, avatar của giáo viên AI */}
    </header>
  );
}

export default Header;