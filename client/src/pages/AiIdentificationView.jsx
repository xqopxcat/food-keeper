import React, { useState, useEffect } from 'react';
import Camera from '../components/Camera.jsx';
import FoodSelector from '../components/FoodSelector.jsx';
import InventoryForm from '../components/InventoryForm.jsx';
import StorageContextForm from '../components/StorageContextForm.jsx';
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
// 開發模式支援
import { DEV_CONFIG, canUseAPI, recordAPIUsage, getRemainingQuota } from '../config/developmentMode.js';
import { mockIdentifyFood, mockExtractText, mockLookupBarcode, generateRandomMockData } from '../services/mockApiService.js';

const AiIdentificationView = () => {
  const [mode, setMode] = useState('camera'); // 'camera', 'upload', 'results'
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

  // 處理拍照結果 - 統一識別協調器
  const handleCapture = async (imageData) => {
    console.log('Captured image data:', imageData);
    setCapturedImage(imageData);
    setMode('results');
    await performUnifiedRecognition(imageData.base64);
  };

  // 處理檔案上傳
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 檢查檔案大小 (限制 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('檔案大小不能超過 10MB');
      return;
    }

    // 檢查檔案類型
    if (!file.type.startsWith('image/')) {
      alert('請選擇圖片檔案');
      return;
    }

    try {
      // 轉換為 base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64WithPrefix = e.target.result;
        const base64Data = base64WithPrefix.split(',')[1]; // 移除 data:image/...;base64, 前綴
        console.log('File uploaded, base64 length:', base64Data.length);
        setCapturedImage({ base64: base64Data });
        setMode('results');
        await performUnifiedRecognition(base64Data);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File upload error:', error);
      alert('檔案上傳失敗，請重試');
    }
  };

  // 統一識別協調器 - 同時觸發三個功能並合併結果
  const performUnifiedRecognition = async (base64Image) => {
    console.log('Starting unified recognition with base64 length:', base64Image.length);
    
    try {
      setIdentificationResults(null);
      setOcrResults(null);
      setBarcodeResults(null);
      setUnifiedResults(null);

      // 1. AI 物件識別
      let aiResults = null;
      try {
        console.log('Starting AI identification...');
        
        if (isDevelopmentMode || !canUseAPI('vision')) {
          console.log('🧪 Using mock AI identification');
          aiResults = await mockIdentifyFood(base64Image);
          if (!isDevelopmentMode) {
            aiResults.warning = '已達今日 Vision API 配額限制，使用模擬數據';
          }
        } else {
          aiResults = await identifyFood({ imageBase64: base64Image }).unwrap();
          recordAPIUsage('vision');
          setApiQuota(getRemainingQuota());
        }
        
        console.log('AI identification result:', aiResults);
        setIdentificationResults(aiResults);
      } catch (error) {
        console.error('AI identification failed:', error);
        setIdentificationResults({ success: false, error: error.message });
      }

      // 2. OCR 文字識別
      let textResults = null;
      try {
        console.log('Starting text extraction...');
        
        if (isDevelopmentMode || !canUseAPI('gemini')) {
          console.log('🧪 Using mock OCR extraction');
          textResults = await mockExtractText(base64Image);
          if (!isDevelopmentMode) {
            textResults.warning = '已達今日 Gemini API 配額限制，使用模擬數據';
          }
        } else {
          textResults = await extractText({ imageBase64: base64Image }).unwrap();
          recordAPIUsage('gemini');
          setApiQuota(getRemainingQuota());
        }
        
        console.log('Text extraction result:', textResults);
        setOcrResults(textResults);
      } catch (error) {
        console.error('Text extraction failed:', error);
        setOcrResults({ success: false, error: error.message });
      }

      // 3. 條碼識別 (ZXing 本地處理，不消耗 API)
      let barcodeResults = null;
      try {
        console.log('Starting barcode detection...');
        barcodeResults = await extractAndLookupBarcode(base64Image);
        console.log('Barcode detection result:', barcodeResults);
        setBarcodeResults(barcodeResults);
      } catch (error) {
        console.error('Barcode detection failed:', error);
        setBarcodeResults({ success: false, error: error.message });
      }

      // 4. 合併結果
      const unified = mergeRecognitionResults(aiResults, textResults, barcodeResults);
      setUnifiedResults(unified);

    } catch (error) {
      console.error('Unified recognition failed:', error);
      alert('識別過程發生錯誤：' + (error.message || '未知錯誤'));
    }
  };

  // 從圖片中提取條碼並查詢產品資訊
  const extractAndLookupBarcode = async (base64Image) => {
    try {
      const codeReader = new BrowserMultiFormatReader();
      
      // 創建圖片元素
      const img = new Image();
      img.src = `data:image/jpeg;base64,${base64Image}`;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // 嘗試檢測條碼
      try {
        const result = await codeReader.decodeFromImageElement(img);
        const barcode = result.getText();
        console.log('Detected barcode:', barcode);

        // 查詢產品資訊
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
        console.log('No barcode detected:', decodeError.message);
        return { success: false, message: '未檢測到條碼' };
      }
    } catch (error) {
      console.error('Barcode extraction error:', error);
      return { success: false, error: error.message };
    }
  };

  // 合併三種識別結果
  const mergeRecognitionResults = (aiResult, ocrResult, barcodeResult) => {
    const mergedData = {
      hasResults: false,
      confidence: {
        overall: 0,
        ai: 0,
        ocr: 0,
        barcode: 0
      },
      foodItems: [],
      barcodeProducts: [],
      extractedText: null,
      recommendations: [],
      crossValidation: {
        confidence: 0,
        nameConsistency: false,
        brandConsistency: false
      }
    };

    // 處理 AI 識別結果
    if (aiResult?.success && aiResult.items?.length > 0) {
      mergedData.hasResults = true;
      mergedData.confidence.ai = aiResult.items.reduce((sum, item) => sum + (item.confidence || 0), 0) / aiResult.items.length;
      mergedData.foodItems.push(...aiResult.items.map(item => ({ ...item, source: 'ai-identified' })));
    }

    // 處理 OCR 結果
    if (ocrResult?.success) {
      mergedData.hasResults = true;
      // OCR 結果可能是單一項目或者帶有文字內容
      if (ocrResult.text && (ocrResult.text.name || ocrResult.text.itemKey)) {
        mergedData.confidence.ocr = 0.8; // OCR 通常比較可靠
        const ocrItem = {
          name: ocrResult.text.name || '未知產品',
          itemKey: ocrResult.text.itemKey || null,
          brand: ocrResult.text.brand || null,
          category: ocrResult.text.category || null,
          quantity: ocrResult.text.quantity || { amount: 1, unit: '個' },
          expirationDate: ocrResult.text.expirationDate || null,
          storageMode: ocrResult.text.storageMode || 'fridge',
          state: ocrResult.text.state || 'whole',
          barcode: ocrResult.text.barcode || null,
          confidence: ocrResult.confidence || 0.8,
          source: 'ocr-identified'
        };
        mergedData.foodItems.push(ocrItem);
      }
      if (ocrResult.text) {
        mergedData.extractedText = ocrResult.text.allText || (typeof ocrResult.text === 'string' ? ocrResult.text : JSON.stringify(ocrResult.text));
      }
    }

    // 處理條碼結果
    if (barcodeResult?.success && barcodeResult.products?.length > 0) {
      mergedData.hasResults = true;
      mergedData.confidence.barcode = 0.95; // 條碼查詢最可靠
      mergedData.barcodeProducts = barcodeResult.products;
    }

    // 計算整體置信度
    const confidenceValues = [mergedData.confidence.ai, mergedData.confidence.ocr, mergedData.confidence.barcode].filter(c => c > 0);
    mergedData.confidence.overall = confidenceValues.length > 0 ? confidenceValues.reduce((sum, c) => sum + c, 0) / confidenceValues.length : 0;

    // 生成建議
    if (mergedData.confidence.overall < 0.5) {
      mergedData.recommendations.push({ message: '識別信心度較低，建議重新拍照', priority: 'high' });
    }
    if (!mergedData.hasResults) {
      mergedData.recommendations.push({ message: '未識別到任何內容，請確保圖片清晰', priority: 'high' });
    }

    return mergedData;
  };

  // 重新識別
  const retryIdentification = () => {
    if (capturedImage?.base64) {
      performUnifiedRecognition(capturedImage.base64);
    }
  };

  // 選擇項目進行庫存設定
  const selectItemForStorage = (item) => {
    console.log('Selecting item for storage:', item);
    setSelectedItemForStorage(item);
    setShowStorageModal(true);
    
    // 自動設定推測值
    if (item.itemKey) {
      setFacts(prev => ({
        ...prev,
        itemKey: item.itemKey,
        storageMode: item.storageMode || 'fridge',
        state: item.state || 'whole'
      }));
    }
    
    if (item.quantity && typeof item.quantity === 'object') {
      setInventoryData(prev => ({
        ...prev,
        quantity: item.quantity
      }));
    }
  };

  // 估算保存期限
  const handleEstimateShelfLife = async () => {
    if (!facts.itemKey) {
      alert('請先選擇食材種類');
      return;
    }

    try {
      const payload = {
        ...facts,
        purchaseDate: inventoryData.purchaseDate
      };
      
      const data = await estimateShelfLife(payload).unwrap();
      console.log('Shelf life estimate:', data);
      // 這裡可以顯示估算結果
      alert(`估算保存期限：${data.daysMin || 0}-${data.daysMax || 0} 天`);
    } catch (e) {
      console.error('Estimate failed:', e);
      alert(e?.message || '估算失敗');
    }
  };

  // 進階加入庫存功能
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
        // 如果是OCR識別且有到期日，則傳送
        ...(selectedItemForStorage?.source === 'ocr-identified' && selectedItemForStorage?.expirationDate && {
          expirationDate: selectedItemForStorage.expirationDate,
        })
      };

      const response = await estimateShelfLife(payload).unwrap();
      
      if (response.saved) {
        alert(`✅ 已成功加入庫存！\n預估保存期限：${response.daysMin || 'N/A'}~${response.daysMax || 'N/A'} 天`);
        closeStorageModal();
      }
    } catch (e) {
      console.error('Advanced add failed:', e);
      alert(`❌ 加入庫存失敗：${e.message || '未知錯誤'}`);
    }
  };

  // 快速加入庫存 (使用 addToInventory hook)
  const handleQuickAdd = async (item) => {
    const result = await addToInventory(item, inventoryData, facts);
    alert(result.message);
    if (result.success) {
      // 可以選擇重置或繼續識別
    }
  };

  // 關閉庫存設定彈窗
  const closeStorageModal = () => {
    setShowStorageModal(false);
    setSelectedItemForStorage(null);
  };

  // 重置狀態
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
    setMode('camera');
  };

  // 過濾食材選項 (為了兼容模態窗口)
  const filteredFoodOptions = foodOptions.filter(option =>
    option.label.toLowerCase().includes('') ||
    option.value.toLowerCase().includes('')
  );

  // 取得當前選中項目的標籤
  const selectedFoodLabel = foodOptions.find(option => option.value === facts.itemKey)?.label || '';

  // AI 服務狀態檢查
  if (!aiStatus?.aiEnabled) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fef3c7',
        padding: 40
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h3 style={{ color: '#92400e', marginBottom: 12 }}>AI 服務暫時無法使用</h3>
        <p style={{ color: '#92400e', fontSize: 14 }}>請檢查網路連線或稍後再試</p>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 保持原版的庫存設定模態窗口 UI */}
      {showStorageModal && selectedItemForStorage && (
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
            {/* 模態窗口頭部 */}
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
              >
                ✕ 關閉
              </button>
            </div>

            {/* 模態窗口內容 */}
            <div style={{ padding: 20 }}>
              {/* 選中項目摘要 */}
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
                    selectedItemForStorage.source === 'ai-identified' ? '🔍 物件識別 (Google Vision)' :
                    selectedItemForStorage.source === 'barcode' ? '📱 條碼查詢' :
                    '🤖 AI 識別'
                  }</div>
                </div>
              </div>

              {/* 保存情境設定 - 使用共用組件 */}
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
                  {/* 食材選擇器 */}
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      食材種類
                    </span>
                    <FoodSelector
                      value={facts.itemKey}
                      onChange={(value) => setFacts(f => ({ ...f, itemKey: value }))}
                      placeholder={selectedItemForStorage.itemKey ? 
                        `AI 推測: ${selectedItemForStorage.itemKey}` : 
                        "搜尋食材種類..."
                      }
                      style={{ width: '100%' }}
                    />
                  </label>

                  {/* 其他保存情境欄位 */}
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

              {/* 庫存資訊 - 使用共用組件 */}
              <InventoryForm
                inventoryData={inventoryData}
                onInventoryDataChange={setInventoryData}
                style={{ marginBottom: 24 }}
              />

              {/* 操作按鈕 */}
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

      {/* 主界面頭部 */}
      <div style={{ padding: 16, backgroundColor: '#f8f9fa', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: '0 0 8px 0' }}>🤖 智慧統一識別</h2>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
              一次拍照，同時進行 AI 物件識別、OCR 文字識別、條碼掃描，並智慧合併結果
            </p>
          </div>
          
          {/* 開發者工具按鈕 */}
          {showDevPanel && (
            <button
              onClick={() => setShowDevPanel(!showDevPanel)}
              style={{
                padding: '4px 8px',
                backgroundColor: 'rgba(0,0,0,0.1)',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              🛠️ 開發工具
            </button>
          )}
        </div>
        
        {/* 開發者面板 */}
        {showDevPanel && (
          <div style={{
            marginTop: 12,
            padding: 12,
            backgroundColor: isDevelopmentMode ? '#fef3c7' : '#f0f9ff',
            border: `1px solid ${isDevelopmentMode ? '#f59e0b' : '#3b82f6'}`,
            borderRadius: 8,
            fontSize: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <strong style={{ color: isDevelopmentMode ? '#92400e' : '#1e40af' }}>
                🧪 開發模式 {isDevelopmentMode ? '(模擬數據)' : '(真實 API)'}
              </strong>
              <button
                onClick={() => setIsDevelopmentMode(!isDevelopmentMode)}
                style={{
                  padding: '2px 6px',
                  backgroundColor: isDevelopmentMode ? '#fbbf24' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10px'
                }}
              >
                {isDevelopmentMode ? '切換到真實 API' : '切換到模擬數據'}
              </button>
            </div>
            
            {!isDevelopmentMode && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                <div>
                  <span style={{ color: '#6b7280' }}>Vision API:</span>
                  <span style={{ marginLeft: 4, fontWeight: 'bold', color: apiQuota.vision > 0 ? '#059669' : '#dc2626' }}>
                    {apiQuota.vision}/10
                  </span>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Gemini API:</span>
                  <span style={{ marginLeft: 4, fontWeight: 'bold', color: apiQuota.gemini > 0 ? '#059669' : '#dc2626' }}>
                    {apiQuota.gemini}/5
                  </span>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>OCR:</span>
                  <span style={{ marginLeft: 4, fontWeight: 'bold', color: apiQuota.ocr > 0 ? '#059669' : '#dc2626' }}>
                    {apiQuota.ocr}/8
                  </span>
                </div>
              </div>
            )}
            
            {isDevelopmentMode && (
              <div style={{ color: '#92400e' }}>
                💡 目前使用模擬數據，不會消耗 API 配額。切換到真實 API 進行最終測試。
              </div>
            )}
          </div>
        )}
      </div>

      {/* 模式切換按鈕 */}
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
        {/* 相機模式 */}
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
                disabled={isIdentifying || isExtracting || isLookingUp}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  opacity: (isIdentifying || isExtracting || isLookingUp) ? 0.6 : 1
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

            {/* 顯示拍攝的圖片 */}
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
            {(isIdentifying || isExtracting || isLookingUp) && (
              <div style={{
                textAlign: 'center',
                padding: 20,
                backgroundColor: '#f3f4f6',
                borderRadius: 8,
                margin: '16px 0'
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>🤖</div>
                <p>🚀 統一識別處理中...</p>
                <div style={{ fontSize: '14px', color: '#6b7280', marginTop: 8 }}>
                  {isIdentifying && '• AI 物件識別中...'}<br/>
                  {isExtracting && '• OCR 文字識別中...'}<br/>
                  {isLookingUp && '• 條碼產品查詢中...'}
                </div>
              </div>
            )}

            {/* 統一結果摘要 */}
            {unifiedResults && unifiedResults.hasResults && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ 
                  margin: '0 0 12px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  🎯 統一識別結果摘要
                </h3>
                
                <div style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: 12,
                  backgroundColor: 'white'
                }}>
                  <div style={{ marginBottom: 12 }}>
                    <strong>整體置信度: </strong>
                    <span style={{ 
                      color: unifiedResults.confidence.overall > 0.7 ? '#059669' : 
                             unifiedResults.confidence.overall > 0.4 ? '#d97706' : '#dc2626'
                    }}>
                      {Math.round(unifiedResults.confidence.overall * 100)}%
                    </span>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: 4 }}>
                      AI: {Math.round(unifiedResults.confidence.ai * 100)}% | 
                      OCR: {Math.round(unifiedResults.confidence.ocr * 100)}% | 
                      條碼: {Math.round(unifiedResults.confidence.barcode * 100)}%
                    </div>
                  </div>

                  <div style={{ marginBottom: 12, fontSize: '14px' }}>
                    <div>AI識別食材: {unifiedResults.foodItems.filter(item => item.source === 'ai-identified').length} 項</div>
                    <div>文字識別產品: {unifiedResults.foodItems.filter(item => item.source === 'ocr-identified').length} 項</div>
                    <div>條碼產品: {unifiedResults.barcodeProducts.length} 項</div>
                    <div>原始文字: {unifiedResults.extractedText ? '已擷取' : '無'}</div>
                  </div>

                  {unifiedResults.recommendations.length > 0 && (
                    <div>
                      <strong>智慧建議:</strong>
                      {unifiedResults.recommendations.map((rec, index) => (
                        <div key={index} style={{
                          fontSize: '12px',
                          color: rec.priority === 'high' ? '#dc2626' : '#6b7280',
                          marginTop: 4
                        }}>
                          • {rec.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 原版的各項識別結果顯示，保持相同UI但使用componentized後的數據結構 */}
            
            {/* 條碼識別結果 */}
            {barcodeResults && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ 
                  margin: '0 0 12px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  🏷️ 條碼識別結果
                </h3>
                
                {barcodeResults.success ? (
                  <div style={{ display: 'grid', gap: 12 }}>
                    {barcodeResults.products.map(({ product, barcode }, index) => (
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
                              {product.name || '未知產品'}
                            </h4>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                              條碼: {barcode}
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <button
                              onClick={() => selectItemForStorage({ ...product, source: 'barcode', barcode })}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              📦 詳細設定
                            </button>
                            <button
                              onClick={() => handleQuickAdd({ ...product, source: 'barcode', barcode })}
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
                              {isAdding ? '⏳ 新增中...' : '⚡ 快速加入'}
                            </button>
                          </div>
                        </div>

                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                          gap: 8,
                          fontSize: '14px'
                        }}>
                          {product.brand && (
                            <div><strong>品牌:</strong> {product.brand}</div>
                          )}
                          {product.category && (
                            <div><strong>分類:</strong> {product.category}</div>
                          )}
                          {product.quantity && (
                            <div>
                              <strong>規格:</strong> 
                              {typeof product.quantity === 'object' ? 
                                ` ${product.quantity.amount || ''} ${product.quantity.unit || ''}`.trim() : 
                                product.quantity
                              }
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    padding: 16,
                    backgroundColor: '#fef3c7',
                    border: '1px solid #f59e0b',
                    borderRadius: 8,
                    color: '#92400e'
                  }}>
                    ℹ️ {barcodeResults.error || barcodeResults.message || '未檢測到條碼'}
                  </div>
                )}
              </div>
            )}

            {/* AI 識別結果 */}
            {identificationResults && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ 
                  margin: '0 0 12px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  🍎 識別到的食材 ({identificationResults.totalItems || (identificationResults.items?.length || 0)})
                </h3>
                
                {identificationResults.success ? (
                  <div style={{ display: 'grid', gap: 12 }}>
                    {(identificationResults.items || []).map((item, index) => (
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
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <button
                              onClick={() => selectItemForStorage({ ...item, source: 'ai-identified' })}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: selectedItemForStorage === item ? '#6366f1' : '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              {selectedItemForStorage === item ? '✅ 設定中' : '📦 詳細設定'}
                            </button>
                            <button
                              onClick={() => handleQuickAdd({ ...item, source: 'ai-identified' })}
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
                              {isAdding ? '⏳ 新增中...' : '⚡ 快速加入'}
                            </button>
                          </div>
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
                              <strong>數量:</strong> 
                              {typeof item.quantity === 'object' ? 
                                `${item.quantity.amount} ${item.quantity.unit}` : 
                                item.quantity
                              }
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
                  <div>
                    {/* 顯示結構化 OCR 識別結果並提供庫存功能 */}
                    <div style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      padding: 12,
                      backgroundColor: 'white'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h4 style={{ margin: 0, fontSize: '14px', color: '#374151' }}>
                          🔍 結構化文字識別結果
                        </h4>
                        
                        {/* 快速操作按鈕 */}
                        {ocrResults.text && (ocrResults.text.name || ocrResults.text.itemKey) && (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={() => {
                                // 轉換 OCR 結果為物件格式
                                const ocrItem = {
                                  name: ocrResults.text.name || '未知產品',
                                  englishName: ocrResults.text.englishName || ocrResults.text.name || 'Unknown Product',
                                  itemKey: ocrResults.text.itemKey || null,
                                  brand: ocrResults.text.brand || null,
                                  category: ocrResults.text.category || null,
                                  quantity: ocrResults.text.quantity || { amount: 1, unit: '個' },
                                  expirationDate: ocrResults.text.expirationDate || null,
                                  storageMode: ocrResults.text.storageMode || 'fridge',
                                  state: ocrResults.text.state || 'whole',
                                  barcode: ocrResults.text.barcode || null,
                                  confidence: ocrResults.confidence || 0.8,
                                  source: 'ocr-identified'
                                };
                                setSelectedItemForStorage(ocrItem);
                                setShowStorageModal(true);
                              }}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              📦 詳細設定
                            </button>
                            <button
                              onClick={async () => {
                                const ocrItem = {
                                  name: ocrResults.text.name || '未知產品',
                                  itemKey: ocrResults.text.itemKey || null,
                                  brand: ocrResults.text.brand || null,
                                  category: ocrResults.text.category || null,
                                  quantity: ocrResults.text.quantity || { amount: 1, unit: '個' },
                                  expirationDate: ocrResults.text.expirationDate || null,
                                  storageMode: ocrResults.text.storageMode || 'fridge',
                                  state: ocrResults.text.state || 'whole',
                                  barcode: ocrResults.text.barcode || null,
                                  confidence: ocrResults.confidence || 0.8,
                                  source: 'ocr-identified'
                                };
                                const result = await addToInventory(ocrItem, inventoryData, facts);
                                alert(result.message);
                              }}
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
                              {isAdding ? '⏳ 新增中...' : '⚡ 快速加入'}
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {ocrResults.text && Object.entries(ocrResults.text).map(([key, value]) => (
                        value && key !== 'allText' && (
                          <div key={key} style={{ marginBottom: 6, fontSize: '13px' }}>
                            <strong style={{ color: '#374151' }}>
                              {
                                key === 'name' ? '產品名稱' :
                                key === 'itemKey' ? '產品類別' :
                                key === 'brand' ? '品牌' :
                                key === 'expirationDate' ? '保存期限' :
                                key === 'barcode' ? '條碼' :
                                key === 'ingredients' ? '成分' :
                                key === 'nutrition' ? '營養標示' :
                                key === 'quantity' ? '數量' :
                                key === 'category' ? '類別' :
                                key === 'storageMode' ? '保存方式' :
                                key === 'tips' ? '提示' :
                                key === 'notes' ? '備註' :
                                key === 'state' ? '狀態' : key
                              }:
                            </strong>
                            <span style={{ marginLeft: 8 }}>
                              {typeof value === 'object' && value !== null ? (
                                key === 'quantity' ? 
                                  `${value.amount || ''} ${value.unit || ''}`.trim() :
                                  JSON.stringify(value)
                              ) : (
                                String(value)
                              )}
                            </span>
                          </div>
                        )
                      ))}
                      
                      {ocrResults.text?.allText && (
                        <details style={{ marginTop: 12 }}>
                          <summary style={{ cursor: 'pointer', color: '#6b7280', fontSize: '12px' }}>
                            查看完整識別文字
                          </summary>
                          <div style={{
                            marginTop: 8,
                            padding: 8,
                            backgroundColor: '#f9fafb',
                            borderRadius: 4,
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            whiteSpace: 'pre-wrap',
                            maxHeight: '200px',
                            overflow: 'auto'
                          }}>
                            {ocrResults.text.allText}
                          </div>
                        </details>
                      )}
                    </div>
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