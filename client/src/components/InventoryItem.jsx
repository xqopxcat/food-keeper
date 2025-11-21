import React from 'react';
import { urgencyConfig } from '../constants';

/**
 * 庫存項目組件
 * 統一庫存項目的顯示格式和操作按鈕
 */
const InventoryItem = ({ 
  item,
  isSelected = false,
  onSelect = () => {},
  onStatusUpdate = () => {},
  onDelete = () => {},
  showCheckbox = true,
  style = {}
}) => {
  // 格式化日期顯示
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const today = new Date();
    const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '明天';
    if (diffDays === -1) return '昨天';
    if (diffDays > 0) return `${diffDays} 天後`;
    return `${Math.abs(diffDays)} 天前`;
  };

  // 獲取緊急程度配置
  const urgency = urgencyConfig[item.urgency] || { color: '#6b7280', icon: '⚪' };

  return (
    <div 
      style={{
        padding: 16,
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        backgroundColor: item.status === 'consumed' ? '#f9fafb' : 'white',
        borderLeftWidth: 4,
        borderLeftColor: item.status === 'consumed' ? '#9ca3af' : urgency.color,
        opacity: item.status === 'consumed' ? 0.7 : 1,
        ...style
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* 選擇框 */}
        {showCheckbox && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            disabled={item.status === 'consumed'}
            style={{ cursor: item.status === 'consumed' ? 'not-allowed' : 'pointer' }}
          />
        )}
        
        {/* 主要內容 */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            {/* 左側信息 */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h4 style={{ 
                  margin: 0, 
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#1f2937',
                  textDecoration: item.status === 'consumed' ? 'line-through' : 'none'
                }}>
                  {item.name}
                </h4>
                {item.status === 'consumed' && (
                  <span style={{
                    fontSize: 12,
                    padding: '2px 8px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    borderRadius: '12px',
                    fontWeight: '500'
                  }}>
                    ✅ 已消耗
                  </span>
                )}
              </div>
              
              {/* 品牌 */}
              {item.brand && (
                <div style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }}>
                  {item.brand}
                </div>
              )}
              
              {/* 數量、位置、保存方式 */}
              <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
                {item.quantity?.amount || 1} {item.quantity?.unit || '個'} • {' '}
                {item.location?.replace('_', ' ') || 'unknown'} • {' '}
                {item.storageMode}
              </div>
            </div>
            
            {/* 右側到期信息 */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ 
                fontSize: 14, 
                fontWeight: '600',
                color: urgency.color
              }}>
                {urgency.icon} {formatDate(item.expiresMaxAt)}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                {item.daysLeft !== null ? 
                  (item.daysLeft >= 0 ? `還有 ${item.daysLeft} 天` : `過期 ${Math.abs(item.daysLeft)} 天`) : 
                  '未知'
                }
              </div>
            </div>
          </div>
          
          {/* 備註 */}
          {item.notes && (
            <div style={{ 
              fontSize: 12, 
              color: '#6b7280', 
              marginTop: 8,
              padding: '6px 8px',
              backgroundColor: '#f9fafb',
              borderRadius: '4px',
              borderLeft: '3px solid #e5e7eb'
            }}>
              {item.notes}
            </div>
          )}
          
          {/* 操作按鈕 */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {item.status === 'consumed' ? (
              <>
                <button 
                  onClick={() => onStatusUpdate(item._id, 'fresh')}
                  style={{ 
                    padding: '6px 12px', 
                    fontSize: 12, 
                    backgroundColor: '#3b82f6', 
                    color: 'white',
                    border: 'none', 
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  恢復庫存
                </button>
                
                <button 
                  onClick={() => onDelete(item._id)}
                  style={{ 
                    padding: '6px 12px', 
                    fontSize: 12, 
                    backgroundColor: '#ef4444', 
                    color: 'white',
                    border: 'none', 
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  刪除
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => onStatusUpdate(item._id, 'consumed')}
                  style={{ 
                    padding: '6px 12px', 
                    fontSize: 12, 
                    backgroundColor: '#10b981', 
                    color: 'white',
                    border: 'none', 
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  標記已消耗
                </button>
                
                <button 
                  onClick={() => onDelete(item._id)}
                  style={{ 
                    padding: '6px 12px', 
                    fontSize: 12, 
                    backgroundColor: '#ef4444', 
                    color: 'white',
                    border: 'none', 
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  刪除
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryItem;