// FriendsButton.jsx - 好友按键组件
import { useState } from 'react';
import { useTheme } from './ThemeContext';
import './FriendsButton.css';

export default function FriendsButton({ onClick, friendRequestsCount = 0 }) {
  const { isDark } = useTheme();

  return (
    <button
      className="friends-button"
      onClick={onClick}
      aria-label="好友管理"
    >
      <div className="friends-content">
        <span className="friends-icon">👥</span>
        <span className="friends-label">好友</span>
        {friendRequestsCount > 0 && (
          <span className="friends-badge">{friendRequestsCount}</span>
        )}
      </div>
    </button>
  );
}