import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const SERVER = import.meta.env.VITE_SERVER_ORIGIN || 'http://localhost:4000';

// 全局登出函數引用
let globalLogout = null;

export const setRTKGlobalLogout = (logoutFn) => {
  globalLogout = logoutFn;
};

// 創建自定義 baseQuery 來處理認證錯誤
const baseQueryWithAuth = fetchBaseQuery({
  baseUrl: `${SERVER}/api`,
  prepareHeaders: (headers, { getState, endpoint }) => {
    // 獲取 token
    const token = localStorage.getItem('token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    // 對於檔案上傳的端點，不設置 Content-Type，讓瀏覽器自動設置
    const formDataEndpoints = ['identifyFoodItemsFile', 'extractTextFromImageFile', 'batchIdentifyFoodItems'];
    if (!formDataEndpoints.includes(endpoint)) {
      headers.set('Content-Type', 'application/json');
    }
    return headers;
  },
});

const baseQueryWithLogout = async (args, api, extraOptions) => {
  let result = await baseQueryWithAuth(args, api, extraOptions);
  
  if (result.error && result.error.status === 401) {
    console.log('收到 401 未授權響應，執行自動登出');
    if (globalLogout) {
      globalLogout();
    }
  }
  
  return result;
};

// 輔助函數
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export const foodCoreAPI = createApi({
  reducerPath: 'foodCoreAPI',
  baseQuery: baseQueryWithLogout,
  tagTypes: ['Item', 'Stats', 'ExpiringItems'],
  endpoints: (builder) => ({
    getUserProfile: builder.query({
      query: () => 'auth/me',
    }),
    
    // 條碼查詢
    lookupByBarcode: builder.query({
      query: (barcode) => `lookup?barcode=${encodeURIComponent(barcode)}`,
    }),

    // 備用查詢（本地 + Open Food Facts）
    lookupOrFallback: builder.query({
      queryFn: async (code, _queryApi, _extraOptions, fetchWithBQ) => {
        // 先查本地
        let result = await fetchWithBQ(`lookup?barcode=${code}`);
        if (result.data) return { data: result.data };

        // 再去 OFF 查一次
        result = await fetchWithBQ(`off/lookup?barcode=${code}`);
        if (result.error) return { error: { status: 'NOT_FOUND', error: 'NOT_FOUND' } };
        return { data: result.data };
      },
    }),

    // 保存期限估算
    estimateShelfLife: builder.mutation({
      query: (payload) => ({
        url: 'estimate',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: (result) => {
        // 如果有保存到庫存，則使相關標籤失效
        return result?.saved ? ['Item', 'Stats'] : [];
      },
    }),

    // 庫存管理 API

    // 取得庫存列表（使用統一的 items 端點）
    getInventory: builder.query({
      query: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return `items?${queryString}`;
      },
      providesTags: ['Item'],
    }),

    // 取得即將到期的項目
    getExpiringItems: builder.query({
      query: (days = 3) => `inventory/expiring?days=${days}`,
      providesTags: ['ExpiringItems'],
    }),

    // 取得庫存統計
    getInventoryStats: builder.query({
      query: () => 'inventory/stats',
      providesTags: ['Stats'],
    }),

    // 更新庫存項目
    updateInventoryItem: builder.mutation({
      query: ({ itemId, updateData }) => ({
        url: `inventory/${itemId}`,
        method: 'PUT',
        body: updateData,
      }),
      invalidatesTags: ['Item', 'Stats', 'ExpiringItems'],
    }),

    // 刪除庫存項目
    deleteInventoryItem: builder.mutation({
      query: (itemId) => ({
        url: `inventory/${itemId}?userId=`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Item', 'Stats', 'ExpiringItems'],
    }),

    // 批量消耗項目
    consumeItems: builder.mutation({
      query: (itemIds) => ({
        url: 'inventory/consume',
        method: 'POST',
        body: { itemIds },
      }),
      invalidatesTags: ['Item', 'Stats', 'ExpiringItems'],
    }),

    // 新增庫存項目（直接使用 inventory/add）
    addInventoryItem: builder.mutation({
      query: (itemData) => ({
        url: 'inventory/add',
        method: 'POST',
        body: itemData,
      }),
      invalidatesTags: ['Item', 'Stats'],
    }),

    // AI 物品識別相關 API

    // AI 物品識別 - 使用 base64 圖片
    identifyFoodItems: builder.mutation({
      query: ({ imageBase64, options = {} }) => ({
        url: 'ai/identify',
        method: 'POST',
        body: { imageBase64, options },
      }),
    }),

    // AI 物品識別 - 使用 FormData (檔案上傳)
    identifyFoodItemsFile: builder.mutation({
      query: ({ file, options = {} }) => {
        const formData = new FormData();
        formData.append('image', file);
        if (Object.keys(options).length > 0) {
          formData.append('options', JSON.stringify(options));
        }
        return {
          url: 'ai/identify',
          method: 'POST',
          body: formData,
        };
      },
    }),

    // AI OCR 文字識別
    extractTextFromImage: builder.mutation({
      query: ({ imageBase64 }) => ({
        url: 'ai/ocr',
        method: 'POST',
        body: { imageBase64 },
      }),
    }),

    // AI OCR 文字識別 - 使用檔案
    extractTextFromImageFile: builder.mutation({
      query: ({ file }) => {
        const formData = new FormData();
        formData.append('image', file);
        return {
          url: 'ai/ocr',
          method: 'POST',
          body: formData,
        };
      },
    }),

    // 批量 AI 識別
    batchIdentifyFoodItems: builder.mutation({
      query: ({ files, options = {} }) => {
        const formData = new FormData();
        files.forEach(file => formData.append('images', file));
        if (Object.keys(options).length > 0) {
          formData.append('options', JSON.stringify(options));
        }
        return {
          url: 'ai/batch-identify',
          method: 'POST',
          body: formData,
        };
      },
    }),

    // 檢查 AI 服務狀態
    getAiStatus: builder.query({
      query: () => 'ai/status',
    }),
  }),
});

export const {
  useGetUserProfileQuery,
  useLazyGetUserProfileQuery,
  useLookupByBarcodeQuery,
  useLazyLookupByBarcodeQuery,
  useLookupOrFallbackQuery,
  useLazyLookupOrFallbackQuery,
  useGetInventoryQuery,
  useGetExpiringItemsQuery,
  useGetInventoryStatsQuery,
  
  useEstimateShelfLifeMutation,
  useUpdateInventoryItemMutation,
  useDeleteInventoryItemMutation,
  useConsumeItemsMutation,
  useAddInventoryItemMutation,
  
  // AI 識別相關 hooks
  useIdentifyFoodItemsMutation,
  useIdentifyFoodItemsFileMutation,
  useExtractTextFromImageMutation,
  useExtractTextFromImageFileMutation,
  useBatchIdentifyFoodItemsMutation,
  useGetAiStatusQuery,
  
  // 其他
  util: { invalidateTags },
} = foodCoreAPI;
