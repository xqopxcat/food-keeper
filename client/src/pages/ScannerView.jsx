import React, { useState, useEffect } from 'react'
import BarcodeScanner from '../components/BarcodeScanner.jsx';
import FoodSelector from '../components/FoodSelector.jsx';
import InventoryForm from '../components/InventoryForm.jsx';
import StorageContextForm from '../components/StorageContextForm.jsx';
import HeaderBar from '../components/HeaderBar.jsx';
import Card, { StatusCard, ActionCard } from '../components/Card.jsx';
import { DESIGN_SYSTEM, COMMON_STYLES } from '../styles/designSystem.js';
import {
  useLazyLookupByBarcodeQuery,
  useEstimateShelfLifeMutation,
} from '../redux/services/foodCoreAPI.js';
import { inferDefaultsFromProduct } from '../inferDefaults.js';
import { useInventoryManagement, useStorageContext } from '../hooks/useInventoryData.js';
import { useShelfLifeEstimate } from '../hooks/useInventoryActions.js';

const ScannerView = () => {
  const [barcode, setBarcode] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [estimate, setEstimate] = useState(null);

  // 使用自定義 hooks
  const { facts, setFacts, resetFacts } = useStorageContext();
  const { inventoryData, setInventoryData, resetInventoryData } = useInventoryManagement();
  const { estimateAndSave } = useShelfLifeEstimate();

  // RTK Query hooks
  const [triggerLookup, { 
    data: lookupData, 
    isLoading: lookupLoading, 
    error: lookupError 
  }] = useLazyLookupByBarcodeQuery();
  
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
  
  // 處理估算保存期限
  async function handleEstimate(save = false) {
    const scannerResult = await estimateAndSave(facts, inventoryData, barcode, result?.product?.name, save);
    if (scannerResult.success) {
      if (save) {
        alert(scannerResult.message);
        resetForm();
      } else {
        setEstimate(scannerResult.data);
      }
    } else {
      alert(scannerResult.message);
    }
  }

  // 加入庫存的簡化版本
  async function handleAddToInventory() {
    await handleEstimate(true);
  }

  function resetForm() {
    setBarcode(null);
    setResult(null);
    setError(null);
    setEstimate(null);
    resetFacts();
    resetInventoryData();
  }

  async function handleDetected(code) {
    setBarcode(code);
    setResult(null);
    setError(null);
    
    // 使用 RTK Query 進行查詢，強制重新獲取
    triggerLookup(code, true);
  }

  const readyForEstimate = !!facts.itemKey && !!facts.storageMode;
  const loading = lookupLoading;

  return (
    <div style={COMMON_STYLES.pageContainer}>
      <HeaderBar 
        title="📱 條碼掃描"
        subtitle="掃描條碼快速識別食材"
      />

      <div className="responsive-container" style={COMMON_STYLES.container}>
        {/* 掃描區域 */}
        {!barcode && (
          <Card 
            title="📷 條碼掃描器" 
            style={{ marginBottom: DESIGN_SYSTEM.spacing.lg }}
          >
            <div style={{
              textAlign: 'center',
              marginBottom: DESIGN_SYSTEM.spacing.md
            }}>
              <p style={{
                margin: 0,
                color: DESIGN_SYSTEM.colors.gray[600],
                fontSize: DESIGN_SYSTEM.typography.sizes.sm,
                lineHeight: '1.5'
              }}>
                將條碼對準掃描區域，系統會自動識別商品資訊
              </p>
            </div>
            
            <div style={{ 
              padding: DESIGN_SYSTEM.spacing.lg,
              backgroundColor: DESIGN_SYSTEM.colors.gray[50],
              borderRadius: DESIGN_SYSTEM.borderRadius.xl,
              border: `2px dashed ${DESIGN_SYSTEM.colors.gray[300]}`,
              minHeight: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BarcodeScanner onDetected={handleDetected} />
            </div>
          </Card>
        )}

        {/* 掃描結果 */}
        {barcode && (
          <Card 
            title={`🏷️ 掃描結果`}
            style={{ marginBottom: DESIGN_SYSTEM.spacing.lg }}
          >
            {/* 條碼資訊 */}
            <div style={{
              padding: DESIGN_SYSTEM.spacing.md,
              backgroundColor: DESIGN_SYSTEM.colors.primary[50],
              borderRadius: DESIGN_SYSTEM.borderRadius.lg,
              marginBottom: DESIGN_SYSTEM.spacing.md,
              border: `1px solid ${DESIGN_SYSTEM.colors.primary[200]}`
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: DESIGN_SYSTEM.spacing.sm,
                marginBottom: DESIGN_SYSTEM.spacing.xs
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: DESIGN_SYSTEM.colors.success
                }} />
                <span style={{
                  fontSize: DESIGN_SYSTEM.typography.sizes.sm,
                  color: DESIGN_SYSTEM.colors.primary[700],
                  fontWeight: '500'
                }}>
                  掃描成功
                </span>
              </div>
              <div style={{
                fontSize: DESIGN_SYSTEM.typography.sizes.lg,
                fontWeight: '600',
                color: DESIGN_SYSTEM.colors.primary[800],
                fontFamily: 'monospace'
              }}>
                {barcode}
              </div>
            </div>

            {loading && (
              <div style={{ 
                textAlign: 'center', 
                padding: DESIGN_SYSTEM.spacing.xl,
                color: DESIGN_SYSTEM.colors.gray[600]
              }}>
                <div style={{ 
                  fontSize: '32px', 
                  marginBottom: DESIGN_SYSTEM.spacing.md,
                  animation: 'spin 2s linear infinite'
                }}>
                  🔄
                </div>
                <div style={{
                  fontSize: DESIGN_SYSTEM.typography.sizes.base,
                  fontWeight: '500'
                }}>
                  正在查詢商品資料...
                </div>
                <div style={{
                  fontSize: DESIGN_SYSTEM.typography.sizes.sm,
                  color: DESIGN_SYSTEM.colors.gray[500],
                  marginTop: DESIGN_SYSTEM.spacing.xs
                }}>
                  請稍候，正在從多個數據源查詢
                </div>
              </div>
            )}
            
            {error && (
              <div style={{ 
                padding: DESIGN_SYSTEM.spacing.md,
                backgroundColor: DESIGN_SYSTEM.colors.error + '10',
                border: `1px solid ${DESIGN_SYSTEM.colors.error}30`,
                borderRadius: DESIGN_SYSTEM.borderRadius.lg,
                color: DESIGN_SYSTEM.colors.error,
                marginBottom: DESIGN_SYSTEM.spacing.md
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: DESIGN_SYSTEM.spacing.sm,
                  marginBottom: DESIGN_SYSTEM.spacing.xs
                }}>
                  <span style={{ fontSize: '20px' }}>⚠️</span>
                  <span style={{ fontWeight: '600' }}>查詢失敗</span>
                </div>
                <div style={{ fontSize: DESIGN_SYSTEM.typography.sizes.sm }}>
                  {error}
                </div>
              </div>
            )}
            
            {result && (
              <div>
                <div style={{ 
                  display: 'flex', 
                  gap: DESIGN_SYSTEM.spacing.lg, 
                  alignItems: 'flex-start',
                  marginBottom: DESIGN_SYSTEM.spacing.lg
                }}>
                  {result.product?.image_url && (
                    <img 
                      src={result.product.image_url} 
                      alt={result.product.name}
                      style={{ 
                        width: 120, 
                        height: 120, 
                        objectFit: 'cover', 
                        borderRadius: DESIGN_SYSTEM.borderRadius.lg,
                        border: `2px solid ${DESIGN_SYSTEM.colors.gray[200]}`,
                        flexShrink: 0
                      }}
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  )}
                  
                  <div style={{ flex: 1 }}>
                    {/* 數據源標識 */}
                    <div style={{
                      display: 'inline-block',
                      padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.sm}`,
                      backgroundColor: result.source === 'local' ? DESIGN_SYSTEM.colors.success + '20' : DESIGN_SYSTEM.colors.info + '20',
                      color: result.source === 'local' ? DESIGN_SYSTEM.colors.success : DESIGN_SYSTEM.colors.info,
                      borderRadius: DESIGN_SYSTEM.borderRadius.full,
                      fontSize: DESIGN_SYSTEM.typography.sizes.xs,
                      fontWeight: '600',
                      marginBottom: DESIGN_SYSTEM.spacing.sm
                    }}>
                      {result.source === 'local' ? '本地資料庫' : 
                       result.source === 'openfoodfacts' ? 'Open Food Facts' :
                       result.source === 'taiwan_fda' ? '🇹🇼 台灣食藥署' :
                       result.source === 'taiwan_local' ? '🇹🇼 台灣品牌' :
                       result.source === 'taiwan_generic' ? '🇹🇼 台灣製造' :
                       result.source === 'upcdatabase' ? 'UPC Database' : result.source}
                    </div>

                    {/* 產品名稱 */}
                    <h3 style={{
                      margin: `0 0 ${DESIGN_SYSTEM.spacing.sm} 0`,
                      fontSize: DESIGN_SYSTEM.typography.sizes.lg,
                      fontWeight: '700',
                      color: DESIGN_SYSTEM.colors.gray[900],
                      lineHeight: '1.3'
                    }}>
                      {result.product?.name || '未知產品'}
                    </h3>
                    
                    {/* 產品詳細資訊 */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                      gap: DESIGN_SYSTEM.spacing.sm,
                      marginBottom: DESIGN_SYSTEM.spacing.md
                    }}>
                      {result.product?.brand && (
                        <div>
                          <div style={{ 
                            fontSize: DESIGN_SYSTEM.typography.sizes.xs,
                            color: DESIGN_SYSTEM.colors.gray[500],
                            marginBottom: '2px'
                          }}>品牌</div>
                          <div style={{
                            fontSize: DESIGN_SYSTEM.typography.sizes.sm,
                            fontWeight: '500',
                            color: DESIGN_SYSTEM.colors.gray[700]
                          }}>{result.product.brand}</div>
                        </div>
                      )}
                      
                      {result.product?.quantity && (
                        <div>
                          <div style={{ 
                            fontSize: DESIGN_SYSTEM.typography.sizes.xs,
                            color: DESIGN_SYSTEM.colors.gray[500],
                            marginBottom: '2px'
                          }}>規格</div>
                          <div style={{
                            fontSize: DESIGN_SYSTEM.typography.sizes.sm,
                            fontWeight: '500',
                            color: DESIGN_SYSTEM.colors.gray[700]
                          }}>{result.product.quantity}</div>
                        </div>
                      )}
                      
                      {result.product?.category && (
                        <div>
                          <div style={{ 
                            fontSize: DESIGN_SYSTEM.typography.sizes.xs,
                            color: DESIGN_SYSTEM.colors.gray[500],
                            marginBottom: '2px'
                          }}>分類</div>
                          <div style={{
                            fontSize: DESIGN_SYSTEM.typography.sizes.sm,
                            fontWeight: '500',
                            color: DESIGN_SYSTEM.colors.gray[700]
                          }}>{result.product.category}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => { 
                    setBarcode(null); 
                    setResult(null); 
                    setError(null); 
                  }}
                  style={{
                    ...COMMON_STYLES.secondaryButton,
                    width: '100%'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = DESIGN_SYSTEM.shadows.md;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = DESIGN_SYSTEM.shadows.sm;
                  }}
                >
                  🔍 掃描下一個產品
                </button>
              </div>
            )}
          </Card>
        )}

        {/* 保存情境表單 */}
        {barcode && (
          <Card title="📦 保存設定" style={{ marginBottom: DESIGN_SYSTEM.spacing.lg }}>
            {/* 食材選擇器 */}
            <div style={{ marginBottom: DESIGN_SYSTEM.spacing.md }}>
              <label style={{ 
                display: 'block', 
                marginBottom: DESIGN_SYSTEM.spacing.xs, 
                fontWeight: '500',
                fontSize: DESIGN_SYSTEM.typography.sizes.sm
              }}>
                食材種類 (itemKey) *
              </label>
              <FoodSelector
                value={facts.itemKey}
                onChange={(value) => setFacts({ ...facts, itemKey: value })}
              />
            </div>

            {/* 保存情境表單 */}
            <div style={{ marginBottom: DESIGN_SYSTEM.spacing.md }}>
              <StorageContextForm
                facts={facts}
                onFactsChange={setFacts}
                style={{ padding: 0, border: 'none', backgroundColor: 'transparent' }}
              />
            </div>

            {/* 庫存管理表單 */}
            <div style={{ marginBottom: DESIGN_SYSTEM.spacing.lg }}>
              <InventoryForm
                inventoryData={inventoryData}
                onInventoryDataChange={setInventoryData}
              />
            </div>

            {/* 操作按鈕 */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: DESIGN_SYSTEM.spacing.sm,
              marginBottom: DESIGN_SYSTEM.spacing.md
            }}>
              <button 
                onClick={() => handleEstimate(false)} 
                disabled={!readyForEstimate || loading}
                style={{
                  ...COMMON_STYLES.secondaryButton,
                  opacity: (!readyForEstimate || loading) ? 0.5 : 1,
                  cursor: (!readyForEstimate || loading) ? 'not-allowed' : 'pointer'
                }}
              >
                📊 估算期限
              </button>
              
              <button 
                onClick={handleAddToInventory}
                disabled={!facts.itemKey || loading}
                style={{
                  ...COMMON_STYLES.primaryButton,
                  opacity: (!facts.itemKey || loading) ? 0.5 : 1,
                  cursor: (!facts.itemKey || loading) ? 'not-allowed' : 'pointer'
                }}
              >
                📦 加入庫存
              </button>
            </div>

            {!readyForEstimate && (
              <div style={{ 
                padding: DESIGN_SYSTEM.spacing.sm,
                backgroundColor: DESIGN_SYSTEM.colors.warning + '20',
                border: `1px solid ${DESIGN_SYSTEM.colors.warning}40`,
                borderRadius: DESIGN_SYSTEM.borderRadius.md,
                color: DESIGN_SYSTEM.colors.warning,
                fontSize: DESIGN_SYSTEM.typography.sizes.sm,
                marginBottom: DESIGN_SYSTEM.spacing.md
              }}>
                💡 請選擇「食材種類」與「保存方式」後再操作
              </div>
            )}

            {/* 估算結果 */}
            {estimate && (
              <Card 
                backgroundColor={DESIGN_SYSTEM.colors.success + '20'}
                borderColor={DESIGN_SYSTEM.colors.success + '40'}
                style={{ marginTop: DESIGN_SYSTEM.spacing.md }}
              >
                <div style={{ fontSize: DESIGN_SYSTEM.typography.sizes.sm }}>
                  <div style={{ marginBottom: DESIGN_SYSTEM.spacing.xs }}>
                    <strong>📅 估算天數：</strong>{estimate.daysMin}–{estimate.daysMax} 天
                    <span style={{ 
                      marginLeft: DESIGN_SYSTEM.spacing.xs, 
                      color: DESIGN_SYSTEM.colors.gray[600] 
                    }}>
                      (信心 {Math.round(estimate.confidence*100)}%)
                    </span>
                  </div>
                  
                  <div style={{ marginBottom: DESIGN_SYSTEM.spacing.xs }}>
                    <strong>💡 建議：</strong>{estimate.tips || '—'}
                  </div>
                  
                  {estimate.baseDateISO && (
                    <div style={{ 
                      color: estimate.usingPurchaseDate ? DESIGN_SYSTEM.colors.success : DESIGN_SYSTEM.colors.gray[600],
                      marginBottom: DESIGN_SYSTEM.spacing.xs
                    }}>
                      <strong>📍 計算基準：</strong>
                      {new Date(estimate.baseDateISO).toLocaleDateString()} 
                      {estimate.usingPurchaseDate ? ' (購買日期)' : ' (當前日期)'}
                    </div>
                  )}
                  
                  {estimate.expiresMinAtISO && (
                    <div style={{ marginBottom: DESIGN_SYSTEM.spacing.xs }}>
                      <strong>⏰ 最短保存期：</strong>{new Date(estimate.expiresMinAtISO).toLocaleDateString()}
                    </div>
                  )}
                  
                  {estimate.expiresMaxAtISO && (
                    <div style={{ marginBottom: DESIGN_SYSTEM.spacing.xs }}>
                      <strong>⏰ 最長保存期：</strong>{new Date(estimate.expiresMaxAtISO).toLocaleDateString()}
                    </div>
                  )}
                  
                  {estimate.saved && (
                    <div style={{ 
                      color: DESIGN_SYSTEM.colors.success, 
                      fontWeight: 'bold',
                      padding: DESIGN_SYSTEM.spacing.sm,
                      backgroundColor: DESIGN_SYSTEM.colors.success + '20',
                      borderRadius: DESIGN_SYSTEM.borderRadius.sm,
                      marginTop: DESIGN_SYSTEM.spacing.sm
                    }}>
                      ✅ 已成功加入庫存
                    </div>
                  )}
                </div>
              </Card>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}

export default ScannerView