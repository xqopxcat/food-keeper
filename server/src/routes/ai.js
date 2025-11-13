import { Router } from 'express';
import multer from 'multer';
import { hybridFoodIdentification, hybridTextExtraction, getHybridAIStatus } from '../services/hybridAI.js';

const router = Router();

// 設置 multer 用於處理圖片上傳
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 增加到 50MB 限制
  },
  fileFilter: (req, file, cb) => {
    // 只允許圖片類型
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允許上傳圖片檔案'), false);
    }
  }
});

/**
 * POST /api/ai/identify
 * 識別圖片中的食物
 * 
 * Body (multipart/form-data):
 * - image: 圖片檔案
 * - options: JSON 字串，包含識別選項
 * 
 * 或 Body (application/json):
 * - imageBase64: base64 編碼的圖片
 * - options: 識別選項物件
 */
router.post('/identify', upload.single('image'), async (req, res) => {
  try {
    let imageBase64;
    let options = {};

    // 處理兩種上傳方式
    if (req.file) {
      // multipart/form-data 方式
      imageBase64 = req.file.buffer.toString('base64');
      if (req.body.options) {
        try {
          options = JSON.parse(req.body.options);
        } catch (e) {
          console.warn('Invalid options JSON:', e);
        }
      }
    } else if (req.body.imageBase64) {
      // JSON 方式
      imageBase64 = req.body.imageBase64;
      options = req.body.options || {};
    } else {
      return res.status(400).json({
        success: false,
        error: '請提供圖片檔案或 base64 編碼的圖片'
      });
    }

    // 驗證圖片大小 (base64 解碼後)
    const imageSizeBytes = (imageBase64.length * 3) / 4;
    if (imageSizeBytes > 50 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: '圖片大小不能超過 50MB'
      });
    }

    // 呼叫混合 AI 識別服務
    const result = await hybridFoodIdentification(imageBase64, options);

    // 記錄識別結果 (用於改進模型)
    console.log('AI Food Identification:', {
      timestamp: new Date().toISOString(),
      success: result.success,
      itemCount: result.totalItems,
      provider: result.aiProvider
    });

    res.json(result);

  } catch (error) {
    console.error('AI Identify Error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || '圖片識別失敗',
      items: [],
      totalItems: 0
    });
  }
});

/**
 * POST /api/ai/ocr
 * 從圖片中提取文字 (OCR)
 * 
 * Body 格式同 /identify
 */
router.post('/ocr', upload.single('image'), async (req, res) => {
  try {
    let imageBase64;

    if (req.file) {
      imageBase64 = req.file.buffer.toString('base64');
    } else if (req.body.imageBase64) {
      imageBase64 = req.body.imageBase64;
    } else {
      return res.status(400).json({
        success: false,
        error: '請提供圖片檔案或 base64 編碼的圖片'
      });
    }

    // 驗證圖片大小
    const imageSizeBytes = (imageBase64.length * 3) / 4;
    if (imageSizeBytes > 50 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: '圖片大小不能超過 50MB'
      });
    }

    // 呼叫混合 OCR 服務 (專注使用 Google Vision)
    const result = await hybridTextExtraction(imageBase64, { strategy: 'google' });

    console.log('AI OCR (Google Vision):', {
      timestamp: new Date().toISOString(),
      success: result.success,
      provider: result.aiProvider || result.strategy
    });

    res.json(result);

  } catch (error) {
    console.error('AI OCR Error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || '文字識別失敗',
      text: {}
    });
  }
});

/**
 * GET /api/ai/status
 * 檢查 AI 服務狀態
 */
router.get('/status', (req, res) => {
  try {
    const hybridStatus = getHybridAIStatus();
    
    const status = {
      aiEnabled: hybridStatus.google.available,
      providers: [],
      capabilities: [],
      hybrid: hybridStatus.hybrid
    };

    if (hybridStatus.google.available) {
      status.providers.push({
        name: 'Google Vision AI',
        capabilities: hybridStatus.google.capabilities
      });
      status.capabilities.push(...hybridStatus.google.capabilities);
    }

    // 去重
    status.capabilities = [...new Set(status.capabilities)];

    res.json(status);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || '獲取 AI 狀態失敗'
    });
  }
});

