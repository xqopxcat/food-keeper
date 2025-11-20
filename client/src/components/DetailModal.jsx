import React, { useState, useEffect } from 'react'
import { foodOptions, unitOptions, locationOptions } from '../constants';

const DetailModal = ({
  showStorageModal,
  selectedItemForStorage,
  closeStorageModal,
  facts,
  setFacts,
  inventoryData,
  updateInventoryData,
  resetInventoryData,
  handleEstimateShelfLife,
  handleAdvancedAddToInventory,
  isEstimating
}) => {
  // 搜尋相關狀態
  const [foodSearch, setFoodSearch] = useState('');
  const [showFoodDropdown, setShowFoodDropdown] = useState(false);
  const [filteredFoodOptions, setFilteredFoodOptions] = useState([]);
  const [selectedFoodLabel, setSelectedFoodLabel] = useState('');
  
  const resetStorageForm = () => {
    setFacts({ itemKey:'', storageMode:'fridge', state:'whole', container:'none', season:'summer', locale:'TW' });
    resetInventoryData();
    setFoodSearch('');
  };
  
  // 處理食材搜尋
  useEffect(() => {
    const filtered = foodOptions.filter(option =>
      option.label.toLowerCase().includes(foodSearch.toLowerCase()) ||
      option.value.toLowerCase().includes(foodSearch.toLowerCase())
    );
    setFilteredFoodOptions(filtered);
  }, [foodSearch, foodOptions]);

  // 更新選中食材的標籤
  useEffect(() => {
    if (facts.itemKey) {
      const selectedOption = foodOptions.find(option => option.value === facts.itemKey);
      setSelectedFoodLabel(selectedOption ? selectedOption.label : facts.itemKey);
    }
  }, [facts.itemKey, foodOptions]);
  return (
    <>
      { showStorageModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 0,
            maxWidth: 600,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            border: '1px solid #e5e7eb'
          }}>
            {/* Modal 標題 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              backgroundColor: '#f59e0b',
              borderRadius: '16px 16px 0 0',
              color: 'white'
            }}>
              <h3 style={{ 
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '18px'
              }}>
                詳細設定 - {selectedItemForStorage.name}
              </h3>
              <button
                onClick={closeStorageModal}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
                onMouseOver={e => e.target.style.backgroundColor = 'rgba(255,255,255,0.3)'}
                onMouseOut={e => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
              >
                ✕ 關閉
              </button>
            </div>

            {/* Modal 內容 */}
            <div style={{ padding: 20 }}>
              {/* 項目資訊 */}
              <div style={{
                padding: 16,
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: 12,
                marginBottom: 20
              }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  color: '#0369a1',
                  fontSize: '16px',
                  marginBottom: 8
                }}>
                  🎯 {selectedItemForStorage.name} 
                  {selectedItemForStorage.englishName && `(${selectedItemForStorage.englishName})`}
                </div>
                <div style={{ fontSize: '13px', color: '#374151' }}>
                  <div>信心度：{Math.round((selectedItemForStorage.confidence || 0) * 100)}%</div>
                  <div>分類：{selectedItemForStorage.category || '未分類'}</div>
                  <div>代碼：{selectedItemForStorage.itemKey || '自動推測'}</div>
                  <div>來源：{
                    selectedItemForStorage.source === 'ocr-identified' ? '📝 文字識別 (Gemini 2.5)' :
                    selectedItemForStorage.source === 'google-vision' ? '🔍 物件識別 (Google Vision)' :
                    selectedItemForStorage.source === 'ai-identified' ? '🤖 AI 識別' :
                    selectedItemForStorage.source === 'barcode' ? '🏷️ 條碼識別' :
                    '🤖 AI 識別'
                  }</div>
                </div>
              </div>

              {/* 保存情境設定 */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#374151', fontSize: '16px' }}>
                  🌡️ 保存情境
                </h4>
                
                <div style={{ 
                  display:'grid', 
                  gridTemplateColumns:'repeat(2, 1fr)', 
                  gap: 16, 
                  marginBottom: 16 
                }}>
                  {/* 食材種類搜尋 */}
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      食材種類
                    </span>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder={facts.itemKey ? selectedFoodLabel : "搜尋食材種類..."}
                        value={foodSearch}
                        onChange={e => {
                          setFoodSearch(e.target.value);
                          setShowFoodDropdown(true);
                        }}
                        onFocus={() => setShowFoodDropdown(true)}
                        onBlur={() => setTimeout(() => setShowFoodDropdown(false), 200)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                      
                      {showFoodDropdown && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          backgroundColor: 'white',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          zIndex: 1000,
                          boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                        }}>
                          {filteredFoodOptions.slice(0, 30).map(option => (
                            <div
                              key={option.value}
                              onClick={() => {
                                setFacts(f => ({ ...f, itemKey: option.value }));
                                setFoodSearch('');
                                setShowFoodDropdown(false);
                              }}
                              style={{
                                padding: '10px 12px',
                                cursor: 'pointer',
                                backgroundColor: facts.itemKey === option.value ? '#e3f2fd' : 'white',
                                fontSize: '14px',
                                borderBottom: '1px solid #f3f4f6'
                              }}
                              onMouseEnter={e => {
                                if (facts.itemKey !== option.value) {
                                  e.target.style.backgroundColor = '#f3f4f6';
                                }
                              }}
                              onMouseLeave={e => {
                                if (facts.itemKey !== option.value) {
                                  e.target.style.backgroundColor = 'white';
                                }
                              }}
                            >
                              {option.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {facts.itemKey && (
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        已選擇: {selectedFoodLabel}
                      </div>
                    )}
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      保存方式
                    </span>
                    <select 
                      value={facts.storageMode} 
                      onChange={e => setFacts(f => ({ ...f, storageMode: e.target.value }))}
                      style={{ 
                        width: '100%', 
                        padding: '10px 12px', 
                        border: '1px solid #d1d5db', 
                        borderRadius: '8px',
                        fontSize: '14px',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="room">室溫</option>
                      <option value="fridge">冷藏</option>
                      <option value="freezer">冷凍</option>
                    </select>
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      狀態
                    </span>
                    <select 
                      value={facts.state} 
                      onChange={e => setFacts(f => ({ ...f, state: e.target.value }))}
                      style={{ 
                        width: '100%', 
                        padding: '10px 12px', 
                        border: '1px solid #d1d5db', 
                        borderRadius: '8px',
                        fontSize: '14px',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="whole">完整</option>
                      <option value="cut">切開</option>
                      <option value="opened">開封</option>
                      <option value="cooked">熟食</option>
                    </select>
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      容器
                    </span>
                    <select 
                      value={facts.container} 
                      onChange={e => setFacts(f => ({ ...f, container: e.target.value }))}
                      style={{ 
                        width: '100%', 
                        padding: '10px 12px', 
                        border: '1px solid #d1d5db', 
                        borderRadius: '8px',
                        fontSize: '14px',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="none">無</option>
                      <option value="ziplock">夾鏈袋</option>
                      <option value="box">保鮮盒</option>
                      <option value="paper_bag">紙袋</option>
                      <option value="vacuum">真空包裝</option>
                      <option value="glass_jar">玻璃罐</option>
                    </select>
                  </label>
                </div>
              </div>

              {/* 庫存資訊 */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#374151', fontSize: '16px' }}>
                  📋 庫存資訊
                </h4>
                
                <div style={{ 
                  display:'grid', 
                  gridTemplateColumns:'repeat(2, 1fr)', 
                  gap: 16 
                }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      數量
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={inventoryData.quantity.amount}
                        onChange={e => updateInventoryData({ 
                          quantity: { ...inventoryData.quantity, amount: parseFloat(e.target.value) || 0 }
                        })}
                        style={{ 
                          flex: 1, 
                          padding: '10px 12px', 
                          border: '1px solid #d1d5db', 
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                      <select 
                        value={inventoryData.quantity.unit}
                        onChange={e => updateInventoryData({ 
                          quantity: { ...inventoryData.quantity, unit: e.target.value }
                        })}
                        style={{ 
                          padding: '10px 12px', 
                          border: '1px solid #d1d5db', 
                          borderRadius: '8px',
                          fontSize: '14px',
                          backgroundColor: 'white'
                        }}
                      >
                        {unitOptions.map(unit => (
                          <option key={unit.value} value={unit.value}>{unit.label}</option>
                        ))}
                      </select>
                    </div>
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      購買日期
                    </span>
                    <input
                      type="date"
                      value={inventoryData.purchaseDate}
                      onChange={e => updateInventoryData({ purchaseDate: e.target.value })}
                      style={{ 
                        width: '100%', 
                        padding: '10px 12px', 
                        border: '1px solid #d1d5db', 
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      存放位置
                    </span>
                    <select 
                      value={inventoryData.location}
                      onChange={e => updateInventoryData({ location: e.target.value })}
                      style={{ 
                        width: '100%', 
                        padding: '10px 12px', 
                        border: '1px solid #d1d5db', 
                        borderRadius: '8px',
                        fontSize: '14px',
                        backgroundColor: 'white'
                      }}
                    >
                      {locationOptions.map(location => (
                        <option key={location.value} value={location.value}>{location.label}</option>
                      ))}
                    </select>
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      備註
                    </span>
                    <input
                      type="text"
                      placeholder="例：有機、特價、AI識別..."
                      value={inventoryData.notes}
                      onChange={e => updateInventoryData({ notes: e.target.value })}
                      style={{ 
                        width: '100%', 
                        padding: '10px 12px', 
                        border: '1px solid #d1d5db', 
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* 動作按鈕 */}
              <div style={{ 
                display: 'flex', 
                gap: 12, 
                flexWrap: 'wrap',
                paddingTop: 16,
                borderTop: '1px solid #e5e7eb'
              }}>
                <button
                  onClick={handleEstimateShelfLife}
                  disabled={!facts.itemKey || isEstimating}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    backgroundColor: !facts.itemKey || isEstimating ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: (!facts.itemKey || isEstimating) ? 'not-allowed' : 'pointer',
                    opacity: (!facts.itemKey || isEstimating) ? 0.6 : 1,
                    fontSize: '15px',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={e => {
                    if (facts.itemKey && !isEstimating) {
                      e.target.style.backgroundColor = '#2563eb';
                      e.target.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseOut={e => {
                    if (facts.itemKey && !isEstimating) {
                      e.target.style.backgroundColor = '#3b82f6';
                      e.target.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {isEstimating ? '⏳ 估算中...' : '📊 估算保存期限'}
                </button>
                
                <button
                  onClick={handleAdvancedAddToInventory}
                  disabled={!facts.itemKey || isEstimating}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    backgroundColor: !facts.itemKey || isEstimating ? '#9ca3af' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: (!facts.itemKey || isEstimating) ? 'not-allowed' : 'pointer',
                    opacity: (!facts.itemKey || isEstimating) ? 0.6 : 1,
                    fontSize: '15px',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={e => {
                    if (facts.itemKey && !isEstimating) {
                      e.target.style.backgroundColor = '#059669';
                      e.target.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseOut={e => {
                    if (facts.itemKey && !isEstimating) {
                      e.target.style.backgroundColor = '#10b981';
                      e.target.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {isEstimating ? '⏳ 新增中...' : '📦 加入庫存'}
                </button>
              </div>

              {/* 提示訊息 */}
              {!facts.itemKey && (
                <div style={{ 
                  marginTop: 16, 
                  padding: 12,
                  backgroundColor: '#fef3c7',
                  border: '1px solid #f59e0b',
                  borderRadius: 8,
                  color: '#92400e',
                  fontSize: '14px',
                  textAlign: 'center'
                }}>
                  💡 請先選擇或確認「食材種類」再進行保存期限估算
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DetailModal