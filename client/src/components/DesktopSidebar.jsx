import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DESIGN_SYSTEM, COMMON_STYLES } from '../styles/designSystem.js';

const DesktopSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const profileData = localStorage.getItem('userProfile');
    if (profileData) {
      setUserProfile(JSON.parse(profileData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userProfile');
    navigate('/login');
  };

  const navItems = [
    {
      key: 'ai',
      path: '/ai-identification',
      icon: '🤖',
      label: 'AI 識別',
      description: '智慧拍照識別食材'
    },
    {
      key: 'scanner',
      path: '/scanner',
      icon: '📱',
      label: '條碼掃描',
      description: '快速掃描商品條碼'
    },
    {
      key: 'inventory',
      path: '/inventory',
      icon: '📦',
      label: '庫存管理',
      description: '查看和管理食材'
    },
    {
      key: 'settings',
      path: '/settings',
      icon: '⚙️',
      label: '設定',
      description: '應用程式設定'
    }
  ];

  const isActive = (path) => location.pathname === path;

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: DESIGN_SYSTEM.colors.white
    }}>
      {/* Logo 區域 */}
      <div style={{
        padding: `${DESIGN_SYSTEM.spacing.lg} ${DESIGN_SYSTEM.spacing.lg}`,
        borderBottom: `1px solid ${DESIGN_SYSTEM.colors.gray[100]}`,
      }}>
        <h1 style={{
          margin: 0,
          fontSize: DESIGN_SYSTEM.typography.sizes.xl,
          fontWeight: DESIGN_SYSTEM.typography.weights.bold,
          color: DESIGN_SYSTEM.colors.primary[600],
          display: 'flex',
          alignItems: 'center',
          gap: DESIGN_SYSTEM.spacing.sm
        }}>
          🥬 Food Keeper
        </h1>
        <p style={{
          margin: `${DESIGN_SYSTEM.spacing.xs} 0 0 0`,
          fontSize: DESIGN_SYSTEM.typography.sizes.sm,
          color: DESIGN_SYSTEM.colors.gray[600]
        }}>
          智慧食材管理系統
        </p>
      </div>

      {/* 導航項目 */}
      <nav style={{
        flex: 1,
      }}>
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => handleNavigate(item.path)}
            style={{
              width: '100%',
              padding: DESIGN_SYSTEM.spacing.md,
              marginBottom: DESIGN_SYSTEM.spacing.xs,
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backgroundColor: isActive(item.path) 
                ? DESIGN_SYSTEM.colors.primary[50]
                : 'transparent',
              borderLeft: isActive(item.path)
                ? `4px solid ${DESIGN_SYSTEM.colors.primary[500]}`
                : '4px solid transparent'
            }}
            onMouseEnter={(e) => {
              if (!isActive(item.path)) {
                e.target.style.backgroundColor = DESIGN_SYSTEM.colors.gray[50];
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive(item.path)) {
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: DESIGN_SYSTEM.spacing.md
            }}>
              <span style={{
                fontSize: DESIGN_SYSTEM.typography.sizes.lg,
                width: '24px',
                textAlign: 'center'
              }}>
                {item.icon}
              </span>
              
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: DESIGN_SYSTEM.typography.sizes.base,
                  fontWeight: DESIGN_SYSTEM.typography.weights.semibold,
                  color: isActive(item.path) 
                    ? DESIGN_SYSTEM.colors.primary[700]
                    : DESIGN_SYSTEM.colors.gray[900],
                  marginBottom: '2px'
                }}>
                  {item.label}
                </div>
                
                <div style={{
                  fontSize: DESIGN_SYSTEM.typography.sizes.xs,
                  color: isActive(item.path)
                    ? DESIGN_SYSTEM.colors.primary[600]
                    : DESIGN_SYSTEM.colors.gray[500]
                }}>
                  {item.description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </nav>

      {/* 使用者資訊區域 */}
      {userProfile && (
        <div style={{
          padding: DESIGN_SYSTEM.spacing.md,
          borderTop: `1px solid ${DESIGN_SYSTEM.colors.gray[100]}`,
          backgroundColor: DESIGN_SYSTEM.colors.gray[50]
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: DESIGN_SYSTEM.spacing.sm,
            marginBottom: DESIGN_SYSTEM.spacing.md
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: DESIGN_SYSTEM.colors.primary[100],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: DESIGN_SYSTEM.typography.sizes.sm,
              fontWeight: DESIGN_SYSTEM.typography.weights.semibold,
              color: DESIGN_SYSTEM.colors.primary[600]
            }}>
              {userProfile.name ? userProfile.name[0] : '👤'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: DESIGN_SYSTEM.typography.sizes.sm,
                fontWeight: DESIGN_SYSTEM.typography.weights.semibold,
                color: DESIGN_SYSTEM.colors.gray[900],
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {userProfile.name || '使用者'}
              </div>
              <div style={{
                fontSize: DESIGN_SYSTEM.typography.sizes.xs,
                color: DESIGN_SYSTEM.colors.gray[500],
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {userProfile.email}
              </div>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: `${DESIGN_SYSTEM.spacing.sm} ${DESIGN_SYSTEM.spacing.md}`,
              border: `1px solid ${DESIGN_SYSTEM.colors.gray[300]}`,
              borderRadius: DESIGN_SYSTEM.borderRadius.md,
              backgroundColor: DESIGN_SYSTEM.colors.white,
              color: DESIGN_SYSTEM.colors.gray[700],
              fontSize: DESIGN_SYSTEM.typography.sizes.sm,
              fontWeight: DESIGN_SYSTEM.typography.weights.medium,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: DESIGN_SYSTEM.spacing.sm
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = DESIGN_SYSTEM.colors.gray[50];
              e.target.style.borderColor = DESIGN_SYSTEM.colors.gray[400];
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = DESIGN_SYSTEM.colors.white;
              e.target.style.borderColor = DESIGN_SYSTEM.colors.gray[300];
            }}
          >
            <span>🔓</span>
            <span>登出</span>
          </button>
        </div>
      )}

      {/* 底部資訊 */}
      <div style={{
        padding: DESIGN_SYSTEM.spacing.lg,
        borderTop: `1px solid ${DESIGN_SYSTEM.colors.gray[100]}`,
        color: DESIGN_SYSTEM.colors.gray[500],
        fontSize: DESIGN_SYSTEM.typography.sizes.xs,
        textAlign: 'center'
      }}>
        <div>版本 1.0.0</div>
        <div style={{ marginTop: '4px' }}>
          © 2025 Food Keeper
        </div>
      </div>
    </div>
  );
};

export default DesktopSidebar;