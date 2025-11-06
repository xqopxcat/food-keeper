# 食材管理系統架構整合說明

## 📋 整合後的系統架構

### 🎯 核心理念
統一使用 **Item Model** 作為所有食材庫存的資料模型，避免重複和混亂。

## 🗄️ 資料模型

### Item Model (`/server/src/models/Item.js`)
```javascript
{
  // 用戶識別
  userId: String (default: '')
  
  // 食材基本資訊  
  barcode: String,
  name: String,
  brand: String,
  itemKey: String,        // 對應 rules.json 的食材類型
  
  // 保存條件
  storageMode: String,    // 'room' | 'fridge' | 'freezer'
  state: String,          // 'whole' | 'cut' | 'opened' | 'cooked'
  container: String,      // 'none' | 'ziplock' | 'box' | ...
  season: String,         // 'summer' | 'winter' | ...
  locale: String,         // 'TW' | 'JP' | ...
  
  // 庫存管理資訊 (新增)
  quantity: {
    amount: Number,
    unit: String          // '個' | '包' | 'kg' | ...
  },
  purchaseDate: Date,
  location: String,       // 'fridge_main' | 'pantry' | ...
  status: String,         // 'fresh' | 'warning' | 'expired' | 'consumed'
  source: String,         // 'manual' | 'barcode' | 'photo' | ...
  notes: String,
  tags: [String],
  
  // 時間管理
  acquiredAt: Date,       // 加入庫存時間
  purchaseDate: Date,     // 購買日期
  consumedAt: Date,       // 消耗時間
  expiresMinAt: Date,     // 最短保存期限
  expiresMaxAt: Date,     // 最長保存期限
  
  // AI 預測結果
  daysMin: Number,
  daysMax: Number,
  tips: String,
  confidence: Number,
  ruleId: String
}
```

## 🔌 API 架構

### 1. 估算與入庫 API (`/api/estimate`)
**統一的食材處理入口**
- 估算保存期限
- 可選擇直接入庫 (`save: true`)
- 支援條碼掃描和手動輸入

```javascript
POST /api/estimate
{
  // 基本資訊
  barcode?: string,
  manualName?: string,
  itemKey: string,
  storageMode: string,
  state: string,
  container?: string,
  
  // 庫存資訊 (如果要入庫)
  save?: boolean,           // true = 入庫
  quantity?: object,
  purchaseDate?: string,
  location?: string,
  notes?: string,
  tags?: [string]
}
```

### 2. 庫存管理 API (`/api/inventory/*`)
**庫存的 CRUD 操作**
- `/inventory/list` - 取得庫存清單 (已改用 `/api/items`)
- `/inventory/expiring` - 即將到期項目
- `/inventory/stats` - 庫存統計
- `/inventory/:id` - 更新/刪除單一項目
- `/inventory/consume` - 批量標記消耗

### 3. 項目查看 API (`/api/items`)
**統一的項目查詢接口**
```javascript
GET /api/items?userId=default&status=fresh&sortBy=expiresMaxAt&order=asc
```

## 🎨 前端架構

### App.jsx 主要功能
1. **掃描/手動輸入**: 條碼掃描 + 食材識別
2. **智能推論**: 自動填入食材類型和保存建議
3. **一鍵入庫**: 使用 `estimateShelfLife(payload)` 直接估算並入庫

### InventoryView.jsx 庫存管理
1. **庫存總覽**: 統計卡片顯示各種狀態
2. **到期提醒**: 即將到期項目優先顯示  
3. **篩選排序**: 依狀態、到期日等排序
4. **批量操作**: 標記消耗、刪除等

## 🔄 用戶流程整合

### 流程 1: 掃描添加食材
```
條碼掃描 → 商品識別 → AI 推論食材類型 → 設定保存條件 → 點擊"加入庫存" → 調用 estimateShelfLife(save:true) → 自動入庫
```

### 流程 2: 庫存管理
```
切換到"庫存管理"頁面 → 查看所有項目 → 依緊急程度排序 → 處理即將到期項目 → 標記消耗/刪除
```

## 🎯 整合優勢

### ✅ 消除重複
- **統一資料模型**: 只有一個 Item model
- **統一 API 邏輯**: estimate API 處理所有入庫需求
- **一致的資料格式**: 前端不需要處理不同的資料結構

### ✅ 簡化維護  
- **單一真相來源**: 所有食材資料都在 Item collection
- **統一業務邏輯**: 保存期限計算邏輯集中在 estimate API
- **清晰的責任分工**: estimate 負責計算，inventory 負責管理

### ✅ 功能完整
- **智能識別**: 條碼 + AI 推論
- **精確預測**: 多因子保存期限估算
- **完整追蹤**: 從採購到消耗的全生命週期
- **主動提醒**: 到期通知和處理建議

## 🚀 後續擴展方向

1. **AI 圖像識別**: 拍照識別食材種類和數量
2. **智能提醒系統**: 推播通知即將到期項目
3. **烹飪建議**: 基於庫存推薦食譜
4. **購物規劃**: 分析需求，生成購買清單

## 📝 重要變更紀錄

- ❌ 刪除了重複的 `FoodInventory` model
- ✅ 擴展了 `Item` model 包含完整庫存管理欄位
- ✅ 統一使用 `estimate` API 作為入庫入口
- ✅ 整合了前端的 `handleAddToInventory` 邏輯
- ✅ 創建了統一的 `/api/items` 查詢接口

現在系統架構清晰，沒有重複邏輯，功能完整且易於維護！🎉