/**
 * POST /api/ai/batch-identify
 * 批量識別多張圖片
 */
router.post('/batch-identify', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: '請提供至少一張圖片'
      });
    }

    let options = {};
    if (req.body.options) {
      try {
        options = JSON.parse(req.body.options);
      } catch (e) {
        console.warn('Invalid options JSON:', e);
      }
    }

    const results = [];
    
    // 並行處理多張圖片 (限制併發數量)
    const batchSize = 3;
    for (let i = 0; i < req.files.length; i += batchSize) {
      const batch = req.files.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (file, index) => {
        try {
          const imageBase64 = file.buffer.toString('base64');
          // 使用混合 AI 識別 (專注 Google Vision)
          const batchOptions = { strategy: 'google', ...options };
          const result = await hybridFoodIdentification(imageBase64, batchOptions);
          return {
            index: i + index,
            filename: file.originalname,
            ...result
          };
        } catch (error) {
          return {
            index: i + index,
            filename: file.originalname,
            success: false,
            error: error.message,
            items: [],
            totalItems: 0
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    // 統計結果
    const totalItems = results.reduce((sum, r) => sum + (r.totalItems || 0), 0);
    const successCount = results.filter(r => r.success).length;

    res.json({
      success: successCount > 0,
      results,
      summary: {
        totalImages: req.files.length,
        successImages: successCount,
        failedImages: req.files.length - successCount,
        totalItemsFound: totalItems
      }
    });

  } catch (error) {
    console.error('Batch AI Identify Error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || '批量識別失敗',
      results: []
    });
  }
});

/**
 * POST /api/ai/compare
 * 比較不同 AI 服務的識別結果
 */
router.post('/compare', upload.single('image'), async (req, res) => {
  try {
    let imageBase64;

    if (req.file) {
      imageBase64 = req.file.buffer.toString('base64');
    } else if (req.body.imageBase64) {
      imageBase64 = req.body.imageBase64;
    } else {
      return res.status(400).json({
        success: false,
        error: '請提供圖片檔案或 base64 編碼的圖片'
      });
    }

    const options = {
      strategy: 'google', // 當前專注使用 Google Vision (可在未來改為 'both' 進行比較)
      language: 'zh-TW',
      includeQuantity: true,
      includeExpiration: true,
      includeBrand: true
    };

    // 執行 Google Vision 識別 
    const result = await hybridFoodIdentification(imageBase64, options);
    
    // 同時執行 Google Vision OCR
    const ocrResult = await hybridTextExtraction(imageBase64, { strategy: 'google' });

    res.json({
      success: true,
      comparison: {
        food_identification: result,
        ocr: ocrResult,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI Compare Error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'AI 比較失敗'
    });
  }
});

/**
 * POST /api/ai/hybrid-ocr  
 * 使用混合策略進行 OCR
 */
router.post('/hybrid-ocr', upload.single('image'), async (req, res) => {
  try {
    let imageBase64;
    let options = {};

    if (req.file) {
      imageBase64 = req.file.buffer.toString('base64');
      if (req.body.options) {
        try {
          options = JSON.parse(req.body.options);
        } catch (e) {
          console.warn('Invalid options JSON:', e);
        }
      }
    } else if (req.body.imageBase64) {
      imageBase64 = req.body.imageBase64;
      options = req.body.options || {};
    } else {
      return res.status(400).json({
        success: false,
        error: '請提供圖片檔案或 base64 編碼的圖片'
      });
    }

    // 使用混合 OCR 策略 (預設專注使用 Google Vision)
    const ocrOptions = { strategy: 'google', ...options };
    const result = await hybridTextExtraction(imageBase64, ocrOptions);

    console.log('Hybrid OCR:', {
      timestamp: new Date().toISOString(),
      success: result.success,
      strategy: result.strategy
    });

    res.json(result);

  } catch (error) {
    console.error('Hybrid OCR Error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || '混合 OCR 失敗',
      text: {}
    });
  }
});

export default router;