import React from 'react';

/**
 * AI 識別結果顯示組件
 * 統一處理各種 AI 識別結果的顯示
 */
const AiIdentificationResults = ({ 
  unifiedResults,
  onQuickAdd = () => {},
  onDetailedSetup = () => {},
  onRetry = () => {},
  isLoading = false
}) => {
  if (!unifiedResults) return null;

  const { 
    mergedItems = [], 
    confidence = 0, 
    recommendations = [], 
    sources = {},
    crossValidation = {} 
  } = unifiedResults;

  return (
    <div style={{ padding: '16px 20px' }}>
      {/* 總體信息 */}
      <div style={{
        padding: 16,
        backgroundColor: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: 12,
        marginBottom: 20
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12
        }}>
          <h3 style={{ margin: 0, color: '#0369a1', fontSize: '18px' }}>
            🎯 綜合識別結果
          </h3>
          <div style={{
            padding: '4px 12px',
            backgroundColor: confidence > 0.7 ? '#dcfce7' : confidence > 0.4 ? '#fef3c7' : '#fee2e2',
            color: confidence > 0.7 ? '#166534' : confidence > 0.4 ? '#92400e' : '#dc2626',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {confidence > 0.7 ? '🟢 高' : confidence > 0.4 ? '🟡 中' : '🔴 低'} 信心度 {Math.round(confidence * 100)}%
          </div>
        </div>

        {/* 來源信息 */}
        <div style={{ fontSize: '14px', color: '#0284c7', marginBottom: 8 }}>
          識別來源: {[
            sources.ai && '🤖 AI物件識別',
            sources.ocr && '📝 OCR文字識別', 
            sources.barcode && '📱 條碼查詢'
          ].filter(Boolean).join(' + ')}
        </div>

        {/* 交叉驗證結果 */}
        {crossValidation.hasMatches && (
          <div style={{ 
            fontSize: '13px', 
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <span>✅ 交叉驗證通過</span>
            <span style={{ color: '#6b7280' }}>
              ({crossValidation.matchCount} 項目匹配)
            </span>
          </div>
        )}
      </div>

      {/* 識別項目列表 */}
      {mergedItems.length > 0 ? (
        <div style={{ display: 'grid', gap: 16 }}>
          {mergedItems.map((item, index) => (
            <div
              key={index}
              style={{
                padding: 16,
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                backgroundColor: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              {/* 項目標題 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 12
              }}>
                <div>
                  <h4 style={{
                    margin: '0 0 4px 0',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1f2937'
                  }}>
                    {item.name}
                    {item.englishName && (
                      <span style={{ 
                        fontSize: '14px', 
                        color: '#6b7280', 
                        fontWeight: 'normal',
                        marginLeft: 8
                      }}>
                        ({item.englishName})
                      </span>
                    )}
                  </h4>
                  {item.brand && (
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      品牌: {item.brand}
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: item.confidence > 0.7 ? '#059669' : item.confidence > 0.4 ? '#d97706' : '#dc2626'
                  }}>
                    {Math.round((item.confidence || 0) * 100)}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    信心度
                  </div>
                </div>
              </div>

              {/* 項目詳情 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 12,
                marginBottom: 12,
                fontSize: '13px',
                color: '#374151'
              }}>
                {item.category && (
                  <div>
                    <span style={{ fontWeight: '500' }}>分類：</span>
                    {item.category}
                  </div>
                )}
                {item.quantity && (
                  <div>
                    <span style={{ fontWeight: '500' }}>數量：</span>
                    {typeof item.quantity === 'object' ? 
                      `${item.quantity.amount} ${item.quantity.unit}` : 
                      item.quantity
                    }
                  </div>
                )}
                {item.expirationDate && (
                  <div>
                    <span style={{ fontWeight: '500' }}>效期：</span>
                    {item.expirationDate}
                  </div>
                )}
                {item.itemKey && (
                  <div>
                    <span style={{ fontWeight: '500' }}>代碼：</span>
                    {item.itemKey}
                  </div>
                )}
              </div>

              {/* 來源標籤 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  來源：{
                    item.source === 'ocr-identified' ? '📝 文字識別 (Gemini 2.5)' :
                    item.source === 'google-vision' ? '🔍 物件識別 (Google Vision)' :
                    item.source === 'barcode' ? '📱 條碼查詢' :
                    '🤖 AI 識別'
                  }
                </div>
                {item.priority && (
                  <div style={{
                    padding: '2px 8px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#6b7280'
                  }}>
                    優先級: {item.priority.toFixed(2)}
                  </div>
                )}
              </div>

              {/* 操作按鈕 */}
              <div style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => onQuickAdd(item)}
                  disabled={isLoading}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.6 : 1
                  }}
                >
                  ⚡ 快速加入庫存
                </button>
                
                <button
                  onClick={() => onDetailedSetup(item)}
                  disabled={isLoading}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.6 : 1
                  }}
                >
                  ⚙️ 詳細設定
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: 40,
          color: '#6b7280',
          border: '2px dashed #d1d5db',
          borderRadius: 12
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div>未識別到食材項目</div>
          <div style={{ fontSize: 14, marginTop: 8 }}>
            請嘗試重新拍照或上傳更清晰的圖片
          </div>
        </div>
      )}

      {/* 建議信息 */}
      {recommendations.length > 0 && (
        <div style={{
          marginTop: 20,
          padding: 16,
          backgroundColor: '#fffbeb',
          border: '1px solid #fbbf24',
          borderRadius: 12
        }}>
          <h4 style={{
            margin: '0 0 12px 0',
            color: '#92400e',
            fontSize: '16px'
          }}>
            💡 智慧建議
          </h4>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {recommendations.map((rec, index) => (
              <li key={index} style={{
                color: '#92400e',
                fontSize: '14px',
                marginBottom: 4
              }}>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 重新識別按鈕 */}
      <div style={{
        marginTop: 20,
        textAlign: 'center'
      }}>
        <button
          onClick={onRetry}
          disabled={isLoading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1
          }}
        >
          📸 重新識別
        </button>
      </div>
    </div>
  );
};

export default AiIdentificationResults;