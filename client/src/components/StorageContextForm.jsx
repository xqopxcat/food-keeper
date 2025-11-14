import React from 'react';

/**
 * 保存情境表單組件
 * 統一處理保存方式、狀態、容器、季節、地區等選擇
 */
const StorageContextForm = ({ 
  facts,
  onFactsChange,
  disabled = false,
  style = {}
}) => {
  const handleFieldChange = (field, value) => {
    onFactsChange({
      ...facts,
      [field]: value
    });
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: disabled ? '#f3f4f6' : 'white'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px'
  };

  return (
    <div style={{ 
      padding: 12, 
      border: '1px solid #e5e7eb', 
      borderRadius: 8, 
      backgroundColor: '#ffffff',
      ...style 
    }}>
      <h4 style={{ 
        margin: '0 0 12px 0', 
        color: '#374151', 
        fontSize: '16px',
        fontWeight: '600'
      }}>
        🌡️ 保存情境
      </h4>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, minmax(160px, 1fr))', 
        gap: 12 
      }}>
        {/* 保存方式 */}
        <label>
          <span style={labelStyle}>保存方式</span>
          <select 
            value={facts.storageMode || 'fridge'}
            onChange={e => handleFieldChange('storageMode', e.target.value)}
            disabled={disabled}
            style={inputStyle}
          >
            <option value="room">🌡️ 室溫</option>
            <option value="fridge">🧊 冷藏</option>
            <option value="freezer">❄️ 冷凍</option>
          </select>
        </label>

        {/* 食材狀態 */}
        <label>
          <span style={labelStyle}>食材狀態</span>
          <select 
            value={facts.state || 'whole'}
            onChange={e => handleFieldChange('state', e.target.value)}
            disabled={disabled}
            style={inputStyle}
          >
            <option value="whole">🟢 完整</option>
            <option value="cut">🔪 切開</option>
            <option value="opened">📦 開封</option>
            <option value="cooked">🍳 熟食</option>
          </select>
        </label>

        {/* 容器類型 */}
        <label>
          <span style={labelStyle}>容器類型</span>
          <select 
            value={facts.container || 'none'}
            onChange={e => handleFieldChange('container', e.target.value)}
            disabled={disabled}
            style={inputStyle}
          >
            <option value="none">⭕ 無</option>
            <option value="ziplock">🔒 夾鏈袋</option>
            <option value="box">📦 保鮮盒</option>
            <option value="paper_bag">📄 紙袋</option>
            <option value="vacuum">🌀 真空包裝</option>
            <option value="glass_jar">🏺 玻璃罐</option>
          </select>
        </label>

        {/* 季節 */}
        <label>
          <span style={labelStyle}>季節</span>
          <select 
            value={facts.season || 'summer'}
            onChange={e => handleFieldChange('season', e.target.value)}
            disabled={disabled}
            style={inputStyle}
          >
            <option value="spring">🌸 春季</option>
            <option value="summer">☀️ 夏季</option>
            <option value="autumn">🍂 秋季</option>
            <option value="winter">❄️ 冬季</option>
          </select>
        </label>

        {/* 地區 */}
        <label style={{ gridColumn: 'span 2' }}>
          <span style={labelStyle}>地區</span>
          <select 
            value={facts.locale || 'TW'}
            onChange={e => handleFieldChange('locale', e.target.value)}
            disabled={disabled}
            style={inputStyle}
          >
            <option value="TW">🇹🇼 台灣</option>
            <option value="US">🇺🇸 美國</option>
            <option value="EU">🇪🇺 歐洲</option>
            <option value="JP">🇯🇵 日本</option>
            <option value="CN">🇨🇳 中國</option>
          </select>
        </label>
      </div>

      {/* 提示信息 */}
      <div style={{
        marginTop: '12px',
        padding: '8px',
        backgroundColor: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#0369a1'
      }}>
        💡 提示：不同的保存情境會影響食材的保存期限計算
      </div>
    </div>
  );
};

export default StorageContextForm;