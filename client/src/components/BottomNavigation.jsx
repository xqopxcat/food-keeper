import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DESIGN_SYSTEM, COMMON_STYLES } from '../styles/designSystem.js';

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      key: 'scanner',
      path: '/scanner',
      icon: '📱',
      label: '掃描',
      activeIcon: '📱'
    },
    {
      key: 'ai',
      path: '/ai-identification',
      icon: '🤖',
      label: 'AI識別',
      activeIcon: '🤖'
    },
    {
      key: 'inventory',
      path: '/inventory',
      icon: '📦',
      label: '庫存',
      activeIcon: '📦'
    },
    {
      key: 'settings',
      path: '/settings',
      icon: '⚙️',
      label: '設定',
      activeIcon: '⚙️'
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div 
      className="bottom-navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: DESIGN_SYSTEM.layout.bottomNavHeight,
        backgroundColor: DESIGN_SYSTEM.colors.white,
        borderTop: `1px solid ${DESIGN_SYSTEM.colors.gray[100]}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: 'env(safe-area-inset-bottom)', // iPhone X+ 底部安全區域
        zIndex: 1000,
      boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)'
    }}>
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        
        return (
          <button
            key={item.key}
            onClick={() => handleNavigation(item.path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: `${DESIGN_SYSTEM.spacing.sm} ${DESIGN_SYSTEM.spacing.md}`,
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: DESIGN_SYSTEM.borderRadius.md,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minWidth: '60px',
              position: 'relative'
            }}
          >
            {/* 活動狀態背景 */}
            {isActive && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '48px',
                height: '32px',
                backgroundColor: DESIGN_SYSTEM.colors.primary[50],
                borderRadius: DESIGN_SYSTEM.borderRadius.lg,
                zIndex: -1
              }} />
            )}
            
            {/* 圖示 */}
            <div style={{
              fontSize: '24px',
              marginBottom: DESIGN_SYSTEM.spacing.xs,
              transform: isActive ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.2s ease'
            }}>
              {isActive ? item.activeIcon : item.icon}
            </div>
            
            {/* 標籤 */}
            <span style={{
              fontSize: DESIGN_SYSTEM.typography.sizes.xs,
              fontWeight: isActive ? DESIGN_SYSTEM.typography.weights.semibold : DESIGN_SYSTEM.typography.weights.normal,
              color: isActive ? DESIGN_SYSTEM.colors.primary[600] : DESIGN_SYSTEM.colors.gray[600],
              transition: 'color 0.2s ease'
            }}>
              {item.label}
            </span>
            
            {/* 活動指示器 */}
            {isActive && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '4px',
                height: '4px',
                backgroundColor: DESIGN_SYSTEM.colors.primary[500],
                borderRadius: DESIGN_SYSTEM.borderRadius.full
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default BottomNavigation;