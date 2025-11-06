import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const Navigation = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav style={{
      backgroundColor: '#1f2937',
      color: 'white',
      padding: '12px 16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <h1 style={{ margin: 0, fontSize: '20px' }}>🍎 Food Keeper</h1>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Link
          to="/scanner"
          style={{
            padding: '6px 12px',
            backgroundColor: currentPath === '/scanner' ? '#3b82f6' : 'transparent',
            color: 'white',
            border: '1px solid #6b7280',
            borderRadius: '6px',
            textDecoration: 'none',
            display: 'block',
            fontSize: '14px'
          }}
        >
          📷 掃描
        </Link>
        <Link
          to="/inventory"
          style={{
            padding: '6px 12px',
            backgroundColor: currentPath === '/inventory' ? '#3b82f6' : 'transparent',
            color: 'white',
            border: '1px solid #6b7280',
            borderRadius: '6px',
            textDecoration: 'none',
            display: 'block',
            fontSize: '14px'
          }}
        >
          📦 庫存
        </Link>
      </div>
    </nav>
  )
}

export default Navigation