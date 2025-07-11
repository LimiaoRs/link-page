// SettingsButton.jsx - 设置按键组件
import { useState, useRef, useEffect } from 'react';
import { useTheme } from './ThemeContext';
import './SettingsButton.css';

export default function SettingsButton({ 
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
    <div className="settings-button-container" ref={dropdownRef}>
      <button 
        className="settings-button"
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label="设置菜单"
      >
        <span className="settings-icon">⚙️</span>
        <span className="settings-label">设置</span>
      </button>

      {showDropdown && (
        <div className="settings-dropdown">
          <div className="dropdown-item" onClick={() => handleMenuItemClick(onToggleEditMode)}>
            <span className="item-icon">{isEditMode ? '👁️' : '✏️'}</span>
            <span className="item-text">
              {isEditMode ? '退出编辑' : '编辑模式'}
            </span>
          </div>
          
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
          
          <div className="dropdown-item logout" onClick={() => handleMenuItemClick(onLogout)}>
            <span className="item-icon">🚪</span>
            <span className="item-text">退出登录</span>
          </div>
        </div>
      )}
    </div>
  );
}