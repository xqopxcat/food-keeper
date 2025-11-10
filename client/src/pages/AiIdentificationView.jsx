import React, { useState } from 'react';
import Camera from '../components/Camera.jsx';
import { 
  useIdentifyFoodItemsMutation, 
  useExtractTextFromImageMutation, 
  useGetAiStatusQuery,
  useAddInventoryItemMutation 
} from '../redux/services/foodCoreAPI';
import { inferDefaultsFromProduct } from '../inferDefaults.js';
import { foodOptions } from '../constants/index.jsx';

const AiIdentificationView = () => {
  const [mode, setMode] = useState('camera'); // 'camera', 'upload', 'results'
  const [capturedImage, setCapturedImage] = useState(null);
  const [identificationResults, setIdentificationResults] = useState(null);
  const [ocrResults, setOcrResults] = useState(null);

  // RTK Query hooks
  const [identifyFood, { isLoading: isIdentifying }] = useIdentifyFoodItemsMutation();
  const [extractText, { isLoading: isExtracting }] = useExtractTextFromImageMutation();
  const [addInventoryItem, { isLoading: isAdding }] = useAddInventoryItemMutation();
  const { data: aiStatus } = useGetAiStatusQuery();

  // 處理拍照結果
  const handleCapture = async (imageData) => {
    setCapturedImage(imageData);
    setMode('results');
    
    // 自動開始識別
    await performIdentification(imageData.base64);
  };

  // 處理檔案上傳
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 驗證檔案類型
    if (!file.type.startsWith('image/')) {
      alert('請選擇圖片檔案');
      return;
    }

    // 轉換為 base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result.split(',')[1];
      const imageData = {
        base64,
        blob: file,
        width: 0, // 實際尺寸會由瀏覽器處理
        height: 0,
        timestamp: Date.now()
      };
      
      setCapturedImage(imageData);
      setMode('results');
      
      // 自動開始識別
      await performIdentification(base64);
    };
    reader.readAsDataURL(file);
  };

  // 執行 AI 識別
  const performIdentification = async (base64Image) => {
    try {
      // 並行執行物品識別和文字識別
      const [foodResult, ocrResult] = await Promise.allSettled([
        identifyFood({ 
          imageBase64: base64Image,
          options: {
            language: 'zh-TW',
            includeQuantity: true,
            includeExpiration: true,
            includeBrand: true
          }
        }).unwrap(),
        extractText({ imageBase64: base64Image }).unwrap()
      ]);

      if (foodResult.status === 'fulfilled') {
        setIdentificationResults(foodResult.value);
      } else {
        console.error('Food identification failed:', foodResult.reason);
      }

      if (ocrResult.status === 'fulfilled') {
        setOcrResults(ocrResult.value);
      } else {
        console.error('OCR failed:', ocrResult.reason);
      }

    } catch (error) {
      console.error('AI identification error:', error);
      alert('AI 識別失敗：' + (error.message || '未知錯誤'));
    }
  };

  // 重新識別
  const retryIdentification = () => {
    if (capturedImage?.base64) {
      setIdentificationResults(null);
      setOcrResults(null);
      performIdentification(capturedImage.base64);
    }
  };

  // 添加識別的食材到庫存
  const addToInventory = async (item) => {
    try {
      console.log('Adding to inventory:', item);
      
      // 如果已經有保存期限資訊就直接使用，否則使用 inferDefaults
      let itemKey = item.itemKey;
      let storageMode = item.storageMode;
      let state = item.state || 'whole';
      
      // 如果沒有 itemKey，嘗試使用 inferDefaults
      if (!itemKey) {
        const inferred = inferDefaultsFromProduct({
          name: item.name,
          brand: item.brand,
          category: item.category
        });
        
        if (inferred) {
          itemKey = inferred.itemKey;
          storageMode = inferred.storageMode;
          state = inferred.state;
        }
      }

      // 構建新增庫存的資料
      const inventoryData = {
        itemKey: itemKey || `AI_${Date.now()}`, // 如果還是沒有 itemKey，生成一個唯一的
        name: item.name || item.englishName || '未知食材',
        brand: item.brand || null,
        quantity: item.quantity || { amount: 1, unit: '個' },
        purchaseDate: new Date().toISOString().split('T')[0], // 今天的日期
        storageMode: storageMode || 'fridge',
        state: state,
        container: 'none',
        source: 'ai-identified',
        notes: `AI 識別: ${item.notes || ''} ${item.shelfLife ? `| 保存期限: ${item.shelfLife.daysMin}-${item.shelfLife.daysMax}天` : ''}`.trim(),
        tags: ['ai-identified']
      };

      console.log('Inventory data to submit:', inventoryData);

      // 呼叫 API 新增到庫存
      const result = await addInventoryItem(inventoryData).unwrap();
      
      if (result.success) {
        alert(`✅ 已成功新增「${item.name}」到庫存！\n\n保存期限: ${result.estimate?.shelfLifeDays?.min || 0}-${result.estimate?.shelfLifeDays?.max || 0} 天\n保存建議: ${result.estimate?.tips || '無'}`);
        
        // 可以選擇是否要重置識別結果
        // reset();
      } else {
        throw new Error(result.error || '新增失敗');
      }
      
    } catch (error) {
      console.error('Add to inventory failed:', error);
      alert('❌ 新增到庫存失敗：' + (error.message || '未知錯誤'));
    }
  };

  // 重置狀態
  const reset = () => {
    setCapturedImage(null);
    setIdentificationResults(null);
    setOcrResults(null);
    setMode('camera');
  };

  // AI 服務狀態檢查
  if (!aiStatus?.aiEnabled) {
    return (
      <div style={{ padding: 16, textAlign: 'center' }}>
        <h2>🤖 AI 識別功能</h2>
        <div style={{ 
          padding: 20, 
          backgroundColor: '#fef3c7', 
          border: '1px solid #f59e0b', 
          borderRadius: 8,
          margin: '16px 0'
        }}>
          <p>⚠️ AI 識別功能尚未啟用</p>
          <p style={{ fontSize: '14px', color: '#92400e' }}>
            請在伺服器設定中配置 OpenAI API Key 以啟用此功能
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 頁面標題 */}
      <div style={{ padding: 16, backgroundColor: '#f8f9fa', borderBottom: '1px solid #e5e7eb' }}>
        <h2 style={{ margin: '0 0 8px 0' }}>🤖 AI 物品識別</h2>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
          拍照或上傳圖片，AI 自動識別食材種類和包裝資訊
        </p>
      </div>

      {/* 模式切換 */}
      {mode !== 'results' && (
        <div style={{ 
          padding: 16,
          display: 'flex', 
          gap: 8,
          justifyContent: 'center',
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <button
            onClick={() => setMode('camera')}
            style={{
              padding: '8px 16px',
              backgroundColor: mode === 'camera' ? '#3b82f6' : 'transparent',
              color: mode === 'camera' ? 'white' : '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            📷 拍照識別
          </button>
          <button
            onClick={() => setMode('upload')}
            style={{
              padding: '8px 16px',
              backgroundColor: mode === 'upload' ? '#3b82f6' : 'transparent',
              color: mode === 'upload' ? 'white' : '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            📁 上傳圖片
          </button>
        </div>
      )}

      {/* 主要內容區域 */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {/* 拍照模式 */}
        {mode === 'camera' && (
          <Camera
            onCapture={handleCapture}
            onError={(error) => alert(error)}
            style={{ width: '100%', height: '100%' }}
          />
        )}

        {/* 上傳模式 */}
        {mode === 'upload' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: 20
          }}>
            <div style={{
              border: '2px dashed #d1d5db',
              borderRadius: 12,
              padding: 40,
              textAlign: 'center',
              width: '100%',
              maxWidth: 400,
              cursor: 'pointer'
            }}
            onClick={() => document.getElementById('fileInput').click()}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
              <h3 style={{ margin: '0 0 8px 0' }}>選擇圖片</h3>
              <p style={{ color: '#6b7280', margin: 0 }}>
                點擊選擇或拖放圖片檔案<br/>
                支援 JPG, PNG 格式，最大 10MB
              </p>
            </div>
            
            <input
              id="fileInput"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>
        )}

        {/* 結果顯示模式 */}
        {mode === 'results' && (
          <div style={{ 
            height: '100%', 
            overflow: 'auto',
            padding: 16
          }}>
            {/* 操作按鈕 */}
            <div style={{ 
              display: 'flex', 
              gap: 8, 
              marginBottom: 16,
              flexWrap: 'wrap'
            }}>
              <button
                onClick={retryIdentification}
                disabled={isIdentifying || isExtracting}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  opacity: (isIdentifying || isExtracting) ? 0.6 : 1
                }}
              >
                🔄 重新識別
              </button>
              <button
                onClick={reset}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                📷 重新拍照
              </button>
            </div>

            {/* 拍攝的圖片預覽 */}
            {capturedImage && (
              <div style={{ 
                marginBottom: 16,
                textAlign: 'center'
              }}>
                <img
                  src={`data:image/jpeg;base64,${capturedImage.base64}`}
                  alt="Captured"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 300,
                    borderRadius: 8,
                    border: '1px solid #e5e7eb'
                  }}
                />
              </div>
            )}

            {/* 載入狀態 */}
            {(isIdentifying || isExtracting) && (
              <div style={{
                textAlign: 'center',
                padding: 20,
                backgroundColor: '#f3f4f6',
                borderRadius: 8,
                margin: '16px 0'
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>🤖</div>
                <p>AI 正在分析圖片中...</p>
              </div>
            )}

            {/* 物品識別結果 */}
            {identificationResults && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ 
                  margin: '0 0 12px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  🍎 識別到的食材 ({identificationResults.totalItems || 0})
                </h3>
                
                {identificationResults.success ? (
                  <div style={{ display: 'grid', gap: 12 }}>
                    {identificationResults.items.map((item, index) => (
                      <div
                        key={index}
                        style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: 8,
                          padding: 12,
                          backgroundColor: 'white'
                        }}
                      >
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: 8
                        }}>
                          <div>
                            <h4 style={{ margin: '0 0 4px 0' }}>
                              {item.name} {item.englishName && `(${item.englishName})`}
                            </h4>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                              信心度: {Math.round((item.confidence || 0) * 100)}%
                            </div>
                          </div>
                          <button
                            onClick={() => addToInventory(item)}
                            disabled={isAdding}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: isAdding ? '#9ca3af' : '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: isAdding ? 'not-allowed' : 'pointer',
                              opacity: isAdding ? 0.6 : 1
                            }}
                          >
                            {isAdding ? '⏳ 新增中...' : '➕ 加入庫存'}
                          </button>
                        </div>

                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                          gap: 8,
                          fontSize: '14px'
                        }}>
                          {item.category && (
                            <div><strong>分類:</strong> {item.category}</div>
                          )}
                          {item.quantity && (
                            <div>
                              <strong>數量:</strong> {item.quantity.amount} {item.quantity.unit}
                            </div>
                          )}
                          {item.storageMode && (
                            <div>
                              <strong>保存:</strong> {
                                item.storageMode === 'fridge' ? '冷藏' :
                                item.storageMode === 'freezer' ? '冷凍' : '室溫'
                              }
                            </div>
                          )}
                          {item.brand && (
                            <div><strong>品牌:</strong> {item.brand}</div>
                          )}
                          {item.itemKey && (
                            <div><strong>代碼:</strong> {item.itemKey}</div>
                          )}
                        </div>

                        {/* 保存期限資訊 */}
                        {item.shelfLife && (
                          <div style={{
                            marginTop: 8,
                            padding: 8,
                            backgroundColor: '#f0f9ff',
                            border: '1px solid #bae6fd',
                            borderRadius: 4,
                            fontSize: '12px'
                          }}>
                            <div style={{ fontWeight: 'bold', color: '#0369a1', marginBottom: 4 }}>
                              📅 保存期限建議
                            </div>
                            <div style={{ color: '#374151' }}>
                              <div>• 期限: {item.shelfLife.daysMin}-{item.shelfLife.daysMax} 天</div>
                              <div>• 信心度: {Math.round((item.shelfLife.confidence || 0) * 100)}%</div>
                              {item.shelfLife.tips && (
                                <div>• 建議: {item.shelfLife.tips}</div>
                              )}
                            </div>
                          </div>
                        )}

                        {item.notes && (
                          <div style={{ 
                            marginTop: 8, 
                            padding: 8,
                            backgroundColor: '#f9fafb',
                            borderRadius: 4,
                            fontSize: '12px',
                            color: '#374151'
                          }}>
                            📝 {item.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    padding: 16,
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 8,
                    color: '#991b1b'
                  }}>
                    ❌ {identificationResults.error || '無法識別圖片中的食材'}
                  </div>
                )}
              </div>
            )}

            {/* OCR 識別結果 */}
            {ocrResults && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ 
                  margin: '0 0 12px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  📝 包裝文字識別
                </h3>
                
                {ocrResults.success ? (
                  <div style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    padding: 12,
                    backgroundColor: 'white'
                  }}>
                    {Object.entries(ocrResults.text).map(([key, value]) => (
                      value && key !== 'allText' && (
                        <div key={key} style={{ marginBottom: 8, fontSize: '14px' }}>
                          <strong style={{ color: '#374151' }}>
                            {key === 'productName' ? '產品名稱' :
                             key === 'brand' ? '品牌' :
                             key === 'expirationDate' ? '保存期限' :
                             key === 'barcode' ? '條碼' :
                             key === 'ingredients' ? '成分' :
                             key === 'nutrition' ? '營養標示' : key}:
                          </strong>
                          <span style={{ marginLeft: 8 }}>{value}</span>
                        </div>
                      )
                    ))}
                    
                    {ocrResults.text.allText && (
                      <details style={{ marginTop: 12 }}>
                        <summary style={{ cursor: 'pointer', color: '#6b7280' }}>
                          查看所有識別文字
                        </summary>
                        <div style={{
                          marginTop: 8,
                          padding: 8,
                          backgroundColor: '#f9fafb',
                          borderRadius: 4,
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {ocrResults.text.allText}
                        </div>
                      </details>
                    )}
                  </div>
                ) : (
                  <div style={{
                    padding: 16,
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 8,
                    color: '#991b1b'
                  }}>
                    ❌ {ocrResults.error || '無法識別圖片中的文字'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AiIdentificationView;