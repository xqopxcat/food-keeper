import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import BottomNavigation from './components/BottomNavigation';
import DesktopSidebar from './components/DesktopSidebar';
import ScannerView from './pages/ScannerView';
import InventoryView from './pages/InventoryView';
import AiIdentificationView from './pages/AiIdentificationView';
import { DESIGN_SYSTEM, COMMON_STYLES, CSS_KEYFRAMES } from './styles/designSystem.js';

export default function App() {
  return (
    <Router>
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
          
          @media (min-width: 768px) {
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
                  <Route path="/scanner" element={<ScannerView />} />
                  <Route path="/inventory" element={<InventoryView />} />
                  <Route path="/ai-identification" element={<AiIdentificationView />} />
                  <Route path="/settings" element={<div style={{ padding: '20px', textAlign: 'center', paddingTop: '100px' }}>⚙️ 設定頁面開發中...</div>} />
                  <Route path="*" element={<Navigate to="/ai-identification" replace />} />
                </Routes>
              </div>
            </div>
          </div>

          {/* 移動版佈局 */}
          <div className="mobile-layout">
            <div className="page-container" style={COMMON_STYLES.pageContainer}>
              <Routes>
                <Route path="/scanner" element={<ScannerView />} />
                <Route path="/inventory" element={<InventoryView />} />
                <Route path="/ai-identification" element={<AiIdentificationView />} />
                <Route path="/settings" element={<div style={{ padding: '20px', textAlign: 'center', paddingTop: '100px' }}>⚙️ 設定頁面開發中...</div>} />
                <Route path="*" element={<Navigate to="/ai-identification" replace />} />
              </Routes>
            </div>
            
            <BottomNavigation />
          </div>
        </div>
      </div>
    </Router>
  );
}
