import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import ScannerView from './pages/ScannerView';
import InventoryView from './pages/InventoryView';


export default function App() {
  return (
    <Router>
      <div style={{ fontFamily:'ui-sans-serif, system-ui' }}>
        <Navigation />
        <Routes>
          <Route path="/scanner" element={<ScannerView />} />
          <Route path="/inventory" element={<InventoryView />} />
          <Route path="*" element={<Navigate to="/scanner" replace />} />
        </Routes>
      </div>
    </Router>
  );
}
