import { useState, useRef } from 'react';
import './ImageUploadField.css';

const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_MB = 5;

export default function ImageUploadField({ value, onChange, token }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!ALLOWED.includes(file.type)) {
      setUploadError('Only JPEG, PNG, or WebP images are allowed.');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setUploadError(`Image must be under ${MAX_MB}MB.`);
      return;
    }

    setUploadError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      onChange(data.url);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="img-upload-field">
      <div className="img-upload-row">
        <input
          type="text"
          className="img-url-input"
          placeholder="Paste image URL or upload a file below"
          value={value}
          onChange={(e) => { setUploadError(''); onChange(e.target.value); }}
        />
      </div>
      <div className="img-upload-row">
        <label className="img-file-btn">
          {uploading ? 'Uploading…' : '📁 Browse & Upload'}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
        <span className="img-upload-hint">JPEG / PNG / WebP · max 5 MB</span>
      </div>
      {uploadError && <p className="img-upload-error">{uploadError}</p>}
      {value && (
        <img
          src={value}
          alt="preview"
          className="img-upload-preview"
          onError={(e) => { e.target.style.display = 'none'; }}
          onLoad={(e) => { e.target.style.display = 'block'; }}
        />
      )}
    </div>
  );
}
