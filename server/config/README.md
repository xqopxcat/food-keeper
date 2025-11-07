# Server 配置目錄

這個目錄用於存放伺服器端的配置檔案。

## 📁 檔案說明

### `gcp-credentials.json` (需要您手動添加)
- **用途**: Google Vision API 的服務帳號憑證
- **來源**: 從 Google Cloud Console 下載
- **安全性**: 此檔案已在 .gitignore 中排除，不會被提交到 Git

### 設定步驟:
1. 從 Google Cloud Console 下載服務帳號 JSON 檔案
2. 將檔案重命名為 `gcp-credentials.json`
3. 放置到此目錄: `server/config/gcp-credentials.json`
4. 在 `.env` 中設定路徑:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=./config/gcp-credentials.json
   ```

### 🔒 安全注意事項
- ❌ 絕對不要提交 `.json` 憑證檔案到 Git
- ✅ 檔案已被 `.gitignore` 排除
- ✅ 僅在伺服器環境中使用，客戶端無法訪問