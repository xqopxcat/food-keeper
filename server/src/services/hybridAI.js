import { identifyFoodItemsGoogle, extractTextFromImageGoogle } from './googleVisionAI.js';
import { GoogleGenAI } from '@google/genai';

// 初始化 Gemini AI（如果有 API key）
let geminiClient = null;
if (process.env.GEMINI_API_KEY) {
  try {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  } catch (error) {
    console.warn('Gemini AI 初始化失敗:', error.message);
  }
}

/**
 * 智能 AI 路由服務 - 使用 Google Vision API
 */

/**
 * Google Vision 食物識別服務
 * @param {string} imageBase64 - Base64 編碼的圖片  
 * @param {object} options - 識別選項
 * @returns {Promise<object>} 識別結果
 */
export async function hybridFoodIdentification(imageBase64, options = {}) {
  const {
    language = 'zh-TW'
  } = options;

  console.log(`🤖 使用 Google Vision 食物識別`);

  try {
    return await identifyWithGoogle(imageBase64, options);
  } catch (error) {
    console.error('Google Vision identification error:', error);
    return {
      success: false,
      error: error.message || 'Google Vision 識別失敗',
      items: [],
      totalItems: 0,
      strategy: 'google'
    };
  }
}

/**
 * 使用 Google Vision 識別
 */
async function identifyWithGoogle(imageBase64, options) {
  const startTime = Date.now();
  const result = await identifyFoodItemsGoogle(imageBase64, options);
  const processingTime = Date.now() - startTime;
  
  return {
    ...result,
    strategy: 'google',
    processingTime: processingTime
  };
}

/**
 * 策略1: Google Vision OCR + Gemini 智能分析 
 */
export async function hybridTextExtraction(imageBase64, options = {}) {
  console.log(`📝 使用策略1: Google Vision OCR + Gemini 分析`);
  
  try {
    // 步驟1: 使用 Google Vision OCR 提取原始文字
    const ocrResult = await ocrWithGoogle(imageBase64, options);
    
    if (!ocrResult.success || !ocrResult.text?.allText) {
      console.log('OCR 失敗或無文字，返回原始結果');
      return ocrResult;
    }
    
    // 步驟2: 如果有 Gemini API，使用 Gemini 分析 OCR 文字
    if (geminiClient && process.env.GEMINI_API_KEY) {
      try {
        console.log('🤖 使用 Gemini 分析 OCR 文字...');
        const geminiResult = await analyzeTextWithGemini(ocrResult.text.allText, options);
        
        if (geminiResult.success) {
          // 合併 OCR + Gemini 結果
          return {
            ...ocrResult,
            text: {
              ...ocrResult.text,
              ...geminiResult.analysis, // Gemini 的結構化分析
              geminiAnalysis: geminiResult.analysis,
              geminiConfidence: geminiResult.confidence
            },
            confidence: Math.min(ocrResult.confidence || 0.9, geminiResult.confidence || 0.8),
            aiProvider: 'google-vision + gemini',
            strategy: 'ocr-plus-gemini'
          };
        } else {
          console.warn('Gemini 分析失敗，使用純 OCR 結果');
        }
      } catch (geminiError) {
        console.error('Gemini 分析錯誤:', geminiError);
        // 如果 Gemini 失敗，繼續使用純 OCR 結果
      }
    }
    
    // 如果沒有 Gemini 或 Gemini 失敗，返回純 OCR 結果
    return {
      ...ocrResult,
      strategy: 'google-vision-only',
      note: geminiClient ? 'Gemini 分析失敗，使用純 OCR' : '無 Gemini API，使用純 OCR'
    };
    
  } catch (error) {
    console.error('Hybrid text extraction error:', error);
    return {
      success: false,
      error: error.message || 'Hybrid 文字識別失敗',
      text: {},
      strategy: 'error'
    };
  }
}

/**
 * Google Vision OCR
 */
async function ocrWithGoogle(imageBase64, options) {
  const startTime = Date.now();
  const result = await extractTextFromImageGoogle(imageBase64);
  const processingTime = Date.now() - startTime;
  
  return {
    ...result,
    strategy: 'google',
    processingTime: processingTime
  };
}

/**
 * 使用 Gemini 分析 OCR 文字 (新版 @google/genai)
 */
