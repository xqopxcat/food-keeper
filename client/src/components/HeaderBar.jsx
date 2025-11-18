import React from 'react';
import { DESIGN_SYSTEM, COMMON_STYLES } from '../styles/designSystem.js';

const HeaderBar = ({ 
  title, 
  subtitle, 
  leftButton, 
  rightButton, 
  showBackButton = false,
  onBack,
  backgroundColor = DESIGN_SYSTEM.colors.white,
  borderBottom = true,
  sticky = true
}) => {
  return (
    <div style={{
      ...COMMON_STYLES.header,
      backgroundColor,
      borderBottom: borderBottom ? `1px solid ${DESIGN_SYSTEM.colors.gray[100]}` : 'none',
      position: sticky ? 'sticky' : 'relative',
      boxShadow: borderBottom ? DESIGN_SYSTEM.shadows.sm : 'none'
    }}>
      {/* 左側按鈕區域 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        minWidth: '60px',
        justifyContent: 'flex-start'
      }}>
        {showBackButton ? (
          <button
            onClick={onBack}
            style={{
              padding: DESIGN_SYSTEM.spacing.sm,
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: DESIGN_SYSTEM.borderRadius.md,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: DESIGN_SYSTEM.colors.gray[600],
              fontSize: '20px',
              transition: 'all 0.2s ease'
            }}
          >
            ←
          </button>
        ) : leftButton}
      </div>

      {/* 中間標題區域 */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: `0 ${DESIGN_SYSTEM.spacing.md}`
      }}>
        <h1 style={{
          margin: 0,
          fontSize: DESIGN_SYSTEM.typography.sizes.lg,
          fontWeight: DESIGN_SYSTEM.typography.weights.semibold,
          color: DESIGN_SYSTEM.colors.gray[900],
          lineHeight: '1.2'
        }}>
          {title}
        </h1>
        
        {subtitle && (
          <p style={{
            margin: 0,
            fontSize: DESIGN_SYSTEM.typography.sizes.xs,
            color: DESIGN_SYSTEM.colors.gray[500],
            marginTop: '2px'
          }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* 右側按鈕區域 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        minWidth: '60px',
        justifyContent: 'flex-end'
      }}>
        {rightButton}
      </div>
    </div>
  );
};

export default HeaderBar;