import React, { useState } from 'react';
import Camera from '../components/Camera.jsx';
import { BrowserMultiFormatReader } from '@zxing/library';
import { 
  useIdentifyFoodItemsMutation, 
  useExtractTextFromImageMutation,
  useLazyLookupByBarcodeQuery,
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
  const [barcodeResults, setBarcodeResults] = useState(null);
  const [unifiedResults, setUnifiedResults] = useState(null);

  // RTK Query hooks
  const [identifyFood, { isLoading: isIdentifying }] = useIdentifyFoodItemsMutation();
  const [extractText, { isLoading: isExtracting }] = useExtractTextFromImageMutation();
  const [triggerBarcodelookup, { isLoading: isLookingUp }] = useLazyLookupByBarcodeQuery();
  const [addInventoryItem, { isLoading: isAdding }] = useAddInventoryItemMutation();
  const { data: aiStatus } = useGetAiStatusQuery();

  // 處理拍照結果 - 統一識別協調器
  const handleCapture = async (imageData) => {
    setCapturedImage(imageData);
    setMode('results');
    
    // 清空之前的結果
    setIdentificationResults(null);
    setOcrResults(null);
    setBarcodeResults(null);
    setUnifiedResults(null);
    
    // 自動開始統一識別
    await performUnifiedRecognition(imageData.base64);
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
      
      // 清空之前的結果
      setIdentificationResults(null);
      setOcrResults(null);
      setBarcodeResults(null);
      setUnifiedResults(null);
      
      // 自動開始統一識別
      await performUnifiedRecognition(base64);
    };
    reader.readAsDataURL(file);
  };

  // 統一識別協調器 - 同時觸發三個功能並合併結果
  const performUnifiedRecognition = async (base64Image) => {
    try {
      console.log('🚀 開始統一識別處理...');
      
      // 並行執行三種識別：AI物件識別、OCR文字識別、條碼掃描
      const [foodResult, ocrResult, barcodeResult] = await Promise.allSettled([
        // 1. AI 物件識別
        identifyFood({ 
          imageBase64: base64Image,
          options: {
            language: 'zh-TW',
            includeQuantity: true,
            includeExpiration: true,
            includeBrand: true
          }
        }).unwrap(),
        
        // 2. OCR 文字識別  
        extractText({ imageBase64: base64Image }).unwrap(),
        
        // 3. 條碼掃描與產品查詢
        extractAndLookupBarcode(base64Image)
      ]);

      // 處理 AI 物件識別結果
      if (foodResult.status === 'fulfilled') {
        setIdentificationResults(foodResult.value);
        console.log('✅ AI 物件識別完成:', foodResult.value);
      } else {
        console.error('❌ AI 物件識別失敗:', foodResult.reason);
        setIdentificationResults({ success: false, error: foodResult.reason?.message || '識別失敗' });
      }

      // 處理 OCR 文字識別結果
      if (ocrResult.status === 'fulfilled') {
        setOcrResults(ocrResult.value);
        console.log('✅ OCR 文字識別完成:', ocrResult.value);
      } else {
        console.error('❌ OCR 文字識別失敗:', ocrResult.reason);
        setOcrResults({ success: false, error: ocrResult.reason?.message || 'OCR失敗' });
      }

      // 處理條碼識別結果
      if (barcodeResult.status === 'fulfilled') {
        setBarcodeResults(barcodeResult.value);
        console.log('✅ 條碼識別完成:', barcodeResult.value);
      } else {
        console.error('❌ 條碼識別失敗:', barcodeResult.reason);
        setBarcodeResults({ success: false, error: barcodeResult.reason?.message || '條碼掃描失敗' });
      }

      // 合併和分析結果
      const mergedResults = mergeRecognitionResults(
        foodResult.status === 'fulfilled' ? foodResult.value : null,
        ocrResult.status === 'fulfilled' ? ocrResult.value : null,
        barcodeResult.status === 'fulfilled' ? barcodeResult.value : null
      );
      
      setUnifiedResults(mergedResults);
      console.log('🎯 統一識別結果:', mergedResults);

    } catch (error) {
      console.error('❌ 統一識別處理錯誤:', error);
      alert('統一識別失敗：' + (error.message || '未知錯誤'));
    }
  };

  // 從圖片中提取條碼並查詢產品資訊
  const extractAndLookupBarcode = async (base64Image) => {
    try {
      console.log('🔍 開始條碼掃描...');
      
      // 使用 @zxing/library 從圖片中檢測條碼
      const extractedBarcodes = await extractBarcodesFromImage(base64Image);
      
      if (extractedBarcodes.length === 0) {
        return {
          success: false,
          message: '未檢測到條碼',
          products: []
        };
      }

      // 查詢每個檢測到的條碼
      const productLookups = await Promise.allSettled(
        extractedBarcodes.map(barcode => 
          triggerBarcodelookup(barcode).unwrap()
        )
      );

      const products = productLookups
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => ({
          ...result.value,
          source: 'barcode'
        }));

      return {
        success: products.length > 0,
        barcodes: extractedBarcodes,
        products: products,
        message: products.length > 0 ? `找到 ${products.length} 個產品` : '未找到產品資訊'
      };

    } catch (error) {
      console.error('條碼識別錯誤:', error);
      return {
        success: false,
        error: error.message || '條碼識別失敗',
        products: []
      };
    }
  };

  // 使用 @zxing/library 從 base64 圖片中檢測條碼
  const extractBarcodesFromImage = async (base64Image) => {
    try {
      const codeReader = new BrowserMultiFormatReader();
      
      // 創建 Image 元素
      const img = new Image();
      const imageLoadPromise = new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = `data:image/jpeg;base64,${base64Image}`;
      });
      
      await imageLoadPromise;
      
      // 嘗試從圖片中解碼條碼
      try {
        const result = await codeReader.decodeFromImageElement(img);
        if (result) {
          console.log('✅ 檢測到條碼:', result.getText());
          return [result.getText()];
        }
      } catch (decodeError) {
        console.log('⚠️ 圖片中未檢測到條碼');
        return [];
      }
      
      return [];
    } catch (error) {
      console.error('條碼檢測錯誤:', error);
      return [];
    }
  };

  // 合併三種識別結果的協調器
  const mergeRecognitionResults = (aiResult, ocrResult, barcodeResult) => {
    const merged = {
      hasResults: false,
      confidence: {
        overall: 0,
        ai: 0,
        ocr: 0,
        barcode: 0
      },
      products: [],
      foodItems: [],
      extractedText: null,
      barcodeProducts: [],
      crossValidation: {},
      recommendations: []
    };

    // 合併 AI 識別的食材
    if (aiResult?.success && aiResult.items?.length > 0) {
      merged.foodItems = aiResult.items.map(item => ({
        ...item,
        source: 'ai_recognition',
        priority: calculateItemPriority(item, 'ai')
      }));
      merged.confidence.ai = calculateAverageConfidence(aiResult.items);
      merged.hasResults = true;
    }

    // 合併 OCR 提取的文字資訊
    if (ocrResult?.success && ocrResult.text) {
      merged.extractedText = ocrResult.text;
      merged.confidence.ocr = 0.8; // OCR 基礎置信度
      merged.hasResults = true;
      
      // OCR 純粹作為文字識別，不再嘗試提取產品資訊
      // 只提供原始文字資料，讓用戶自行判斷
    }

    // 合併條碼識別的產品
    if (barcodeResult?.success && barcodeResult.products?.length > 0) {
      merged.barcodeProducts = barcodeResult.products;
      merged.products.push(...barcodeResult.products.map(product => ({
        ...product,
        source: 'barcode_lookup',
        priority: calculateItemPriority(product, 'barcode')
      })));
      merged.confidence.barcode = 0.95; // 條碼查詢的高置信度
      merged.hasResults = true;
    }

    // 交叉驗證和置信度提升
    merged.crossValidation = performCrossValidation(aiResult, ocrResult, barcodeResult);
    
    // 計算整體置信度
    const validConfidences = [
      merged.confidence.ai,
      merged.confidence.ocr,
      merged.confidence.barcode
    ].filter(conf => conf > 0);
    
    merged.confidence.overall = validConfidences.length > 0 
      ? validConfidences.reduce((sum, conf) => sum + conf, 0) / validConfidences.length 
      : 0;

    // 生成智慧建議
    merged.recommendations = generateRecommendations(merged);

    return merged;
  };

  // 計算項目優先級
  const calculateItemPriority = (item, source) => {
    let priority = 0;
    
    // 來源權重
    const sourceWeights = { barcode: 0.4, ai: 0.3, ocr: 0.3 };
    priority += sourceWeights[source] || 0;
    
    // 置信度權重
    priority += (item.confidence || 0) * 0.4;
    
    // 資訊完整度權重
    const completeness = calculateInformationCompleteness(item);
    priority += completeness * 0.3;
    
    return Math.min(priority, 1.0);
  };

  // 計算資訊完整度
  const calculateInformationCompleteness = (item) => {
    const fields = ['name', 'brand', 'category', 'quantity'];
    const filledFields = fields.filter(field => item[field]).length;
    return filledFields / fields.length;
  };

  // 計算平均置信度
  const calculateAverageConfidence = (items) => {
    if (!items || items.length === 0) return 0;
    const totalConfidence = items.reduce((sum, item) => sum + (item.confidence || 0), 0);
    return totalConfidence / items.length;
  };

  // 交叉驗證邏輯
  const performCrossValidation = (aiResult, ocrResult, barcodeResult) => {
    const validation = {
      nameConsistency: false,
      brandConsistency: false,
      categoryConsistency: false,
      confidence: 0
    };

    // 檢查產品名稱一致性
    const names = [];
    if (aiResult?.items?.[0]?.name) names.push(aiResult.items[0].name.toLowerCase());
    if (ocrResult?.text?.productName) names.push(ocrResult.text.productName.toLowerCase());
    if (barcodeResult?.products?.[0]?.name) names.push(barcodeResult.products[0].name.toLowerCase());
    
    if (names.length > 1) {
      // 簡單的名稱相似度檢查
      validation.nameConsistency = names.some(name => 
        names.some(otherName => 
          name !== otherName && (name.includes(otherName) || otherName.includes(name))
        )
      );
    }

    // 檢查品牌一致性
    const brands = [];
    if (aiResult?.items?.[0]?.brand) brands.push(aiResult.items[0].brand);
    if (ocrResult?.text?.brand) brands.push(ocrResult.text.brand);
    if (barcodeResult?.products?.[0]?.brand) brands.push(barcodeResult.products[0].brand);
    
    validation.brandConsistency = brands.length > 1 && new Set(brands).size === 1;

    // 計算驗證置信度
    let validationScore = 0;
    if (validation.nameConsistency) validationScore += 0.4;
    if (validation.brandConsistency) validationScore += 0.3;
    validation.confidence = validationScore;

    return validation;
  };

  // 生成智慧建議
  const generateRecommendations = (mergedResults) => {
    const recommendations = [];

    if (mergedResults.confidence.overall > 0.8) {
      recommendations.push({
        type: 'high_confidence',
        message: '識別結果置信度高，建議直接加入庫存',
        priority: 'high'
      });
    } else if (mergedResults.confidence.overall < 0.5) {
      recommendations.push({
        type: 'low_confidence',
        message: '識別結果置信度較低，建議手動確認',
        priority: 'medium'
      });
    }

    if (mergedResults.crossValidation.nameConsistency) {
      recommendations.push({
        type: 'cross_validation',
        message: '多種識別方式確認了產品名稱，結果可信度高',
        priority: 'info'
      });
    }

    if (mergedResults.barcodeProducts.length > 0) {
      recommendations.push({
        type: 'barcode_found',
        message: '找到條碼資訊，產品資料完整度高',
        priority: 'high'
      });
    }

    return recommendations;
  };

  // 重新識別
  const retryIdentification = () => {
    if (capturedImage?.base64) {
      setIdentificationResults(null);
      setOcrResults(null);
      setBarcodeResults(null);
      setUnifiedResults(null);
      performUnifiedRecognition(capturedImage.base64);
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

      // 根據來源設置不同的標籤和備註
      const sourceInfo = {
        'ai_recognition': { tag: 'ai-identified', prefix: 'AI 物件識別' },
        'ocr_extraction': { tag: 'ocr-identified', prefix: 'OCR 文字識別' },
        'barcode_lookup': { tag: 'barcode-identified', prefix: '條碼查詢' },
        'barcode': { tag: 'barcode-identified', prefix: '條碼查詢' }
      };
      
      const sourceData = sourceInfo[item.source] || sourceInfo['ai_recognition'];
      
      // 構建新增庫存的資料
      const inventoryData = {
        itemKey: itemKey || `${sourceData.tag.toUpperCase()}_${Date.now()}`,
        name: item.name || item.englishName || '未知食材',
        brand: item.brand || null,
        quantity: item.quantity || { amount: 1, unit: '個' },
        purchaseDate: new Date().toISOString().split('T')[0], // 今天的日期
        storageMode: storageMode || 'fridge',
        state: state,
        container: 'none',
        source: sourceData.tag,
        notes: buildItemNotes(item, sourceData.prefix),
        tags: [sourceData.tag],
        // OCR 特有的欄位
        ...(item.source === 'ocr_extraction' && {
          expirationDate: item.expirationDate,
          ingredients: item.ingredients,
          nutrition: item.nutrition,
          rawText: item.rawText
        })
      };

      // 建構項目備註的輔助函數
      function buildItemNotes(item, sourcePrefix) {
        const notes = [`${sourcePrefix}識別`];
        
        if (item.confidence) {
          notes.push(`信心度: ${Math.round(item.confidence * 100)}%`);
        }
        
        if (item.shelfLife) {
          notes.push(`預估保存期限: ${item.shelfLife.daysMin}-${item.shelfLife.daysMax}天`);
        }
        
        if (item.expirationDate) {
          notes.push(`包裝標示效期: ${item.expirationDate}`);
        }
        
        if (item.category) {
          notes.push(`類別: ${item.category}`);
        }
        
        if (item.notes) {
          notes.push(item.notes);
        }
        
        return notes.join(' | ');
      }

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
    setBarcodeResults(null);
    setUnifiedResults(null);
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
            {/* OCR 識別已停用 - 等待選擇新的 AI 提供商 */}
            <div>文字識別功能暫時停用，等待重新評估 AI 提供商</div>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 頁面標題 */}
      <div style={{ padding: 16, backgroundColor: '#f8f9fa', borderBottom: '1px solid #e5e7eb' }}>
        <h2 style={{ margin: '0 0 8px 0' }}>🤖 智慧統一識別</h2>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
          一次拍照，同時進行 AI 物件識別、OCR 文字識別、條碼掃描，並智慧合併結果
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

            {/* 統一識別結果摘要 */}
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
                  {/* 整體置信度 */}
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

                  {/* 識別到的產品數量 */}
                  <div style={{ marginBottom: 12, fontSize: '14px' }}>
                    <div>AI識別食材: {unifiedResults.foodItems.filter(item => item.source === 'ai_recognition').length} 項</div>
                    <div>文字識別產品: {unifiedResults.foodItems.filter(item => item.source === 'ocr_extraction').length} 項</div>
                    <div>條碼產品: {unifiedResults.barcodeProducts.length} 項</div>
                    <div>原始文字: {unifiedResults.extractedText ? '已擷取' : '無'}</div>
                  </div>

                  {/* 智慧建議 */}
                  {unifiedResults.recommendations.length > 0 && (
                    <div>
                      <strong>智慧建議:</strong>
                      {unifiedResults.recommendations.map((rec, index) => (
                        <div key={index} style={{
                          fontSize: '12px',
                          color: rec.priority === 'high' ? '#059669' : 
                                 rec.priority === 'medium' ? '#d97706' : '#6b7280',
                          marginTop: 4
                        }}>
                          • {rec.message}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 交叉驗證結果 */}
                  {unifiedResults.crossValidation.confidence > 0 && (
                    <div style={{
                      marginTop: 8,
                      padding: 6,
                      backgroundColor: '#f0f9ff',
                      borderRadius: 4,
                      fontSize: '12px'
                    }}>
                      ✅ 交叉驗證: {unifiedResults.crossValidation.nameConsistency ? '名稱一致 ' : ''}
                      {unifiedResults.crossValidation.brandConsistency ? '品牌一致' : ''}
                    </div>
                  )}
                </div>
              </div>
            )}

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
                    {barcodeResults.products.map(({ product }, index) => (
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
                              條碼: {product.barcode}
                            </div>
                          </div>
                          <button
                            onClick={() => addToInventory(product)}
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
                          {product.brand && (
                            <div><strong>品牌:</strong> {product.brand}</div>
                          )}
                          {product.category && (
                            <div><strong>分類:</strong> {product.category}</div>
                          )}
                          {product.quantity && (
                            <div><strong>規格:</strong> {product.quantity}</div>
                          )}
                        </div>

                        {product.description && (
                          <div style={{ 
                            marginTop: 8, 
                            padding: 8,
                            backgroundColor: '#f9fafb',
                            borderRadius: 4,
                            fontSize: '12px',
                            color: '#374151'
                          }}>
                            📝 {product.description}
                          </div>
                        )}
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
                  <div>
                    {/* 顯示原始 OCR 文字，不再提取產品 */}
                    <div style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      padding: 12,
                      backgroundColor: 'white'
                    }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#374151' }}>
                        🔍 結構化文字識別結果
                      </h4>
                      
                      {Object.entries(ocrResults.text).map(([key, value]) => (
                        value && key !== 'allText' && (
                          <div key={key} style={{ marginBottom: 6, fontSize: '13px' }}>
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