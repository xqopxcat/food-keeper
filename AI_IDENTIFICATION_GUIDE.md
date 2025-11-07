# AI 物品識別與文字識別功能

## 🎯 功能概述

本系統整合了 OpenAI GPT-4V 的視覺識別能力，提供以下功能：

### 1. 🍎 智能食材識別
- **拍照識別**: 使用相機即時拍攝食材並進行識別
- **圖片上傳**: 支援從相簿選擇圖片進行識別
- **批量識別**: 一次上傳多張圖片進行批量處理
- **多語言支援**: 支援繁體中文、簡體中文、英文等

### 2. 📝 包裝文字識別 (OCR)
- **產品資訊**: 識別產品名稱、品牌、規格等
- **保存期限**: 自動讀取包裝上的有效期限
- **條碼識別**: 提取產品條碼資訊
- **營養標示**: 識別營養成分和配料表

### 3. 🔄 智能整合
- **自動分類**: 根據識別結果自動分配食材類別
- **庫存建議**: 提供適合的保存方式和存放位置
- **數量估算**: 智能估算食材數量和單位

## 🚀 使用方式

### 前端組件

#### Camera 組件
```jsx
import Camera from '../components/Camera.jsx';

<Camera
  onCapture={handleCapture}
  onError={handleError}
  className="custom-camera"
  style={{ width: '100%', height: '400px' }}
/>
```

#### AI 識別頁面
```jsx
import AiIdentificationView from '../pages/AiIdentificationView.jsx';

// 在路由中使用
<Route path="/ai" element={<AiIdentificationView />} />
```

### RTK Query Hooks

#### 物品識別
```jsx
import { useIdentifyFoodItemsMutation } from '../redux/services/foodCoreAPI';

const [identifyFood, { isLoading, data, error }] = useIdentifyFoodItemsMutation();

// 使用 base64 圖片
await identifyFood({
  imageBase64: 'base64string...',
  options: {
    language: 'zh-TW',
    includeQuantity: true,
    includeExpiration: true,
    includeBrand: true
  }
});

// 使用檔案
await identifyFoodItemsFile({
  file: imageFile,
  options: { language: 'zh-TW' }
});
```

#### 文字識別 (OCR)
```jsx
import { useExtractTextFromImageMutation } from '../redux/services/foodCoreAPI';

const [extractText] = useExtractTextFromImageMutation();

const result = await extractText({
  imageBase64: 'base64string...'
});
```

#### 批量識別
```jsx
import { useBatchIdentifyFoodItemsMutation } from '../redux/services/foodCoreAPI';

const [batchIdentify] = useBatchIdentifyFoodItemsMutation();

await batchIdentify({
  files: [file1, file2, file3],
  options: { language: 'zh-TW' }
});
```

## 🔧 後端 API

### 識別端點

#### POST /api/ai/identify
識別圖片中的食物

**請求格式 1: JSON**
```json
{
  "imageBase64": "base64編碼的圖片",
  "options": {
    "language": "zh-TW",
    "includeQuantity": true,
    "includeExpiration": true,
    "includeBrand": true
  }
}
```

**請求格式 2: FormData**
```javascript
const formData = new FormData();
formData.append('image', imageFile);
formData.append('options', JSON.stringify(options));
```

**回應格式**
```json
{
  "success": true,
  "items": [
    {
      "name": "蘋果",
      "englishName": "Apple",
      "category": "水果類",
      "itemKey": "Apple",
      "brand": null,
      "quantity": {"amount": 2, "unit": "個"},
      "confidence": 0.95,
      "storageMode": "fridge",
      "state": "whole",
      "notes": "外觀新鮮，無明顯損傷",
      "packageText": null,
      "expirationDate": null,
      "productCode": null
    }
  ],
  "totalItems": 1,
  "aiProvider": "openai",
  "model": "gpt-4o-mini"
}
```

#### POST /api/ai/ocr
提取圖片中的文字

**回應格式**
```json
{
  "success": true,
  "text": {
    "productName": "產品名稱",
    "brand": "品牌名稱",
    "expirationDate": "2024-12-31",
    "barcode": "1234567890123",
    "ingredients": "成分表內容",
    "nutrition": "營養標示內容",
    "allText": "所有識別到的文字內容"
  },
  "confidence": 0.95,
  "aiProvider": "openai"
}
```

#### POST /api/ai/batch-identify
批量識別多張圖片

**回應格式**
```json
{
  "success": true,
  "results": [
    {
      "index": 0,
      "filename": "apple.jpg",
      "success": true,
      "items": [...],
      "totalItems": 2
    },
    {
      "index": 1,
      "filename": "orange.jpg", 
      "success": true,
      "items": [...],
      "totalItems": 1
    }
  ],
  "summary": {
    "totalImages": 2,
    "successImages": 2,
    "failedImages": 0,
    "totalItemsFound": 3
  }
}
```

#### GET /api/ai/status
檢查 AI 服務狀態

```json
{
  "aiEnabled": true,
  "providers": [
    {
      "name": "OpenAI",
      "model": "gpt-4o-mini", 
      "capabilities": ["food-identification", "ocr", "text-extraction"]
    }
  ],
  "capabilities": ["food-identification", "ocr"]
}
```

## ⚙️ 設定說明

### 環境變數
```bash
# OpenAI API 設定
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini

# Google Vision API (可選)
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
```

### 依賴安裝
```bash
# 後端
cd server
npm install openai multer

# 前端 (React 18+ 已內建 Camera API 支援)
# 無需額外安裝套件
```

## 🎯 使用流程

1. **拍攝/上傳圖片**
   - 使用相機即時拍攝
   - 或從相簿選擇圖片

2. **AI 自動識別**
   - 並行執行食材識別和文字識別
   - 回傳結構化的識別結果

3. **結果處理**
   - 顯示識別到的食材和文字資訊
   - 提供加入庫存的快速操作

4. **庫存整合**
   - 一鍵將識別結果加入庫存系統
   - 自動填入食材類型、數量等資訊

## 📱 相機功能

- **雙鏡頭支援**: 自動偵測並支援前後鏡頭切換
- **高解析度**: 支援最高 1920x1080 解析度拍攝
- **即時預覽**: 提供即時相機預覽
- **權限管理**: 友善的權限請求和錯誤處理

## 🔒 安全性

- **圖片大小限制**: 最大 10MB
- **檔案類型驗證**: 只允許圖片格式
- **API 金鑰保護**: 後端統一管理 API 金鑰
- **錯誤處理**: 完善的錯誤處理和使用者提示

## 🚀 擴展性

系統設計支援未來擴展：

- **多 AI 提供商**: 支援 OpenAI、Google Vision 等
- **自定義模型**: 可整合自訓練的食材識別模型
- **批量處理**: 支援大量圖片的批次識別
- **結果快取**: 可加入識別結果快取機制