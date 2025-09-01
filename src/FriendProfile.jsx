import React, { useState, useEffect } from 'react';
import { getFriendProfile, getFriendLinks } from './supabase';
import './FriendProfile.css';

export default function FriendProfile({ friend, currentUser, onBack, onRemoveFriend }) {
  const [friendProfile, setFriendProfile] = useState(null);
  const [friendLinks, setFriendLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // 格式化用户名显示
  const formatUsername = (username, discriminator) => {
    return discriminator ? `${username}#${discriminator}` : username;
  };

  // 加载好友详细信息和链接
  useEffect(() => {
    if (friend?.friend_id) {
      loadFriendData();
    }
  }, [friend]);

  const loadFriendData = async () => {
    try {
      setLoading(true);

      // 获取好友详细资料
      const { data: profileData, error: profileError } = await getFriendProfile(friend.friend_id);
      if (profileError) {
        console.error('获取好友资料失败:', profileError);
        setMessage('加载好友信息失败: ' + profileError.message);
        return;
      }

      // 获取好友的链接
      const { data: linksData, error: linksError } = await getFriendLinks(friend.friend_id);
      if (linksError) {
        console.error('获取好友链接失败:', linksError);
        setMessage('加载好友链接失败: ' + linksError.message);
      }

      setFriendProfile(profileData);
      setFriendLinks(linksData || []);
    } catch (error) {
      console.error('加载好友数据异常:', error);
      setMessage('加载失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!confirm(`确定要删除好友 ${friendProfile?.display_name || friend.username} 吗？`)) {
      return;
    }

    try {
      await onRemoveFriend(friend.friend_id);
      setMessage('好友已删除');
      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (error) {
      setMessage('删除失败: ' + error.message);
    }
  };

  const handleLinkClick = (url) => {
    // 确保链接格式正确
    const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
    window.open(formattedUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="friend-profile-container">
        <div className="friend-profile-wrapper">
          <div className="friend-profile-header">
            <button className="back-button" onClick={onBack}>
              <span className="back-icon">←</span>
            </button>
            <h1 className="friend-profile-title">加载中...</h1>
          </div>
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>正在加载好友信息...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="friend-profile-container">
      <div className="friend-profile-wrapper">
        {/* 消息提示 */}
        {message && (
          <div className={`message-toast ${message.includes('失败') || message.includes('错误') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        {/* 头部导航 */}
        <div className="friend-profile-header">
          <button className="back-button" onClick={onBack}>
            <span className="back-icon">←</span>
          </button>
          <h1 className="friend-profile-title">
            {formatUsername(friendProfile?.username || friend.username, friendProfile?.discriminator || friend.discriminator)}
          </h1>
          <button className="remove-friend-button" onClick={handleRemoveFriend}>
            <span className="remove-icon">🗑️</span>
          </button>
        </div>

        {/* 主要内容 */}
        <div className="friend-profile-content">
          {/* 好友信息卡片 */}
          <div className="friend-info-card">
            {/* 头像容器 */}
            <div className="friend-avatar-container">
              <div className="friend-avatar-wrapper">
                {friendProfile?.avatar_url ? (
                  <img
                    src={friendProfile.avatar_url}
                    alt={friendProfile.display_name}
                    className="friend-avatar-image"
                  />
                ) : (
                  <div className="friend-avatar-fallback">
                    {(friendProfile?.display_name || friend.display_name)?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              {/* 状态指示器 */}
              <div className="friend-status-indicator">
                {friendProfile?.current_status_emoji || '💼'}
              </div>
            </div>

            {/* 基本信息 */}
            <div className="friend-basic-info">
              <h2 className="friend-display-name">
                {friendProfile?.display_name || friend.display_name || '未知用户'}
              </h2>
              <p className="friend-username">
                {formatUsername(friendProfile?.username || friend.username, friendProfile?.discriminator || friend.discriminator)}
              </p>
              {friendProfile?.bio && (
                <p className="friend-bio">{friendProfile.bio}</p>
              )}
            </div>

            {/* 状态显示 */}
            {friendProfile?.current_status_emoji && friendProfile?.current_status_text && (
              <div className="friend-status-display">
                <span className="status-emoji">{friendProfile.current_status_emoji}</span>
                <span className="status-text">{friendProfile.current_status_text}</span>
              </div>
            )}
          </div>

          {/* 社交链接区域 */}
          <div className="friend-links-section">
            <h3 className="links-section-title">社交链接</h3>
            <div className="friend-links-container">
              {friendLinks && friendLinks.length > 0 ? (
                friendLinks.map((link) => (
                  <button
                    key={link.id}
                    className="friend-link-button"
                    onClick={() => handleLinkClick(link.url)}
                  >
                    <span className="link-title">{link.title}</span>
                    <span className="link-arrow">→</span>
                  </button>
                ))
              ) : (
                <div className="no-links-message">
                  <span className="no-links-icon">🔗</span>
                  <p>该用户还没有添加社交链接</p>
                </div>
              )}
            </div>
          </div>

          {/* 底部操作区域 */}
          <div className="friend-actions-section">
            <button className="action-button secondary" onClick={onBack}>
              返回好友列表
            </button>
            <button className="action-button danger" onClick={handleRemoveFriend}>
              删除好友
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}