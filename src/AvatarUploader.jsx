import { useState, useRef } from 'react';
import { supabase } from './supabase';
import './AvatarUploader.css';

export default function AvatarUploader({ user, currentAvatarUrl, onAvatarUpdate, onClose }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  // 处理文件选择
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      setMessage('请选择图片文件！');
      return;
    }

    // 检查文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('图片大小不能超过5MB！');
      return;
    }

    setSelectedFile(file);
    setMessage('');

    // 创建预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // 压缩图片
  const compressImage = (file, maxWidth = 400, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // 计算新尺寸（保持宽高比）
        let { width, height } = img;
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width = (width * maxWidth) / height;
            height = maxWidth;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // 绘制并压缩
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // 上传头像
  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('请先选择图片！');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      console.log('开始上传头像...');
      
      // 压缩图片
      const compressedFile = await compressImage(selectedFile);
      
      // 生成文件名
      const fileExt = 'jpg'; // 统一使用 jpg 格式
      const fileName = `${user.id}/avatar.${fileExt}`;
      
      console.log('上传文件名:', fileName);

      // 先删除旧头像（如果存在）
      try {
        await supabase.storage
          .from('avatars')
          .remove([fileName]);
        console.log('旧头像已删除');
      } catch (error) {
        console.log('没有旧头像需要删除，或删除失败:', error);
      }

      // 上传新头像
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('上传失败:', error);
        setMessage('上传失败: ' + error.message);
        return;
      }

      console.log('上传成功:', data);

      // 获取公共URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      console.log('头像URL:', publicUrl);

      // 更新数据库中的头像URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error('更新数据库失败:', updateError);
        setMessage('保存失败: ' + updateError.message);
        return;
      }

      console.log('头像更新成功');
      setMessage('头像上传成功！');
      
      // 通知父组件更新
      if (onAvatarUpdate) {
        onAvatarUpdate(publicUrl);
      }

      // 延迟关闭弹窗
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      console.error('上传异常:', error);
      setMessage('上传失败: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // 删除头像
  const handleRemoveAvatar = async () => {
    if (!currentAvatarUrl) return;

    if (!confirm('确定要删除头像吗？')) return;

    setUploading(true);
    try {
      // 从URL中提取文件名
      const fileName = `${user.id}/avatar.jpg`;
      
      // 删除存储中的文件
      await supabase.storage
        .from('avatars')
        .remove([fileName]);

      // 更新数据库
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: '' })
        .eq('id', user.id);

      if (error) {
        setMessage('删除失败: ' + error.message);
        return;
      }

      setMessage('头像已删除');
      if (onAvatarUpdate) {
        onAvatarUpdate('');
      }

      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      console.error('删除失败:', error);
      setMessage('删除失败: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="avatar-uploader-overlay">
      <div className="avatar-uploader-modal">
        <div className="avatar-uploader-header">
          <h2>更换头像</h2>
          <button onClick={onClose} className="close-button">✕</button>
        </div>

        {message && (
          <div className={`avatar-message ${message.includes('成功') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <div className="avatar-preview-section">
          <div className="current-avatar">
            <h3>当前头像</h3>
            {currentAvatarUrl ? (
              <img src={currentAvatarUrl} alt="当前头像" className="avatar-preview-img" />
            ) : (
              <div className="avatar-placeholder">👤</div>
            )}
          </div>

          {preview && (
            <div className="new-avatar">
              <h3>新头像预览</h3>
              <img src={preview} alt="新头像预览" className="avatar-preview-img" />
            </div>
          )}
        </div>

        <div className="upload-section">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          
          <button
            onClick={() => fileInputRef.current.click()}
            className="select-file-button"
            disabled={uploading}
          >
            📁 选择图片
          </button>

          <div className="upload-tips">
            <p>• 支持 JPG、PNG、WebP 格式</p>
            <p>• 图片大小不超过 5MB</p>
            <p>• 建议尺寸：400x400 像素</p>
          </div>
        </div>

        <div className="avatar-actions">
          <button
            onClick={onClose}
            className="cancel-button"
            disabled={uploading}
          >
            取消
          </button>
          
          {currentAvatarUrl && (
            <button
              onClick={handleRemoveAvatar}
              className="remove-button"
              disabled={uploading}
            >
              {uploading ? '删除中...' : '删除头像'}
            </button>
          )}
          
          <button
            onClick={handleUpload}
            className="upload-button"
            disabled={uploading || !selectedFile}
          >
            {uploading ? '上传中...' : '上传头像'}
          </button>
        </div>
      </div>
    </div>
  );
}