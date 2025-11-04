const SERVER = import.meta.env.VITE_SERVER_ORIGIN || 'http://localhost:4000';

export async function lookupByBarcode(barcode) {
  const res = await fetch(`${SERVER}/api/lookup?barcode=${encodeURIComponent(barcode)}`);
  if (!res.ok) throw new Error((await res.json().catch(()=>({}))).error || `HTTP ${res.status}`);
  return res.json();
}

// 取得 VAPID 公鑰（供前端轉成 Uint8Array）
export async function getVapidKey() {
  const res = await fetch(`${SERVER}/api/push/public-key`);
  if (!res.ok) throw new Error('cannot get vapid key');
  const { publicKey } = await res.json();
  return publicKey;
}

export async function subscribePush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('此瀏覽器不支援推播');
  }
  const reg = await navigator.serviceWorker.ready;
  const vapidKey = await getVapidKey();
  const applicationServerKey = urlBase64ToUint8Array(vapidKey);
  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
  const res = await fetch(`${SERVER}/api/push/subscribe`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub)
  });
  if (!res.ok) throw new Error('訂閱失敗');
  return await res.json();
}

export async function sendTestPush() {
  const res = await fetch(`${SERVER}/api/push/test`, { method: 'POST' });
  if (!res.ok) throw new Error('測試推播失敗');
  return res.json();
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export async function estimateShelfLife(payload) {
  const res = await fetch(`${SERVER}/api/estimate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error((await res.json().catch(()=>({}))).error || `HTTP ${res.status}`);
  return res.json();
}

export async function lookupOrFallback(code) {
  // 先查本地
  let r = await fetch(`${SERVER}/api/lookup?barcode=${code}`);
  if (r.ok) return r.json();

  // 再去 OFF 查一次，並同時把資料寫回 products
  r = await fetch(`${SERVER}/api/off/lookup?barcode=${code}`);
  if (!r.ok) throw new Error('NOT_FOUND');
  return r.json();
}


