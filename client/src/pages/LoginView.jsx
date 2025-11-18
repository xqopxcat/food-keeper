import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DESIGN_SYSTEM, COMMON_STYLES } from '../styles/designSystem.js';

const LoginView = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 檢查是否已經登入
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      navigate('/ai-identification');
    }
  }, [navigate]);

  // Google OAuth 登入處理
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 這裡將來會整合實際的 Google OAuth API
      // 目前先模擬登入流程
      
      // 模擬 API 調用延遲
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 模擬成功登入
      const mockToken = 'mock_jwt_token_' + Date.now();
      const mockUser = {
        id: 'google_123456789',
        email: 'user@gmail.com',
        name: '使用者',
        picture: 'https://via.placeholder.com/96'
      };
      
      localStorage.setItem('authToken', mockToken);
      localStorage.setItem('userProfile', JSON.stringify(mockUser));
      
      // 導向主頁面
      navigate('/ai-identification');
      
    } catch (err) {
      setError('登入失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: DESIGN_SYSTEM.colors.gradients.soft,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: DESIGN_SYSTEM.spacing.lg,
      boxSizing: 'border-box'
    }}>
      {/* 登入卡片 */}
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: DESIGN_SYSTEM.colors.white,
        borderRadius: DESIGN_SYSTEM.borderRadius.xl,
        boxShadow: DESIGN_SYSTEM.shadows.floating,
        padding: `${DESIGN_SYSTEM.spacing.xxl} ${DESIGN_SYSTEM.spacing.xl}`,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* 背景裝飾 */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-30%',
          width: '200px',
          height: '200px',
          background: DESIGN_SYSTEM.colors.gradients.primary,
          borderRadius: '50%',
          opacity: 0.1,
          filter: 'blur(40px)'
        }} />
        
        <div style={{
          position: 'absolute',
          bottom: '-30%',
          left: '-20%',
          width: '150px',
          height: '150px',
          background: DESIGN_SYSTEM.colors.primary[300],
          borderRadius: '50%',
          opacity: 0.1,
          filter: 'blur(30px)'
        }} />

        {/* Logo 區域 */}
        <div style={{
          marginBottom: DESIGN_SYSTEM.spacing.xxl,
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: DESIGN_SYSTEM.spacing.md,
            filter: 'drop-shadow(0 4px 12px rgba(14, 165, 233, 0.2))'
          }}>
            🥬
          </div>
          
          <h1 style={{
            margin: 0,
            fontSize: DESIGN_SYSTEM.typography.sizes.xxl,
            fontWeight: DESIGN_SYSTEM.typography.weights.bold,
            background: DESIGN_SYSTEM.colors.gradients.primary,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: DESIGN_SYSTEM.spacing.sm
          }}>
            Food Keeper
          </h1>
          
          <p style={{
            margin: 0,
            fontSize: DESIGN_SYSTEM.typography.sizes.base,
            color: DESIGN_SYSTEM.colors.gray[600],
            lineHeight: '1.6',
            fontWeight: DESIGN_SYSTEM.typography.weights.medium
          }}>
            智慧食材管理系統
            <br />
            讓 AI 幫你管理食材保存期限
          </p>
        </div>

        {/* 功能預覽 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: DESIGN_SYSTEM.spacing.md,
          marginBottom: DESIGN_SYSTEM.spacing.xxl,
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            padding: DESIGN_SYSTEM.spacing.md,
            backgroundColor: DESIGN_SYSTEM.colors.primary[50],
            borderRadius: DESIGN_SYSTEM.borderRadius.lg,
            border: `1px solid ${DESIGN_SYSTEM.colors.primary[200]}`
          }}>
            <div style={{ 
              fontSize: '24px', 
              marginBottom: DESIGN_SYSTEM.spacing.xs 
            }}>🤖</div>
            <div style={{
              fontSize: DESIGN_SYSTEM.typography.sizes.xs,
              color: DESIGN_SYSTEM.colors.primary[700],
              fontWeight: '600'
            }}>
              AI 識別
            </div>
          </div>
          
          <div style={{
            padding: DESIGN_SYSTEM.spacing.md,
            backgroundColor: DESIGN_SYSTEM.colors.secondary[50],
            borderRadius: DESIGN_SYSTEM.borderRadius.lg,
            border: `1px solid ${DESIGN_SYSTEM.colors.gray[200]}`
          }}>
            <div style={{ 
              fontSize: '24px', 
              marginBottom: DESIGN_SYSTEM.spacing.xs 
            }}>📱</div>
            <div style={{
              fontSize: DESIGN_SYSTEM.typography.sizes.xs,
              color: DESIGN_SYSTEM.colors.gray[700],
              fontWeight: '600'
            }}>
              條碼掃描
            </div>
          </div>
          
          <div style={{
            padding: DESIGN_SYSTEM.spacing.md,
            backgroundColor: DESIGN_SYSTEM.colors.success + '20',
            borderRadius: DESIGN_SYSTEM.borderRadius.lg,
            border: `1px solid ${DESIGN_SYSTEM.colors.success}40`
          }}>
            <div style={{ 
              fontSize: '24px', 
              marginBottom: DESIGN_SYSTEM.spacing.xs 
            }}>📦</div>
            <div style={{
              fontSize: DESIGN_SYSTEM.typography.sizes.xs,
              color: DESIGN_SYSTEM.colors.success,
              fontWeight: '600'
            }}>
              庫存管理
            </div>
          </div>
        </div>

        {/* Google 登入按鈕 */}
        <div style={{
          position: 'relative',
          zIndex: 1
        }}>
          {error && (
            <div style={{
              padding: DESIGN_SYSTEM.spacing.md,
              marginBottom: DESIGN_SYSTEM.spacing.lg,
              backgroundColor: DESIGN_SYSTEM.colors.error + '10',
              border: `1px solid ${DESIGN_SYSTEM.colors.error}30`,
              borderRadius: DESIGN_SYSTEM.borderRadius.lg,
              color: DESIGN_SYSTEM.colors.error,
              fontSize: DESIGN_SYSTEM.typography.sizes.sm
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: DESIGN_SYSTEM.spacing.sm,
                justifyContent: 'center'
              }}>
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: `${DESIGN_SYSTEM.spacing.lg} ${DESIGN_SYSTEM.spacing.xl}`,
              backgroundColor: DESIGN_SYSTEM.colors.white,
              border: `2px solid ${DESIGN_SYSTEM.colors.gray[300]}`,
              borderRadius: DESIGN_SYSTEM.borderRadius.xl,
              fontSize: DESIGN_SYSTEM.typography.sizes.base,
              fontWeight: DESIGN_SYSTEM.typography.weights.semibold,
              color: DESIGN_SYSTEM.colors.gray[700],
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: DESIGN_SYSTEM.spacing.md,
              position: 'relative',
              overflow: 'hidden',
              opacity: isLoading ? 0.7 : 1,
              transform: isLoading ? 'scale(0.98)' : 'scale(1)',
              boxShadow: isLoading ? 'none' : DESIGN_SYSTEM.shadows.button
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.borderColor = DESIGN_SYSTEM.colors.primary[400];
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = DESIGN_SYSTEM.shadows.lg;
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.borderColor = DESIGN_SYSTEM.colors.gray[300];
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = DESIGN_SYSTEM.shadows.button;
              }
            }}
          >
            {isLoading ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: `2px solid ${DESIGN_SYSTEM.colors.gray[300]}`,
                  borderTop: `2px solid ${DESIGN_SYSTEM.colors.primary[500]}`,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <span>登入中...</span>
              </>
            ) : (
              <>
                {/* Google Icon */}
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>使用 Google 帳號登入</span>
              </>
            )}
          </button>

          {/* 登入說明 */}
          <p style={{
            margin: `${DESIGN_SYSTEM.spacing.lg} 0 0 0`,
            fontSize: DESIGN_SYSTEM.typography.sizes.xs,
            color: DESIGN_SYSTEM.colors.gray[500],
            lineHeight: '1.5'
          }}>
            登入即表示您同意我們的服務條款和隱私政策
            <br />
            我們僅會使用您的基本資料來提供個人化服務
          </p>
        </div>
      </div>

      {/* 底部版本資訊 */}
      <div style={{
        position: 'absolute',
        bottom: DESIGN_SYSTEM.spacing.lg,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: DESIGN_SYSTEM.typography.sizes.xs,
        color: DESIGN_SYSTEM.colors.gray[500],
        textAlign: 'center'
      }}>
        <div>Food Keeper v1.0.0</div>
        <div style={{ marginTop: '4px' }}>© 2025 智慧食材管理系統</div>
      </div>

      {/* 載入時的動畫樣式 */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
        `
      }} />
    </div>
  );
};

export default LoginView;