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

export const subscribeCoreAPI = createApi({
  reducerPath: 'subscribeCoreAPI',
  baseQuery: fetchBaseQuery({
    baseUrl: `${SERVER}/api`,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  endpoints: (builder) => ({

    // 推播通知相關 API

    // 取得 VAPID 公鑰
    getVapidKey: builder.query({
      query: () => 'push/public-key',
      transformResponse: (response) => response.publicKey,
    }),

    // 訂閱推播
    subscribePush: builder.mutation({
      queryFn: async (_, _queryApi, _extraOptions, fetchWithBQ) => {
        try {
          if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            throw new Error('此瀏覽器不支援推播');
          }

          const reg = await navigator.serviceWorker.ready;
          
          // 取得 VAPID 金鑰
          const vapidResult = await fetchWithBQ('push/public-key');
          if (vapidResult.error) throw new Error('cannot get vapid key');
          
          const applicationServerKey = urlBase64ToUint8Array(vapidResult.data.publicKey);
          const sub = await reg.pushManager.subscribe({ 
            userVisibleOnly: true, 
            applicationServerKey 
          });
          
          // 提交訂閱
          const subscribeResult = await fetchWithBQ({
            url: 'push/subscribe',
            method: 'POST',
            body: sub,
          });
          
          if (subscribeResult.error) throw new Error('訂閱失敗');
          return { data: subscribeResult.data };
          
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message } };
        }
      },
    }),

    // 發送測試推播
    sendTestPush: builder.mutation({
      query: () => ({
        url: 'push/test',
        method: 'POST',
      }),
    }),
  }),
});

export const {
  useGetVapidKeyQuery,
  useSubscribePushMutation,
  useSendTestPushMutation,
} = subscribeCoreAPI;
