# 開發成本控制指南

## 🚀 快速設定

### 開發模式 (節省 API 成本)
```bash
# 1. 開啟開發模式，使用模擬數據
cp .env.development .env.local

# 2. 啟動開發服務器
npm run dev
```

### 測試模式 (有限的真實 API 調用)
編輯 `.env.local`：
```env
VITE_USE_MOCK_DATA=false
VITE_VISION_API_DAILY_LIMIT=3
VITE_GEMINI_API_DAILY_LIMIT=2
VITE_OCR_API_DAILY_LIMIT=3
```

## 💡 成本控制功能

### 1. 開發者面板
- 在頁面右上角點擊 🛠️ 開發工具
- 實時查看 API 配額使用情況
- 一鍵切換模擬/真實 API

### 2. 每日配額限制
- **Google Vision**: 10 次/天 (開發模式)
- **Gemini OCR**: 5 次/天 (開發模式)  
- **條碼查詢**: 8 次/天 (開發模式)

### 3. 自動備用方案
- 配額用完自動切換到模擬數據
- 明確提示用戶當前使用模式
- 配額每日自動重置

## 🧪 模擬數據特色

### 真實感模擬
- 隨機信心度 (80-95%)
- 多樣化食材識別結果
- 完整的 OCR 結構化數據
- 模擬網路延遲 (1-2秒)

### 測試場景覆蓋
- ✅ 成功識別 (90% 機率)
- ❌ 失敗情況 (10% 機率)
- 🏷️ 條碼查詢 (特定條碼)
- 📝 OCR 文字識別

## 📊 API 成本預估

### 實際 API 價格 (Google Cloud)
- **Vision API**: ~$1.50 / 1000 次
- **Gemini Pro**: ~$0.125 / 1K tokens
- **OCR**: 已包含在 Vision API

### 每日開發成本
```
正常開發 (模擬數據): $0
有限測試 (真實API): ~$0.05-0.10
完整測試: ~$0.50-1.00
```

## 🔧 環境切換

### 開發環境 (預設)
```bash
VITE_USE_MOCK_DATA=true    # 使用模擬數據
VITE_SHOW_DEV_PANEL=true   # 顯示開發面板
```

### 生產環境
```bash
VITE_USE_MOCK_DATA=false   # 使用真實 API
VITE_SHOW_DEV_PANEL=false  # 隱藏開發面板
```

## 🎯 建議的開發流程

1. **功能開發**: 100% 模擬數據
2. **UI測試**: 100% 模擬數據  
3. **整合測試**: 5-10 次真實 API 調用
4. **最終驗證**: 10-20 次真實 API 調用
5. **部署上線**: 真實 API

## 🛡️ 緊急成本控制

如果 API 費用過高，立即執行：
```bash
# 1. 切換到純模擬模式
echo "VITE_USE_MOCK_DATA=true" > .env.local

# 2. 重啟開發服務器
npm run dev
```

## 📞 免費替代方案

### 1. 本地 OCR (Tesseract.js)
- 完全免費
- 精度較低
- 無結構化輸出

### 2. 開源視覺模型
- TensorFlow.js
- MediaPipe
- 需要額外訓練

### 3. API 替代服務
- Roboflow (有免費額度)
- Clarifai (有免費額度)
- Azure Computer Vision (有免費額度)