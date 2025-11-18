import React, { useState, useEffect } from 'react';
import Camera from '../components/Camera.jsx';
import FoodSelector from '../components/FoodSelector.jsx';
import InventoryForm from '../components/InventoryForm.jsx';
import StorageContextForm from '../components/StorageContextForm.jsx';
import HeaderBar from '../components/HeaderBar.jsx';
import FullScreenScanner from '../components/FullScreenScanner.jsx';
import Card, { StatusCard, ActionCard } from '../components/Card.jsx';
import { BrowserMultiFormatReader } from '@zxing/library';
import { 
  useIdentifyFoodItemsMutation, 
  useExtractTextFromImageMutation,
  useLazyLookupByBarcodeQuery,
  useGetAiStatusQuery,
  useAddInventoryItemMutation,
  useEstimateShelfLifeMutation
} from '../redux/services/foodCoreAPI';
import { inferDefaultsFromProduct } from '../inferDefaults.js';
import { useInventoryManagement, useStorageContext } from '../hooks/useInventoryData.js';
import { useAddToInventory } from '../hooks/useInventoryActions.js';
import { foodOptions, unitOptions, locationOptions } from '../constants/index.jsx';
import { DESIGN_SYSTEM, COMMON_STYLES } from '../styles/designSystem.js';
// 開發模式支援
import { DEV_CONFIG, canUseAPI, recordAPIUsage, getRemainingQuota } from '../config/developmentMode.js';
import { mockIdentifyFood, mockExtractText, mockLookupBarcode, generateRandomMockData } from '../services/mockApiService.js';

