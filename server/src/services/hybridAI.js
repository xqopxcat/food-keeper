import { identifyFoodItemsGoogle, extractTextFromImageGoogle } from './googleVisionAI.js';

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
 * Google Vision OCR 文字識別
 */
export async function hybridTextExtraction(imageBase64, options = {}) {
  console.log(`📝 使用 Google Vision OCR`);
  
  try {
    return await ocrWithGoogle(imageBase64, options);
  } catch (error) {
    console.error('Google Vision OCR error:', error);
    return {
      success: false,
      error: error.message || 'Google Vision OCR 失敗',
      text: {},
      strategy: 'google'
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
 * 取得 Google Vision AI 服務狀態
 */
export function getHybridAIStatus() {
  const googleAvailable = !!process.env.GOOGLE_CLOUD_PROJECT_ID && !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  const status = {
    current: {
      primary: 'google',
      fallback: null,
      description: '使用 Google Vision API 作為主要 AI 服務'
    },
    google: {
      available: googleAvailable,
      active: true,
      capabilities: ['object-detection', 'label-detection', 'ocr', 'fast-processing'],
      benefits: ['每月1000次免費', '快速回應', 'OCR性能優秀']
    },
    hybrid: {
      enabled: false,
      defaultStrategy: 'google',
      availableStrategies: ['google'],
      recommended: 'google',
      fallbackStrategy: 'google-only'
    },
    recommendations: {
      setup: googleAvailable ? 
        '✅ Google Vision 已設定，可開始使用' : 
        '⚠️ 請設定 Google Vision API 以使用 AI 識別功能',
      usage: 'Google Vision API 提供每月1000次免費額度，適合大多數使用場景'
    }
  };
  
  return status;
}