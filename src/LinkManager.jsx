import { useState, useEffect } from 'react';
import { database } from './supabase';
import './LinkManager.css';

export default function LinkManager({ user, links, onLinksUpdate, onClose }) {
  const [linkList, setLinkList] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    url: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setLinkList(links || []);
  }, [links]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const resetForm = () => {
    setFormData({ title: '', url: '' });
    setShowAddForm(false);
    setEditingLink(null);
    setMessage('');
  };

  const handleAddLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const newLink = {
        user_id: user.id,
        title: formData.title,
        url: formData.url,
        order_index: linkList.length
      };

      const { data, error } = await database.addLink(newLink);
      
      if (error) {
        setMessage('添加失败: ' + error.message);
      } else {
        const updatedLinks = [...linkList, data[0]];
        setLinkList(updatedLinks);
        if (onLinksUpdate) onLinksUpdate(updatedLinks);
        resetForm();
        setMessage('链接添加成功！');
        setTimeout(() => setMessage(''), 2000);
      }
    } catch (error) {
      setMessage('添加失败: ' + error.message);
    }

    setLoading(false);
  };

  const handleEditLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await database.updateLink(editingLink.id, formData);
      
      if (error) {
        setMessage('更新失败: ' + error.message);
      } else {
        const updatedLinks = linkList.map(link => 
          link.id === editingLink.id ? data[0] : link
        );
        setLinkList(updatedLinks);
        if (onLinksUpdate) onLinksUpdate(updatedLinks);
        resetForm();
        setMessage('链接更新成功！');
        setTimeout(() => setMessage(''), 2000);
      }
    } catch (error) {
      setMessage('更新失败: ' + error.message);
    }

    setLoading(false);
  };

  const handleDeleteLink = async (linkId) => {
    if (!confirm('确定要删除这个链接吗？')) return;

    setLoading(true);
    try {
      const { error } = await database.deleteLink(linkId);
      
      if (error) {
        setMessage('删除失败: ' + error.message);
      } else {
        const updatedLinks = linkList.filter(link => link.id !== linkId);
        setLinkList(updatedLinks);
        if (onLinksUpdate) onLinksUpdate(updatedLinks);
        setMessage('链接删除成功！');
        setTimeout(() => setMessage(''), 2000);
      }
    } catch (error) {
      setMessage('删除失败: ' + error.message);
    }
    setLoading(false);
  };

  const startEdit = (link) => {
    setEditingLink(link);
    setFormData({
      title: link.title,
      url: link.url
    });
    setShowAddForm(true);
  };

  const moveLink = async (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= linkList.length) return;

    const newLinks = [...linkList];
    [newLinks[index], newLinks[newIndex]] = [newLinks[newIndex], newLinks[index]];
    
    // 更新排序索引
    const updatedLinks = newLinks.map((link, idx) => ({
      ...link,
      order_index: idx
    }));

    setLinkList(updatedLinks);
    if (onLinksUpdate) onLinksUpdate(updatedLinks);

    // 批量更新数据库中的排序
    try {
      for (const link of updatedLinks) {
        await database.updateLink(link.id, { order_index: link.order_index });
      }
    } catch (error) {
      console.error('更新排序失败:', error);
    }
  };

  return (
    <div className="link-manager-overlay">
      <div className="link-manager-modal">
        <div className="link-manager-header">
          <h2>链接管理</h2>
          <button onClick={onClose} className="close-button">✕</button>
        </div>

        {message && (
          <div className={`link-message ${message.includes('成功') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        {/* 链接列表 */}
        <div className="links-list">
          {linkList.length > 0 ? (
            linkList.map((link, index) => (
              <div key={link.id} className="link-item">
                <div className="link-info">
                  <div className="link-title">{link.title}</div>
                  <div className="link-url">{link.url}</div>
                </div>
                <div className="link-actions">
                  <button 
                    onClick={() => moveLink(index, 'up')}
                    disabled={index === 0}
                    className="move-button"
                  >
                    ↑
                  </button>
                  <button 
                    onClick={() => moveLink(index, 'down')}
                    disabled={index === linkList.length - 1}
                    className="move-button"
                  >
                    ↓
                  </button>
                  <button 
                    onClick={() => startEdit(link)}
                    className="edit-button"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleDeleteLink(link.id)}
                    className="delete-button"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-links-message">
              <p>还没有添加任何链接</p>
              <p>点击下面的按钮开始添加</p>
            </div>
          )}
        </div>

        {/* 添加链接按钮 */}
        {!showAddForm && (
          <button 
            onClick={() => setShowAddForm(true)}
            className="add-link-button"
          >
            ➕ 添加链接
          </button>
        )}

        {/* 添加/编辑表单 */}
        {showAddForm && (
          <form onSubmit={editingLink ? handleEditLink : handleAddLink} className="link-form">
            <h3>{editingLink ? '编辑链接' : '添加新链接'}</h3>
            
            <div className="form-group">
              <label htmlFor="title">链接标题</label>
              <input
                id="title"
                name="title"
                type="text"
                required
                value={formData.title}
                onChange={handleInputChange}
                placeholder="例如：GitHub"
              />
            </div>

            <div className="form-group">
              <label htmlFor="url">链接地址</label>
              <input
                id="url"
                name="url"
                type="url"
                required
                value={formData.url}
                onChange={handleInputChange}
                placeholder="https://github.com/username"
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={resetForm} className="cancel-button">
                取消
              </button>
              <button type="submit" disabled={loading} className="save-button">
                {loading ? '保存中...' : (editingLink ? '更新' : '添加')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}