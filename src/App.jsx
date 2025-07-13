import { useState, useEffect } from "react";
import './App.css';
import Auth from './Auth';
import ProfileEditor from './ProfileEditor';
import LinkManager from './LinkManager';
import AvatarUploader from './AvatarUploader';
import FriendsManager from './FriendsManager';
import MainMenuButton from './MainMenuButton'; // 新的主菜单按键
import { supabase, database, getReceivedFriendRequests } from './supabase';
import ThemeToggle from './ThemeToggle';

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [showLinkManager, setShowLinkManager] = useState(false);
  const [showAvatarUploader, setShowAvatarUploader] = useState(false);
  const [showFriendsManager, setShowFriendsManager] = useState(false);
  const [currentStatus, setCurrentStatus] = useState({ emoji: '💼', text: '工作中' });
  const [friendRequestsCount, setFriendRequestsCount] = useState(0);

  // 状态选项
  const statusOptions = [
    { emoji: '💼', text: '工作中' },
    { emoji: '📚', text: '学习中' },
    { emoji: '😴', text: '睡觉中' },
    { emoji: '🎮', text: '游戏中' },
    { emoji: '🏃', text: '运动中' },
    { emoji: '🍕', text: '用餐中' },
    { emoji: '🚗', text: '通勤中' },
    { emoji: '🎵', text: '听音乐' },
    { emoji: '📺', text: '看剧中' },
    { emoji: '☕', text: '休息中' },
    { emoji: '🔥', text: '忙碌中' },
    { emoji: '😊', text: '开心中' },
    { emoji: '💕', text: '恋爱中' },
    { emoji: '🆓', text: '单身中' },
    { emoji: '🎯', text: '专注中' },
    { emoji: '🌟', text: '有空聊' },
  ];

  // 检查用户认证状态
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setUser(user);
          await loadUserData(user);
        }
      } catch (error) {
        console.error('认证检查出错:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // 加载好友请求数量
  const loadFriendRequestsCount = async (userId) => {
    try {
      const { data, error } = await getReceivedFriendRequests(userId);
      if (!error && data) {
        setFriendRequestsCount(data.length);
      }
    } catch (error) {
      console.error('加载好友请求数量失败:', error);
    }
  };

  // 加载用户数据 - 修复版本
const loadUserData = async (currentUser) => {
  console.log('开始加载用户数据，用户ID:', currentUser.id);
  console.log('用户邮箱:', currentUser.email);
  
  try {
    // 加载用户资料
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();
    
    console.log('用户资料查询结果:', { profileData, profileError });
    
    if (profileError) {
      if (profileError.code === 'PGRST116') {
        // 创建新用户资料
        const newProfile = {
          id: currentUser.id,
          username: currentUser.user_metadata?.username || 
                   currentUser.email?.split('@')[0] || 
                   'user_' + currentUser.id.slice(0, 8),
          display_name: currentUser.user_metadata?.display_name || 
                       currentUser.user_metadata?.username ||
                       currentUser.email?.split('@')[0] || 
                       '新用户',
          bio: '这个人很懒，什么都没写...',
          avatar_url: '',
          current_status_emoji: '💼',
          current_status_text: '工作中',
          email: currentUser.email, // 确保保存邮箱
          discriminator: Math.floor(Math.random() * 10000).toString().padStart(4, '0')
        };
        
        console.log('准备创建的新资料:', newProfile);
        
        try {
          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert([newProfile])
            .select()
            .single();
          
          setProfile(createError ? newProfile : createdProfile);
        } catch (error) {
          console.error('创建用户资料异常:', error);
          setProfile(newProfile);
        }
        
        setCurrentStatus({
          emoji: newProfile.current_status_emoji,
          text: newProfile.current_status_text
        });
      } else {
        console.error('获取用户资料时发生其他错误:', profileError);
        // 使用默认资料
        const defaultProfile = {
          id: currentUser.id,
          username: currentUser.email?.split('@')[0] || 'user',
          display_name: currentUser.email?.split('@')[0] || '用户',
          bio: '这个人很懒，什么都没写...',
          avatar_url: '',
          current_status_emoji: '💼',
          current_status_text: '工作中',
          email: currentUser.email // 确保保存邮箱
        };
        setProfile(defaultProfile);
        setCurrentStatus({
          emoji: defaultProfile.current_status_emoji,
          text: defaultProfile.current_status_text
        });
      }
    } else if (profileData) {
      console.log('用户资料加载成功:', profileData);
      
      // 🆕 检查 email 字段是否为空，如果为空则更新
      if (!profileData.email && currentUser.email) {
        console.log('发现邮箱字段为空，正在更新...');
        try {
          const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update({ email: currentUser.email })
            .eq('id', currentUser.id)
            .select()
            .single();
          
          if (!updateError) {
            console.log('邮箱字段更新成功');
            setProfile(updatedProfile);
          } else {
            console.error('邮箱字段更新失败:', updateError);
            setProfile({ ...profileData, email: currentUser.email });
          }
        } catch (error) {
          console.error('更新邮箱字段异常:', error);
          setProfile({ ...profileData, email: currentUser.email });
        }
      } else {
        setProfile(profileData);
      }
      
      setCurrentStatus({
        emoji: profileData.current_status_emoji || '💼',
        text: profileData.current_status_text || '工作中'
      });
    }

    // 加载用户链接
    const { data: linksData } = await supabase
      .from('links')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('order_index');
    
    setLinks(linksData || []);

    // 加载好友请求数量
    await loadFriendRequestsCount(currentUser.id);

  } catch (error) {
    console.error('加载用户数据失败:', error);
  }
};

  // 处理登录成功
  const handleAuthSuccess = (user) => {
    setUser(user);
    loadUserData(user);
  };

  // 处理登出
  const handleLogout = async () => {
    if (!confirm('确定要退出登录吗？')) return;
    
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setLinks([]);
      setCurrentStatus({ emoji: '💼', text: '工作中' });
      setFriendRequestsCount(0);
      setIsEditMode(false);
      setShowProfileEditor(false);
      setShowLinkManager(false);
      setShowAvatarUploader(false);
      setShowFriendsManager(false);
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  // 切换编辑模式
  const toggleEditMode = () => {
    const newEditMode = !isEditMode;
    setIsEditMode(newEditMode);
    
    if (!newEditMode) {
      setShowProfileEditor(false);
      setShowLinkManager(false);
      setShowAvatarUploader(false);
      setShowFriendsManager(false);
    }
  };

  // 打开好友管理器
  const handleOpenFriendsManager = () => {
    setShowFriendsManager(true);
    if (user) {
      loadFriendRequestsCount(user.id);
    }
  };

  // 选择状态
  const selectStatus = async (emoji, text) => {
    const newStatus = { emoji, text };
    setCurrentStatus(newStatus);
    
    if (user && profile) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .update({
            current_status_emoji: emoji,
            current_status_text: text
          })
          .eq('id', user.id)
          .select();
        
        if (!error) {
          setProfile(prev => ({
            ...prev,
            current_status_emoji: emoji,
            current_status_text: text
          }));
        }
      } catch (error) {
        console.error('更新状态失败:', error);
      }
    }
  };

  // 处理资料更新
  const handleProfileUpdate = (updatedProfile) => {
    setProfile(updatedProfile);
    setCurrentStatus({
      emoji: updatedProfile.current_status_emoji || '💼',
      text: updatedProfile.current_status_text || '工作中'
    });
  };

  // 处理链接更新
  const handleLinksUpdate = (updatedLinks) => {
    setLinks(updatedLinks);
  };

  // 处理头像更新
  const handleAvatarUpdate = (newAvatarUrl) => {
    setProfile(prev => ({ ...prev, avatar_url: newAvatarUrl }));
  };

  // 加载中状态
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-text">加载中...</div>
      </div>
    );
  }

  // 未登录显示认证界面
  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  // 已登录显示个人页面
  return (
    <div className="main-container">
      {/* MyPage 品牌标识 */}
      <div className="brand-header">
        <div className="brand-logo">
          <span className="brand-icon">🔗</span>
          <span className="brand-name">MyPage</span>
        </div>
      </div>

      {/* 右侧按键区域 - 简洁版（只有两个按键）*/}
      <ThemeToggle />
      <MainMenuButton 
        onOpenFriendsManager={handleOpenFriendsManager}
        friendRequestsCount={friendRequestsCount}
        isEditMode={isEditMode}
        onToggleEditMode={toggleEditMode}
        onOpenProfileEditor={() => setShowProfileEditor(true)}
        onOpenLinkManager={() => setShowLinkManager(true)}
        onLogout={handleLogout}
      />

      <div className="content-card">
        {/* 编辑模式提示 */}
        {isEditMode && (
          <div className="edit-mode">
            <div className="edit-mode-text">
              编辑模式已开启 - 点击状态选项来更改你的当前状态
            </div>
          </div>
        )}

        {/* 头像部分 */}
        <div className="avatar-container">
          <div 
            className="avatar-clickable"
            onClick={() => isEditMode && setShowAvatarUploader(true)}
            style={{ cursor: isEditMode ? 'pointer' : 'default' }}
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="头像"
                className="avatar-image"
              />
            ) : (
              <div className="avatar-fallback">👤</div>
            )}
            {isEditMode && (
              <div className="avatar-upload-hint">
                📸 点击更换头像
              </div>
            )}
          </div>
          <div className="status-indicator">{currentStatus.emoji}</div>
        </div>

        <h1 className="user-name">{profile?.display_name || '新用户'}</h1>
        <p className="user-bio">{profile?.bio || '这个人很懒，什么都没写...'}</p>

        {/* 状态显示 */}
        <div className="status-display">
          <span className="status-emoji">{currentStatus.emoji}</span>
          <span className="status-text">{currentStatus.text}</span>
        </div>

        {/* 状态选择器 */}
        {isEditMode && (
          <div className="status-selector">
            <h3>选择你的状态</h3>
            <div className="status-options">
              {statusOptions.map((status, index) => (
                <div
                  key={index}
                  className={`status-option ${
                    currentStatus.emoji === status.emoji ? 'active' : ''
                  }`}
                  onClick={() => selectStatus(status.emoji, status.text)}
                >
                  <span>{status.emoji}</span>
                  <span>{status.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 链接部分 */}
        <div className="links-container">
          {links && links.length > 0 ? (
            links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="link-button"
                style={{
                  display: 'block',
                  padding: '16px 24px',
                  margin: '12px auto',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  textAlign: 'center',
                  width: '80%',
                  maxWidth: '300px',
                  transition: 'all 0.3s ease',
                  border: 'none'
                }}
              >
                {link.title}
              </a>
            ))
          ) : (
            <div className="no-links">
              <p>还没有添加链接</p>
              {isEditMode ? (
                <p>在菜单中点击"管理链接"开始添加</p>
              ) : (
                <p>点击菜单按钮开始编辑</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 弹窗组件 */}
      {showProfileEditor && (
        <ProfileEditor
          user={user}
          profile={profile}
          onProfileUpdate={handleProfileUpdate}
          onClose={() => setShowProfileEditor(false)}
        />
      )}

      {showLinkManager && (
        <LinkManager
          user={user}
          links={links}
          onLinksUpdate={handleLinksUpdate}
          onClose={() => setShowLinkManager(false)}
        />
      )}

      {showAvatarUploader && (
        <AvatarUploader
          user={user}
          currentAvatarUrl={profile?.avatar_url}
          onAvatarUpdate={handleAvatarUpdate}
          onClose={() => setShowAvatarUploader(false)}
        />
      )}

      {showFriendsManager && (
        <FriendsManager
          user={user}
          profile={profile}
          onClose={() => {
            setShowFriendsManager(false);
            if (user) {
              loadFriendRequestsCount(user.id);
            }
          }}
        />
      )}
    </div>
  );
}