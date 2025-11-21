import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
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
  sticky = true,
  showUserProfile = true // 新增：是否顯示使用者資訊
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // 點擊外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowDropdown(false);
  };
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
        gap: DESIGN_SYSTEM.spacing.sm,
        minWidth: '60px',
        justifyContent: 'flex-end'
      }}>
        {rightButton}
        
        {/* 使用者資訊按鈕 */}
        {showUserProfile && user && (
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                padding: DESIGN_SYSTEM.spacing.md,
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = DESIGN_SYSTEM.colors.gray[100];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {user.profile?.avatar ? (
                <img 
                  src={user.profile.avatar} 
                  alt={user.username}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
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
                  {user?.username ? user.username[0].toUpperCase() : '👤'}
                </div>
              )}
            </button>

            {/* 下拉選單 */}
            {showDropdown && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                minWidth: '200px',
                backgroundColor: DESIGN_SYSTEM.colors.white,
                border: `1px solid ${DESIGN_SYSTEM.colors.gray[200]}`,
                borderRadius: DESIGN_SYSTEM.borderRadius.lg,
                boxShadow: DESIGN_SYSTEM.shadows.lg,
                zIndex: 1000,
                overflow: 'hidden'
              }}>
                {/* 使用者資訊 */}
                <div style={{
                  padding: DESIGN_SYSTEM.spacing.md,
                  borderBottom: `1px solid ${DESIGN_SYSTEM.colors.gray[100]}`
                }}>
                  <div style={{
                    fontSize: DESIGN_SYSTEM.typography.sizes.sm,
                    fontWeight: DESIGN_SYSTEM.typography.weights.semibold,
                    color: DESIGN_SYSTEM.colors.gray[900],
                    marginBottom: '4px'
                  }}>
                    {user.username || '使用者'}
                  </div>
                  <div style={{
                    fontSize: DESIGN_SYSTEM.typography.sizes.xs,
                    color: DESIGN_SYSTEM.colors.gray[500]
                  }}>
                    {user.email}
                  </div>
                </div>

                {/* 登出按鈕 */}
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    padding: DESIGN_SYSTEM.spacing.md,
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: DESIGN_SYSTEM.colors.gray[700],
                    fontSize: DESIGN_SYSTEM.typography.sizes.sm,
                    fontWeight: DESIGN_SYSTEM.typography.weights.medium,
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: DESIGN_SYSTEM.spacing.sm,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = DESIGN_SYSTEM.colors.gray[50];
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  <span>🔓</span>
                  <span>登出</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeaderBar;