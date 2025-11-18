import React from 'react';
import { DESIGN_SYSTEM } from '../styles/designSystem.js';

const FullScreenScanner = ({ 
  children, 
  onClose, 
  title = "掃描", 
  subtitle,
  showCloseButton = true,
  overlayOpacity = 0.3,
  scanLineAnimation = true 
}) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: DESIGN_SYSTEM.colors.black,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 頂部控制欄 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '100px',
        background: `linear-gradient(180deg, rgba(0,0,0,${overlayOpacity + 0.4}) 0%, rgba(0,0,0,${overlayOpacity}) 70%, transparent 100%)`,
        zIndex: 1001,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        padding: `0 ${DESIGN_SYSTEM.spacing.lg}`,
        paddingBottom: DESIGN_SYSTEM.spacing.md,
        paddingTop: 'env(safe-area-inset-top)' // iPhone X+ 頂部安全區域
      }}>
        {/* 標題區域 */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h2 style={{
            margin: 0,
            color: DESIGN_SYSTEM.colors.white,
            fontSize: DESIGN_SYSTEM.typography.sizes.lg,
            fontWeight: DESIGN_SYSTEM.typography.weights.semibold,
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)'
          }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{
              margin: 0,
              marginTop: DESIGN_SYSTEM.spacing.xs,
              color: DESIGN_SYSTEM.colors.white,
              fontSize: DESIGN_SYSTEM.typography.sizes.sm,
              opacity: 0.8,
              textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)'
            }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* 關閉按鈕 */}
        {showCloseButton && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: `calc(env(safe-area-inset-top) + ${DESIGN_SYSTEM.spacing.md})`,
              right: DESIGN_SYSTEM.spacing.lg,
              width: '40px',
              height: '40px',
              borderRadius: DESIGN_SYSTEM.borderRadius.full,
              backgroundColor: `rgba(0, 0, 0, ${overlayOpacity + 0.2})`,
              border: `1px solid rgba(255, 255, 255, 0.2)`,
              color: DESIGN_SYSTEM.colors.white,
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(10px)'
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* 主要內容區域 */}
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {children}
      </div>

      {/* 掃描框覆蓋層 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 1000
      }}>
        {/* 掃描目標框 */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '280px',
          height: '280px',
          border: `2px solid ${DESIGN_SYSTEM.colors.primary[400]}`,
          borderRadius: DESIGN_SYSTEM.borderRadius.xl,
          boxShadow: `0 0 0 9999px rgba(0, 0, 0, ${overlayOpacity})`
        }}>
          {/* 四角指示器 */}
          {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((position) => (
            <div
              key={position}
              style={{
                position: 'absolute',
                width: '20px',
                height: '20px',
                border: `3px solid ${DESIGN_SYSTEM.colors.primary[300]}`,
                ...(position === 'top-left' && { top: '-2px', left: '-2px', borderRight: 'none', borderBottom: 'none' }),
                ...(position === 'top-right' && { top: '-2px', right: '-2px', borderLeft: 'none', borderBottom: 'none' }),
                ...(position === 'bottom-left' && { bottom: '-2px', left: '-2px', borderRight: 'none', borderTop: 'none' }),
                ...(position === 'bottom-right' && { bottom: '-2px', right: '-2px', borderLeft: 'none', borderTop: 'none' }),
                borderRadius: DESIGN_SYSTEM.spacing.xs
              }}
            />
          ))}

          {/* 掃描線動畫 */}
          {scanLineAnimation && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '-2px',
              right: '-2px',
              height: '2px',
              background: `linear-gradient(90deg, transparent, ${DESIGN_SYSTEM.colors.primary[300]}, transparent)`,
              animation: 'scanLine 2s ease-in-out infinite',
              transformOrigin: 'center'
            }} />
          )}
        </div>
      </div>

      {/* 底部控制區域 */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '150px',
        background: `linear-gradient(0deg, rgba(0,0,0,${overlayOpacity + 0.4}) 0%, rgba(0,0,0,${overlayOpacity}) 70%, transparent 100%)`,
        zIndex: 1001,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: DESIGN_SYSTEM.spacing.xl,
        paddingBottom: `calc(env(safe-area-inset-bottom) + ${DESIGN_SYSTEM.spacing.lg})`
      }}>
        <p style={{
          margin: 0,
          color: DESIGN_SYSTEM.colors.white,
          fontSize: DESIGN_SYSTEM.typography.sizes.sm,
          textAlign: 'center',
          opacity: 0.8,
          textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
          lineHeight: '1.4'
        }}>
          將食品包裝對準框內進行掃描<br/>
          <span style={{ fontSize: DESIGN_SYSTEM.typography.sizes.xs }}>
            支援條碼、文字和物品識別
          </span>
        </p>
      </div>

      {/* CSS 動畫樣式注入 */}
      <style jsx>{`
        @keyframes scanLine {
          0% {
            transform: translateY(-140px) scaleX(0.5);
            opacity: 0;
          }
          50% {
            transform: translateY(0px) scaleX(1);
            opacity: 1;
          }
          100% {
            transform: translateY(140px) scaleX(0.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default FullScreenScanner;