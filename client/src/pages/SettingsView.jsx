import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderBar from '../components/HeaderBar';
import { useAuth } from '../contexts/AuthContext.jsx';
import { DESIGN_SYSTEM, COMMON_STYLES } from '../styles/designSystem.js';

const SettingsView = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    // 顯示確認對話框
    if (window.confirm('確定要登出嗎？')) {
      logout();
      navigate('/login');
    }
  };

  const settingsItems = [
    {
      icon: '🔔',
      title: '通知設定',
      description: '管理應用程式通知',
      action: () => alert('通知設定功能開發中...')
    },
    {
      icon: '🎨',
      title: '主題設定',
      description: '選擇應用程式主題',
      action: () => alert('主題設定功能開發中...')
    },
    {
      icon: '📱',
      title: '關於應用程式',
      description: '版本資訊和使用條款',
      action: () => alert('關於應用程式功能開發中...')
    },
    {
      icon: '❓',
      title: '幫助與支援',
      description: '常見問題和客服聯繫',
      action: () => alert('幫助與支援功能開發中...')
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: DESIGN_SYSTEM.colors.gray[50],
      paddingBottom: DESIGN_SYSTEM.layout.bottomNavHeight
    }}>
      <HeaderBar title="設定" />
      
      <div className="responsive-container" style={{
        paddingTop: DESIGN_SYSTEM.spacing.lg,
        paddingBottom: DESIGN_SYSTEM.spacing.xl
      }}>
        {/* 使用者資訊卡片 */}
        {user && (
          <div style={{
            ...COMMON_STYLES.card,
            marginBottom: DESIGN_SYSTEM.spacing.lg,
            padding: DESIGN_SYSTEM.spacing.lg
          }}>
            <h3 style={{
              margin: 0,
              marginBottom: DESIGN_SYSTEM.spacing.lg,
              fontSize: DESIGN_SYSTEM.typography.sizes.lg,
              fontWeight: DESIGN_SYSTEM.typography.weights.semibold,
              color: DESIGN_SYSTEM.colors.gray[900]
            }}>
              帳戶資訊
            </h3>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: DESIGN_SYSTEM.spacing.md,
              marginBottom: DESIGN_SYSTEM.spacing.lg
            }}>
              <img 
                src={user.profile.avatar} 
                alt={user.username}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
              
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: DESIGN_SYSTEM.typography.sizes.lg,
                  fontWeight: DESIGN_SYSTEM.typography.weights.semibold,
                  color: DESIGN_SYSTEM.colors.gray[900],
                  marginBottom: DESIGN_SYSTEM.spacing.xs
                }}>
                  { user.username }
                </div>
                <div style={{
                  fontSize: DESIGN_SYSTEM.typography.sizes.sm,
                  color: DESIGN_SYSTEM.colors.gray[600]
                }}>
                  {user.email}
                </div>
              </div>
              
              <div style={{
                padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.sm}`,
                backgroundColor: DESIGN_SYSTEM.colors.success + '20',
                borderRadius: DESIGN_SYSTEM.borderRadius.md,
                fontSize: DESIGN_SYSTEM.typography.sizes.xs,
                fontWeight: DESIGN_SYSTEM.typography.weights.semibold,
                color: DESIGN_SYSTEM.colors.success
              }}>
                已驗證
              </div>
            </div>
          </div>
        )}

        {/* 設定選項 */}
        <div style={{
          ...COMMON_STYLES.card,
          marginBottom: DESIGN_SYSTEM.spacing.lg,
          padding: 0,
          overflow: 'hidden'
        }}>
          <h3 style={{
            margin: 0,
            padding: DESIGN_SYSTEM.spacing.lg,
            paddingBottom: 0,
            fontSize: DESIGN_SYSTEM.typography.sizes.lg,
            fontWeight: DESIGN_SYSTEM.typography.weights.semibold,
            color: DESIGN_SYSTEM.colors.gray[900]
          }}>
            應用程式設定
          </h3>
          
          {settingsItems.map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              style={{
                width: '100%',
                padding: DESIGN_SYSTEM.spacing.lg,
                border: 'none',
                borderBottom: index < settingsItems.length - 1 ? `1px solid ${DESIGN_SYSTEM.colors.gray[100]}` : 'none',
                backgroundColor: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: DESIGN_SYSTEM.spacing.md
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = DESIGN_SYSTEM.colors.gray[50];
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: DESIGN_SYSTEM.borderRadius.lg,
                backgroundColor: DESIGN_SYSTEM.colors.primary[50],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                {item.icon}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: DESIGN_SYSTEM.typography.sizes.base,
                  fontWeight: DESIGN_SYSTEM.typography.weights.semibold,
                  color: DESIGN_SYSTEM.colors.gray[900],
                  marginBottom: DESIGN_SYSTEM.spacing.xs
                }}>
                  {item.title}
                </div>
                <div style={{
                  fontSize: DESIGN_SYSTEM.typography.sizes.sm,
                  color: DESIGN_SYSTEM.colors.gray[600]
                }}>
                  {item.description}
                </div>
              </div>
              
              <div style={{
                fontSize: DESIGN_SYSTEM.typography.sizes.lg,
                color: DESIGN_SYSTEM.colors.gray[400]
              }}>
                ›
              </div>
            </button>
          ))}
        </div>

        {/* 登出按鈕 */}
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: `${DESIGN_SYSTEM.spacing.lg} ${DESIGN_SYSTEM.spacing.xl}`,
            backgroundColor: DESIGN_SYSTEM.colors.white,
            border: `2px solid ${DESIGN_SYSTEM.colors.error}30`,
            borderRadius: DESIGN_SYSTEM.borderRadius.lg,
            fontSize: DESIGN_SYSTEM.typography.sizes.base,
            fontWeight: DESIGN_SYSTEM.typography.weights.semibold,
            color: DESIGN_SYSTEM.colors.error,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: DESIGN_SYSTEM.spacing.sm,
            boxShadow: DESIGN_SYSTEM.shadows.button
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = DESIGN_SYSTEM.colors.error + '10';
            e.target.style.borderColor = DESIGN_SYSTEM.colors.error + '60';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = DESIGN_SYSTEM.shadows.md;
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = DESIGN_SYSTEM.colors.white;
            e.target.style.borderColor = DESIGN_SYSTEM.colors.error + '30';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = DESIGN_SYSTEM.shadows.button;
          }}
        >
          <span style={{ fontSize: '20px' }}>🔓</span>
          <span>登出帳戶</span>
        </button>

        {/* 版本資訊 */}
        <div style={{
          marginTop: DESIGN_SYSTEM.spacing.xl,
          textAlign: 'center',
          color: DESIGN_SYSTEM.colors.gray[500],
          fontSize: DESIGN_SYSTEM.typography.sizes.sm
        }}>
          <div>Food Keeper v1.0.0</div>
          <div style={{ marginTop: DESIGN_SYSTEM.spacing.xs }}>
            © 2025 智慧食材管理系統
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;