import { useState } from 'react';
import { auth, signUp } from './supabase'; // 导入自定义的 signUp 函数
import { useTheme } from './ThemeContext';
import ThemeToggle from './ThemeToggle';
import './Auth.css';

export default function Auth({ onAuthSuccess }) {
  const { theme, isDark } = useTheme();
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    displayName: ''
  });
  const [message, setMessage] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isLogin) {
        // 登录
        console.log('尝试登录...');
        const { data, error } = await auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });
        
        if (error) {
          console.error('登录失败:', error);
          setMessage('登录失败: ' + error.message);
        } else {
          console.log('登录成功:', data);
          setMessage('登录成功！');
          if (onAuthSuccess) onAuthSuccess(data.user);
        }
      } else {
        // 注册 - 使用自定义的 signUp 函数
        console.log('尝试注册...', {
          email: formData.email,
          username: formData.username,
          displayName: formData.displayName
        });
        
        const { data, error } = await signUp(
          formData.email,
          formData.password,
          formData.username,
          formData.displayName
        );
        
        if (error) {
          console.error('注册失败:', error);
          setMessage('注册失败: ' + error.message);
        } else {
          console.log('注册成功:', data);
          setMessage('注册成功！请查收邮件验证后登录');
          // 注册成功后切换到登录模式
          setIsLogin(true);
          setFormData({
            email: formData.email, // 保留邮箱
            password: '',
            username: '',
            displayName: ''
          });
        }
      }
    } catch (error) {
      console.error('操作异常:', error);
      setMessage('操作失败: ' + error.message);
    }

    setLoading(false);
  };

  return (
    <div className={`auth-container ${isDark ? 'dark-theme' : 'light-theme'}`}>
      {/* 主题切换按钮 */}
      <div style={{ 
        position: 'fixed', 
        top: '20px', 
        right: '20px', 
        zIndex: 1001 
      }}>
        <ThemeToggle />
      </div>

      {/* 背景动画 */}
      <div className="background-animation">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      {/* 主要内容 */}
      <div className="auth-content">
        {/* 品牌标识 */}
        <div className="brand-section">
          <div className="brand-icon">🔗</div>
          <h1 className="brand-title">MyPage</h1>
          <p className="brand-subtitle">Create your unique digital presence</p>
        </div>

        {/* 主标题 */}
        <div className="hero-section">
          <h2 className="hero-title">
            {isLogin ? (
              <>
                Welcome back to<br />
                <span className="gradient-text">your digital</span><br />
                <span className="gradient-text">identity</span>
              </>
            ) : (
              <>
                Create your<br />
                <span className="gradient-text">personal</span><br />
                <span className="gradient-text">link hub</span>
              </>
            )}
          </h2>
          <p className="hero-description">
            {isLogin 
              ? "Sign in to manage your links and connect with the world"
              : "Join thousands who share their story through a single link"
            }
          </p>
        </div>

        {/* 认证卡片 */}
        <div className="auth-card">
          {/* 标签切换 */}
          <div className="auth-tabs">
            <button 
              className={`auth-tab ${isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(true)}
            >
              Sign In
            </button>
            <button 
              className={`auth-tab ${!isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(false)}
            >
              Sign Up
            </button>
          </div>

          {message && (
            <div className={`auth-message ${message.includes('成功') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                minLength="6"
              />
            </div>

            {!isLogin && (
              <>
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="例如: chenziyang (会自动生成 #1234)"
                  />
                  <small style={{ 
                    color: 'var(--text-secondary)', 
                    fontSize: '12px',
                    marginTop: '4px',
                    display: 'block'
                  }}>
                    系统会自动为你生成一个4位数字后缀，避免用户名重复
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="displayName">Display Name</label>
                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    required
                    value={formData.displayName}
                    onChange={handleInputChange}
                    placeholder="例如: 陈子阳"
                  />
                  <small style={{ 
                    color: 'var(--text-secondary)', 
                    fontSize: '12px',
                    marginTop: '4px',
                    display: 'block'
                  }}>
                    这是显示在你页面上的名称
                  </small>
                </div>
              </>
            )}

            <button type="submit" disabled={loading} className="auth-button">
              <span className="button-text">
                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
              </span>
              <div className="button-bg"></div>
            </button>
          </form>

          <div className="auth-footer">
            <p>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setMessage('');
                  setFormData({
                    email: '',
                    password: '',
                    username: '',
                    displayName: ''
                  });
                }}
                className="switch-button"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* 装饰元素 */}
      <div className="decorative-elements">
        <div className="floating-element element-1">✨</div>
        <div className="floating-element element-2">🌟</div>
        <div className="floating-element element-3">💫</div>
      </div>
    </div>
  );
}