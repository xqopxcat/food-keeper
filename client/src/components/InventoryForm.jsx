import React from 'react';
import { unitOptions, locationOptions } from '../constants/index.jsx';

/**
 * 庫存表單組件
 * 統一處理數量、日期、位置、備註等庫存相關輸入
 */
const InventoryForm = ({ 
  inventoryData,
  onInventoryDataChange,
  disabled = false,
  style = {}
}) => {
  const handleQuantityAmountChange = (amount) => {
    onInventoryDataChange({
      ...inventoryData,
      quantity: { 
        ...inventoryData.quantity, 
        amount: parseFloat(amount) || 0 
      }
    });
  };

  const handleQuantityUnitChange = (unit) => {
    onInventoryDataChange({
      ...inventoryData,
      quantity: { 
        ...inventoryData.quantity, 
        unit 
      }
    });
  };

  const handleFieldChange = (field, value) => {
    onInventoryDataChange({
      ...inventoryData,
      [field]: value
    });
  };

  return (
    <div style={{ 
      padding: 12, 
      border: '1px solid #e5e7eb', 
      borderRadius: 8, 
      backgroundColor: '#f9fafb',
      ...style 
    }}>
      <h4 style={{ 
        margin: '0 0 12px 0', 
        color: '#374151', 
        fontSize: '16px',
        fontWeight: '600'
      }}>
        📦 庫存資訊
      </h4>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, minmax(160px, 1fr))', 
        gap: 12 
      }}>
        {/* 數量輸入 */}
        <label>
          <span style={{ 
            display: 'block',
            fontSize: '14px', 
            fontWeight: '500', 
            color: '#374151',
            marginBottom: '6px'
          }}>
            數量
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <input
              type="number"
              min="0"
              step="1"
              value={inventoryData.quantity?.amount || 0}
              onChange={e => handleQuantityAmountChange(e.target.value)}
              disabled={disabled}
              style={{ 
                flex: 1, 
                padding: '8px 10px', 
                border: '1px solid #d1d5db', 
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: disabled ? '#f3f4f6' : 'white'
              }}
            />
            <select 
              value={inventoryData.quantity?.unit || '個'}
              onChange={e => handleQuantityUnitChange(e.target.value)}
              disabled={disabled}
              style={{ 
                padding: '8px 10px', 
                border: '1px solid #d1d5db', 
                borderRadius: '6px',
                fontSize: '14px',
                minWidth: '70px',
                backgroundColor: disabled ? '#f3f4f6' : 'white'
              }}
            >
              {unitOptions.map(unit => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
          </div>
        </label>

        {/* 購買日期 */}
        <label>
          <span style={{ 
            display: 'block',
            fontSize: '14px', 
            fontWeight: '500', 
            color: '#374151',
            marginBottom: '6px'
          }}>
            購買日期
          </span>
          <input
            type="date"
            value={inventoryData.purchaseDate || ''}
            onChange={e => handleFieldChange('purchaseDate', e.target.value)}
            disabled={disabled}
            style={{ 
              width: '100%', 
              padding: '8px 10px', 
              border: '1px solid #d1d5db', 
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: disabled ? '#f3f4f6' : 'white'
            }}
          />
        </label>

        {/* 存放位置 */}
        <label>
          <span style={{ 
            display: 'block',
            fontSize: '14px', 
            fontWeight: '500', 
            color: '#374151',
            marginBottom: '6px'
          }}>
            存放位置
          </span>
          <select 
            value={inventoryData.location || 'fridge_main'}
            onChange={e => handleFieldChange('location', e.target.value)}
            disabled={disabled}
            style={{ 
              width: '100%', 
              padding: '8px 10px', 
              border: '1px solid #d1d5db', 
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: disabled ? '#f3f4f6' : 'white'
            }}
          >
            <option value="fridge_main">🧊 冰箱主層</option>
            <option value="fridge_freezer">❄️ 冷凍庫</option>
            <option value="fridge_door">🚪 冰箱門</option>
            <option value="pantry">🏠 食品櫃</option>
            <option value="counter">🍽️ 檯面</option>
            <option value="cabinet">🗄️ 櫥櫃</option>
          </select>
        </label>

        {/* 備註 */}
        <label>
          <span style={{ 
            display: 'block',
            fontSize: '14px', 
            fontWeight: '500', 
            color: '#374151',
            marginBottom: '6px'
          }}>
            備註
          </span>
          <input
            type="text"
            placeholder="例：有機、特價、剩餘..."
            value={inventoryData.notes || ''}
            onChange={e => handleFieldChange('notes', e.target.value)}
            disabled={disabled}
            style={{ 
              width: '100%', 
              padding: '8px 10px', 
              border: '1px solid #d1d5db', 
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: disabled ? '#f3f4f6' : 'white'
            }}
          />
        </label>
      </div>
    </div>
  );
};

export default InventoryForm;