import { Router } from 'express';
import multer from 'multer';
import { hybridFoodIdentification, hybridTextExtraction, getHybridAIStatus } from '../services/hybridAI.js';
import { auth } from '../middleware/auth.js';

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
router.post('/identify', auth, upload.single('image'), async (req, res) => {
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
router.post('/ocr', auth, upload.single('image'), async (req, res) => {
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

export default router;