import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const SERVER = import.meta.env.VITE_SERVER_ORIGIN || 'http://localhost:4000';

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
  baseQuery: fetchBaseQuery({
    baseUrl: `${SERVER}/api`,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Item', 'Stats', 'ExpiringItems'],
  endpoints: (builder) => ({
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
  }),
});

export const {
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
  
  // 其他
  util: { invalidateTags },
} = foodCoreAPI;
