import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { DESIGN_SYSTEM } from '../../styles/designSystem';

const ProtectedRoute = ({ children, requireAuth = true }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: DESIGN_SYSTEM.colors.gray[50],
        background: DESIGN_SYSTEM.colors.gradients.secondary
      }}>
        <div style={{ 
          textAlign: 'center',
          padding: DESIGN_SYSTEM.spacing.xl
        }}>
          {/* Spinner */}
          <div style={{
            width: '48px',
            height: '48px',
            border: `4px solid ${DESIGN_SYSTEM.colors.gray[200]}`,
            borderTop: `4px solid ${DESIGN_SYSTEM.colors.primary[500]}`,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: `0 auto ${DESIGN_SYSTEM.spacing.lg}`
          }} />
          
          {/* Loading Text */}
          <div style={{ 
            fontSize: DESIGN_SYSTEM.typography.sizes.lg,
            fontWeight: DESIGN_SYSTEM.typography.weights.semibold,
            color: DESIGN_SYSTEM.colors.gray[700],
            marginBottom: DESIGN_SYSTEM.spacing.xs
          }}>
            正在載入中
          </div>
        </div>
        
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes bounce {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
          }
        `}</style>
      </div>
    );
  }

  if (requireAuth && !user) {
    // 將當前位置保存到 state，登入後可以重定向回來
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!requireAuth && user) {
    // 已登入用戶訪問登入/註冊頁面時重定向到 dashboard
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;