# 統一識別 API 使用指南

## 概述

新的統一識別系統將條碼掃描、OCR文字識別、物件識別整合為一個單一的API端點，提供「一次拍照獲得所有資訊」的體驗。

## 系統架構

### 模組設計
```
統一協調器 (Unified Orchestrator)
├── 條碼掃描模組 (Barcode Module)
├── OCR 文字識別模組 (OCR Module)
└── 物件識別模組 (Object Detection Module)
```

### 特點
- **模組化**：每個模組可獨立替換和升級
- **快取機制**：24小時內容快取，降低API成本
- **錯誤隔離**：單一模組失敗不影響其他模組
- **並行處理**：三個模組同時執行，提高效率
- **交叉驗證**：模組間結果互相驗證提高準確度

## API 端點

### 統一識別 API
```
POST /api/recognition/unified-recognition
```

#### 請求格式
```json
{
  "image": "base64_encoded_image_string",
  "options": {
    "useCache": true,
    "includeDebugInfo": false,
    "modules": ["barcode", "ocr", "object"]
  }
}
```

#### 回應格式
```json
{
  "success": true,
  "result": {
    "products": [
      {
        "name": "統一麵包",
        "brand": "統一企業",
        "category": "麵包類",
        "barcode": "4710088880123",
        "source": "barcode",
        "confidence": 0.95
      }
    ],
    "foodItems": [
      {
        "name": "Bread",
        "category": "grains",
        "shelfLife": {
          "days": 5,
          "expiryDate": "2024-12-15T00:00:00.000Z"
        },
        "confidence": 0.92,
        "source": "object_detection"
      }
    ],
    "extractedInfo": {
      "text": "統一麵包 保存期限：2024-12-31",
      "structuredData": {
        "dates": [
          {
            "raw": "2024-12-31",
            "parsed": "2024-12-31T00:00:00.000Z",
            "type": "expiry"
          }
        ],
        "brands": ["統一"],
        "nutritionInfo": {},
        "ingredients": ["麵粉", "水", "酵母"]
      }
    },
    "analysis": {
      "primaryProduct": {
        "name": "統一麵包",
        "confidence": 0.95
      },
      "expiryDate": "2024-12-31T00:00:00.000Z",
      "storageType": "room_temperature",
      "confidence": {
        "overall": 0.89,
        "barcode": 0.95,
        "ocr": 0.87,
        "objectDetection": 0.92
      }
    },
    "recommendations": [
      {
        "type": "storage",
        "message": "建議常溫保存",
        "priority": "medium"
      }
    ]
  },
  "processingTime": 1250,
  "timestamp": "2024-11-10T10:30:00.000Z"
}
```

### 個別模組測試端點

#### 條碼測試
```
POST /api/recognition/test/barcode
```

#### OCR測試  
```
POST /api/recognition/test/ocr
```

#### 物件識別測試
```
POST /api/recognition/test/object-detection
```

### 系統管理端點

#### 系統狀態
```
GET /api/recognition/status
```

#### 清除快取
```
POST /api/recognition/cache/clear
```

#### 快取統計
```
GET /api/recognition/cache/stats
```

#### 健康檢查
```
GET /api/recognition/health
```

## 前端整合範例

### JavaScript 使用範例
```javascript
// 統一識別函數
async function processImageWithUnifiedRecognition(imageBase64) {
  try {
    const response = await fetch('/api/recognition/unified-recognition', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image: imageBase64,
        options: {
          useCache: true,
          includeDebugInfo: false
        }
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // 處理成功結果
      displayResults(result.result);
    } else {
      console.error('識別失敗:', result.error);
    }
  } catch (error) {
    console.error('API 調用失敗:', error);
  }
}

// 顯示結果函數
function displayResults(result) {
  // 顯示產品資訊
  if (result.products.length > 0) {
    console.log('檢測到產品:', result.products);
  }
  
  // 顯示食材資訊
  if (result.foodItems.length > 0) {
    console.log('檢測到食材:', result.foodItems);
  }
  
  // 顯示提取的文字
  if (result.extractedInfo.text) {
    console.log('提取的文字:', result.extractedInfo.text);
  }
  
  // 顯示分析結果
  if (result.analysis.expiryDate) {
    console.log('預估保存期限:', result.analysis.expiryDate);
  }
  
  // 顯示建議
  if (result.recommendations.length > 0) {
    result.recommendations.forEach(rec => {
      console.log(`建議 (${rec.priority}):`, rec.message);
    });
  }
}
```

### React Hook 範例
```javascript
import { useState, useCallback } from 'react';

export function useUnifiedRecognition() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  const processImage = useCallback(async (imageBase64, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/recognition/unified-recognition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64, options })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResult(data.result);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { processImage, loading, result, error };
}
```

## 優勢與效益

### 用戶體驗
- **單一操作**：只需拍一次照片
- **完整資訊**：獲得產品、保存期限、食材類型等全方位資訊
- **智慧建議**：基於識別結果提供儲存和使用建議

### 開發維護
- **模組獨立**：可單獨更新任一識別引擎
- **成本控制**：快取機制減少重複API調用
- **錯誤隔離**：單一模組失敗不影響整體功能
- **擴展性**：容易添加新的識別模組

### 性能優化
- **並行處理**：多模組同時執行節省時間
- **智慧快取**：24小時快取避免重複處理
- **結果融合**：交叉驗證提高準確度

## 注意事項

1. **圖片大小限制**：建議圖片大小不超過50MB
2. **快取策略**：相同圖片24小時內會返回快取結果
3. **模組依賴**：某些功能需要外部服務（Google Vision AI等）
4. **錯誤處理**：單一模組失敗不會阻止其他模組執行

## 後續改進計劃

1. **實際整合**：連接真實的條碼掃描庫和Google Vision AI
2. **性能優化**：實施更智慧的快取策略
3. **結果增強**：添加更多交叉驗證邏輯
4. **用戶介面**：提供視覺化的結果展示組件