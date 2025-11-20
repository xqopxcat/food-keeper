import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import BottomNavigation from './components/BottomNavigation';
import DesktopSidebar from './components/DesktopSidebar';
import ScannerView from './pages/ScannerView';
import InventoryView from './pages/InventoryView';
import AiIdentificationView from './pages/AiIdentificationView';
import SettingsView from './pages/SettingsView';
import LoginView from './pages/LoginView';
import { DESIGN_SYSTEM, COMMON_STYLES, CSS_KEYFRAMES } from './styles/designSystem.js';

// 主要應用組件
const AppContent = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div style={{ 
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      backgroundColor: DESIGN_SYSTEM.colors.gray[50],
      minHeight: '100vh',
      width: '100vw',
      position: 'relative',
      margin: 0,
      padding: 0
    }}>
      {/* 注入全局 CSS 動畫和響應式樣式 */}
      <style dangerouslySetInnerHTML={{ __html: `
        ${CSS_KEYFRAMES}
        
        /* 全局重置 */
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }
        
        /* 響應式容器 */
        .responsive-container {
          width: 100%;
          max-width: 100%;
          margin: 24px auto;
          padding: 0 16px;
        }
        
        @media (minWidth: 768px) {
          .responsive-container {
            max-width: 768px;
            padding: 0 24px;
          }
        }
        
        @media (min-width: 1024px) {
          .responsive-container {
            max-width: 1200px;
            padding: 0 32px;
          }
          
          /* 桌面版顯示，移動版隱藏 */
          .desktop-layout {
            display: flex !important;
            min-height: 100vh;
          }
          
          .mobile-layout {
            display: none !important;
          }
          
          .desktop-sidebar {
            width: 240px;
            background: white;
            border-right: 1px solid #e5e7eb;
            padding: 0;
            position: fixed;
            left: 0;
            top: 0;
            height: 100vh;
            z-index: 1000;
          }
          
          .desktop-main {
            margin-left: 240px;
            flex: 1;
            width: calc(100% - 240px);
            max-width: calc(100% - 240px);
            overflow-x: hidden;
          }
        }
        
        /* 響應式網格 */
        .grid-responsive-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        
        @media (min-width: 768px) {
          .grid-responsive-stats {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        
        .grid-responsive-actions {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 16px;
        }
        
        @media (min-width: 768px) {
          .grid-responsive-actions {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      ` }} />
      
      <div style={{
        width: '100vw',
        maxWidth: '100vw',
        overflowX: 'hidden'
      }}>
        {/* 登入頁面 - 全螢幕無導航 */}
        {isLoginPage ? (
          <Routes>
            <Route path="/login" element={<LoginView />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        ) : (
          <>
            {/* 桌面版佈局 */}
            <div className="desktop-layout" style={{
              display: 'none'
            }}>
              {/* 桌面版側邊欄導航 */}
              <div className="desktop-sidebar">
                <DesktopSidebar />
              </div>
              
              {/* 桌面版主內容區 */}
              <div className="desktop-main">
                <div className="page-container" style={{
                  ...COMMON_STYLES.pageContainer,
                  paddingBottom: 0
                }}>
                  <Routes>
                    <Route path="/scanner" element={<ProtectedRoute><ScannerView /></ProtectedRoute>} />
                    <Route path="/inventory" element={<ProtectedRoute><InventoryView /></ProtectedRoute>} />
                    <Route path="/ai-identification" element={<ProtectedRoute><AiIdentificationView /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><SettingsView /></ProtectedRoute>} />
                    <Route path="*" element={<Navigate to="/ai-identification" replace />} />
                  </Routes>
                </div>
              </div>
            </div>

            {/* 移動版佈局 */}
            <div className="mobile-layout">
              <div className="page-container" style={COMMON_STYLES.pageContainer}>
                <Routes>
                  <Route path="/scanner" element={<ProtectedRoute><ScannerView /></ProtectedRoute>} />
                  <Route path="/inventory" element={<ProtectedRoute><InventoryView /></ProtectedRoute>} />
                  <Route path="/ai-identification" element={<ProtectedRoute><AiIdentificationView /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><SettingsView /></ProtectedRoute>} />
                  <Route path="*" element={<Navigate to="/ai-identification" replace />} />
                </Routes>
              </div>
              
              <BottomNavigation />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
