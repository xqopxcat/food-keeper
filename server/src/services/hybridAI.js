import { identifyFoodItems as identifyOpenAI, extractTextFromImage as ocrOpenAI } from './aiRecognition.js';
import { identifyFoodItemsGoogle, extractTextFromImageGoogle } from './googleVisionAI.js';

/**
 * 智能 AI 路由服務 - 根據情況選擇最佳的 AI 服務
 */

/**
 * 混合 AI 識別策略 - 目前專注使用 Google Vision API
 * @param {string} imageBase64 - Base64 編碼的圖片  
 * @param {object} options - 識別選項
 * @returns {Promise<object>} 識別結果
 */
export async function hybridFoodIdentification(imageBase64, options = {}) {
  const {
    strategy = 'google', // 預設使用 Google Vision API
    preferSpeed = true,  // Google Vision 速度較快
    preferAccuracy = true,
    language = 'zh-TW'
  } = options;

  console.log(`🤖 使用混合 AI 識別策略: ${strategy} (預設: Google Vision)`);

  try {
    switch (strategy) {
      case 'openai':
        console.log('⚠️  OpenAI 策略已暫停，自動切換到 Google Vision');
        return await identifyWithGoogle(imageBase64, options);
        
      case 'google':
        return await identifyWithGoogle(imageBase64, options);
        
      case 'both':
        console.log('⚠️  混合策略已暫停，使用 Google Vision');
        return await identifyWithGoogle(imageBase64, options);
        
      case 'auto':
      default:
        return await autoSelectStrategy(imageBase64, options);
    }
  } catch (error) {
    console.error('Hybrid AI identification error:', error);
    return {
      success: false,
      error: error.message || '混合 AI 識別失敗',
      items: [],
      totalItems: 0,
      strategy: 'google'
    };
  }
}

/**
 * 自動選擇最佳策略 - 當前專注使用 Google Vision API
 */
async function autoSelectStrategy(imageBase64, options) {
  const { preferSpeed, preferAccuracy, language } = options;
  
  // 檢查 API 可用性
  const openaiAvailable = !!process.env.OPENAI_API_KEY;
  const googleAvailable = !!process.env.GOOGLE_CLOUD_PROJECT_ID && !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  if (!googleAvailable && !openaiAvailable) {
    throw new Error('沒有可用的 AI 服務，請設定 Google Vision API 或 OpenAI API');
  }

  // 優先使用 Google Vision API
  if (googleAvailable) {
    console.log('🎯 自動選擇: Google Vision API (當前主要服務)');
    return await identifyWithGoogle(imageBase64, options);
  }

  // Google Vision 不可用時的備援方案
  if (openaiAvailable) {
    console.log('⚠️  Google Vision 不可用，使用 OpenAI 作為備援');
    return await identifyWithOpenAI(imageBase64, options);
  }
  
  throw new Error('所有 AI 服務都不可用');
}

/**
 * 使用 OpenAI 識別
 */
async function identifyWithOpenAI(imageBase64, options) {
  const startTime = Date.now();
  const result = await identifyOpenAI(imageBase64, options);
  const processingTime = Date.now() - startTime;
  
  return {
    ...result,
    strategy: 'openai',
    processingTime: processingTime
  };
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
 * 同時使用兩個 API 並合併結果
 */
async function identifyWithBoth(imageBase64, options) {
  const startTime = Date.now();
  
  console.log('🔄 並行使用 OpenAI 和 Google Vision');
  
  const [openaiResult, googleResult] = await Promise.allSettled([
    identifyOpenAI(imageBase64, options).catch(e => ({ success: false, error: e.message, items: [] })),
    identifyFoodItemsGoogle(imageBase64, options).catch(e => ({ success: false, error: e.message, items: [] }))
  ]);
  
  const processingTime = Date.now() - startTime;
  
  // 合併結果
  const mergedResult = mergeIdentificationResults(
    openaiResult.status === 'fulfilled' ? openaiResult.value : { success: false, items: [] },
    googleResult.status === 'fulfilled' ? googleResult.value : { success: false, items: [] }
  );
  
  return {
    ...mergedResult,
    strategy: 'both',
    processingTime: processingTime,
    individual_results: {
      openai: openaiResult.status === 'fulfilled' ? openaiResult.value : null,
      google: googleResult.status === 'fulfilled' ? googleResult.value : null
    }
  };
}

/**
 * 合併兩個 AI 的識別結果
 */
function mergeIdentificationResults(openaiResult, googleResult) {
  const mergedItems = [];
  const seenItemKeys = new Set();
  
  // 優先使用 OpenAI 結果 (通常更準確)
  if (openaiResult.success && openaiResult.items) {
    openaiResult.items.forEach(item => {
      mergedItems.push({
        ...item,
        sources: ['openai']
      });
      if (item.itemKey) seenItemKeys.add(item.itemKey);
    });
  }
  
  // 添加 Google Vision 的補充結果
  if (googleResult.success && googleResult.items) {
    googleResult.items.forEach(item => {
      if (!item.itemKey || !seenItemKeys.has(item.itemKey)) {
        mergedItems.push({
          ...item,
          sources: ['google'],
          confidence: item.confidence * 0.9 // 稍微降低權重
        });
        if (item.itemKey) seenItemKeys.add(item.itemKey);
      } else {
        // 如果同樣的食材被兩個 AI 識別到，增加信心度
        const existingItem = mergedItems.find(existing => existing.itemKey === item.itemKey);
        if (existingItem) {
          existingItem.sources.push('google');
          existingItem.confidence = Math.min(1, existingItem.confidence + 0.1);
          existingItem.notes += ` (Google Vision 確認)`;
        }
      }
    });
  }
  
  // 按信心度排序
  mergedItems.sort((a, b) => b.confidence - a.confidence);
  
  return {
    success: mergedItems.length > 0,
    items: mergedItems,
    totalItems: mergedItems.length,
    aiProvider: 'hybrid',
    merge_strategy: 'confidence_weighted'
  };
}

/**
 * 混合 OCR 文字識別 - 當前專注使用 Google Vision API
 */
export async function hybridTextExtraction(imageBase64, options = {}) {
  const { strategy = 'google' } = options; // 預設使用 Google Vision
  
  console.log(`📝 使用混合 OCR 策略: ${strategy} (預設: Google Vision)`);
  
  try {
    switch (strategy) {
      case 'openai':
        console.log('⚠️  OpenAI OCR 已暫停，自動切換到 Google Vision');
        return await ocrWithGoogle(imageBase64, options);
        
      case 'google':
        return await ocrWithGoogle(imageBase64, options);
        
      case 'both':
        console.log('⚠️  混合 OCR 已暫停，使用 Google Vision');
        return await ocrWithGoogle(imageBase64, options);
        
      case 'auto':
      default:
        return await autoSelectOCRStrategy(imageBase64, options);
    }
  } catch (error) {
    console.error('Hybrid OCR error:', error);
    return {
      success: false,
      error: error.message || '混合 OCR 識別失敗',
      text: {},
      strategy: 'google'
    };
  }
}

/**
 * 自動選擇 OCR 策略 - 專注使用 Google Vision API
 */
async function autoSelectOCRStrategy(imageBase64, options) {
  const googleAvailable = !!process.env.GOOGLE_CLOUD_PROJECT_ID && !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const openaiAvailable = !!process.env.OPENAI_API_KEY;
  
  // 優先使用 Google Vision OCR (OCR 性能優秀)
  if (googleAvailable) {
    console.log('📄 使用 Google Vision OCR (當前主要服務)');
    return await ocrWithGoogle(imageBase64, options);
  }
  
  // Google Vision 不可用時的備援方案
  if (openaiAvailable) {
    console.log('⚠️  Google Vision 不可用，使用 OpenAI OCR 作為備援');
    return await ocrWithOpenAI(imageBase64, options);
  }
  
  return { 
    success: false, 
    error: '沒有可用的 OCR 服務，請設定 Google Vision API', 
    text: {},
    strategy: 'google'
  };
}
}

