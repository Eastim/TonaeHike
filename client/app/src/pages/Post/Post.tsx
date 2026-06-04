import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Save, Send } from 'lucide-react';
import { Header } from '../../components/Header/Header';
import { TabBar } from '../../components/TabBar/TabBar';
import AnimationCharacters from '../../components/AnimationCharacters/AnimationCharacters';
import { ShowSuccessModal } from '../../components/showSuccessModal/showSuccessmodal';

interface ContentImage {
  file: File;
  dataUrl: string;
}

export function PostPage() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [destination, setDestination] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [contentImages, setContentImages] = useState<ContentImage[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');

  // 组件挂载时恢复草稿
  useEffect(() => {
    const draft = localStorage.getItem('draft_post');
    if (draft) {
      try {
        const postData = JSON.parse(draft);
        // 检查草稿是否在24小时内
        if (postData.savedAt && Date.now() - postData.savedAt < 24 * 60 * 60 * 1000) {
          setTitle(postData.title || '');
          setContent(postData.content || '');
          setSummary(postData.summary || '');
          setCategory(postData.category || '');
          setDestination(postData.destination || '');
          setTags(postData.tags || []);
          setCoverImage(postData.coverImage || null);
          // 恢复图片预览（无法恢复File对象，只能恢复预览）
          if (postData.contentImages && postData.contentImages.length > 0) {
            setContentImages(postData.contentImages.map((dataUrl: string) => ({
              file: {} as File,
              dataUrl
            })));
          }
        }
      } catch (e) {
        console.error('恢复草稿失败:', e);
      }
    }
  }, []);

  const categories = [
    { value: '', label: '请选择分类' },
    { value: 'travel', label: '旅行分享' },
    { value: 'food', label: '美食推荐' },
    { value: 'hotel', label: '酒店民宿' },
    { value: 'activity', label: '当地活动' },
    { value: 'tips', label: '实用贴士' },
    { value: 'photo', label: '摄影大佬' },
  ];

  const handleCoverUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 保存原始 File 对象
      setCoverImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setCoverImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const removeCover = useCallback(() => {
    setCoverImage(null);
    setCoverImageFile(null);
  }, []);

  const handleContentImagesUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          setContentImages((prev) => [...prev, { file, dataUrl: event.target?.result as string }]);
        };
        reader.readAsDataURL(file);
      });
    }
    e.target.value = '';
  }, []);

  const removeContentImage = useCallback((index: number) => {
    setContentImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleTagKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const value = tagInput.trim();
      if (value && value.length <= 10 && tags.length < 10) {
        // 移除开头的 # 符号
        const cleanTag = value.startsWith('#') ? value.slice(1) : value;
        if (cleanTag) {
          setTags((prev) => [...prev, cleanTag]);
        }
        setTagInput('');
      }
    }
  }, [tagInput, tags.length]);

  const handleTagInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // 如果输入以 # 开头，自动处理
    if (value.startsWith('#') && value.length > 1) {
      // 用户在输入标签内容
      setTagInput(value);
    } else {
      setTagInput(value);
    }
  }, []);

  const removeTag = useCallback((index: number) => {
    setTags((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSaveDraft = useCallback(() => {
    const postData = {
      title,
      content,
      summary,
      category,
      destination,
      tags,
      coverImage,
      // 保存图片的dataUrl用于恢复（无法保存File对象）
      contentImages: contentImages.map(img => img.dataUrl),
      savedAt: Date.now()
    };
    localStorage.setItem('draft_post', JSON.stringify(postData));
    // 显示保存成功提示
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 2000);
  }, [title, content, summary, category, destination, tags, coverImage, contentImages]);

  const handlePublish = useCallback(async () => {
    if (!title.trim()) {
      setHasError(true);
      setTimeout(() => setHasError(false), 800);
      alert('请填写文章标题');
      return;
    }

    if (!content.trim()) {
      setHasError(true);
      setTimeout(() => setHasError(false), 800);
      alert('请填写正文内容');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('请先登录');
      return;
    }

    try {
      // 第一步：创建帖子记录
      const createResponse = await fetch('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          content,
          category,
          destination,
          tags
        })
      });

      const createData = await createResponse.json();

      if (createData.code !== 200) {
        alert(createData.msg || '创建帖子失败');
        return;
      }

      const postId = createData.data.id;

      // 第二步：上传图片到帖子专属文件夹
      // 只上传真正的 File 对象（排除从草稿恢复的空对象）
      const validContentImages = contentImages.filter(img => img.file && img.file.name);
      
      // 准备要上传的图片数组：封面图放在最前面，然后是正文图片
      const imagesToUpload: File[] = [];
      if (coverImageFile) {
        imagesToUpload.push(coverImageFile);
      }
      validContentImages.forEach(img => {
        imagesToUpload.push(img.file);
      });
      
      if (imagesToUpload.length > 0) {
        // 开始上传，显示进度条
        setUploading(true);
        setUploadProgress(0);
        setUploadStatus('正在上传图片...');

        const imagesFormData = new FormData();
        imagesToUpload.forEach((file) => {
          imagesFormData.append('images', file);
        });

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `http://localhost:3000/api/posts/${postId}/images`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        // 监听上传进度
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(percent);
            setUploadStatus(`正在上传图片... ${percent}%`);
          }
        });

        // 使用 Promise 包装 XHR
        await new Promise<void>((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status === 200) {
              const uploadData = JSON.parse(xhr.responseText);
              if (uploadData.code !== 200) {
                setUploadStatus(`上传失败: ${uploadData.msg}`);
                setTimeout(() => setUploading(false), 1500);
                reject(new Error(uploadData.msg));
              } else {
                setUploadStatus('图片上传完成，正在保存...');
                resolve();
              }
            } else {
              setUploadStatus('上传失败');
              setTimeout(() => setUploading(false), 1500);
              reject(new Error('上传失败'));
            }
          };

          xhr.onerror = () => {
            setUploadStatus('上传失败');
            setTimeout(() => setUploading(false), 1500);
            reject(new Error('网络错误'));
          };

          xhr.send(imagesFormData);
        });

        // 上传完成，等待数据库保存
        setUploadProgress(100);
        setUploadStatus('正在保存到数据库...');
      }

      // 隐藏上传进度条
      setUploading(false);
      // 显示发布成功弹窗
      setShowSuccessModal(true);
      localStorage.removeItem('draft_post');
      // 重置表单
      setTitle('');
      setCategory('');
      setDestination('');
      setCoverImage(null);
      setCoverImageFile(null);
      setSummary('');
      setContent('');
      setContentImages([]);
      setContentImages([]);
      setTags([]);
      setTagInput('');
      // 2秒后关闭弹窗
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (error) {
      console.error('发布失败:', error);
      alert('发布失败，请稍后重试');
    }
  }, [title, content, category, destination, tags, contentImages, hasError]);

  const handleInputChange = useCallback(() => {
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 500);
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      <Header />

      <main className="main-content">
        <div className="post-page">
          <motion.div
            className={`left-panel ${isPanelCollapsed ? 'collapsed' : ''}`}
            animate={{ width: isPanelCollapsed ? 60 : '30%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <button
              type="button"
              onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
              className="collapse-btn"
            >
              <motion.div
                animate={{ rotate: isPanelCollapsed ? 180 : 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </motion.div>
            </button>

            <AnimatePresence>
              {!isPanelCollapsed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="characters-wrapper"
                >
                  <AnimationCharacters
                    isTyping={isTyping}
                    isPasswordFocused={false}
                    showPassword={false}
                    passwordLength={0}
                    hasError={hasError}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div
            className="right-panel"
            animate={{ width: isPanelCollapsed ? 'calc(100% - 60px)' : '70%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="form-container">
              <div className="page-header">
                <h1 className="page-title">发布新帖子</h1>
                <p className="page-subtitle">分享你的旅行故事</p>
              </div>

              <form className="post-form" onSubmit={(e) => e.preventDefault()}>
                <div className="form-group">
                  <label htmlFor="title">文章标题</label>
                  <input
                    type="text"
                    id="title"
                    className="form-input"
                    placeholder="请输入标题"
                    maxLength={100}
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      handleInputChange();
                    }}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="category">分类</label>
                    <select
                      id="category"
                      className="form-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="destination">目的地</label>
                    <input
                      type="text"
                      id="destination"
                      className="form-input"
                      placeholder="请输入目的地"
                      value={destination}
                      onChange={(e) => {
                        setDestination(e.target.value);
                        handleInputChange();
                      }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>封面图片</label>
                  <div className="upload-area" onClick={() => document.getElementById('coverInput')?.click()}>
                    <input
                      type="file"
                      id="coverInput"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverUpload}
                    />
                    <AnimatePresence mode="wait">
                      {coverImage ? (
                        <motion.div
                          key="preview"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="preview-container"
                        >
                          <img src={coverImage} alt="封面预览" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeCover();
                            }}
                            className="remove-btn"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="placeholder"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="upload-placeholder"
                        >
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                          <p>点击上传封面图片</p>
                          <span>支持 JPG、PNG 格式</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="summary">摘要 / 简介</label>
                  <textarea
                    id="summary"
                    className="form-textarea"
                    placeholder="请输入简短的介绍，用于在列表中展示"
                    rows={3}
                    value={summary}
                    onChange={(e) => {
                      setSummary(e.target.value);
                      handleInputChange();
                    }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="content">正文内容</label>
                  <textarea
                    id="content"
                    className="form-textarea content-area"
                    placeholder="旅行中发生了什么有趣的事情呢..."
                    rows={12}
                    value={content}
                    onChange={(e) => {
                      setContent(e.target.value);
                      handleInputChange();
                    }}
                  />
                </div>

                <div className="form-group">
                  <label>正文图片（多图）</label>
                  <div className="images-grid-container">
                    <input
                      type="file"
                      id="contentImagesInput"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleContentImagesUpload}
                    />
                    <div className="images-grid">
                      {contentImages.map((img, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="image-item"
                        >
                          <img src={img.dataUrl} alt={`图片${index + 1}`} />
                          <button
                            type="button"
                            onClick={() => removeContentImage(index)}
                            className="remove-btn"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </motion.div>
                      ))}
                      {contentImages.length < 9 && (
                        <motion.div
                          key="add"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="image-item add-btn"
                          onClick={() => document.getElementById('contentImagesInput')?.click()}
                        >
                          <Plus className="w-6 h-6" />
                        </motion.div>
                      )}
                    </div>
                    {contentImages.length === 9 && (
                      <p className="text-sm text-gray-400 mt-2">最多上传9张图片</p>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>标签管理</label>
                  <div className="tags-container">
                    <div className="tags-input-wrapper">
                      <div className="tags-list">
                        {tags.map((tag, index) => (
                          <motion.span
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="tag"
                          >
                            {tag}
                            <button type="button" onClick={() => removeTag(index)}>
                              <X className="w-3 h-3" />
                            </button>
                          </motion.span>
                        ))}
                      </div>
                      <input
                        type="text"
                        className={`tag-input ${tagInput.startsWith('#') ? 'tag-input-active' : ''}`}
                        placeholder="输入标签后按回车添加"
                        value={tagInput}
                        onChange={handleTagInputChange}
                        onKeyDown={handleTagKeyDown}
                      />
                    </div>
                    <div className="tags-hint">每个标签不超过10个字符</div>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={handleSaveDraft}>
                    <Save className="w-4.5 h-4.5" />
                    保存草稿
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handlePublish}>
                    <Send className="w-4.5 h-4.5" />
                    发帖
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </main>

      <TabBar />

      {/* 上传进度弹窗 */}
      <AnimatePresence>
        {uploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200]"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 w-full max-w-md shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
            >
              <div className="flex flex-col items-center gap-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-12 h-12 border-4 border-[#0F9AFF] border-t-transparent rounded-full"
                />
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">发帖</h3>
                  <p className="text-gray-500 text-sm">{uploadStatus}</p>
                </div>
                <div className="w-full">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] rounded-full"
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="text-right mt-2">
                    <span className="text-sm text-[#0F9AFF] font-medium">{uploadProgress}%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 成功弹窗 */}
      <ShowSuccessModal 
        show={showSuccessModal} 
        title="操作成功" 
        message="帖子已发布成功" 
      />

      <style>{`
        .main-content {
          padding: 24px;
          padding-bottom: 120px;
        }

        .post-page {
          display: flex;
          gap: 0;
          max-width: 1400px;
          margin: 0 auto;
          background: #fff;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 2px 20px rgba(15, 154, 255, 0.06);
          min-height: calc(100vh - 150px);
        }

        .left-panel {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, #d4d0dc 0%, #c8c4d0 50%, #bbb7c5 100%);
          padding: 40px;
          width: 30%;
          flex-shrink: 0;
        }

        .left-panel.collapsed {
          padding: 20px 10px;
        }

        .collapse-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          right: -17px;
          width: 34px;
          height: 34px;
          border: none;
          background: #fff;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.18);
          transition: all 0.2s ease;
          z-index: 100;
        }

        .collapse-btn:hover {
          background: #f0f7ff;
          color: #0F9AFF;
        }

        .left-panel::after {
          content: "";
          position: absolute;
          top: 20%;
          right: 15%;
          width: 200px;
          height: 200px;
          background: rgba(180, 170, 200, 0.25);
          border-radius: 50%;
          filter: blur(80px);
        }

        .left-panel::before {
          content: "";
          position: absolute;
          bottom: 15%;
          left: 10%;
          width: 280px;
          height: 280px;
          background: rgba(200, 195, 210, 0.2);
          border-radius: 50%;
          filter: blur(100px);
        }

        .characters-wrapper {
          position: relative;
          z-index: 10;
        }

        .right-panel {
          padding: 40px;
          overflow-y: auto;
          overflow-x: hidden;
          max-height: calc(100vh - 150px);
          width: 70%;
        }

        .form-container {
          max-width: 680px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 32px;
        }

        .page-title {
          font-size: 28px;
          font-weight: 700;
          color: #333;
          margin-bottom: 8px;
        }

        .page-subtitle {
          font-size: 14px;
          color: #999;
        }

        .post-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-input,
        .form-select,
        .form-textarea {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid rgba(15, 154, 255, 0.15);
          border-radius: 12px;
          font-size: 14px;
          font-family: inherit;
          color: #333;
          background: #fff;
          outline: none;
          transition: all 0.2s ease;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          border-color: #0F9AFF;
          box-shadow: 0 0 0 4px rgba(15, 154, 255, 0.08);
        }

        .form-input::placeholder,
        .form-textarea::placeholder {
          color: #999;
        }

        .form-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 16px center;
          padding-right: 40px;
          cursor: pointer;
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .form-textarea.content-area {
          min-height: 200px;
        }

        .upload-area {
          border: 2px dashed rgba(15, 154, 255, 0.2);
          border-radius: 16px;
          padding: 24px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #fafbfc;
        }

        .upload-area:hover {
          border-color: #0F9AFF;
          background: rgba(15, 154, 255, 0.02);
        }

        .upload-area.multiple {
          padding: 16px;
        }

        .upload-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #999;
        }

        .upload-placeholder svg {
          color: rgba(15, 154, 255, 0.5);
        }

        .upload-placeholder p {
          font-size: 14px;
          font-weight: 500;
        }

        .upload-placeholder span {
          font-size: 12px;
        }

        .upload-placeholder.compact {
          flex-direction: row;
          padding: 12px;
          gap: 8px;
        }

        .upload-placeholder.compact p {
          font-size: 13px;
        }

        .preview-container {
          position: relative;
          width: 100%;
        }

        .preview-container img {
          width: 100%;
          max-height: 300px;
          object-fit: cover;
          border-radius: 12px;
        }

        .remove-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background: rgba(0, 0, 0, 0.6);
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .remove-btn:hover {
          background: rgba(255, 77, 79, 0.9);
        }

        .images-grid-container {
          padding: 12px;
          border: 2px dashed rgba(15, 154, 255, 0.2);
          border-radius: 12px;
          background: #fff;
        }

        .images-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .image-item {
          position: relative;
          aspect-ratio: 1;
          border-radius: 8px;
          overflow: hidden;
          background: #f8f9fa;
        }

        .image-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-item.add-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: 2px dashed #d9d9d9;
          transition: all 0.2s ease;
        }

        .image-item.add-btn:hover {
          border-color: #0F9AFF;
          background: rgba(15, 154, 255, 0.05);
        }

        .image-item.add-btn svg {
          color: #999;
        }

        .image-item.add-btn:hover svg {
          color: #0F9AFF;
        }

        .image-item .remove-btn {
          width: 24px;
          height: 24px;
        }

        .files-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 12px;
        }

        .file-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #fff;
          border: 1px solid rgba(15, 154, 255, 0.1);
          border-radius: 12px;
        }

        .file-item svg {
          color: #0F9AFF;
          flex-shrink: 0;
        }

        .file-name {
          flex: 1;
          font-size: 13px;
          color: #333;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-item .remove-btn {
          position: relative;
          top: auto;
          right: auto;
          width: 28px;
          height: 28px;
          background: rgba(255, 77, 79, 0.1);
          color: #FF4D4F;
        }

        .file-item .remove-btn:hover {
          background: rgba(255, 77, 79, 0.2);
        }

        .tags-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .tags-input-wrapper {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 12px;
          border: 1px solid rgba(15, 154, 255, 0.15);
          border-radius: 12px;
          background: #fff;
          cursor: text;
        }

        .tags-input-wrapper:focus-within {
          border-color: #0F9AFF;
          box-shadow: 0 0 0 4px rgba(15, 154, 255, 0.08);
        }

        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tag {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: linear-gradient(135deg, #0F9AFF 0%, #0010B3 100%);
          color: #fff;
          font-size: 13px;
          font-weight: 500;
          border-radius: 16px;
        }

        .tag button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          border: none;
          background: rgba(255, 255, 255, 0.3);
          color: #fff;
          border-radius: 50%;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .tag button:hover {
          background: rgba(255, 255, 255, 0.5);
        }

        .tag-input {
          flex: 1;
          min-width: 120px;
          border: none;
          outline: none;
          font-size: 14px;
          font-family: inherit;
          color: #333;
          background: transparent;
        }

        .tag-input::placeholder {
          color: #999;
        }

        .tag-input-active {
          background: rgba(15, 154, 255, 0.1);
          padding: 6px 12px;
          border-radius: 16px;
          color: #0F9AFF;
        }

        .tag-input-active::placeholder {
          color: #0F9AFF;
          opacity: 0.6;
        }

        .tags-hint {
          font-size: 12px;
          color: #999;
        }

        .form-actions {
          display: flex;
          gap: 16px;
          margin-top: 16px;
        }

        .btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 24px;
          border-radius: 24px;
          font-size: 15px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-secondary {
          background: #fff;
          border: 1px solid rgba(15, 154, 255, 0.2);
          color: #666;
        }

        .btn-secondary:hover {
          border-color: #0F9AFF;
          color: #0F9AFF;
          background: rgba(15, 154, 255, 0.04);
        }

        .btn-primary {
          background: linear-gradient(135deg, #0F9AFF 0%, #0010B3 100%);
          border: none;
          color: #fff;
          box-shadow: 0 4px 16px rgba(15, 154, 255, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(15, 154, 255, 0.45);
        }

        .hidden {
          display: none;
        }

        @media (max-width: 900px) {
          .post-page {
            flex-direction: column;
          }

          .left-panel {
            display: none;
          }

          .right-panel {
            width: 100%;
            max-height: none;
          }

          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}





