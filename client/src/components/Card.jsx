import React from 'react';
import { DESIGN_SYSTEM, COMMON_STYLES } from '../styles/designSystem.js';

const Card = ({ 
  children, 
  title, 
  subtitle, 
  icon, 
  onClick, 
  className = '',
  padding = DESIGN_SYSTEM.spacing.lg,
  shadow = 'md',
  hover = false,
  borderColor = DESIGN_SYSTEM.colors.gray[100],
  backgroundColor = DESIGN_SYSTEM.colors.white,
  ...props 
}) => {
  const cardStyle = {
    backgroundColor,
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
    padding,
    boxShadow: DESIGN_SYSTEM.shadows[shadow],
    border: `1px solid ${borderColor}`,
    transition: 'all 0.2s ease',
    cursor: onClick ? 'pointer' : 'default',
    ...(hover && {
      ':hover': {
        transform: 'translateY(-2px)',
        boxShadow: DESIGN_SYSTEM.shadows.lg
      }
    })
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div 
      style={cardStyle}
      className={className}
      onClick={handleClick}
      {...props}
    >
      {/* 卡片頭部 */}
      {(title || subtitle || icon) && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          marginBottom: title || subtitle ? DESIGN_SYSTEM.spacing.md : 0
        }}>
          {/* 圖示 */}
          {icon && (
            <div style={{
              marginRight: DESIGN_SYSTEM.spacing.md,
              fontSize: '24px',
              lineHeight: '1'
            }}>
              {icon}
            </div>
          )}
          
          {/* 標題區域 */}
          <div style={{ flex: 1 }}>
            {title && (
              <h3 style={{
                margin: 0,
                fontSize: DESIGN_SYSTEM.typography.sizes.lg,
                fontWeight: DESIGN_SYSTEM.typography.weights.semibold,
                color: DESIGN_SYSTEM.colors.gray[900],
                lineHeight: '1.3'
              }}>
                {title}
              </h3>
            )}
            
            {subtitle && (
              <p style={{
                margin: 0,
                marginTop: DESIGN_SYSTEM.spacing.xs,
                fontSize: DESIGN_SYSTEM.typography.sizes.sm,
                color: DESIGN_SYSTEM.colors.gray[600],
                lineHeight: '1.4'
              }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 卡片內容 */}
      {children}
    </div>
  );
};

// 特殊卡片變體
export const StatusCard = ({ status, title, subtitle, icon, value, unit, ...props }) => {
  const statusColors = {
    success: {
      backgroundColor: DESIGN_SYSTEM.colors.primary[50],
      borderColor: DESIGN_SYSTEM.colors.primary[200],
      textColor: DESIGN_SYSTEM.colors.primary[700]
    },
    warning: {
      backgroundColor: '#fef3c7',
      borderColor: '#fbbf24',
      textColor: '#92400e'
    },
    error: {
      backgroundColor: '#fef2f2',
      borderColor: '#fca5a5',
      textColor: '#991b1b'
    },
    info: {
      backgroundColor: '#eff6ff',
      borderColor: '#93c5fd',
      textColor: '#1e40af'
    }
  };

  const colors = statusColors[status] || statusColors.info;

  return (
    <Card
      title={title}
      subtitle={subtitle}
      icon={icon}
      backgroundColor={colors.backgroundColor}
      borderColor={colors.borderColor}
      {...props}
    >
      {value && (
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: DESIGN_SYSTEM.spacing.xs
        }}>
          <span style={{
            fontSize: DESIGN_SYSTEM.typography.sizes['2xl'],
            fontWeight: DESIGN_SYSTEM.typography.weights.bold,
            color: colors.textColor
          }}>
            {value}
          </span>
          {unit && (
            <span style={{
              fontSize: DESIGN_SYSTEM.typography.sizes.sm,
              color: colors.textColor,
              opacity: 0.8
            }}>
              {unit}
            </span>
          )}
        </div>
      )}
    </Card>
  );
};

// 動作卡片
export const ActionCard = ({ title, subtitle, icon, action, actionText, ...props }) => {
  return (
    <Card
      title={title}
      subtitle={subtitle}
      icon={icon}
      onClick={action}
      hover={true}
      {...props}
    >
      {
         actionText && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: DESIGN_SYSTEM.spacing.md
          }}>
            <div style={{ flex: 1 }} />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: DESIGN_SYSTEM.spacing.xs,
              color: DESIGN_SYSTEM.colors.primary[600],
              fontSize: DESIGN_SYSTEM.typography.sizes.sm,
              fontWeight: DESIGN_SYSTEM.typography.weights.medium
            }}>
              {actionText}
              <span style={{ fontSize: '12px' }}>→</span>
            </div>
          </div>
         )
      }
    </Card>
  );
};

export default Card;