async function analyzeTextWithGemini(ocrText, options = {}) {
  if (!geminiClient || !process.env.GEMINI_API_KEY) {
    throw new Error('Gemini API 未配置');
  }

  const {
    language = 'zh-TW',
    includeNutrition = true,
    includeIngredients = true
  } = options;

  try {
    // 構建分析提示詞
    const prompt = buildAnalysisPrompt(ocrText, {
      language,
      includeNutrition,
      includeIngredients
    });

    console.log('🤖 Gemini 正在分析 OCR 文字...');
    
    // 使用新版 API
    const response = await geminiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    const analysisText = response.text;

    // 解析 JSON 回應
    const analysis = parseGeminiResponse(analysisText);
    
    return {
      success: true,
      analysis: analysis,
      confidence: analysis.confidence || 0.8,
      aiProvider: 'gemini-2.5-flash',
      processingTime: Date.now(),
      originalText: ocrText
    };

  } catch (error) {
    console.error('Gemini 分析錯誤:', error);
    
    return {
      success: false,
      error: error.message || 'Gemini 分析失敗',
      analysis: {},
      aiProvider: 'gemini-2.5-flash'
    };
  }
}

/**
 * 構建 Gemini 分析提示詞
 */
function buildAnalysisPrompt(ocrText, options) {
  const { language, includeNutrition, includeIngredients } = options;
  
  return `請分析以下來自食品包裝的OCR文字，提取結構化資訊。

OCR文字：
${ocrText}

請以JSON格式回覆，包含以下欄位（符合台灣食品庫存系統的 addInventoryItem 格式）：

{
  "itemKey": "對應的系統食材代碼（如 Apple, Banana, Chicken_meat 等，若無對應則使用最接近的英文名稱）",
  "name": "產品中文名稱",
  "brand": "品牌名稱",
  "category": "食品分類（🍎 水果類, 🥬 蔬菜類, 🥩 肉類, 🥛 乳製品, 🍚 主食類, 🌾 乾貨類, 🥫 罐頭類, 🍪 零食類, 🧊 冷凍食品, 🥤 飲料類）",
  "quantity": {
    "amount": 重量或數量的數值,
    "unit": "單位（個, 包, 瓶, 罐, 公克, 公斤, 毫升, 公升等）"
  },
  "expirationDate": "YYYY-MM-DD格式的保存期限（從包裝上識別）",
  "storageMode": "建議保存方式（room=室溫, fridge=冷藏, freezer=冷凍）",
  "state": "產品狀態（whole=完整, cut=切開, opened=開封, cooked=熟食）",
  "barcode": "條碼號碼（如果識別到）",
  ${includeIngredients ? '"ingredients": "主要成分列表",' : ''}
  ${includeNutrition ? '"nutrition": "營養資訊摘要",' : ''}
  "tips": "包裝上的保存方式說明",
  "notes": "其他注意事項",
  "confidence": 分析信心度（0.0-1.0）
}

分析要求：
1. itemKey 必須映射到系統中存在的食材代碼，常見的有：Apple, Banana, Citrus_orange, Tomato, Carrot, Potato, Chicken_meat, Pork_meat, Beef_meat, Fish, Milk, Egg, Cheese, Yogurt, Bread, Rice_uncooked, Tofu, Instant_noodle, Snack, Chocolate, Mango, Kiwi, Pear, Cabbage, Lettuce_iceberg, Green_bean, Eggplant, Sweet_potato, Cauliflower, Spinach, Bok_choy, Scallion, Celery 等
2. category 必須使用提供的表情符號分類
3. 如果是台灣常見食品，請優先識別正確的中文名稱
4. 保存期限格式務必正確，若無法確定則設為 null
5. 數量解析要準確，注意單位轉換
6. 信心度要根據文字清晰度和資訊完整度評估

只回覆JSON，不要其他文字。`;
}

/**
 * 解析 Gemini 回應
 */
