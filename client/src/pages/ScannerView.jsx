import React, { useState, useEffect } from 'react'
import BarcodeScanner from '../components/BarcodeScanner.jsx';
import {
  useLazyLookupByBarcodeQuery,
  useEstimateShelfLifeMutation,
} from '../redux/services/foodCoreAPI.js';
import {
  useSubscribePushMutation,
  useSendTestPushMutation,
} from '../redux/services/subscribeCoreAPI.js';
import { inferDefaultsFromProduct } from '../inferDefaults.js';
import { foodOptions, unitOptions, locationOptions } from '../constants/index.jsx';

const ScannerView = () => {
  const [barcode, setBarcode] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [pushOK, setPushOK] = useState(false);
  
  const [facts, setFacts] = useState({ 
    itemKey:'', 
    storageMode:'fridge', 
    state:'whole', 
    container:'none', 
    season:'summer', 
    locale:'TW' 
  });
  
  const [estimate, setEstimate] = useState(null);
  
  // 食材搜尋狀態
  const [foodSearch, setFoodSearch] = useState('');
  const [showFoodDropdown, setShowFoodDropdown] = useState(false);

  // 庫存管理狀態
  const [inventoryData, setInventoryData] = useState({
    quantity: { amount: 1, unit: '個' },
    purchaseDate: new Date().toISOString().split('T')[0],
    location: 'fridge_main',
    notes: ''
  });

  // RTK Query hooks
  const [triggerLookup, { 
    data: lookupData, 
    isLoading: lookupLoading, 
    error: lookupError 
  }] = useLazyLookupByBarcodeQuery();

  const [estimateShelfLife, { 
    isLoading: estimateLoading 
  }] = useEstimateShelfLifeMutation();

  const [subscribePush] = useSubscribePushMutation();
  const [sendTestPush] = useSendTestPushMutation();

  // 過濾食材選項
  const filteredFoodOptions = foodOptions.filter(option =>
    option.label.toLowerCase().includes(foodSearch.toLowerCase()) ||
    option.value.toLowerCase().includes(foodSearch.toLowerCase())
  );

  // 取得當前選中項目的標籤
  const selectedFoodLabel = foodOptions.find(option => option.value === facts.itemKey)?.label || '';
  
  // 處理查詢結果
  useEffect(() => {
    if (lookupData?.product) {
      console.log('RTK Query lookup result:', lookupData.product); 
      setResult(lookupData);
      setError(null);
      
      const d = inferDefaultsFromProduct(lookupData.product);
      if (d) {
        setFacts(f => ({
          ...f,
          itemKey: d.itemKey,
          storageMode: d.storageMode,
          state: d.state,
          container: d.container
        }));
      }
    } else if (lookupError) {
      setError(lookupError.message || '查詢失敗');
      setResult(null);
    }
  }, [lookupData, lookupError]);
  
  async function handleEstimate(save = false) {
    if (!facts.itemKey) { 
      alert('請選擇食材種類'); 
      return; 
    }
    
    try {
      const payload = {
        barcode,
        manualName: result?.product?.name,
        ...facts,
        save
      };
      
      const data = await estimateShelfLife(payload).unwrap();
      setEstimate(data);
    } catch (e) {
      alert(e?.message || '估算失敗');
    }
  }

  async function handleAddToInventory() {
    if (!facts.itemKey) {
      alert('請先選擇食材種類');
      return;
    }

    try {
      const payload = {
        barcode,
        manualName: result?.product?.name || selectedFoodLabel || facts.itemKey,
        ...facts,
        save: true, // 重要：告訴 estimate API 要保存到庫存
        // 庫存相關資料
        quantity: inventoryData.quantity,
        purchaseDate: inventoryData.purchaseDate,
        location: inventoryData.location,
        source: barcode ? 'barcode' : 'manual',
        notes: inventoryData.notes
      };

      const response = await estimateShelfLife(payload).unwrap();
      
      if (response.saved) {
        alert(`✅ 已成功加入庫存！\n預估保存期限：${response.daysMin || 'N/A'}~${response.daysMax || 'N/A'} 天`);
        
        // 重置表單
        resetForm();
      }
    } catch (e) {
      alert(`❌ 加入庫存失敗：${e.message || '未知錯誤'}`);
    }
  }

  function resetForm() {
    setBarcode(null);
    setResult(null);
    setError(null);
    setEstimate(null);
    setFacts({ itemKey:'', storageMode:'fridge', state:'whole', container:'none', season:'summer', locale:'TW' });
    setInventoryData({
      quantity: { amount: 1, unit: '個' },
      purchaseDate: new Date().toISOString().split('T')[0],
      location: 'fridge_main',
      notes: ''
    });
    setFoodSearch('');
  }

  async function handleDetected(code) {
    setBarcode(code);
    setResult(null);
    setError(null);
    
    // 使用 RTK Query 進行查詢，強制重新獲取
    triggerLookup(code, true);
  }

  async function enablePush() {
    try { 
      await subscribePush().unwrap();
      setPushOK(true);
      alert('推播訂閱成功');
    } catch (e) { 
      alert(e?.message || '推播訂閱失敗');
    }
  }

  async function handleSendTestPush() {
    try {
      await sendTestPush().unwrap();
    } catch (e) {
      alert(e?.message || '發送測試推播失敗');
    }
  }

  const readyForEstimate = !!facts.itemKey && !!facts.storageMode;
  const loading = lookupLoading || estimateLoading;

  return (
    <div>
      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ margin: '0 0 8px 0' }}>掃描或添加食材</h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
            使用條碼掃描或手動輸入來識別食材，系統會自動推算最佳保存期限
          </p>
        </div>
      </div>

      {/* 推播控制 */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom: 16 }}>
        <button onClick={enablePush}>啟用推播</button>
        <button onClick={handleSendTestPush} disabled={!pushOK}>發送測試推播</button>
      </div>

      {/* 相機掃碼區 */}
      {!barcode && (
        <div style={{ marginTop:16 }}>
          <BarcodeScanner onDetected={handleDetected} />
        </div>
      )}

      {/* 查詢結果 */}
      {barcode && (
        <div style={{ marginTop:16 }}>
          <div>掃描/查詢到的條碼：<b>{barcode}</b></div>
          
          {loading && (
            <div style={{ marginTop:8 }}>查詢商品資料中…</div>
          )}
          
          {error && (
            <div style={{ marginTop:8, color:'crimson' }}>查詢失敗：{error}</div>
          )}
          
          {result && (
            <div style={{ marginTop:12, padding:12, border:'1px solid #ddd', borderRadius:8 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                {result.product?.image_url && (
                  <img 
                    src={result.product.image_url} 
                    alt={result.product.name}
                    style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }}
                    onError={(e) => e.target.style.display = 'none'}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <div><b>來源：</b>
                    <span style={{ 
                      color: result.source === 'local' ? '#059669' : '#0ea5e9',
                      marginLeft: 4 
                    }}>
                      {result.source === 'local' ? '本地資料庫' : 
                       result.source === 'openfoodfacts' ? 'Open Food Facts' :
                       result.source === 'taiwan_fda' ? '🇹🇼 台灣食藥署' :
                       result.source === 'taiwan_local' ? '🇹🇼 台灣品牌' :
                       result.source === 'taiwan_generic' ? '🇹🇼 台灣製造' :
                       result.source === 'upcdatabase' ? 'UPC Database' : result.source}
                    </span>
                  </div>
                  <div><b>品名：</b>{result.product?.name}</div>
                  <div><b>品牌：</b>{result.product?.brand || '-'}</div>
                  <div><b>數量：</b>{result.product?.quantity || '-'}</div>
                  {result.product?.category && (
                    <div><b>分類：</b>{result.product.category}</div>
                  )}
                </div>
              </div>
              <button 
                style={{ marginTop:12 }} 
                onClick={() => { 
                  setBarcode(null); 
                  setResult(null); 
                  setError(null); 
                }}
              >
                掃下一個
              </button>
            </div>
          )}
        </div>
      )}

      {/* 保存情境表單 - 簡化版本 */}
      {barcode && (
        <div style={{ marginTop:12 }}>
          <h3>保存情境</h3>
          
          {/* 完整的食材選擇（含下拉選單） */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(160px,1fr))', gap:8 }}>
            <label>
              食材種類 (itemKey)
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
                  onBlur={() => {
                    // 延遲關閉下拉選單，讓點擊選項有時間執行
                    setTimeout(() => setShowFoodDropdown(false), 200);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
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
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    {/* 清除選項 */}
                    {facts.itemKey && (
                      <div
                        onClick={() => {
                          setFacts(f => ({ ...f, itemKey: '' }));
                          setFoodSearch('');
                          setShowFoodDropdown(false);
                        }}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #eee',
                          color: '#666',
                          fontStyle: 'italic'
                        }}
                        onMouseEnter={e => e.target.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={e => e.target.style.backgroundColor = 'white'}
                      >
                        清除選擇
                      </div>
                    )}
                    
                    {/* 過濾後的選項 */}
                    {filteredFoodOptions.length === 0 ? (
                      <div style={{ padding: '8px 12px', color: '#999' }}>
                        找不到符合的食材
                      </div>
                    ) : (
                      (() => {
                        // 按分類分組
                        const groupedOptions = filteredFoodOptions.reduce((groups, option) => {
                          if (!groups[option.category]) groups[option.category] = [];
                          groups[option.category].push(option);
                          return groups;
                        }, {});
                        
                        return Object.entries(groupedOptions).map(([category, options]) => (
                          <div key={category}>
                            <div style={{
                              padding: '4px 12px',
                              backgroundColor: '#f8f9fa',
                              fontWeight: 'bold',
                              fontSize: '12px',
                              color: '#666'
                            }}>
                              {category}
                            </div>
                            {options.map(option => (
                              <div
                                key={option.value}
                                onClick={() => {
                                  setFacts(f => ({ ...f, itemKey: option.value }));
                                  setFoodSearch('');
                                  setShowFoodDropdown(false);
                                }}
                                style={{
                                  padding: '8px 12px',
                                  cursor: 'pointer',
                                  backgroundColor: facts.itemKey === option.value ? '#e3f2fd' : 'white',
                                  fontSize: '14px'
                                }}
                                onMouseEnter={e => {
                                  if (facts.itemKey !== option.value) {
                                    e.target.style.backgroundColor = '#f5f5f5';
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
                        ));
                      })()
                    )}
                  </div>
                )}
              </div>
              {facts.itemKey && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  已選擇: {selectedFoodLabel}
                </div>
              )}
            </label>

            <label>
              保存方式 (storageMode)
              <select value={facts.storageMode} onChange={e => setFacts(f => ({ ...f, storageMode: e.target.value }))}>
                <option value="room">室溫</option>
                <option value="fridge">冷藏</option>
                <option value="freezer">冷凍</option>
              </select>
            </label>

            <label>
              狀態 (state)
              <select value={facts.state} onChange={e => setFacts(f => ({ ...f, state: e.target.value }))}>
                <option value="whole">完整</option>
                <option value="cut">切開</option>
                <option value="opened">開封</option>
                <option value="cooked">熟食</option>
              </select>
            </label>

            <label>
              容器 (container)
              <select value={facts.container} onChange={e => setFacts(f => ({ ...f, container: e.target.value }))}>
                <option value="none">無</option>
                <option value="ziplock">夾鏈袋</option>
                <option value="box">保鮮盒</option>
                <option value="paper_bag">紙袋</option>
                <option value="vacuum">真空包裝</option>
                <option value="glass_jar">玻璃罐</option>
              </select>
            </label>
          </div>

          {/* 庫存管理表單 */}
          <div style={{ marginTop: 16, padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, backgroundColor: '#f9fafb' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>📦 庫存資訊</h4>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(160px,1fr))', gap:8 }}>
              <label>
                數量
                <div style={{ display: 'flex', gap: 4 }}>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={inventoryData.quantity.amount}
                    onChange={e => setInventoryData(data => ({
                      ...data,
                      quantity: { ...data.quantity, amount: parseFloat(e.target.value) || 0 }
                    }))}
                    style={{ flex: 1, padding: '6px 8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                  <select 
                    value={inventoryData.quantity.unit}
                    onChange={e => setInventoryData(data => ({
                      ...data,
                      quantity: { ...data.quantity, unit: e.target.value }
                    }))}
                    style={{ padding: '6px 8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  >
                    {unitOptions.map(unit => (
                      <option key={unit.value} value={unit.value}>{unit.label}</option>
                    ))}
                  </select>
                </div>
              </label>

              <label>
                購買日期
                <input
                  type="date"
                  value={inventoryData.purchaseDate}
                  onChange={e => setInventoryData(data => ({ ...data, purchaseDate: e.target.value }))}
                  style={{ width: '100%', padding: '6px 8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </label>

              <label>
                存放位置
                <select 
                  value={inventoryData.location}
                  onChange={e => setInventoryData(data => ({ ...data, location: e.target.value }))}
                  style={{ width: '100%', padding: '6px 8px', border: '1px solid #ccc', borderRadius: '4px' }}
                >
                  <option value="fridge_main">🧊 冰箱主層</option>
                  <option value="fridge_freezer">❄️ 冷凍庫</option>
                  <option value="fridge_door">🚪 冰箱門</option>
                  <option value="pantry">🏠 食品櫃</option>
                  <option value="counter">🍽️ 檯面</option>
                  <option value="cabinet">🗄️ 櫥櫃</option>
                </select>
              </label>

              <label>
                備註
                <input
                  type="text"
                  placeholder="例：有機、特價、剩餘..."
                  value={inventoryData.notes}
                  onChange={e => setInventoryData(data => ({ ...data, notes: e.target.value }))}
                  style={{ width: '100%', padding: '6px 8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </label>
            </div>
          </div>

          <div style={{ display:'flex', gap:8, marginTop:10, flexWrap: 'wrap' }}>
            <button 
              onClick={() => handleEstimate(false)} 
              disabled={!readyForEstimate || loading}
            >
              📊 估算保存期限
            </button>

            <button 
              onClick={() => handleEstimate(true)} 
              disabled={!readyForEstimate || loading}
            >
              💾 估算並入庫
            </button>

            <button 
              onClick={handleAddToInventory}
              disabled={!facts.itemKey || loading}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: (!facts.itemKey || loading) ? 'not-allowed' : 'pointer',
                opacity: (!facts.itemKey || loading) ? 0.6 : 1
              }}
            >
              📦 加入庫存
            </button>

            {!readyForEstimate && (
              <div style={{ width: '100%', marginTop: 6, color: '#b45309', fontSize: '14px' }}>
                💡 無法自動判斷食材類型，請手動選擇「食材種類」與「保存方式」後再操作。
              </div>
            )}
          </div>

          {!readyForEstimate && (
            <div style={{ marginTop: 6, color: '#b45309', fontSize: '14px' }}>
              💡 請選擇「食材種類」與「保存方式」後再操作。
            </div>
          )}

          {estimate && (
            <div style={{ marginTop:10, padding:10, border:'1px dashed #aaa', borderRadius:8 }}>
              <div><b>估算天數：</b>{estimate.daysMin}–{estimate.daysMax} 天（信心 {Math.round(estimate.confidence*100)}%）</div>
              <div><b>建議：</b>{estimate.tips || '—'}</div>
              {estimate.nowISO && <div><b>入庫時間：</b>{new Date(estimate.nowISO).toLocaleString()}</div>}
              {estimate.expiresMinAtISO && <div><b>到期（Min）：</b>{new Date(estimate.expiresMinAtISO).toLocaleDateString()}</div>}
              {estimate.expiresMaxAtISO && <div><b>到期（Max）：</b>{new Date(estimate.expiresMaxAtISO).toLocaleDateString()}</div>}
              {estimate.saved && (
                <div style={{ color: '#059669', fontWeight: 'bold' }}>
                  ✅ 已成功加入庫存
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ScannerView