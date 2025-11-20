import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DESIGN_SYSTEM, COMMON_STYLES } from '../styles/designSystem.js';
import { useAuth } from '../contexts/AuthContext';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import GoogleAuthButton from '../components/Auth/GoogleAuthButton';

const LoginView = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { isMobile } = useDeviceDetection();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

   // 如果已經登入，重定向到 dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);
  
  // 處理 Google Auth 錯誤
  const handleGoogleAuthError = (errorMessage) => {
    setError(errorMessage);
    setIsLoading(false);
  };

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

        {/* Google Login Button */}
        <GoogleAuthButton 
          mode="login" 
          onLoading={setIsLoading}
          onError={handleGoogleAuthError}
        />
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