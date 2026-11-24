'use client';
import { useState, useRef } from 'react';

interface Asset {
  id: string;
  name: string;
  mime: string;
  alt?: string;
}

interface ImageFieldProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  assets?: Asset[];
  disabled?: boolean;
}

export default function ImageField({
  label = 'Cover Image',
  value,
  onChange,
  assets = [],
  disabled = false,
}: ImageFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.set('file', file);
      form.set('alt', file.name.replace(/\.[^/.]+$/, ''));
      const res = await fetch('/api/cms/upload', {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      onChange(`/api/cms-media/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="cms-image-field-wrap">
      <div className="cms-image-field-header">
        <label className="cms-image-field-label">{label}</label>
        {value && (
          <button
            type="button"
            className="cms-image-clear-btn"
            onClick={() => onChange('')}
            disabled={disabled}
            title="Clear image"
          >
            ✕ Clear
          </button>
        )}
      </div>

      <div className="cms-image-input-row">
        <div className="cms-image-input-box">
          <input
            type="text"
            className="cms-image-url-input"
            placeholder="Paste Cloudinary URL (https://res.cloudinary.com/...) or upload from PC"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled || uploading}
          />
        </div>

        <button
          type="button"
          className="cms-image-upload-btn"
          disabled={disabled || uploading}
          onClick={() => fileInputRef.current?.click()}
          title="Upload image directly from your PC"
        >
          {uploading ? (
            <span>Uploading…</span>
          ) : (
            <>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span>Upload from PC</span>
            </>
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFileUpload(file);
          }}
        />
      </div>

      {assets.length > 0 && (
        <div className="cms-image-library-picker">
          <small>Or pick from Media Library:</small>
          <select
            value={value.startsWith('/api/cms-media/') ? value : ''}
            onChange={(e) => {
              if (e.target.value) onChange(e.target.value);
            }}
            disabled={disabled}
          >
            <option value="">Select an uploaded media asset…</option>
            {assets.map((a) => (
              <option key={a.id} value={`/api/cms-media/${a.id}`}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="cms-image-field-error">{error}</p>}

      {value && (
        <div className="cms-image-preview-card">
          <div className="cms-image-preview-media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Preview"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
              onLoad={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'block';
              }}
            />
          </div>
          <div className="cms-image-preview-info">
            <span className="cms-image-preview-url" title={value}>
              {value}
            </span>
            <small>
              {value.includes('cloudinary.com')
                ? 'Cloudinary CDN Image'
                : value.startsWith('/api/cms-media/')
                ? 'Uploaded Media Asset'
                : 'Custom Image URL'}
            </small>
          </div>
        </div>
      )}
    </div>
  );
}

