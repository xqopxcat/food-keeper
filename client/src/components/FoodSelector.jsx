import React, { useState } from 'react';
import { foodOptions } from '../constants/index.jsx';

/**
 * 食材選擇器組件
 * 統一處理食材搜索、下拉選單、分類顯示等功能
 */
const FoodSelector = ({ 
  value = '',
  onChange = () => {},
  placeholder = "搜尋食材種類...",
  disabled = false,
  style = {}
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // 過濾食材選項
  const filteredOptions = foodOptions.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 取得當前選中項目的標籤
  const selectedLabel = foodOptions.find(option => option.value === value)?.label || '';

  // 處理選項點擊
  const handleOptionSelect = (optionValue) => {
    onChange(optionValue);
    setSearchTerm('');
    setShowDropdown(false);
  };

  // 處理清除選擇
  const handleClear = () => {
    onChange('');
    setSearchTerm('');
    setShowDropdown(false);
  };

  // 按分類分組選項
  const groupedOptions = filteredOptions.reduce((groups, option) => {
    if (!groups[option.category]) groups[option.category] = [];
    groups[option.category].push(option);
    return groups;
  }, {});

  return (
    <div style={{ position: 'relative', ...style }}>
      <input
        type="text"
        placeholder={value ? selectedLabel : placeholder}
        value={searchTerm}
        disabled={disabled}
        onChange={e => {
          setSearchTerm(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => {
          // 延遲關閉下拉選單，讓點擊選項有時間執行
          setTimeout(() => setShowDropdown(false), 200);
        }}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          fontSize: '14px',
          backgroundColor: disabled ? '#f9fafb' : 'white',
          cursor: disabled ? 'not-allowed' : 'text'
        }}
      />

      {/* 已選擇的項目顯示 */}
      {value && !searchTerm && (
        <div style={{ 
          fontSize: '12px', 
          color: '#6b7280', 
          marginTop: '4px',
          paddingLeft: '4px'
        }}>
          已選擇: {selectedLabel}
        </div>
      )}

      {/* 下拉選單 */}
      {showDropdown && !disabled && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          maxHeight: '300px',
          overflowY: 'auto',
          zIndex: 1000,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
        }}>
          {/* 清除選項 */}
          {value && (
            <div
              onClick={handleClear}
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                borderBottom: '1px solid #f3f4f6',
                color: '#6b7280',
                fontStyle: 'italic',
                fontSize: '14px'
              }}
              onMouseEnter={e => e.target.style.backgroundColor = '#f9fafb'}
              onMouseLeave={e => e.target.style.backgroundColor = 'white'}
            >
              ✕ 清除選擇
            </div>
          )}

          {/* 過濾後的選項 */}
          {filteredOptions.length === 0 ? (
            <div style={{ padding: '12px', color: '#9ca3af', textAlign: 'center' }}>
              找不到符合的食材
            </div>
          ) : (
            Object.entries(groupedOptions).map(([category, options]) => (
              <div key={category}>
                {/* 分類標題 */}
                <div style={{
                  padding: '6px 12px',
                  backgroundColor: '#f8f9fa',
                  fontWeight: '600',
                  fontSize: '12px',
                  color: '#6b7280',
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  {category}
                </div>

                {/* 分類下的選項 */}
                {options.map(option => (
                  <div
                    key={option.value}
                    onClick={() => handleOptionSelect(option.value)}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      backgroundColor: value === option.value ? '#e3f2fd' : 'white',
                      fontSize: '14px',
                      borderBottom: '1px solid #f3f4f6'
                    }}
                    onMouseEnter={e => {
                      if (value !== option.value) {
                        e.target.style.backgroundColor = '#f9fafb';
                      }
                    }}
                    onMouseLeave={e => {
                      if (value !== option.value) {
                        e.target.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default FoodSelector;