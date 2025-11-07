# ✅ API 設定快速檢查清單

## 🎯 完成這個清單就能馬上使用 AI 識別功能！

### 📋 OpenAI API 設定 (5分鐘)

#### ✅ 步驟 1: 註冊帳號
- [ ] 前往 https://platform.openai.com/
- [ ] 使用 Google/Email 註冊帳號
- [ ] 驗證 Email

#### ✅ 步驟 2: 設定付費 (新用戶有 $5 免費額度)
- [ ] Settings → Billing → Add payment method
- [ ] 輸入信用卡資訊
- [ ] 設定 usage limit: $10-20 (避免意外高費用)

#### ✅ 步驟 3: 創建 API Key
- [ ] Dashboard → API keys → Create new secret key
- [ ] 名稱: `food-keeper-ai`
- [ ] 權限: `Restricted` → 只開啟 `Model capabilities`
- [ ] **複製並保存 API Key** (只顯示一次！)

#### ✅ 步驟 4: 填入環境變數
```bash
# 在 server/.env 檔案中
OPENAI_API_KEY=sk-proj-你的API金鑰
OPENAI_MODEL=gpt-4o-mini
```

---

### 👁️ Google Vision API 設定 (10分鐘)

#### ✅ 步驟 1: 創建 Google Cloud 專案
- [ ] 前往 https://console.cloud.google.com/
- [ ] 登入 Google 帳號
- [ ] 創建新專案: 名稱 `food-keeper-vision`
- [ ] 記下專案 ID (如: `food-keeper-vision-123456`)

#### ✅ 步驟 2: 啟用 Vision API
- [ ] Navigation Menu → APIs & Services → Library
- [ ] 搜尋 `Cloud Vision API` → 點擊 Enable
- [ ] 設定計費帳號 (需要信用卡，但每月 1000 次免費)

#### ✅ 步驟 3: 創建服務帳號
- [ ] IAM & Admin → Service Accounts → Create Service Account
- [ ] 名稱: `food-keeper-vision`
- [ ] 權限: `Cloud Vision API Service Agent`
- [ ] 完成創建

#### ✅ 步驟 4: 下載憑證
- [ ] 點擊剛創建的服務帳號
- [ ] Keys 標籤 → Add Key → Create new key → JSON
- [ ] 下載 JSON 檔案
- [ ] 將檔案移到安全位置 (如: `~/.gcp/credentials/service-account.json`)

#### ✅ 步驟 5: 填入環境變數
```bash
# 在 server/.env 檔案中
GOOGLE_CLOUD_PROJECT_ID=food-keeper-vision-123456
GOOGLE_APPLICATION_CREDENTIALS=/Users/你的用戶名/.gcp/credentials/service-account.json
```

---

### ⚙️ 環境設定

#### ✅ 步驟 1: 設定環境變數檔案
```bash
cd food-keeper/server
cp .env.example .env
```

#### ✅ 步驟 2: 編輯 .env 檔案
```bash
# 必要設定
OPENAI_API_KEY=sk-proj-你的OpenAI金鑰
OPENAI_MODEL=gpt-4o-mini

GOOGLE_CLOUD_PROJECT_ID=你的專案ID
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# 其他設定 (可保持預設)
MONGODB_URI=mongodb://localhost:27017/foodkeeper
PORT=4000
```

---

### 🧪 測試設定

#### ✅ 步驟 1: 快速測試
```bash
cd server
npm run test:api
```

#### ✅ 步驟 2: 分別測試
```bash
# 只測試 OpenAI
npm run test:openai

# 只測試 Google Vision
npm run test:google
```

#### ✅ 步驟 3: 啟動伺服器
```bash
npm run dev
```

#### ✅ 步驟 4: 測試 AI 識別
```bash
# 檢查 AI 服務狀態
curl http://localhost:4000/api/ai/status
```

---

## 🎉 完成後你就可以：

### ✨ 使用 AI 食材識別
- 📸 拍照自動識別蔬果類型
- 🔤 OCR 識別包裝食品資訊  
- 📊 獲得食材數量和新鮮度評估
- 💡 接收保存建議

### 💰 費用控制
```bash
OpenAI (gpt-4o-mini):
- 每次識別: ~$0.002
- 1000次: ~$2/月  
- 新用戶 $5 免費額度約可用 2500 次

Google Vision:
- 每月前 1000 次: 完全免費
- 超出部分: $1.50/1000次
- 年度免費額度: 12000 次
```

### 🚀 智能策略
- 🆓 **輕度使用**: 純 Google Vision (免費)
- 🎯 **中度使用**: 混合策略 (成本最佳化)
- 🏆 **重度使用**: 場景智能選擇

---

## 🆘 遇到問題？

### 常見錯誤解決
```bash
# OpenAI API Key 錯誤
❌ "Invalid API key" 
→ 檢查 API Key 是否正確，是否有多餘空格

# Google Vision 認證失敗  
❌ "Could not load credentials"
→ 檢查 JSON 檔案路徑和權限

# 費用相關
❌ "Usage limit exceeded"
→ 檢查 OpenAI billing 設定和限制
```

### 測試指令
```bash
# 檢查環境變數
node test-api-connection.js --env

# 測試特定 API
node test-api-connection.js --openai
node test-api-connection.js --google

# 查看完整幫助
node test-api-connection.js --help
```

### 獲取幫助
- 📖 [詳細設定指南](./API_SETUP_GUIDE.md)
- 🌐 [OpenAI 官方文件](https://platform.openai.com/docs)
- 🌐 [Google Vision 文件](https://cloud.google.com/vision/docs)

**設定完成後，你就擁有了強大的 AI 視覺識別能力！** 🎊