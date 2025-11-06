# API.js 到 RTK Query 遷移指南

## 📋 概述

這份文件說明如何將 `api.js` 中的傳統 fetch API 遷移到 RTK Query。

## 🚀 已完成的遷移

### 1. Redux Store 設置

已創建並配置：
- `src/redux/store.js` - Redux store 配置
- `src/redux/services/foodCoreAPI.js` - RTK Query API 定義
- `src/main.jsx` - Redux Provider 設置

### 2. RTK Query API 端點

所有原本在 `api.js` 中的函數都已轉換為 RTK Query 端點：

#### 條碼查詢相關
```javascript
// 舊的方式
import { lookupByBarcode } from '../api.js';
const data = await lookupByBarcode(barcode);

// RTK Query 方式
import { useLookupByBarcodeQuery } from '../redux/services/foodCoreAPI';
const { data, isLoading, error } = useLookupByBarcodeQuery(barcode);
```

#### 庫存管理相關
```javascript
// 舊的方式
import { getInventory, updateInventoryItem } from '../api.js';
const inventory = await getInventory(params);
await updateInventoryItem(itemId, updateData);

// RTK Query 方式
import { 
  useGetInventoryQuery, 
  useUpdateInventoryItemMutation 
} from '../redux/services/foodCoreAPI';

const { data: inventory, isLoading } = useGetInventoryQuery(params);
const [updateItem] = useUpdateInventoryItemMutation();
await updateItem({ itemId, updateData }).unwrap();
```

#### 保存期限估算
```javascript
// 舊的方式
import { estimateShelfLife } from '../api.js';
const result = await estimateShelfLife(payload);

// RTK Query 方式
import { useEstimateShelfLifeMutation } from '../redux/services/foodCoreAPI';
const [estimateShelfLife] = useEstimateShelfLifeMutation();
const result = await estimateShelfLife(payload).unwrap();
```

## 🔧 RTK Query 主要優勢

### 1. 自動快取管理
- 相同查詢會自動快取，減少不必要的 API 調用
- 智能的快取失效機制

### 2. 載入狀態管理
```javascript
const { data, isLoading, error, isFetching } = useGetInventoryQuery();

if (isLoading) return <div>載入中...</div>;
if (error) return <div>錯誤: {error.message}</div>;
```

### 3. 自動重新取得資料
```javascript
// 當庫存更新後，相關查詢會自動重新取得資料
const [updateItem] = useUpdateInventoryItemMutation();
await updateItem(data).unwrap(); 
// 這會自動觸發 useGetInventoryQuery 和 useGetInventoryStatsQuery 重新取得資料
```

### 4. 標籤系統
```javascript
// API 定義中的標籤系統
tagTypes: ['Item', 'Stats', 'ExpiringItems'],

// 變更操作會使相關標籤失效
invalidatesTags: ['Item', 'Stats', 'ExpiringItems'],
```

## 📂 檔案結構

```
src/
├── redux/
│   ├── store.js                    # Redux store 配置
│   └── services/
│       └── foodCoreAPI.js          # RTK Query API 定義
├── pages/
│   ├── ScannerView.jsx             # 原始版本
│   ├── ScannerViewRTK.jsx          # RTK Query 版本
│   ├── InventoryView.jsx           # 原始版本
│   └── InventoryViewRTK.jsx        # RTK Query 版本
└── api.js                          # 舊的 API (可以保留用於參考)
```

## 🎯 使用方式

### 查詢 (Query)
```javascript
// 自動執行查詢
const { data, isLoading, error } = useGetInventoryQuery(params);

// 手動觸發查詢
const [trigger, { data, isLoading }] = useLazyLookupByBarcodeQuery();
trigger(barcode);
```

### 變更 (Mutation)
```javascript
const [updateItem, { isLoading, error }] = useUpdateInventoryItemMutation();

const handleUpdate = async () => {
  try {
    const result = await updateItem({ itemId, updateData }).unwrap();
    console.log('更新成功:', result);
  } catch (error) {
    console.error('更新失敗:', error);
  }
};
```

## 🔄 完整遷移步驟

### 1. 更新組件導入
```javascript
// 移除舊的 API 導入
// import { getInventory } from '../api.js';

// 添加 RTK Query hooks
import { useGetInventoryQuery } from '../redux/services/foodCoreAPI';
```

### 2. 替換狀態管理
```javascript
// 移除手動狀態管理
// const [inventory, setInventory] = useState([]);
// const [loading, setLoading] = useState(false);

// 使用 RTK Query
const { data: inventory, isLoading } = useGetInventoryQuery(params);
```

### 3. 替換 API 調用
```javascript
// 移除手動 API 調用
// const loadData = async () => {
//   setLoading(true);
//   try {
//     const data = await getInventory(params);
//     setInventory(data.items);
//   } catch (error) {
//     setError(error.message);
//   } finally {
//     setLoading(false);
//   }
// };

// RTK Query 自動處理所有這些邏輯
```

## 🧪 測試 RTK Query 版本

1. 啟動開發服務器：`npm run dev`
2. 訪問 RTK Query 版本的頁面：
   - 掃描器：`/scanner-rtk`
   - 庫存管理：`/inventory-rtk`
3. 比較與原版本的功能和性能差異

## 📝 注意事項

1. **錯誤處理**：RTK Query 的錯誤格式可能與原本不同
2. **載入狀態**：使用 `isLoading` 而不是自定義的載入狀態
3. **重新取得資料**：依賴 RTK Query 的自動快取管理，而不是手動重新載入
4. **類型安全**：可以考慮添加 TypeScript 來獲得更好的類型安全

## 🎉 遷移完成後的好處

- ✅ 減少樣板代碼（boilerplate code）
- ✅ 自動快取和狀態管理
- ✅ 更好的開發者體驗
- ✅ 統一的錯誤處理
- ✅ 自動的載入狀態管理
- ✅ 智能的資料重新取得機制