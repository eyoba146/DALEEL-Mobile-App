import React, { useState, useRef, useEffect } from 'react';
import { adminApi } from '../api';
import { Upload, Camera, Link as LinkIcon, RefreshCw, X, Check, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  label = 'Hero Photo',
}) => {
  const [mode, setMode] = useState<'upload' | 'camera' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState(value);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUrlInput(value);
  }, [value]);

  // Clean up camera stream on unmount or mode switch
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  const handleStartCamera = async () => {
    setErrorMessage('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Trigger native mobile/device camera file input as fallback
        nativeCameraInputRef.current?.click();
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' },
        audio: false,
      });
      setCameraStream(stream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Direct webcam access failed, using native file camera capture:', err);
      // Fallback: trigger native file camera input
      nativeCameraInputRef.current?.click();
    }
  };

  const handleStopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const handleCaptureSnapshot = async () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const base64 = canvas.toDataURL('image/jpeg', 0.9);
      handleStopCamera();
      await uploadBase64(base64);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to capture camera snapshot');
    }
  };

  const uploadBase64 = async (base64String: string) => {
    setIsUploading(true);
    setErrorMessage('');
    try {
      const result = await adminApi.uploadImage(base64String);
      onChange(result.url);
      setUrlInput(result.url);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (under 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('File size exceeds 15MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      await uploadBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onChange(urlInput.trim());
    }
  };

  const handleRemoveImage = () => {
    onChange('');
    setUrlInput('');
    handleStopCamera();
  };

  return (
    <div style={styles.container}>
      <div style={styles.labelRow}>
        <label style={styles.label}>{label} *</label>
        {value && (
          <button type="button" style={styles.removeBtn} onClick={handleRemoveImage}>
            <X size={13} color="#C53030" />
            <span>Remove Photo</span>
          </button>
        )}
      </div>

      {/* Mode Selector Tabs */}
      <div style={styles.modeTabs}>
        <button
          type="button"
          style={{
            ...styles.modeTab,
            ...(mode === 'upload' ? styles.modeTabActive : {}),
          }}
          onClick={() => {
            handleStopCamera();
            setMode('upload');
          }}
        >
          <Upload size={14} color={mode === 'upload' ? '#07152B' : '#5A687A'} />
          <span>Upload File</span>
        </button>

        <button
          type="button"
          style={{
            ...styles.modeTab,
            ...(mode === 'camera' ? styles.modeTabActive : {}),
          }}
          onClick={() => {
            setMode('camera');
            handleStartCamera();
          }}
        >
          <Camera size={14} color={mode === 'camera' ? '#07152B' : '#5A687A'} />
          <span>Take Photo (Camera)</span>
        </button>

        <button
          type="button"
          style={{
            ...styles.modeTab,
            ...(mode === 'url' ? styles.modeTabActive : {}),
          }}
          onClick={() => {
            handleStopCamera();
            setMode('url');
          }}
        >
          <LinkIcon size={14} color={mode === 'url' ? '#07152B' : '#5A687A'} />
          <span>Paste Web URL</span>
        </button>
      </div>

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/png, image/jpeg, image/webp, image/jpg"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <input
        type="file"
        ref={nativeCameraInputRef}
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Mode 1: Drag & Drop / File Browser */}
      {mode === 'upload' && !isCameraActive && (
        <div
          style={styles.dropzone}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => uploadBase64(reader.result as string);
              reader.readAsDataURL(file);
            }
          }}
        >
          {isUploading ? (
            <div style={styles.uploadingState}>
              <RefreshCw size={24} color="#8C6A21" style={{ animation: 'spin 1s linear infinite' }} />
              <span style={styles.uploadingText}>Uploading photo to platform...</span>
            </div>
          ) : (
            <>
              <div style={styles.uploadIconWrap}>
                <Upload size={20} color="#8C6A21" />
              </div>
              <div style={styles.dropzoneTitle}>Click to browse or drag & drop photo</div>
              <div style={styles.dropzoneSub}>Supports high-resolution PNG, JPG, or WEBP (up to 15MB)</div>
            </>
          )}
        </div>
      )}

      {/* Mode 2: Camera Viewfinder */}
      {mode === 'camera' && (
        <div style={styles.cameraBox}>
          {isCameraActive ? (
            <div style={styles.viewfinderWrap}>
              <video ref={videoRef} autoPlay playsInline style={styles.videoStream} />
              <div style={styles.cameraOverlay}>
                <button type="button" style={styles.captureBtn} onClick={handleCaptureSnapshot} title="Capture Photo">
                  <div style={styles.captureInner} />
                </button>
                <button type="button" style={styles.cancelCameraBtn} onClick={handleStopCamera}>
                  Cancel Camera
                </button>
              </div>
            </div>
          ) : (
            <div style={styles.cameraPlaceholder}>
              <Camera size={28} color="#8C6A21" />
              <div style={styles.cameraPromptText}>Camera ready to take photo</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="btn btn-primary" onClick={handleStartCamera}>
                  <Camera size={15} />
                  <span>Open Live Camera</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => nativeCameraInputRef.current?.click()}
                >
                  <span>Device Camera App</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 3: Paste Web URL */}
      {mode === 'url' && (
        <div style={styles.urlInputRow}>
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            style={styles.textInput}
          />
          <button type="button" className="btn btn-primary" onClick={handleUrlSubmit}>
            <Check size={14} />
            <span>Apply URL</span>
          </button>
        </div>
      )}

      {errorMessage && <div style={styles.errorBox}>{errorMessage}</div>}

      {/* Active Photo Preview */}
      {value && !isCameraActive && (
        <div style={styles.previewContainer}>
          <div style={styles.previewHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ImageIcon size={14} color="#8C6A21" />
              <span style={styles.previewTitle}>Active Photo Preview</span>
            </div>
            <span style={styles.statusPill}>Selected</span>
          </div>

          <div style={styles.previewImgWrap}>
            <img src={value} alt="Destination Preview" style={styles.previewImg} />
          </div>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  labelRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#07152B',
  },
  removeBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    background: 'none',
    border: 'none',
    color: '#C53030',
    fontSize: '11.5px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  modeTabs: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#F8FAFC',
    padding: '4px',
    borderRadius: '8px',
    border: '1px solid #E4E9F0',
  },
  modeTab: {
    flex: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '7px 10px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#5A687A',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
    color: '#07152B',
    fontWeight: 700,
    boxShadow: '0 1px 4px rgba(7, 21, 43, 0.06)',
  },
  dropzone: {
    border: '2px dashed #CBD5E1',
    borderRadius: '10px',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    cursor: 'pointer',
    backgroundColor: '#FAFCFE',
    transition: 'all 0.18s ease',
  },
  uploadIconWrap: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    backgroundColor: '#F8F4EC',
    border: '1px solid #E0C582',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px',
  },
  dropzoneTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#07152B',
  },
  dropzoneSub: {
    fontSize: '11.5px',
    color: '#5A687A',
    marginTop: '2px',
  },
  uploadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  uploadingText: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#8C6A21',
  },
  cameraBox: {
    border: '1px solid #E4E9F0',
    borderRadius: '10px',
    overflow: 'hidden',
    backgroundColor: '#07152B',
  },
  viewfinderWrap: {
    position: 'relative',
    width: '100%',
    height: '240px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  videoStream: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: '14px',
    left: 0,
    right: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
  },
  captureBtn: {
    width: '54px',
    height: '54px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    border: '3px solid #FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
  },
  captureInner: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#DFB76C',
  },
  cancelCameraBtn: {
    padding: '6px 12px',
    backgroundColor: 'rgba(7, 21, 43, 0.75)',
    color: '#FFFFFF',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  cameraPlaceholder: {
    padding: '30px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    backgroundColor: '#FAFCFE',
  },
  cameraPromptText: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#07152B',
  },
  urlInputRow: {
    display: 'flex',
    gap: '8px',
  },
  textInput: {
    flex: 1,
    padding: '9px 12px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#07152B',
  },
  previewContainer: {
    marginTop: '6px',
    backgroundColor: '#FAFCFE',
    border: '1px solid #E4E9F0',
    borderRadius: '10px',
    padding: '12px',
  },
  previewHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  previewTitle: {
    fontSize: '11.5px',
    fontWeight: 700,
    color: '#07152B',
  },
  statusPill: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#16803C',
    backgroundColor: '#E8F7ED',
    padding: '2px 8px',
    borderRadius: '9999px',
  },
  previewImgWrap: {
    height: '160px',
    width: '100%',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #E4E9F0',
  },
  previewImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  errorBox: {
    backgroundColor: '#FFF0F0',
    border: '1px solid rgba(214, 48, 49, 0.3)',
    color: '#D63031',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '12px',
  },
};
