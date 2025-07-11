import React, { useState, useEffect } from 'react';
import { 
  searchUsers, 
  sendFriendRequest, 
  getReceivedFriendRequests, 
  getSentFriendRequests,
  handleFriendRequest,
  getFriends,
  removeFriend,
  getFriendshipStatus 
} from './supabase';
import './FriendsManager.css';

export default function FriendsManager({ user, onClose }) {
  const [activeTab, setActiveTab] = useState('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 格式化用户名显示
  const formatUsername = (username, discriminator) => {
    return discriminator ? `${username}#${discriminator}` : username;
  };

  // 加载数据
  useEffect(() => {
    if (user) {
      loadFriends();
      loadFriendRequests();
    }
  }, [user]);

  const loadFriends = async () => {
    try {
      console.log('加载好友列表...');
      const { data, error } = await getFriends(user.id);
      if (error) {
        console.error('加载好友失败:', error);
        throw error;
      }
      console.log('好友列表加载成功:', data);
      setFriends(data || []);
    } catch (error) {
      console.error('加载好友列表失败:', error);
      setMessage('加载好友列表失败: ' + error.message);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const loadFriendRequests = async () => {
    try {
      console.log('加载好友请求...');
      const [receivedResult, sentResult] = await Promise.all([
        getReceivedFriendRequests(user.id),
        getSentFriendRequests(user.id)
      ]);
      
      if (receivedResult.error) {
        console.error('加载收到的好友请求失败:', receivedResult.error);
        throw receivedResult.error;
      }
      if (sentResult.error) {
        console.error('加载发送的好友请求失败:', sentResult.error);
        throw sentResult.error;
      }
      
      console.log('收到的好友请求:', receivedResult.data);
      console.log('发送的好友请求:', sentResult.data);
      
      setReceivedRequests(receivedResult.data || []);
      setSentRequests(sentResult.data || []);
    } catch (error) {
      console.error('加载好友请求失败:', error);
      setMessage('加载好友请求失败: ' + error.message);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      console.log('搜索用户:', searchQuery);
      const { data, error } = await searchUsers(searchQuery);
      
      if (error) {
        console.error('搜索失败:', error);
        setMessage(error.message || '搜索失败，请重试');
        setSearchResults([]);
        setTimeout(() => setMessage(''), 3000);
        return;
      }
      
      console.log('搜索结果:', data);
      
      // 过滤掉自己
      const filteredResults = data.filter(u => u.id !== user.id);
      
      // 为每个用户获取好友关系状态
      const resultsWithStatus = await Promise.all(
        filteredResults.map(async (searchUser) => {
          const status = await getFriendshipStatus(user.id, searchUser.id);
          return { ...searchUser, friendshipStatus: status };
        })
      );
      
      setSearchResults(resultsWithStatus);
      
      if (resultsWithStatus.length === 0) {
        setMessage('未找到符合条件的用户');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('搜索用户失败:', error);
      setMessage('搜索失败，请重试');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async (receiverId) => {
    try {
      console.log('发送好友请求给:', receiverId);
      const { error } = await sendFriendRequest(user.id, receiverId);
      if (error) {
        console.error('发送好友请求失败:', error);
        throw error;
      }
      
      setMessage('好友请求已发送！');
      setTimeout(() => setMessage(''), 3000);
      
      // 重新搜索以更新状态
      handleSearch();
      loadFriendRequests();
    } catch (error) {
      console.error('发送好友请求失败:', error);
      setMessage(error.message || '发送失败，请重试');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      console.log('接受好友请求:', requestId);
      const { error } = await handleFriendRequest(requestId, 'accept');
      if (error) {
        console.error('接受好友请求失败:', error);
        throw error;
      }
      
      setMessage('已接受好友请求！');
      setTimeout(() => setMessage(''), 3000);
      
      // 重新加载数据
      loadFriends();
      loadFriendRequests();
    } catch (error) {
      console.error('接受好友请求失败:', error);
      setMessage('操作失败: ' + error.message);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      console.log('拒绝好友请求:', requestId);
      const { error } = await handleFriendRequest(requestId, 'reject');
      if (error) {
        console.error('拒绝好友请求失败:', error);
        throw error;
      }
      
      setMessage('已拒绝好友请求');
      setTimeout(() => setMessage(''), 3000);
      
      loadFriendRequests();
    } catch (error) {
      console.error('拒绝好友请求失败:', error);
      setMessage('操作失败: ' + error.message);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!confirm('确定要删除这个好友吗？')) return;
    
    try {
      console.log('删除好友:', friendId);
      const { error } = await removeFriend(user.id, friendId);
      if (error) {
        console.error('删除好友失败:', error);
        throw error;
      }
      
      setMessage('已删除好友');
      setTimeout(() => setMessage(''), 3000);
      
      loadFriends();
    } catch (error) {
      console.error('删除好友失败:', error);
      setMessage('操作失败: ' + error.message);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const renderSearchResults = () => (
    <div className="search-results">
      {searchResults.length === 0 && searchQuery.trim() !== '' && !loading && (
        <div className="empty-message">
          {searchQuery.includes('#') || searchQuery.includes('@') ? 
            `未找到用户 "${searchQuery}"` : 
            `请输入正确格式：用户名#1234 或 邮箱地址`
          }
        </div>
      )}
      {searchResults.map(searchUser => (
        <div key={searchUser.id} className="user-card">
          <div className="user-info">
            <div className="user-avatar">
              {searchUser.avatar_url ? (
                <img src={searchUser.avatar_url} alt={formatUsername(searchUser.username, searchUser.discriminator)} />
              ) : (
                <div className="avatar-placeholder">
                  {searchUser.username?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <div className="user-details">
              <h4>{formatUsername(searchUser.username, searchUser.discriminator)}</h4>
              <p className="display-name">{searchUser.display_name}</p>
              {searchUser.bio && <p className="user-bio">{searchUser.bio}</p>}
            </div>
          </div>
          <div className="user-actions">
            {searchUser.friendshipStatus.status === 'none' && (
              <button 
                className="btn btn-primary"
                onClick={() => handleSendFriendRequest(searchUser.id)}
              >
                添加好友
              </button>
            )}
            {searchUser.friendshipStatus.status === 'friends' && (
              <span className="status-badge friends">已是好友</span>
            )}
            {searchUser.friendshipStatus.status === 'request_sent' && (
              <span className="status-badge pending">请求已发送</span>
            )}
            {searchUser.friendshipStatus.status === 'request_received' && (
              <span className="status-badge received">收到请求</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderFriendsList = () => (
    <div className="friends-list">
      {friends.length === 0 ? (
        <div className="empty-state">
          <p>还没有好友呢～</p>
          <p>去搜索一些用户添加为好友吧！</p>
        </div>
      ) : (
        friends.map(friend => (
          <div key={friend.friend_id} className="friend-card">
            <div className="user-info">
              <div className="user-avatar">
                {friend.avatar_url ? (
                  <img src={friend.avatar_url} alt={formatUsername(friend.username, friend.discriminator)} />
                ) : (
                  <div className="avatar-placeholder">
                    {friend.username?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <div className="user-details">
                <h4>{formatUsername(friend.username, friend.discriminator)}</h4>
                <p className="display-name">{friend.display_name}</p>
                {friend.bio && <p className="user-bio">{friend.bio}</p>}
              </div>
            </div>
            <div className="friend-actions">
              <button 
                className="btn btn-outline"
                onClick={() => window.open(`/${friend.username}`, '_blank')}
              >
                查看页面
              </button>
              <button 
                className="btn btn-danger"
                onClick={() => handleRemoveFriend(friend.friend_id)}
              >
                删除好友
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderFriendRequests = () => (
    <div className="friend-requests">
      <div className="requests-section">
        <h3>收到的好友请求 ({receivedRequests.length})</h3>
        {receivedRequests.length === 0 ? (
          <p className="empty-message">暂无收到的好友请求</p>
        ) : (
          receivedRequests.map(request => (
            <div key={request.id} className="request-card">
              <div className="user-info">
                <div className="user-avatar">
                  {request.sender?.avatar_url ? (
                    <img src={request.sender.avatar_url} alt={formatUsername(request.sender.username, request.sender.discriminator)} />
                  ) : (
                    <div className="avatar-placeholder">
                      {request.sender?.username?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <div className="user-details">
                  <h4>{formatUsername(request.sender?.username, request.sender?.discriminator)}</h4>
                  <p className="display-name">{request.sender?.display_name}</p>
                  <p className="request-time">
                    {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="request-actions">
                <button 
                  className="btn btn-success"
                  onClick={() => handleAcceptRequest(request.id)}
                >
                  接受
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={() => handleRejectRequest(request.id)}
                >
                  拒绝
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="requests-section">
        <h3>发送的好友请求 ({sentRequests.length})</h3>
        {sentRequests.length === 0 ? (
          <p className="empty-message">暂无发送的好友请求</p>
        ) : (
          sentRequests.map(request => (
            <div key={request.id} className="request-card">
              <div className="user-info">
                <div className="user-avatar">
                  {request.receiver?.avatar_url ? (
                    <img src={request.receiver.avatar_url} alt={formatUsername(request.receiver.username, request.receiver.discriminator)} />
                  ) : (
                    <div className="avatar-placeholder">
                      {request.receiver?.username?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <div className="user-details">
                  <h4>{formatUsername(request.receiver?.username, request.receiver?.discriminator)}</h4>
                  <p className="display-name">{request.receiver?.display_name}</p>
                  <p className="request-time">
                    {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="request-status">
                <span className="status-badge pending">等待回应</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="friends-manager-overlay">
      <div className="friends-manager">
        <div className="friends-header">
          <h2>好友管理</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {message && (
          <div className={`message-toast ${message.includes('失败') || message.includes('错误') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <div className="friends-tabs">
          <button 
            className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            搜索用户
          </button>
          <button 
            className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            我的好友 ({friends.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            好友请求 ({receivedRequests.length + sentRequests.length})
          </button>
        </div>

        <div className="friends-content">
          {activeTab === 'search' && (
            <div className="search-section">
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="搜索用户: chenziyang#1234 或 email@example.com"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button 
                  className="search-btn"
                  onClick={handleSearch}
                  disabled={loading}
                >
                  {loading ? '搜索中...' : '搜索'}
                </button>
              </div>
              {renderSearchResults()}
            </div>
          )}

          {activeTab === 'friends' && renderFriendsList()}
          {activeTab === 'requests' && renderFriendRequests()}
        </div>
      </div>
    </div>
  );
}