/**
 * OpenAI OCR
 */
async function ocrWithOpenAI(imageBase64, options) {
  const startTime = Date.now();
  const result = await ocrOpenAI(imageBase64);
  const processingTime = Date.now() - startTime;
  
  return {
    ...result,
    strategy: 'openai',
    processingTime: processingTime
  };
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
 * 同時使用兩個 OCR 並合併結果
 */
async function ocrWithBoth(imageBase64, options) {
  const startTime = Date.now();
  
  console.log('📄 並行使用 OpenAI 和 Google Vision OCR');
  
  const [openaiResult, googleResult] = await Promise.allSettled([
    ocrOpenAI(imageBase64).catch(e => ({ success: false, error: e.message, text: {} })),
    extractTextFromImageGoogle(imageBase64).catch(e => ({ success: false, error: e.message, text: {} }))
  ]);
  
  const processingTime = Date.now() - startTime;
  
  // 合併 OCR 結果
  const mergedText = mergeOCRResults(
    openaiResult.status === 'fulfilled' ? openaiResult.value : { success: false, text: {} },
    googleResult.status === 'fulfilled' ? googleResult.value : { success: false, text: {} }
  );
  
  return {
    success: Object.keys(mergedText).length > 0,
    text: mergedText,
    strategy: 'both',
    processingTime: processingTime,
    individual_results: {
      openai: openaiResult.status === 'fulfilled' ? openaiResult.value : null,
      google: googleResult.status === 'fulfilled' ? googleResult.value : null
    }
  };
}

/**
 * 合併 OCR 結果
 */
function mergeOCRResults(openaiResult, googleResult) {
  const merged = {};
  
  // 優先使用結構化程度更高的結果
  if (openaiResult.success && openaiResult.text) {
    Object.assign(merged, openaiResult.text);
  }
  
  // 補充 Google 的結果
  if (googleResult.success && googleResult.text) {
    Object.keys(googleResult.text).forEach(key => {
      if (!merged[key] || merged[key] === null) {
        merged[key] = googleResult.text[key];
      }
    });
  }
  
  return merged;
}

/**
 * 取得可用的 AI 服務狀態 - 當前專注使用 Google Vision
 */
export function getHybridAIStatus() {
  const googleAvailable = !!process.env.GOOGLE_CLOUD_PROJECT_ID && !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const openaiAvailable = !!process.env.OPENAI_API_KEY;
  
  const status = {
    current: {
      primary: 'google',
      fallback: openaiAvailable ? 'openai' : null,
      description: '當前專注使用 Google Vision API，OpenAI 作為備援'
    },
    google: {
      available: googleAvailable,
      active: true,
      capabilities: ['object-detection', 'label-detection', 'ocr', 'fast-processing'],
      benefits: ['每月1000次免費', '快速回應', 'OCR性能優秀']
    },
    openai: {
      available: openaiAvailable,
      active: false, // 暫時停用作為主要服務
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      capabilities: ['food-identification', 'ocr', 'contextual-understanding', 'multilingual'],
      benefits: ['高準確度', '台灣食材理解佳', '複雜場景識別'],
      note: '保留作為備援服務，未來可重新啟用'
    },
    hybrid: {
      enabled: true,
      defaultStrategy: 'google',
      availableStrategies: ['auto', 'google'],
      recommended: 'google',
      fallbackStrategy: openaiAvailable ? 'openai' : 'google-only'
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