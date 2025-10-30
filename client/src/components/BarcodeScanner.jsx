import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

export default function BarcodeScanner({ onDetected }) {
  const videoRef = useRef(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let stopped = false;

    async function start() {
      setError(null);
      try {
        setRunning(true);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } }, audio: false
        });
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        codeReader.decodeFromVideoDevice(null, videoRef.current, result => {
          if (stopped) return;
          if (result) {
            const text = result.getText();
            stop();
            onDetected(text);
          }
        });
      } catch (e) {
        console.error(e);
        setError(e?.message || 'Camera init failed');
        setRunning(false);
      }
    }

    function stop() {
      if (stopped) return;
      stopped = true;
      setRunning(false);
      codeReader.reset();
      const stream = videoRef.current?.srcObject;
      stream && stream.getTracks().forEach(t => t.stop());
    }

    start();
    return () => stop();
  }, [onDetected]);

  return (
    <div>
      <div style={{ position:'relative', width:'100%', maxWidth:480 }}>
        <video ref={videoRef} style={{ width:'100%', borderRadius:8 }} muted playsInline />
        <div style={{ position:'absolute', inset:0, border:'2px dashed #999', borderRadius:8, pointerEvents:'none' }} />
      </div>
      <div style={{ marginTop:8, color: error ? 'crimson' : '#666' }}>
        {error ? `相機錯誤：${error}` : (running ? '對準商品條碼掃描中…' : '準備中…')}
      </div>
    </div>
  );
}
