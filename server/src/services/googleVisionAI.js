import { ImageAnnotatorClient } from '@google-cloud/vision';
import { inferDefaultsFromProduct } from './inferDefaults.js';
import { evaluateShelfLife } from './shelfLife.js';

// 初始化 Google Vision 客戶端
const vision = new ImageAnnotatorClient({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

/**
 * 使用 Google Vision API 識別圖片中的物體和標籤
 * @param {string} imageBase64 - Base64 編碼的圖片
 * @param {object} options - 識別選項
 * @returns {Promise<object>} 識別結果
 */
const identifyFoodItemsGoogle = async (imageBase64, options = {}) => {
  if (!process.env.GOOGLE_CLOUD_PROJECT_ID || !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error('Google Vision API credentials not configured');
  }

  const {
    language = 'zh-TW',
    includeQuantity = false, // Google Vision 不太擅長數量估算
    maxResults = 20
  } = options;

  try {
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    
    // 並行執行多種檢測
    const [labelResult, objectResult, textResult] = await Promise.allSettled([
      // 標籤檢測 (識別物體類型)
      vision.labelDetection({
        image: { content: imageBuffer },
        maxResults: maxResults,
        imageContext: {
          languageHints: [language === 'zh-TW' ? 'zh-Hant' : 'en']
        }
      }),
      
      // 物體定位檢測
      vision.objectLocalization({
        image: { content: imageBuffer },
        maxResults: maxResults
      }),
      
      // 文字檢測 (用於輔助識別)
      vision.textDetection({
        image: { content: imageBuffer },
        imageContext: {
          languageHints: [language === 'zh-TW' ? 'zh-Hant' : 'en']
        }
      })
    ]);

    // 處理標籤檢測結果
    const labels = labelResult.status === 'fulfilled' 
      ? labelResult.value[0].labelAnnotations || []
      : [];
    
    // 處理物體檢測結果  
    const objects = objectResult.status === 'fulfilled'
      ? objectResult.value[0].localizedObjectAnnotations || []
      : [];
    
    // 處理文字檢測結果
    const texts = textResult.status === 'fulfilled'
      ? textResult.value[0].textAnnotations || []
      : [];

    // 食材相關的標籤過濾
    const foodRelatedLabels = labels.filter(label => {
      const description = label.description.toLowerCase();
      const foodKeywords = [
        'food', 'fruit', 'vegetable', 'meat', 'dairy', 'bread', 'grain',
        'apple', 'banana', 'orange', 'tomato', 'carrot', 'potato',
        '食物', '水果', '蔬菜', '肉類', '乳製品', '麵包', '穀物'
      ];
      return foodKeywords.some(keyword => description.includes(keyword));
    });

    // 將 Google Vision 結果轉換為統一格式
    const items = [];
    
    // 處理識別到的物體
    const processedObjects = new Set();

    objects.forEach(async (object) => {
      const name = object.name;
      if (processedObjects.has(name)) return;
      processedObjects.add(name);
      
      const confidence = object.score || 0;
      
      // 嘗試映射到系統食材代碼
      const itemKey = mapGoogleLabelToItemKey(name);
      const category = mapToFoodCategory(name);
      const storageMode = inferStorageMode(name);
      
      if (itemKey || category) {
        // 使用 inferDefaults 來獲取更準確的 itemKey 和 storageMode
        const productForInfer = {
          name: translateToTraditionalChinese(name),
          brand: extractBrand(texts),
          category: category
        };
        
        const inferredDefaults = inferDefaultsFromProduct(productForInfer);
        const finalItemKey = (inferredDefaults && inferredDefaults.itemKey) || itemKey;
        const finalStorageMode = (inferredDefaults && inferredDefaults.storageMode) || storageMode;
        const finalState = (inferredDefaults && inferredDefaults.state) || 'whole';

        // 使用保存期限估算服務
        let shelfLifeResult = null;
        if (finalItemKey) {
          try {
            shelfLifeResult = await evaluateShelfLife({
              itemKey: finalItemKey,
              storageMode: finalStorageMode,
              state: finalState,
              container: 'none',
              season: 'summer',
              locale: 'TW'
            });
          } catch (error) {
            console.warn('Failed to evaluate shelf life:', error);
          }
        }

        items.push({
          name: translateToTraditionalChinese(name),
          englishName: name,
          category: category,
          itemKey: finalItemKey,
          brand: extractBrand(texts),
          quantity: { amount: 1, unit: '個' }, // Google Vision 不擅長數量估算
          confidence: confidence,
          storageMode: finalStorageMode,
          state: finalState,
          notes: `Google Vision 識別 (${Math.round(confidence * 100)}% 信心度)`,
          packageText: texts.length > 0 ? texts[0].description : null,
          expirationDate: null,
          productCode: extractBarcode(texts),
          boundingBox: object.boundingPoly, // Google Vision 特有的位置資訊
          // 保存期限資訊
          shelfLife: shelfLifeResult ? {
            daysMin: shelfLifeResult.daysMin,
            daysMax: shelfLifeResult.daysMax,
            tips: shelfLifeResult.tips,
            confidence: shelfLifeResult.confidence,
            ruleId: shelfLifeResult.ruleId
          } : null
        });
      }
    });

    // 如果物體檢測沒有結果，嘗試從標籤推斷
    if (items.length === 0 && foodRelatedLabels.length > 0) {
      for (const label of foodRelatedLabels.slice(0, 5)) {
        const name = label.description;
        const confidence = label.score || 0;
        
        const itemKey = mapGoogleLabelToItemKey(name);
        const category = mapToFoodCategory(name);
        const storageMode = inferStorageMode(name);
        
        // 使用 inferDefaults 來獲取更準確的 itemKey 和 storageMode
        const productForInfer = {
          name: translateToTraditionalChinese(name),
          brand: extractBrand(texts),
          category: category
        };
        
        const inferredDefaults = inferDefaultsFromProduct(productForInfer);
        const finalItemKey = (inferredDefaults && inferredDefaults.itemKey) || itemKey;
        const finalStorageMode = (inferredDefaults && inferredDefaults.storageMode) || storageMode;
        const finalState = (inferredDefaults && inferredDefaults.state) || 'whole';

        // 使用保存期限估算服務
        let shelfLifeResult = null;
        if (finalItemKey) {
          try {
            shelfLifeResult = await evaluateShelfLife({
              itemKey: finalItemKey,
              storageMode: finalStorageMode,
              state: finalState,
              container: 'none',
              season: 'summer',
              locale: 'TW'
            });
          } catch (error) {
            console.warn('Failed to evaluate shelf life for label:', error);
          }
        }
        
        items.push({
          name: translateToTraditionalChinese(name),
          englishName: name,
          category: category,
          itemKey: finalItemKey,
          brand: extractBrand(texts),
          quantity: { amount: 1, unit: '個' },
          confidence: confidence,
          storageMode: finalStorageMode,
          state: finalState,
          notes: `從標籤推斷 (${Math.round(confidence * 100)}% 信心度)`,
          packageText: texts.length > 0 ? texts[0].description : null,
          expirationDate: null,
          productCode: extractBarcode(texts),
          // 保存期限資訊
          shelfLife: shelfLifeResult ? {
            daysMin: shelfLifeResult.daysMin,
            daysMax: shelfLifeResult.daysMax,
            tips: shelfLifeResult.tips,
            confidence: shelfLifeResult.confidence,
            ruleId: shelfLifeResult.ruleId
          } : null
        });
      }
    }

    return {
      success: items.length > 0,
      items: items,
      totalItems: items.length,
      language: language,
      aiProvider: 'google-vision',
      processingTime: Date.now(),
      rawData: {
        labels: labels,
        objects: objects,
        texts: texts.length > 0 ? texts[0].description : null
      }
    };

  } catch (error) {
    console.error('Google Vision API Error:', error);
    
    return {
      success: false,
      error: error.message || 'Google Vision API 暫時無法使用',
      items: [],
      totalItems: 0,
      aiProvider: 'google-vision'
    };
  }
}

/**
 * Google Vision OCR 文字識別
 */
export async function extractTextFromImageGoogle(imageBase64) {
  try {
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    
    const [result] = await vision.textDetection({
      image: { content: imageBuffer },
      imageContext: {
        languageHints: ['zh-Hant', 'en']
      }
    });

    const detections = result.textAnnotations;
    
    if (!detections || detections.length === 0) {
      return {
        success: false,
        error: '圖片中未檢測到文字',
        text: {},
        aiProvider: 'google-vision'
      };
    }

    // 第一個結果是完整文字
    const fullText = detections[0].description;
    
    // 嘗試提取結構化資訊
    const structuredText = extractStructuredInfo(fullText);

    return {
      success: true,
      text: {
        ...structuredText,
        allText: fullText
      },
      confidence: 0.9, // Google Vision OCR 通常很準確
      aiProvider: 'google-vision',
      boundingBoxes: detections.map(d => ({
        text: d.description,
        boundingPoly: d.boundingPoly
      }))
    };

  } catch (error) {
    console.error('Google Vision OCR Error:', error);
    
    return {
      success: false,
      error: error.message || 'Google Vision OCR 服務暫時無法使用',
      text: {},
      aiProvider: 'google-vision'
    };
  }
}

// 輔助函數：映射 Google 標籤到系統食材代碼
function mapGoogleLabelToItemKey(googleLabel) {
  const labelMap = {
    'apple': 'Apple',
    'banana': 'Banana', 
    'orange': 'Citrus_orange',
    'tomato': 'Tomato',
    'carrot': 'Carrot',
    'potato': 'Potato',
    'bread': 'Bread',
    'milk': 'Milk',
    'egg': 'Egg',
    'chicken': 'Chicken_meat',
    'beef': 'Beef_meat',
    'pork': 'Pork_meat',
    'fish': 'Fish',
    'cheese': 'Cheese',
    'yogurt': 'Yogurt',
    'rice': 'Rice_uncooked'
  };
  
  const normalizedLabel = googleLabel.toLowerCase();
  return labelMap[normalizedLabel] || null;
}

// 輔助函數：映射到食物分類
function mapToFoodCategory(googleLabel) {
  const categoryMap = {
    'fruit': '🍎 水果類',
    'vegetable': '🥬 蔬菜類', 
    'meat': '🥩 肉類',
    'dairy': '🥛 乳製品',
    'bread': '🍚 主食類',
    'grain': '🌾 乾貨類'
  };
  
  const normalizedLabel = googleLabel.toLowerCase();
  
  // 直接匹配
  if (categoryMap[normalizedLabel]) {
    return categoryMap[normalizedLabel];
  }
  
  // 模糊匹配
  if (normalizedLabel.includes('fruit') || 
      ['apple', 'banana', 'orange', 'grape'].includes(normalizedLabel)) {
    return '🍎 水果類';
  }
  
  if (normalizedLabel.includes('vegetable') ||
      ['tomato', 'carrot', 'potato', 'onion'].includes(normalizedLabel)) {
    return '🥬 蔬菜類';
  }
  
  if (['meat', 'chicken', 'beef', 'pork', 'fish'].includes(normalizedLabel)) {
    return '🥩 肉類';
  }
  
  return null;
}

// 輔助函數：推斷保存方式
function inferStorageMode(googleLabel) {
  const fridgeItems = ['milk', 'cheese', 'yogurt', 'meat', 'chicken', 'beef', 'fish'];
  const roomItems = ['bread', 'potato', 'onion', 'banana'];
  const freezerItems = ['ice cream'];
  
  const normalizedLabel = googleLabel.toLowerCase();
  
  if (fridgeItems.includes(normalizedLabel)) return 'fridge';
  if (roomItems.includes(normalizedLabel)) return 'room';
  if (freezerItems.includes(normalizedLabel)) return 'freezer';
  
  return 'fridge'; // 預設冷藏
}

// 輔助函數：翻譯為繁體中文
function translateToTraditionalChinese(englishName) {
  const translations = {
    'apple': '蘋果',
    'banana': '香蕉',
    'orange': '橘子',
    'tomato': '番茄',
    'carrot': '紅蘿蔔',
    'potato': '馬鈴薯',
    'bread': '麵包',
    'milk': '鮮奶',
    'egg': '雞蛋',
    'chicken': '雞肉',
    'beef': '牛肉',
    'pork': '豬肉',
    'fish': '魚',
    'cheese': '起司',
    'yogurt': '優格',
    'rice': '白米',
    'food': '食物',
    'fruit': '水果',
    'vegetable': '蔬菜',
    'meat': '肉類'
  };
  
  return translations[englishName.toLowerCase()] || englishName;
}

// 輔助函數：從 OCR 文字中提取條碼
function extractBarcode(texts) {
  if (!texts || texts.length === 0) return null;
  
  const fullText = texts[0].description;
  const barcodePattern = /\b\d{8,14}\b/g;
  const matches = fullText.match(barcodePattern);
  
  return matches && matches.length > 0 ? matches[0] : null;
}

// 輔助函數：從 OCR 文字中提取品牌
function extractBrand(texts) {
  if (!texts || texts.length === 0) return null;
  
  const fullText = texts[0].description;
  
  // 台灣常見品牌識別
  const brands = ['統一', '義美', '味全', '愛之味', '維力', '康師傅', '泰山', '光泉', '林鳳營'];
  for (const brand of brands) {
    if (fullText.includes(brand)) {
      return brand;
    }
  }
  
  return null;
}

// 輔助函數：從 OCR 文字提取結構化資訊
function extractStructuredInfo(text) {
  const result = {
    productName: null,
    brand: null,
    expirationDate: null,
    barcode: null,
    ingredients: null,
    nutrition: null
  };
  
  // 提取日期
  const datePatterns = [
    /(\d{4})[.-](\d{1,2})[.-](\d{1,2})/g,
    /(\d{1,2})[.-](\d{1,2})[.-](\d{4})/g,
    /有效期限?\s*[：:]?\s*(\d{4}[.-]\d{1,2}[.-]\d{1,2})/gi,
    /保存期限?\s*[：:]?\s*(\d{4}[.-]\d{1,2}[.-]\d{1,2})/gi
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.expirationDate = match[0];
      break;
    }
  }
  
  // 提取條碼
  const barcodeMatch = text.match(/\b\d{8,14}\b/);
  if (barcodeMatch) {
    result.barcode = barcodeMatch[0];
  }
  
  // 簡單的品牌識別 (台灣常見品牌)
  const brands = ['統一', '義美', '味全', '愛之味', '維力', '康師傅'];
  for (const brand of brands) {
    if (text.includes(brand)) {
      result.brand = brand;
      break;
    }
  }
  
  return result;
}

export { identifyFoodItemsGoogle };