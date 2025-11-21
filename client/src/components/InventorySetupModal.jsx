import React from 'react';
import FoodSelector from './FoodSelector.jsx';
import StorageContextForm from './StorageContextForm.jsx';
import InventoryForm from './InventoryForm.jsx';

/**
 * 庫存設定模態窗口組件
 * 統一處理詳細的庫存設定界面
 */
const InventorySetupModal = ({
  isOpen,
  onClose,
  selectedItem,
  facts,
  onFactsChange,
  inventoryData,
  onInventoryDataChange,
  onEstimate,
  onSave,
  estimate,
  isEstimating,
  isSaving
}) => {
  if (!isOpen || !selectedItem) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: 16,
        maxWidth: 700,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* 模態窗口頭部 */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f9fafb',
          borderRadius: '16px 16px 0 0'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            📦 庫存詳細設定
          </h3>
          <button
            onClick={onClose}
            style={{
              padding: '6px 12px',
              backgroundColor: '#f3f4f6',
              color: '#6b7280',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            ✕ 關閉
          </button>
        </div>

        {/* 模態窗口內容 */}
        <div style={{ padding: 24 }}>
          {/* 選中項目摘要 */}
          <div style={{
            padding: 16,
            backgroundColor: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: 12,
            marginBottom: 24
          }}>
            <div style={{
              fontWeight: '600',
              color: '#0369a1',
              fontSize: '16px',
              marginBottom: 8
            }}>
              🎯 {selectedItem.name}
              {selectedItem.englishName && ` (${selectedItem.englishName})`}
            </div>
            <div style={{ fontSize: '13px', color: '#374151' }}>
              <div>信心度：{Math.round((selectedItem.confidence || 0) * 100)}%</div>
              <div>分類：{selectedItem.category || '未分類'}</div>
              <div>代碼：{selectedItem.itemKey || '自動推測'}</div>
              <div>來源：{
                selectedItem.source === 'ocr-identified' ? '📝 文字識別 (Gemini 2.5)' :
                selectedItem.source === 'google-vision' ? '🔍 物件識別 (Google Vision)' :
                '🤖 AI 識別'
              }</div>
            </div>
          </div>

          {/* 食材選擇器 */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ 
              margin: '0 0 12px 0', 
              color: '#374151', 
              fontSize: '16px',
              fontWeight: '600'
            }}>
              食材種類
            </h4>
            <FoodSelector
              value={facts.itemKey}
              onChange={(value) => onFactsChange({ ...facts, itemKey: value })}
              placeholder={selectedItem.itemKey ? 
                `AI 推測: ${selectedItem.itemKey}` : 
                "搜尋食材種類..."
              }
            />
          </div>

          {/* 保存情境設定 */}
          <div style={{ marginBottom: 20 }}>
            <StorageContextForm
              facts={facts}
              onFactsChange={onFactsChange}
            />
          </div>

          {/* 庫存資訊 */}
          <div style={{ marginBottom: 20 }}>
            <InventoryForm
              inventoryData={inventoryData}
              onInventoryDataChange={onInventoryDataChange}
            />
          </div>

          {/* 估算結果 */}
          {estimate && (
            <div style={{
              padding: 16,
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 12,
              marginBottom: 20
            }}>
              <h4 style={{
                margin: '0 0 12px 0',
                color: '#166534',
                fontSize: '16px'
              }}>
                📊 保存期限估算
              </h4>
              <div style={{ fontSize: '14px', color: '#374151' }}>
                <div style={{ marginBottom: 6 }}>
                  <strong>估算天數：</strong>
                  {estimate.daysMin}–{estimate.daysMax} 天
                  <span style={{ 
                    marginLeft: 8, 
                    color: '#6b7280',
                    fontSize: '12px'
                  }}>
                    (信心 {Math.round(estimate.confidence * 100)}%)
                  </span>
                </div>
                
                <div style={{ marginBottom: 6 }}>
                  <strong>建議：</strong>
                  {estimate.tips || '—'}
                </div>
                
                {estimate.baseDateISO && (
                  <div style={{ 
                    color: estimate.usingPurchaseDate ? '#059669' : '#6b7280',
                    fontSize: '12px'
                  }}>
                    <strong>計算基準：</strong>
                    {new Date(estimate.baseDateISO).toLocaleDateString()}
                    {estimate.usingPurchaseDate ? ' (購買日期)' : ' (當前日期)'}
                  </div>
                )}
                
                {estimate.expiresMinAtISO && (
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    <strong>最短保存期：</strong>
                    {new Date(estimate.expiresMinAtISO).toLocaleDateString()}
                  </div>
                )}
                
                {estimate.expiresMaxAtISO && (
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    <strong>最長保存期：</strong>
                    {new Date(estimate.expiresMaxAtISO).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 操作按鈕 */}
          <div style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap'
          }}>
            <button
              onClick={onEstimate}
              disabled={!facts.itemKey || isEstimating}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: (!facts.itemKey || isEstimating) ? 'not-allowed' : 'pointer',
                opacity: (!facts.itemKey || isEstimating) ? 0.6 : 1
              }}
            >
              {isEstimating ? '計算中...' : '📊 估算保存期限'}
            </button>

            <button
              onClick={onSave}
              disabled={!facts.itemKey || isSaving}
              style={{
                padding: '10px 20px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: (!facts.itemKey || isSaving) ? 'not-allowed' : 'pointer',
                opacity: (!facts.itemKey || isSaving) ? 0.6 : 1
              }}
            >
              {isSaving ? '保存中...' : '📦 加入庫存'}
            </button>
          </div>

          {/* 提示信息 */}
          {!facts.itemKey && (
            <div style={{
              marginTop: 16,
              padding: 12,
              backgroundColor: '#fef3c7',
              border: '1px solid #fbbf24',
              borderRadius: 8,
              fontSize: '14px',
              color: '#92400e'
            }}>
              💡 請先選擇「食材種類」後再操作
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventorySetupModal;