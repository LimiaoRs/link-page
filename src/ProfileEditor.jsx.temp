import { useState, useEffect } from 'react';
import { database } from './supabase';
import './ProfileEditor.css';

export default function ProfileEditor({ user, profile, onProfileUpdate, onClose }) {
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    username: '',
    avatar_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        username: profile.username || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile]);

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
      const { data, error } = await database.updateProfile(user.id, formData);
      
      if (error) {
        setMessage('保存失败: ' + error.message);
      } else {
        setMessage('保存成功！');
        if (onProfileUpdate) {
          onProfileUpdate(data[0]);
        }
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (error) {
      setMessage('保存失败: ' + error.message);
    }

    setLoading(false);
  };

  return (
    <div className="profile-editor-overlay">
      <div className="profile-editor-modal">
        <div className="profile-editor-header">
          <h2>编辑个人资料</h2>
          <button onClick={onClose} className="close-button">✕</button>
        </div>

        {message && (
          <div className={`profile-message ${message.includes('成功') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="display_name">显示名称</label>
              <input
                id="display_name"
                name="display_name"
                type="text"
                required
                value={formData.display_name}
                onChange={handleInputChange}
                placeholder="你的显示名称"
              />
            </div>

            <div className="form-group">
              <label htmlFor="username">用户名</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleInputChange}
                placeholder="用于URL的用户名"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="bio">个人简介</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="介绍一下自己..."
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="avatar_url">头像链接</label>
            <input
              id="avatar_url"
              name="avatar_url"
              type="url"
              value={formData.avatar_url}
              onChange={handleInputChange}
              placeholder="https://example.com/avatar.jpg"
            />
            <div className="avatar-preview">
              {formData.avatar_url ? (
                <img src={formData.avatar_url} alt="头像预览" />
              ) : (
                <div className="avatar-placeholder">👤</div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              取消
            </button>
            <button type="submit" disabled={loading} className="save-button">
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}