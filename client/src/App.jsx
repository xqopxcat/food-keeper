import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import ScannerViewRTK from './pages/ScannerView';
import InventoryViewRTK from './pages/InventoryView';
import AiIdentificationView from './pages/AiIdentificationView';


export default function App() {
  return (
    <Router>
      <div style={{ fontFamily:'ui-sans-serif, system-ui' }}>
        <Navigation />
        <Routes>
          <Route path="/scanner" element={<ScannerViewRTK />} />
          <Route path="/inventory" element={<InventoryViewRTK />} />
          <Route path="/ai" element={<AiIdentificationView />} />
          <Route path="*" element={<Navigate to="/scanner" replace />} />
        </Routes>
      </div>
    </Router>
  );
}