const AiIdentificationView = () => {
  const [mode, setMode] = useState('home'); // 'home', 'camera', 'upload', 'results'
  const [capturedImage, setCapturedImage] = useState(null);
  const [identificationResults, setIdentificationResults] = useState(null);
  const [ocrResults, setOcrResults] = useState(null);
  const [barcodeResults, setBarcodeResults] = useState(null);
  const [unifiedResults, setUnifiedResults] = useState(null);
  const [selectedItemForStorage, setSelectedItemForStorage] = useState(null);
  const [showStorageModal, setShowStorageModal] = useState(false);
  
  // 開發模式狀態
  const [isDevelopmentMode, setIsDevelopmentMode] = useState(DEV_CONFIG.useMockData);
  const [apiQuota, setApiQuota] = useState(getRemainingQuota());
  const [showDevPanel, setShowDevPanel] = useState(DEV_CONFIG.isDevelopment);

  // 使用自定義 hooks
  const { facts, setFacts, resetFacts } = useStorageContext();
  const { inventoryData, setInventoryData, resetInventoryData } = useInventoryManagement();
  const { addToInventory } = useAddToInventory();

  // RTK Query hooks
  const [identifyFood, { isLoading: isIdentifying }] = useIdentifyFoodItemsMutation();
  const [extractText, { isLoading: isExtracting }] = useExtractTextFromImageMutation();
  const [triggerBarcodelookup, { isLoading: isLookingUp }] = useLazyLookupByBarcodeQuery();
  const { data: aiStatus } = useGetAiStatusQuery();
  const [addInventoryItem, { isLoading: isAdding }] = useAddInventoryItemMutation();
  const [estimateShelfLife, { isLoading: isEstimating }] = useEstimateShelfLifeMutation();

  // 處理拍照結果
  const handleCapture = async (imageData) => {
    console.log('Captured image data:', imageData);
    setCapturedImage(imageData);
    setMode('results');
    await performUnifiedRecognition(imageData.base64);
  };

  // 統一識別協調器 - 簡化版本，保持原有功能
  const performUnifiedRecognition = async (base64Image) => {
    console.log('Starting unified recognition with base64 length:', base64Image.length);
    
    try {
      setIdentificationResults(null);
      setOcrResults(null);
      setBarcodeResults(null);
      setUnifiedResults(null);

      // AI 物件識別
      let aiResults = null;
      try {
        if (isDevelopmentMode || !canUseAPI('vision')) {
          aiResults = await mockIdentifyFood(base64Image);
          if (!isDevelopmentMode) {
            aiResults.warning = '已達今日 Vision API 配額限制，使用模擬數據';
          }
        } else {
          aiResults = await identifyFood({ imageBase64: base64Image }).unwrap();
          recordAPIUsage('vision');
          setApiQuota(getRemainingQuota());
        }
        setIdentificationResults(aiResults);
      } catch (error) {
        setIdentificationResults({ success: false, error: error.message });
      }

      // OCR 文字識別
      let textResults = null;
      try {
        if (isDevelopmentMode || !canUseAPI('gemini')) {
          textResults = await mockExtractText(base64Image);
          if (!isDevelopmentMode) {
            textResults.warning = '已達今日 Gemini API 配額限制，使用模擬數據';
          }
        } else {
          textResults = await extractText({ imageBase64: base64Image }).unwrap();
          recordAPIUsage('gemini');
          setApiQuota(getRemainingQuota());
        }
        setOcrResults(textResults);
      } catch (error) {
        setOcrResults({ success: false, error: error.message });
      }

      // 條碼識別
      let barcodeResults = null;
      try {
        barcodeResults = await extractAndLookupBarcode(base64Image);
        setBarcodeResults(barcodeResults);
      } catch (error) {
        setBarcodeResults({ success: false, error: error.message });
      }

      // 合併結果
      const unified = mergeRecognitionResults(aiResults, textResults, barcodeResults);
      setUnifiedResults(unified);

    } catch (error) {
      console.error('Unified recognition failed:', error);
      alert('識別過程發生錯誤：' + (error.message || '未知錯誤'));
    }
  };

  // 條碼識別功能（保持原有邏輯）
  const extractAndLookupBarcode = async (base64Image) => {
    try {
      const codeReader = new BrowserMultiFormatReader();
      const img = new Image();
      img.src = `data:image/jpeg;base64,${base64Image}`;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      try {
        const result = await codeReader.decodeFromImageElement(img);
        const barcode = result.getText();
        const productData = await triggerBarcodelookup(barcode).unwrap();
        
        return {
          success: true,
          products: [{
            barcode,
            product: productData.product,
            source: productData.source
          }]
        };
      } catch (decodeError) {
        return { success: false, message: '未檢測到條碼' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // 合併識別結果（保持原有邏輯）
  const mergeRecognitionResults = (aiResult, ocrResult, barcodeResult) => {
    const mergedData = {
      hasResults: false,
      confidence: { overall: 0, ai: 0, ocr: 0, barcode: 0 },
      foodItems: [],
      barcodeProducts: [],
      extractedText: null,
      recommendations: []
    };

    if (aiResult?.success && aiResult.items?.length > 0) {
      mergedData.hasResults = true;
      mergedData.confidence.ai = aiResult.items.reduce((sum, item) => sum + (item.confidence || 0), 0) / aiResult.items.length;
      mergedData.foodItems.push(...aiResult.items.map(item => ({ ...item, source: 'ai-identified' })));
    }

    if (ocrResult?.success) {
      mergedData.hasResults = true;
      if (ocrResult.text && (ocrResult.text.name || ocrResult.text.itemKey)) {
        mergedData.confidence.ocr = 0.8;
        const ocrItem = {
          name: ocrResult.text.name || '未知產品',
          itemKey: ocrResult.text.itemKey || null,
          brand: ocrResult.text.brand || null,
          category: ocrResult.text.category || null,
          confidence: ocrResult.confidence || 0.8,
          source: 'ocr-identified'
        };
        mergedData.foodItems.push(ocrItem);
      }
      if (ocrResult.text) {
        mergedData.extractedText = ocrResult.text.allText || (typeof ocrResult.text === 'string' ? ocrResult.text : JSON.stringify(ocrResult.text));
      }
    }

    if (barcodeResult?.success && barcodeResult.products?.length > 0) {
      mergedData.hasResults = true;
      mergedData.confidence.barcode = 0.95;
      mergedData.barcodeProducts = barcodeResult.products;
    }

    const confidenceValues = [mergedData.confidence.ai, mergedData.confidence.ocr, mergedData.confidence.barcode].filter(c => c > 0);
    mergedData.confidence.overall = confidenceValues.length > 0 ? confidenceValues.reduce((sum, c) => sum + c, 0) / confidenceValues.length : 0;

    return mergedData;
  };

  // 其他功能函數（保持原有邏輯）
  const selectItemForStorage = (item) => {
    setSelectedItemForStorage(item);
    setShowStorageModal(true);
    
    if (item.itemKey) {
      setFacts(prev => ({
        ...prev,
        itemKey: item.itemKey,
        storageMode: item.storageMode || 'fridge',
        state: item.state || 'whole'
      }));
    }
  };

  const closeStorageModal = () => {
    setShowStorageModal(false);
    setSelectedItemForStorage(null);
  };

  const handleEstimateShelfLife = async () => {
    if (!facts.itemKey) {
      alert('請先選擇食材種類');
      return;
    }

    try {
      const payload = { ...facts, purchaseDate: inventoryData.purchaseDate };
      const data = await estimateShelfLife(payload).unwrap();
      alert(`估算保存期限：${data.daysMin || 0}-${data.daysMax || 0} 天`);
    } catch (e) {
      alert(e?.message || '估算失敗');
    }
  };

  const handleAdvancedAddToInventory = async () => {
    if (!facts.itemKey) {
      alert('請先選擇食材種類');
      return;
    }

    try {
      const payload = {
        manualName: selectedItemForStorage?.name,
        ...facts,
        save: true,
        quantity: inventoryData.quantity,
        purchaseDate: inventoryData.purchaseDate,
        location: inventoryData.location,
        source: selectedItemForStorage?.source || 'manual',
        notes: inventoryData.notes,
      };

      const response = await estimateShelfLife(payload).unwrap();
      
      if (response.saved) {
        alert(`✅ 已成功加入庫存！\n預估保存期限：${response.daysMin || 'N/A'}~${response.daysMax || 'N/A'} 天`);
        closeStorageModal();
      }
    } catch (e) {
      alert(`❌ 加入庫存失敗：${e.message || '未知錯誤'}`);
    }
  };

  const reset = () => {
    setCapturedImage(null);
    setIdentificationResults(null);
    setOcrResults(null);
    setBarcodeResults(null);
    setUnifiedResults(null);
    setSelectedItemForStorage(null);
    setShowStorageModal(false);
    resetFacts();
    resetInventoryData();
    setMode('home');
  };

  // AI 服務狀態檢查
  if (!aiStatus?.aiEnabled) {
    return (
      <div style={COMMON_STYLES.pageContainer}>
        <HeaderBar 
          title="AI 識別"
          subtitle="服務暫時無法使用"
        />
        <div style={{
          ...COMMON_STYLES.container,
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 64px)',
          padding: DESIGN_SYSTEM.spacing.xl
        }}>
          <div style={{ fontSize: '64px', marginBottom: DESIGN_SYSTEM.spacing.lg }}>⚠️</div>
          <h3 style={{ 
            color: DESIGN_SYSTEM.colors.warning, 
            marginBottom: DESIGN_SYSTEM.spacing.md,
            textAlign: 'center',
            fontSize: DESIGN_SYSTEM.typography.sizes.xl,
            fontWeight: DESIGN_SYSTEM.typography.weights.semibold
          }}>
            AI 服務暫時無法使用
          </h3>
          <p style={{ 
            color: DESIGN_SYSTEM.colors.gray[600], 
            fontSize: DESIGN_SYSTEM.typography.sizes.base,
            textAlign: 'center',
            lineHeight: '1.5'
          }}>
            請檢查網路連線或稍後再試
          </p>
        </div>
      </div>
    );
  }

  // 主頁面 - 發票怪獸風格
  if (mode === 'home') {
    return (
      <div style={COMMON_STYLES.pageContainer}>
        <HeaderBar 
          title="🤖 AI 識別"
          subtitle="一次掃描，智慧識別食材"
          rightButton={
            showDevPanel && (
              <button
                onClick={() => setIsDevelopmentMode(!isDevelopmentMode)}
                style={{
                  padding: DESIGN_SYSTEM.spacing.xs,
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: DESIGN_SYSTEM.borderRadius.md,
                  cursor: 'pointer',
                  fontSize: DESIGN_SYSTEM.typography.sizes.xs
                }}
              >
                🛠️
              </button>
            )
          }
        />

        {/* 開發者面板 */}
        {showDevPanel && (
          <div style={{
            ...COMMON_STYLES.container,
            paddingTop: 0
          }}>
            <Card
              backgroundColor={isDevelopmentMode ? DESIGN_SYSTEM.colors.warning + '20' : DESIGN_SYSTEM.colors.info + '20'}
              borderColor={isDevelopmentMode ? DESIGN_SYSTEM.colors.warning : DESIGN_SYSTEM.colors.info}
              style={{ marginBottom: DESIGN_SYSTEM.spacing.lg }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: DESIGN_SYSTEM.spacing.sm
              }}>
                <strong style={{
                  color: isDevelopmentMode ? DESIGN_SYSTEM.colors.warning : DESIGN_SYSTEM.colors.info,
                  fontSize: DESIGN_SYSTEM.typography.sizes.sm
                }}>
                  🧪 開發模式 {isDevelopmentMode ? '(模擬數據)' : '(真實 API)'}
                </strong>
                <button
                  onClick={() => setIsDevelopmentMode(!isDevelopmentMode)}
                  style={{
                    ...COMMON_STYLES.primaryButton,
                    padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.sm}`,
                    fontSize: DESIGN_SYSTEM.typography.sizes.xs,
                    backgroundColor: isDevelopmentMode ? DESIGN_SYSTEM.colors.warning : DESIGN_SYSTEM.colors.primary[500]
                  }}
                >
                  {isDevelopmentMode ? '切換真實API' : '切換模擬數據'}
                </button>
              </div>
              
              {!isDevelopmentMode && (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: DESIGN_SYSTEM.spacing.sm,
                  fontSize: DESIGN_SYSTEM.typography.sizes.xs 
                }}>
                  <div>
                    Vision: <strong style={{ color: apiQuota.vision > 0 ? DESIGN_SYSTEM.colors.success : DESIGN_SYSTEM.colors.error }}>
                      {apiQuota.vision}/10
                    </strong>
                  </div>
                  <div>
                    Gemini: <strong style={{ color: apiQuota.gemini > 0 ? DESIGN_SYSTEM.colors.success : DESIGN_SYSTEM.colors.error }}>
                      {apiQuota.gemini}/5
                    </strong>
                  </div>
                  <div>
                    OCR: <strong style={{ color: apiQuota.ocr > 0 ? DESIGN_SYSTEM.colors.success : DESIGN_SYSTEM.colors.error }}>
                      {apiQuota.ocr}/8
                    </strong>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* 主要操作區域 */}
        <div style={{
          ...COMMON_STYLES.container,
          paddingTop: showDevPanel ? 0 : DESIGN_SYSTEM.spacing.lg
        }}>
          {/* 功能統計卡片 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: DESIGN_SYSTEM.spacing.md,
            marginBottom: DESIGN_SYSTEM.spacing.xl
          }}>
            <StatusCard
              status="success"
              icon="🎯"
              title="AI 識別"
              value="95%"
              unit="準確率"
            />
            <StatusCard
              status="info"
              icon="⚡"
              title="識別速度"
              value="2"
              unit="秒內"
            />
          </div>

          {/* 主要掃描按鈕 */}
          <button
            onClick={() => setMode('camera')}
            style={{
              ...COMMON_STYLES.primaryButton,
              width: '100%',
              padding: `${DESIGN_SYSTEM.spacing.xl} ${DESIGN_SYSTEM.spacing.lg}`,
              fontSize: DESIGN_SYSTEM.typography.sizes.lg,
              marginBottom: DESIGN_SYSTEM.spacing.lg,
              background: `linear-gradient(135deg, ${DESIGN_SYSTEM.colors.primary[500]} 0%, ${DESIGN_SYSTEM.colors.primary[600]} 100%)`,
              boxShadow: DESIGN_SYSTEM.shadows.lg,
              transform: 'translateY(0)',
              transition: 'all 0.2s ease'
            }}
            onMouseDown={(e) => e.target.style.transform = 'translateY(2px)'}
            onMouseUp={(e) => e.target.style.transform = 'translateY(0)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            📷 開始掃描識別
          </button>

          {/* 功能卡片 */}
          <div style={{
            display: 'grid',
            gap: DESIGN_SYSTEM.spacing.md
          }}>
            <ActionCard
              icon="🍎"
              title="AI 物件識別"
              subtitle="識別食材種類、品牌和保存方式"
              actionText="了解更多"
            />
            
            <ActionCard
              icon="📝"
              title="包裝文字識別"
              subtitle="掃描包裝上的文字信息和有效期限"
              actionText="了解更多"
            />
            
            <ActionCard
              icon="📱"
              title="條碼掃描"
              subtitle="快速查詢產品詳細信息"
              actionText="了解更多"
            />
          </div>
        </div>
      </div>
    );
  }

  // 全屏掃描模式
  if (mode === 'camera') {
    return (
      <FullScreenScanner
        title="AI 智慧識別"
        subtitle="對準食品包裝進行掃描"
        onClose={() => setMode('home')}
      >
        <Camera
          onCapture={handleCapture}
          onError={(error) => {
            alert(error);
            setMode('home');
          }}
          style={{ width: '100%', height: '100%' }}
        />
      </FullScreenScanner>
    );
  }

  // 結果顯示頁面
  if (mode === 'results') {
    return (
      <div style={COMMON_STYLES.pageContainer}>
        <HeaderBar 
          title="識別結果"
          subtitle={`${unifiedResults?.foodItems?.length || 0} 項結果`}
          showBackButton={true}
          onBack={() => setMode('home')}
          rightButton={
            <button
              onClick={() => setMode('camera')}
              style={{
                ...COMMON_STYLES.secondaryButton,
                padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.sm}`,
                fontSize: DESIGN_SYSTEM.typography.sizes.xs
              }}
            >
              重新掃描
            </button>
          }
        />

        <div style={{
          ...COMMON_STYLES.container,
          paddingTop: DESIGN_SYSTEM.spacing.lg
        }}>
          {/* 拍攝的圖片預覽 */}
          {capturedImage && (
            <Card style={{ marginBottom: DESIGN_SYSTEM.spacing.lg }}>
              <img
                src={`data:image/jpeg;base64,${capturedImage.base64}`}
                alt="掃描圖片"
                style={{
                  width: '100%',
                  height: '200px',
                  objectFit: 'cover',
                  borderRadius: DESIGN_SYSTEM.borderRadius.md
                }}
              />
            </Card>
          )}

          {/* 載入狀態 */}
          {(isIdentifying || isExtracting || isLookingUp) && (
            <Card style={{ marginBottom: DESIGN_SYSTEM.spacing.lg }}>
              <div style={{
                textAlign: 'center',
                padding: DESIGN_SYSTEM.spacing.lg
              }}>
                <div style={{ 
                  fontSize: '32px', 
                  marginBottom: DESIGN_SYSTEM.spacing.md,
                  animation: 'spin 2s linear infinite'
                }}>
                  🤖
                </div>
                <h3>AI 分析中...</h3>
                <p style={{ color: DESIGN_SYSTEM.colors.gray[600], fontSize: DESIGN_SYSTEM.typography.sizes.sm }}>
                  正在進行物件識別、文字分析和條碼掃描
                </p>
              </div>
            </Card>
          )}

          {/* AI 識別結果 */}
          {identificationResults?.success && (
            <Card 
              title="🍎 AI 識別結果" 
              subtitle={`找到 ${identificationResults.items?.length || 0} 個食材`}
              style={{ marginBottom: DESIGN_SYSTEM.spacing.lg }}
            >
              {(identificationResults.items || []).map((item, index) => (
                <div key={index} style={{
                  padding: DESIGN_SYSTEM.spacing.md,
                  backgroundColor: DESIGN_SYSTEM.colors.gray[50],
                  borderRadius: DESIGN_SYSTEM.borderRadius.md,
                  marginBottom: DESIGN_SYSTEM.spacing.md
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: DESIGN_SYSTEM.spacing.sm
                  }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: DESIGN_SYSTEM.typography.sizes.base }}>
                        {item.name}
                      </h4>
                      <p style={{ 
                        margin: 0, 
                        fontSize: DESIGN_SYSTEM.typography.sizes.sm, 
                        color: DESIGN_SYSTEM.colors.gray[600] 
                      }}>
                        信心度: {Math.round((item.confidence || 0) * 100)}%
                      </p>
                    </div>
                    <button
                      onClick={() => selectItemForStorage({ ...item, source: 'ai-identified' })}
                      style={{
                        ...COMMON_STYLES.primaryButton,
                        padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.sm}`,
                        fontSize: DESIGN_SYSTEM.typography.sizes.sm
                      }}
                    >
                      📦 加入庫存
                    </button>
                  </div>
                  
                  {/* 保存期限資訊 */}
                  {item.shelfLife && (
                    <div style={{
                      padding: DESIGN_SYSTEM.spacing.sm,
                      backgroundColor: DESIGN_SYSTEM.colors.primary[50],
                      border: `1px solid ${DESIGN_SYSTEM.colors.primary[200]}`,
                      borderRadius: DESIGN_SYSTEM.borderRadius.sm,
                      fontSize: DESIGN_SYSTEM.typography.sizes.xs
                    }}>
                      📅 保存期限: {item.shelfLife.daysMin}-{item.shelfLife.daysMax} 天
                      {item.shelfLife.tips && (
                        <div style={{ marginTop: DESIGN_SYSTEM.spacing.xs, color: DESIGN_SYSTEM.colors.gray[600] }}>
                          💡 {item.shelfLife.tips}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </Card>
          )}

          {/* OCR 識別結果 */}
          {ocrResults?.success && ocrResults.text && (
            <Card 
              title="📝 文字識別結果"
              style={{ marginBottom: DESIGN_SYSTEM.spacing.lg }}
            >
              {ocrResults.text && (ocrResults.text.name || ocrResults.text.itemKey) && (
                <div style={{
                  padding: DESIGN_SYSTEM.spacing.md,
                  backgroundColor: DESIGN_SYSTEM.colors.gray[50],
                  borderRadius: DESIGN_SYSTEM.borderRadius.md,
                  marginBottom: DESIGN_SYSTEM.spacing.md
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: DESIGN_SYSTEM.spacing.sm
                  }}>
                    <h4 style={{ margin: 0 }}>
                      {ocrResults.text.name || '識別的產品'}
                    </h4>
                    <button
                      onClick={() => selectItemForStorage({
                        name: ocrResults.text.name || '未知產品',
                        itemKey: ocrResults.text.itemKey,
                        brand: ocrResults.text.brand,
                        source: 'ocr-identified'
                      })}
                      style={{
                        ...COMMON_STYLES.primaryButton,
                        padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.sm}`,
                        fontSize: DESIGN_SYSTEM.typography.sizes.sm
                      }}
                    >
                      📦 加入庫存
                    </button>
                  </div>

                  {/* OCR 詳細信息 */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: DESIGN_SYSTEM.spacing.sm,
                    fontSize: DESIGN_SYSTEM.typography.sizes.sm,
                    color: DESIGN_SYSTEM.colors.gray[600]
                  }}>
                    {Object.entries(ocrResults.text).map(([key, value]) => 
                      value && key !== 'allText' && (
                        <div key={key}>
                          <strong>
                            {key === 'name' ? '產品名稱' :
                             key === 'brand' ? '品牌' :
                             key === 'expirationDate' ? '保存期限' :
                             key === 'itemKey' ? '類別' : key}:
                          </strong> {String(value)}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* 條碼識別結果 */}
          {barcodeResults?.success && (
            <Card 
              title="🏷️ 條碼識別結果"
              style={{ marginBottom: DESIGN_SYSTEM.spacing.lg }}
            >
              {barcodeResults.products.map(({ product, barcode }, index) => (
                <div key={index} style={{
                  padding: DESIGN_SYSTEM.spacing.md,
                  backgroundColor: DESIGN_SYSTEM.colors.gray[50],
                  borderRadius: DESIGN_SYSTEM.borderRadius.md
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: DESIGN_SYSTEM.spacing.sm
                  }}>
                    <div>
                      <h4 style={{ margin: 0 }}>{product.name || '未知產品'}</h4>
                      <p style={{ margin: 0, fontSize: DESIGN_SYSTEM.typography.sizes.sm, color: DESIGN_SYSTEM.colors.gray[600] }}>
                        條碼: {barcode}
                      </p>
                    </div>
                    <button
                      onClick={() => selectItemForStorage({ ...product, source: 'barcode', barcode })}
                      style={{
                        ...COMMON_STYLES.primaryButton,
                        padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.sm}`,
                        fontSize: DESIGN_SYSTEM.typography.sizes.sm
                      }}
                    >
                      📦 加入庫存
                    </button>
                  </div>
                </div>
              ))}
            </Card>
          )}

          {/* 統一結果摘要 */}
          {unifiedResults?.hasResults && (
            <StatusCard
              status="success"
              title="識別完成"
              subtitle={`整體信心度 ${Math.round(unifiedResults.confidence.overall * 100)}%`}
              value={unifiedResults.foodItems.length + unifiedResults.barcodeProducts.length}
              unit="項結果"
            />
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default AiIdentificationView;