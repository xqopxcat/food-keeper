# 🚀 API 申請與設定完整指南

## 📋 目錄
1. [OpenAI API Key 申請](#openai-api-key-申請)
2. [Google Vision API 設定](#google-vision-api-設定)
3. [環境變數配置](#環境變數配置)
4. [測試 API 連接](#測試-api-連接)
5. [費用控制建議](#費用控制建議)
6. [常見問題解決](#常見問題解決)

---

## 🤖 OpenAI API Key 申請

### 步驟 1: 註冊 OpenAI 帳號
1. **前往 OpenAI Platform**
   - 網址: https://platform.openai.com/
   - 點擊右上角 "Sign up"

2. **註冊方式**
   ```
   選項 1: Email + 密碼註冊
   選項 2: Google 帳號授權
   選項 3: Microsoft 帳號授權
   ```

3. **驗證帳號**
   - 檢查 Email 收到的驗證信
   - 點擊驗證連結完成註冊

### 步驟 2: 設定計費 💳
1. **進入計費設定**
   ```
   登入後 → Settings (左側選單) → Billing
   ```

2. **添加付費方式**
   - 點擊 "Add payment method"
   - 輸入信用卡資訊
   - 設定 usage limit (建議 $10-20 開始)

3. **免費額度說明**
   ```
   新用戶福利: $5 美元免費額度
   有效期限: 3個月
   足夠測試: ~3000次 AI 識別
   ```

### 步驟 3: 創建 API Key 🔑
1. **進入 API 管理**
   ```
   Dashboard → API keys (左側選單)
   ```

2. **創建新 Key**
   - 點擊 "Create new secret key"
   - 輸入名稱: `food-keeper-ai`
   - 選擇權限: `Restricted` (建議)
   - 開啟權限: `Model capabilities`

3. **保存 API Key**
   ```
   ⚠️  重要: API Key 只會顯示一次！
   立即複製並安全保存
   格式: sk-proj-xxxxxxxxxxxxxxxxx
   ```

### 步驟 4: 安全設定 🔒
```bash
# 設定使用限制 (推薦)
Monthly budget limit: $20
Hard limit: 啟用
Email alerts: 80% 和 100%

# 模型使用建議
gpt-4o-mini: 日常使用 (便宜、快速)
gpt-4o: 高精度需求 (貴但準確)
```

---

## 👁️ Google Vision API 設定

### 步驟 1: 創建 Google Cloud 項目
1. **前往 Google Cloud Console**
   - 網址: https://console.cloud.google.com/
   - 使用 Google 帳號登入

2. **創建新項目**
   ```
   點擊頂部項目選擇器 → "New Project"
   
   項目資訊:
   - Project name: food-keeper-vision
   - Organization: (可選)
   - Location: (預設即可)
   ```

3. **設定計費帳號** 💳
   - 需要綁定信用卡
   - 每月 1000 次免費額度
   - 超出部分: $1.50/1000 次

### 步驟 2: 啟用 Vision API
```bash
# 方法 1: 透過 Console
Navigation Menu → APIs & Services → Library
搜尋 "Cloud Vision API" → Enable

# 方法 2: 透過 gcloud CLI
gcloud services enable vision.googleapis.com
```

### 步驟 3: 創建服務帳號
1. **進入 IAM 設定**
   ```
   Navigation Menu → IAM & Admin → Service Accounts
   ```

2. **創建服務帳號**
   ```
   點擊 "Create Service Account"
   
   基本資訊:
   - Service account name: food-keeper-vision
   - Service account ID: (自動生成)
   - Description: AI vision service for food identification
   ```

3. **設定權限**
   ```
   Grant this service account access to project:
   Role: Cloud Vision API Service Agent
   
   或者使用基本角色:
   Role: Editor (不建議，權限過大)
   Role: Viewer + Cloud Vision API User (推薦)
   ```

### 步驟 4: 下載憑證文件 📄
1. **生成 JSON Key**
   ```
   進入服務帳號詳情 → Keys 標籤
   Add Key → Create new key → JSON
   ```

2. **安全保存 JSON 文件**
   ```bash
   # 建議存放位置
   mkdir -p ~/.gcp/credentials
   mv ~/Downloads/service-account-key.json ~/.gcp/credentials/
   
   # 設定檔案權限
   chmod 600 ~/.gcp/credentials/service-account-key.json
   ```

3. **記錄項目 ID**
   ```
   在 Google Cloud Console 首頁可以看到:
   Project ID: food-keeper-vision-123456
   ```

---

## ⚙️ 環境變數配置

### 步驟 1: 複製範例文件
```bash
cd /path/to/food-keeper/server
cp .env.example .env
```

### 步驟 2: 編輯 .env 文件
```bash
# OpenAI 設定
OPENAI_API_KEY=sk-proj-你的實際API_Key
OPENAI_MODEL=gpt-4o-mini

# Google Vision 設定  
GOOGLE_CLOUD_PROJECT_ID=food-keeper-vision-123456
GOOGLE_APPLICATION_CREDENTIALS=/Users/yourname/.gcp/credentials/service-account-key.json

# 其他設定保持預設值
MONGODB_URI=mongodb://localhost:27017/foodkeeper
PORT=4000
```

### 步驟 3: 驗證設定
```bash
# 檢查檔案存在
ls -la ~/.gcp/credentials/service-account-key.json

# 檢查 JSON 格式
cat ~/.gcp/credentials/service-account-key.json | python -m json.tool
```

---

## 🧪 測試 API 連接

創建測試腳本來驗證 API 設定：

### OpenAI 測試
```bash
# 測試 OpenAI 連接
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Google Vision 測試
```bash
# 測試 Google Vision (需要先安裝 gcloud CLI)
gcloud auth application-default login
gcloud services list --enabled | grep vision
```

### 應用程式測試
```bash
# 啟動伺服器測試
cd server
npm run dev

# 測試 AI 識別端點
curl -X GET http://localhost:4000/api/ai/status
```

---

## 💰 費用控制建議

### OpenAI 費用控制
```bash
# 推薦設定
Monthly hard limit: $20
Usage monitoring: 每日檢查
Alert thresholds: 80%, 100%

# 成本預估 (gpt-4o-mini)
每次識別: ~$0.002
1000次/月: ~$2
10000次/月: ~$20
```

### Google Vision 費用控制
```bash
# 免費額度
每月免費: 1000 次
年度免費: 12000 次

# 付費價格
標籤檢測: $1.50/1000次
OCR: $1.50/1000次

# 預算警告設定
Budget alerts: $10, $50, $100
```

### 使用策略建議
```javascript
// 成本最佳化策略
const strategy = {
  lightUsage: "純 Google Vision (免費額度)",
  mediumUsage: "混合使用 (Google + OpenAI)",
  heavyUsage: "OpenAI 為主 (單次成本較低)"
};
```

---

## 🔧 常見問題解決

### Q1: OpenAI API Key 無效
```bash
# 檢查清單
✓ API Key 格式正確 (sk-proj-...)
✓ 沒有多餘空格
✓ 計費設定完成
✓ 使用限制未達上限

# 測試方法
curl -H "Authorization: Bearer YOUR_KEY" \
     https://api.openai.com/v1/models
```

### Q2: Google Vision 認證失敗
```bash
# 檢查清單
✓ JSON 文件路徑正確
✓ 服務帳號有適當權限
✓ Vision API 已啟用
✓ 項目 ID 正確

# 除錯方法
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
gcloud auth application-default print-access-token
```

### Q3: 費用異常高
```bash
# 檢查使用量
OpenAI: https://platform.openai.com/usage
Google: https://console.cloud.google.com/billing

# 緊急處理
1. 立即停用 API Key
2. 設定更嚴格的限制
3. 檢查程式碼是否有無限迴圈
```

### Q4: API 回應慢
```bash
# 最佳化建議
✓ 使用 gpt-4o-mini 而非 gpt-4o
✓ 壓縮圖片大小
✓ 實施請求快取
✓ 使用批次處理

# 監控工具
Response time monitoring
Error rate tracking
```

---

## 🎯 快速開始檢查清單

### ✅ OpenAI 設定完成
- [ ] 註冊 OpenAI 帳號
- [ ] 添加付費方式
- [ ] 創建 API Key
- [ ] 設定使用限制
- [ ] 測試 API 連接

### ✅ Google Vision 設定完成  
- [ ] 創建 Google Cloud 項目
- [ ] 啟用 Vision API
- [ ] 創建服務帳號
- [ ] 下載 JSON 憑證
- [ ] 測試 API 連接

### ✅ 環境配置完成
- [ ] 複製 .env.example 到 .env
- [ ] 填入 OpenAI API Key
- [ ] 填入 Google 項目 ID 和憑證路徑
- [ ] 啟動伺服器測試
- [ ] 測試 AI 識別功能

---

## 📞 需要幫助？

如果在設定過程中遇到問題：

1. **檢查官方文檔**
   - [OpenAI API 文檔](https://platform.openai.com/docs)
   - [Google Vision API 文檔](https://cloud.google.com/vision/docs)

2. **檢查 API 狀態**
   - [OpenAI 狀態頁面](https://status.openai.com/)
   - [Google Cloud 狀態](https://status.cloud.google.com/)

3. **社群支援**
   - [OpenAI 社群論壇](https://community.openai.com/)
   - [Google Cloud 支援](https://cloud.google.com/support)

**設定完成後，您就可以享受強大的 AI 食材識別功能了！** 🎉