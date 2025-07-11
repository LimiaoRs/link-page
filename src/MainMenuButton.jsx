// 方案2：将好友和设置功能整合到一个菜单按键中

import { useState, useRef, useEffect } from 'react';
import { useTheme } from './ThemeContext';
import './MainMenuButton.css';

export default function MainMenuButton({ 
  onOpenFriendsManager,
  friendRequestsCount,
  isEditMode, 
  onToggleEditMode, 
  onOpenProfileEditor,
  onOpenLinkManager,
  onLogout 
}) {
  const { isDark } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMenuItemClick = (action) => {
    setShowDropdown(false);
    if (action) action();
  };

  return (
    <div className="main-menu-container" ref={dropdownRef}>
      <button 
        className="main-menu-button"
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label="主菜单"
      >
        <span className="menu-icon">☰</span>
        <span className="menu-label">菜单</span>
        {friendRequestsCount > 0 && (
          <span className="menu-badge">{friendRequestsCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className="menu-dropdown">
          {/* 好友管理 */}
          <div className="dropdown-item" onClick={() => handleMenuItemClick(onOpenFriendsManager)}>
            <span className="item-icon">👥</span>
            <span className="item-text">好友管理</span>
            {friendRequestsCount > 0 && (
              <span className="item-badge">{friendRequestsCount}</span>
            )}
          </div>
          
          <div className="dropdown-divider"></div>
          
          {/* 编辑模式切换 */}
          <div className="dropdown-item" onClick={() => handleMenuItemClick(onToggleEditMode)}>
            <span className="item-icon">{isEditMode ? '👁️' : '✏️'}</span>
            <span className="item-text">
              {isEditMode ? '退出编辑' : '编辑模式'}
            </span>
          </div>
          
          {/* 编辑模式下的选项 */}
          {isEditMode && (
            <>
              <div className="dropdown-item" onClick={() => handleMenuItemClick(onOpenProfileEditor)}>
                <span className="item-icon">👤</span>
                <span className="item-text">编辑资料</span>
              </div>
              
              <div className="dropdown-item" onClick={() => handleMenuItemClick(onOpenLinkManager)}>
                <span className="item-icon">🔗</span>
                <span className="item-text">管理链接</span>
              </div>
              
              <div className="dropdown-divider"></div>
            </>
          )}
          
          {/* 退出登录 */}
          <div className="dropdown-item logout" onClick={() => handleMenuItemClick(onLogout)}>
            <span className="item-icon">🚪</span>
            <span className="item-text">退出登录</span>
          </div>
        </div>
      )}
    </div>
  );
}