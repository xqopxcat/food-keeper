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
  const [showDetailedSettings, setShowDetailedSettings] = useState(false);
  
  // 開發模式狀態
  const [isDevelopmentMode, setIsDevelopmentMode] = useState(DEV_CONFIG.useMockData);
  const [apiQuota, setApiQuota] = useState(getRemainingQuota());
  const [showDevPanel, setShowDevPanel] = useState(DEV_CONFIG.isDevelopment);

  // 使用自定義 hooks
  const { facts, setFacts, resetFacts } = useStorageContext();
  const { inventoryData, setInventoryData, resetInventoryData } = useInventoryManagement();
  const { addToInventory } = useAddToInventory();

  // 搜尋相關狀態
  const [foodSearch, setFoodSearch] = useState('');
  const [showFoodDropdown, setShowFoodDropdown] = useState(false);
  const [filteredFoodOptions, setFilteredFoodOptions] = useState([]);
  const [selectedFoodLabel, setSelectedFoodLabel] = useState('');
  
  // 載入選項資料
  const [foodOptions, setFoodOptions] = useState([]);
  const [unitOptions] = useState([
    { value: 'pieces', label: '個' },
    { value: 'grams', label: '克' },
    { value: 'kilograms', label: '公斤' },
    { value: 'milliliters', label: '毫升' },
    { value: 'liters', label: '公升' },
    { value: 'cups', label: '杯' },
    { value: 'packages', label: '包' }
  ]);
  const [locationOptions] = useState([
    { value: 'fridge_main', label: '冷藏室主區' },
    { value: 'fridge_drawer', label: '冷藏室抽屜' },
    { value: 'fridge_door', label: '冷藏室門邊' },
    { value: 'freezer_main', label: '冷凍室主區' },
    { value: 'freezer_drawer', label: '冷凍室抽屜' },
    { value: 'pantry', label: '食品櫃' },
    { value: 'room_temp', label: '室溫儲存' }
  ]);

  // 載入食材選項
  useEffect(() => {
    const loadFoodOptions = async () => {
      try {
        // 假設有一個 API 端點來獲取食材選項
        // const response = await fetch('/api/rules');
        // const data = await response.json();
        // 暫時使用模擬資料
        const mockOptions = [
          { value: 'apple', label: '蘋果' },
          { value: 'banana', label: '香蕉' },
          { value: 'milk', label: '牛奶' },
          { value: 'bread', label: '麵包' },
          { value: 'cheese', label: '起司' },
          { value: 'yogurt', label: '優格' },
          { value: 'chicken', label: '雞肉' },
          { value: 'pork', label: '豬肉' },
          { value: 'beef', label: '牛肉' },
          { value: 'fish', label: '魚類' },
          { value: 'vegetables', label: '蔬菜' },
          { value: 'fruits', label: '水果' },
          // 更多選項...
        ];
        setFoodOptions(mockOptions);
      } catch (error) {
        console.error('載入食材選項失敗:', error);
      }
    };
    
    loadFoodOptions();
  }, []);

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
        <div className="responsive-container" style={{
          ...COMMON_STYLES.container,
          paddingTop: showDevPanel ? 0 : DESIGN_SYSTEM.spacing.lg
        }}>
          {/* 主要掃描按鈕 */}
          <div className="grid-responsive-actions" style={{
            marginBottom: DESIGN_SYSTEM.spacing.lg
          }}>
            <button
              onClick={() => setMode('camera')}
              style={{
                ...COMMON_STYLES.primaryButton,
                padding: `${DESIGN_SYSTEM.spacing.lg} ${DESIGN_SYSTEM.spacing.md}`,
                fontSize: DESIGN_SYSTEM.typography.sizes.base,
                fontWeight: '600',
                letterSpacing: '-0.025em',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = DESIGN_SYSTEM.shadows.lg;
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = DESIGN_SYSTEM.shadows.button;
              }}
            >
              📷 拍照掃描
            </button>
            
            <button
              onClick={() => setMode('upload')}
              style={{
                ...COMMON_STYLES.secondaryButton,
                padding: `${DESIGN_SYSTEM.spacing.lg} ${DESIGN_SYSTEM.spacing.md}`,
                fontSize: DESIGN_SYSTEM.typography.sizes.base,
                fontWeight: '500',
                letterSpacing: '-0.025em'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = DESIGN_SYSTEM.shadows.md;
                e.target.style.borderColor = DESIGN_SYSTEM.colors.primary[300];
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = DESIGN_SYSTEM.shadows.sm;
                e.target.style.borderColor = DESIGN_SYSTEM.colors.gray[200];
              }}
            >
              🖼️ 上傳圖片
            </button>
          </div>

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

  // 相機掃描模式 - 真正全屏，隱藏底部導航
  if (mode === 'camera') {
    return (
      <>
        {/* 隱藏底部導航 */}
        <style dangerouslySetInnerHTML={{
          __html: `
            .bottom-navigation { display: none !important; }
            body { overflow: hidden !important; }
          `
        }} />
        
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#000',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* 返回按鈕 */}
          <div style={{
            position: 'absolute',
            top: 'max(env(safe-area-inset-top), 20px)',
            left: '20px',
            zIndex: 10000
          }}>
            <button
              onClick={() => setMode('home')}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                border: 'none',
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '18px',
                color: 'white'
              }}
            >
              ✕
            </button>
          </div>

          {/* 標題 */}
          <div style={{
            position: 'absolute',
            top: 'max(env(safe-area-inset-top), 20px)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10000,
            color: 'white',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>AI 智慧識別</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.8 }}>對準食品包裝進行掃描</p>
          </div>

          {/* 相機組件 - 完整尺寸 */}
          <Camera
            onCapture={handleCapture}
            onError={(error) => {
              alert(error);
              setMode('home');
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </div>
      </>
    );
  }

  // 圖片上傳模式 - 高質感設計
  if (mode === 'upload') {
    return (
      <div style={COMMON_STYLES.pageContainer}>
        <HeaderBar 
          title="📸 上傳圖片"
          subtitle="從相簿選擇食品圖片進行識別"
          showBackButton={true}
          onBack={() => setMode('home')}
        />

        <div style={{
          ...COMMON_STYLES.container,
          paddingTop: DESIGN_SYSTEM.spacing.lg,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 'calc(100vh - 120px)',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {/* 上傳區域 */}
          <div style={{
            width: '100%',
            maxWidth: '400px',
            padding: DESIGN_SYSTEM.spacing.xl,
            border: `2px dashed ${DESIGN_SYSTEM.colors.primary[300]}`,
            borderRadius: DESIGN_SYSTEM.borderRadius.xl,
            textAlign: 'center',
            backgroundColor: DESIGN_SYSTEM.colors.primary[50],
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = async (event) => {
                  const base64 = event.target.result.split(',')[1];
                  setCapturedImage({ 
                    base64,
                    file: file,
                    timestamp: new Date().toISOString()
                  });
                  setMode('results');
                  await performUnifiedRecognition(base64);
                };
                reader.readAsDataURL(file);
              }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer'
              }}
            />
            
            {/* 上傳圖示 */}
            <div style={{
              fontSize: '64px',
              marginBottom: DESIGN_SYSTEM.spacing.md,
              color: DESIGN_SYSTEM.colors.primary[400]
            }}>
              📁
            </div>
            
            {/* 上傳文字 */}
            <h3 style={{
              margin: 0,
              marginBottom: DESIGN_SYSTEM.spacing.sm,
              color: DESIGN_SYSTEM.colors.primary[700],
              fontSize: DESIGN_SYSTEM.typography.sizes.lg,
              fontWeight: DESIGN_SYSTEM.typography.weights.semibold
            }}>
              選擇圖片上傳
            </h3>
            
            <p style={{
              margin: 0,
              color: DESIGN_SYSTEM.colors.gray[600],
              fontSize: DESIGN_SYSTEM.typography.sizes.sm,
              lineHeight: '1.5'
            }}>
              支援 JPG、PNG 格式<br />
              建議圖片清晰，包含完整包裝
            </p>
          </div>

          {/* 或者分隔線 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            maxWidth: '400px',
            margin: `${DESIGN_SYSTEM.spacing.lg} 0`
          }}>
            <div style={{
              flex: 1,
              height: '1px',
              backgroundColor: DESIGN_SYSTEM.colors.gray[200]
            }} />
            <span style={{
              padding: `0 ${DESIGN_SYSTEM.spacing.md}`,
              color: DESIGN_SYSTEM.colors.gray[500],
              fontSize: DESIGN_SYSTEM.typography.sizes.sm
            }}>
              或者
            </span>
            <div style={{
              flex: 1,
              height: '1px',
              backgroundColor: DESIGN_SYSTEM.colors.gray[200]
            }} />
          </div>

          {/* 返回拍照按鈕 */}
          <button
            onClick={() => setMode('camera')}
            style={{
              ...COMMON_STYLES.secondaryButton,
              width: '100%',
              maxWidth: '400px',
              padding: DESIGN_SYSTEM.spacing.lg
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
            📷 改用拍照掃描
          </button>
        </div>
      </div>
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
            <Card style={{
                marginBottom: DESIGN_SYSTEM.spacing.lg,
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <img
                src={`data:image/jpeg;base64,${capturedImage.base64}`}
                alt="掃描圖片"
                style={{
                  width: 'fit-content',
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
                    <div style={{ display: 'flex', gap: DESIGN_SYSTEM.spacing.xs }}>
                      <button
                        onClick={() => {
                          // 直接加入庫存 - 使用預設值
                          const payload = {
                            manualName: item.name,
                            itemKey: item.itemKey || item.name,
                            storageMode: 'fridge',
                            state: 'whole',
                            container: 'none',
                            season: 'summer',
                            locale: 'TW',
                            save: true,
                            quantity: { amount: 1, unit: '個' },
                            purchaseDate: new Date().toISOString().split('T')[0],
                            location: 'fridge_main',
                            source: 'ai-identified',
                            notes: 'AI識別'
                          };
                          estimateShelfLife(payload).unwrap()
                            .then(response => {
                              alert(`✅ 已成功加入庫存！\n預估保存期限：${response.daysMin || 'N/A'}~${response.daysMax || 'N/A'} 天`);
                            })
                            .catch(e => {
                              alert(`❌ 加入庫存失敗：${e.message || '未知錯誤'}`);
                            });
                        }}
                        style={{
                          ...COMMON_STYLES.primaryButton,
                          padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.sm}`,
                          fontSize: DESIGN_SYSTEM.typography.sizes.sm
                        }}
                      >
                        ⚡ 快速加入
                      </button>
                      <button
                        onClick={() => selectItemForStorage({ ...item, source: 'ai-identified' })}
                        style={{
                          ...COMMON_STYLES.secondaryButton,
                          padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.sm}`,
                          fontSize: DESIGN_SYSTEM.typography.sizes.sm
                        }}
                      >
                        ⚙️ 庫存設定
                      </button>
                    </div>
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
                    <div style={{ display: 'flex', gap: DESIGN_SYSTEM.spacing.xs }}>
                      <button
                        onClick={() => {
                          // 直接加入庫存 - 使用預設值
                          const payload = {
                            manualName: ocrResults.text.name || '未知產品',
                            itemKey: ocrResults.text.itemKey || ocrResults.text.name,
                            storageMode: 'fridge',
                            state: 'whole',
                            container: 'none',
                            season: 'summer',
                            locale: 'TW',
                            save: true,
                            quantity: { amount: 1, unit: '個' },
                            purchaseDate: new Date().toISOString().split('T')[0],
                            location: 'fridge_main',
                            source: 'ocr-identified',
                            notes: '文字識別'
                          };
                          estimateShelfLife(payload).unwrap()
                            .then(response => {
                              alert(`✅ 已成功加入庫存！\n預估保存期限：${response.daysMin || 'N/A'}~${response.daysMax || 'N/A'} 天`);
                            })
                            .catch(e => {
                              alert(`❌ 加入庫存失敗：${e.message || '未知錯誤'}`);
                            });
                        }}
                        style={{
                          ...COMMON_STYLES.primaryButton,
                          padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.sm}`,
                          fontSize: DESIGN_SYSTEM.typography.sizes.sm
                        }}
                      >
                        ⚡ 快速加入
                      </button>
                      <button
                        onClick={() => selectItemForStorage({
                          name: ocrResults.text.name || '未知產品',
                          itemKey: ocrResults.text.itemKey,
                          brand: ocrResults.text.brand,
                          source: 'ocr-identified'
                        })}
                        style={{
                          ...COMMON_STYLES.secondaryButton,
                          padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.sm}`,
                          fontSize: DESIGN_SYSTEM.typography.sizes.sm
                        }}
                      >
                        ⚙️ 庫存設定
                      </button>
                    </div>
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
                             key === 'itemKey' ? '類別' :
                             key === 'quantity' ? '數量' :
                             key === 'nutrition' ? '營養信息' : key}:
                          </strong> {
                            typeof value === 'object' && value !== null 
                              ? JSON.stringify(value, null, 2)
                              : String(value)
                          }
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
                    <div style={{ display: 'flex', gap: DESIGN_SYSTEM.spacing.xs }}>
                      <button
                        onClick={() => {
                          // 直接加入庫存 - 使用預設值
                          const payload = {
                            manualName: product.name || '未知產品',
                            itemKey: product.itemKey || product.name,
                            storageMode: 'fridge',
                            state: 'whole',
                            container: 'none',
                            season: 'summer',
                            locale: 'TW',
                            save: true,
                            quantity: { amount: 1, unit: '個' },
                            purchaseDate: new Date().toISOString().split('T')[0],
                            location: 'fridge_main',
                            source: 'barcode',
                            notes: `條碼:${barcode}`
                          };
                          estimateShelfLife(payload).unwrap()
                            .then(response => {
                              alert(`✅ 已成功加入庫存！\n預估保存期限：${response.daysMin || 'N/A'}~${response.daysMax || 'N/A'} 天`);
                            })
                            .catch(e => {
                              alert(`❌ 加入庫存失敗：${e.message || '未知錯誤'}`);
                            });
                        }}
                        style={{
                          ...COMMON_STYLES.primaryButton,
                          padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.sm}`,
                          fontSize: DESIGN_SYSTEM.typography.sizes.sm
                        }}
                      >
                        ⚡ 快速加入
                      </button>
                      <button
                        onClick={() => selectItemForStorage({ ...product, source: 'barcode', barcode })}
                        style={{
                          ...COMMON_STYLES.secondaryButton,
                          padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.sm}`,
                          fontSize: DESIGN_SYSTEM.typography.sizes.sm
                        }}
                      >
                        ⚙️ 庫存設定
                      </button>
                    </div>
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

  // 詳細設定 Modal
  if (showStorageModal && selectedItemForStorage) {
    return (
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
              📦 庫存設定 - {selectedItemForStorage.name}
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
                      onChange={e => setInventoryData(data => ({
                        ...data,
                        quantity: { ...data.quantity, amount: parseFloat(e.target.value) || 0 }
                      }))}
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
                      onChange={e => setInventoryData(data => ({
                        ...data,
                        quantity: { ...data.quantity, unit: e.target.value }
                      }))}
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
                    onChange={e => setInventoryData(data => ({ ...data, purchaseDate: e.target.value }))}
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
                    onChange={e => setInventoryData(data => ({ ...data, location: e.target.value }))}
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
                    onChange={e => setInventoryData(data => ({ ...data, notes: e.target.value }))}
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
    );
  }

  return null;
};

export default AiIdentificationView;