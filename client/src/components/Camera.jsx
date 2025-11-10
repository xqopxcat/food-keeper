import React, { useRef, useEffect, useState, useCallback } from 'react';

const Camera = ({ onCapture, onError, className = '', style = {} }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' 前鏡頭, 'environment' 後鏡頭
  const [supportedConstraints, setSupportedConstraints] = useState({});

  // 停止相機
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  // 啟動相機
  const startCamera = useCallback(async () => {
    try {
      // 檢查瀏覽器支援
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('此瀏覽器不支援相機功能');
      }

      // 如果已經在串流中，先停止
      if (isStreaming) {
        stopCamera();
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // 獲取支援的約束
      const constraints = navigator.mediaDevices.getSupportedConstraints();
      setSupportedConstraints(constraints);

      // 相機設定
      const mediaConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 30 } // 限制幀率避免閃爍
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
      
      if (videoRef.current && !isStreaming) {
        videoRef.current.srcObject = stream;
        
        // 使用 Promise 確保視頻載入完成
        await new Promise((resolve, reject) => {
          const video = videoRef.current;
          if (!video) {
            reject(new Error('Video element not available'));
            return;
          }

          const onCanPlay = () => {
            video.removeEventListener('canplay', onCanPlay);
            video.removeEventListener('error', onError);
            video.play().then(() => {
              setIsStreaming(true);
              resolve();
            }).catch(reject);
          };

          const onError = (e) => {
            video.removeEventListener('canplay', onCanPlay);
            video.removeEventListener('error', onError);
            reject(e);
          };

          video.addEventListener('canplay', onCanPlay);
          video.addEventListener('error', onError);
        });
      }

    } catch (error) {
      console.error('Camera Error:', error);
      const errorMessage = error.name === 'NotAllowedError' 
        ? '請允許使用相機權限'
        : error.name === 'NotFoundError'
        ? '找不到可用的相機'
        : error.message || '無法啟動相機';
      
      setIsStreaming(false);
      onError?.(errorMessage);
    }
  }, [facingMode, onError, isStreaming, stopCamera]);

  // 切換前後鏡頭
  const switchCamera = useCallback(() => {
    setFacingMode(current => current === 'environment' ? 'user' : 'environment');
  }, []);

  // 拍照
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      onError?.('相機未就緒');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // 設置 canvas 大小
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 繪製當前影像到 canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 轉換為 blob
    canvas.toBlob((blob) => {
      if (blob) {
        // 同時提供 blob 和 base64
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1]; // 移除 data:image/jpeg;base64, 前綴
          onCapture?.({
            blob,
            base64,
            width: canvas.width,
            height: canvas.height,
            timestamp: Date.now()
          });
        };
        reader.readAsDataURL(blob);
      } else {
        onError?.('拍照失敗');
      }
    }, 'image/jpeg', 0.8);
  }, [onCapture, onError]);

  // 組件卸載時停止相機
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // facingMode 改變時重新啟動相機
  useEffect(() => {
    if (isStreaming) {
      stopCamera();
      // 增加延遲以確保前一個流完全停止
      setTimeout(startCamera, 300);
    }
  }, [facingMode]);

  return (
    <div className={`camera-container ${className}`} style={style}>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {/* 影像預覽 */}
        <video
          ref={videoRef}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            backgroundColor: '#000'
          }}
          playsInline
          muted
        />
        
        {/* 隱藏的 canvas 用於拍照 */}
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />

        {/* 控制按鈕覆蓋層 */}
        <div style={{
          position: 'absolute',
          bottom: 16,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 16,
          padding: '0 16px'
        }}>
          {/* 切換鏡頭按鈕 */}
          {supportedConstraints.facingMode && (
            <button
              onClick={switchCamera}
              disabled={!isStreaming}
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: 'rgba(0,0,0,0.6)',
                border: '2px solid white',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20
              }}
              title="切換鏡頭"
            >
              🔄
            </button>
          )}

          {/* 拍照按鈕 */}
          <button
            onClick={capturePhoto}
            disabled={!isStreaming}
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              backgroundColor: isStreaming ? 'white' : 'rgba(255,255,255,0.5)',
              border: '4px solid rgba(0,0,0,0.6)',
              cursor: isStreaming ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              transition: 'all 0.2s ease'
            }}
            title="拍照"
          >
            📷
          </button>

          {/* 停止相機按鈕 */}
          {isStreaming && (
            <button
              onClick={stopCamera}
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: 'rgba(220, 38, 38, 0.8)',
                border: '2px solid white',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20
              }}
              title="關閉相機"
            >
              ✕
            </button>
          )}
        </div>

        {/* 啟動相機按鈕 */}
        {!isStreaming && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}>
            <button
              onClick={startCamera}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              📷 啟動相機
            </button>
          </div>
        )}

        {/* 狀態指示 */}
        {isStreaming && (
          <div style={{
            position: 'absolute',
            top: 16,
            right: 16,
            backgroundColor: 'rgba(0,0,0,0.6)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            🔴 錄影中 ({facingMode === 'environment' ? '後鏡頭' : '前鏡頭'})
          </div>
        )}
      </div>
    </div>
  );
};

export default Camera;