function parseGeminiResponse(responseText) {
  try {
    // 清理回應文字，移除可能的markdown標記
    const cleanedText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(cleanedText);
    
    // 驗證和標準化必要欄位
    return {
      itemKey: parsed.itemKey || null,
      name: parsed.name || '未知產品',
      brand: parsed.brand || null,
      category: parsed.category || null,
      quantity: parsed.quantity || { amount: 1, unit: '個' },
      expirationDate: validateDate(parsed.expirationDate),
      storageMode: validateStorageMode(parsed.storageMode),
      state: validateState(parsed.state),
      barcode: parsed.barcode || null,
      ingredients: parsed.ingredients || null,
      nutrition: parsed.nutrition || null,
      tips: parsed.tips || null,
      notes: parsed.notes || null,
      confidence: Math.max(0, Math.min(1, parsed.confidence || 0.7))
    };

  } catch (error) {
    console.error('解析 Gemini 回應失敗:', error);
    console.error('原始回應:', responseText);
    
    // 回傳預設結構
    return {
      itemKey: null,
      name: '解析失敗',
      brand: null,
      category: null,
      quantity: { amount: 1, unit: '個' },
      expirationDate: null,
      storageMode: 'fridge',
      state: 'whole',
      barcode: null,
      ingredients: null,
      nutrition: null,
      tips: null,
      notes: `Gemini回應解析失敗: ${error.message}`,
      confidence: 0.1
    };
  }
}

/**
 * 驗證日期格式
 */
function validateDate(dateString) {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]; // 返回 YYYY-MM-DD 格式
    }
  } catch (e) {
    // 繼續其他驗證
  }
  
  return null;
}

/**
 * 驗證保存方式
 */
function validateStorageMode(mode) {
  const validModes = ['room', 'fridge', 'freezer'];
  return validModes.includes(mode) ? mode : 'fridge';
}

/**
 * 驗證產品狀態
 */
function validateState(state) {
  const validStates = ['whole', 'cut', 'opened', 'cooked'];
  return validStates.includes(state) ? state : 'whole';
}

/**
 * 取得 Hybrid AI 服務狀態（Google Vision + Gemini）
 */
export function getHybridAIStatus() {
  const googleAvailable = !!process.env.GOOGLE_CLOUD_PROJECT_ID && !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const geminiAvailable = !!process.env.GEMINI_API_KEY;
  
  const status = {
    current: {
      primary: 'google-vision',
      enhancement: geminiAvailable ? 'gemini-2.5-flash' : null,
      description: geminiAvailable ? 
        '使用 Google Vision OCR + Gemini 2.5 Flash 智能分析策略' : 
        '使用 Google Vision API 作為主要 AI 服務'
    },
    google: {
      available: googleAvailable,
      active: true,
      capabilities: ['object-detection', 'label-detection', 'ocr', 'fast-processing'],
      benefits: ['每月1000次免費', '快速回應', 'OCR性能優秀']
    },
    gemini: {
      available: geminiAvailable,
      active: geminiAvailable,
      version: '@google/genai v1.29.1',
      model: 'gemini-2.5-flash',
      capabilities: ['text-analysis', 'structured-extraction', 'language-understanding', 'json-formatting', 'multimodal-understanding'],
      benefits: ['最新 Gemini 2.5 模型', '更強語言理解', '結構化數據提取', '支援繁體中文', '智能分析', '多模態能力']
    },
    hybrid: {
      enabled: geminiAvailable,
      strategy: geminiAvailable ? 'ocr-plus-gemini-2.5' : 'google-vision-only',
      availableStrategies: geminiAvailable ? 
        ['google-vision-only', 'ocr-plus-gemini-2.5'] : 
        ['google-vision-only'],
      recommended: geminiAvailable ? 'ocr-plus-gemini-2.5' : 'google-vision-only',
      description: geminiAvailable ? 
        '策略1: Google Vision OCR 提取文字 → Gemini 2.5 Flash 結構化分析' :
        '純 Google Vision 識別'
    },
    recommendations: {
      setup: (() => {
        if (googleAvailable && geminiAvailable) {
          return '✅ Google Vision + Gemini 2.5 Flash 已設定，使用最新增強分析模式';
        } else if (googleAvailable) {
          return '⚠️ 建議設定 Gemini API 以獲得 Gemini 2.5 Flash 的強大文字分析能力';
        } else {
          return '⚠️ 請設定 Google Vision API 以使用 AI 識別功能';
        }
      })(),
      usage: geminiAvailable ? 
        'OCR + Gemini 2.5 Flash 智能分析模式，提供最準確的結構化數據提取' :
        'Google Vision API 提供每月1000次免費額度，適合大多數使用場景'
    }
  };
  
  return status;
}