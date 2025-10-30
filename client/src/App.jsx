import React, { useState } from 'react';
import BarcodeScanner from './components/BarcodeScanner.jsx';
import { lookupByBarcode, subscribePush, sendTestPush } from './api.js';

export default function App() {
  const [barcode, setBarcode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [pushOK, setPushOK] = useState(false);

  async function handleDetected(code) {
    setBarcode(code); setResult(null); setError(null); setLoading(true);
    try { setResult(await lookupByBarcode(code)); } 
    catch (e) { setError(e?.message || '查詢失敗'); } 
    finally { setLoading(false); }
  }

  async function enablePush() {
    try { await subscribePush(); setPushOK(true); alert('推播訂閱成功'); }
    catch (e) { alert(e?.message || '推播訂閱失敗'); }
  }

  return (
    <div style={{ padding:16, fontFamily:'ui-sans-serif, system-ui' }}>
      <h1>Food Keeper（Web, JS）</h1>

      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        <button onClick={enablePush}>啟用推播</button>
        <button onClick={sendTestPush} disabled={!pushOK}>發送測試推播</button>
      </div>

      {!barcode && <div style={{ marginTop:16 }}><BarcodeScanner onDetected={handleDetected} /></div>}

      {barcode && (
        <div style={{ marginTop:16 }}>
          <div>掃描到的條碼：<b>{barcode}</b></div>
          {loading && <div style={{ marginTop:8 }}>查詢商品資料中…</div>}
          {error && <div style={{ marginTop:8, color:'crimson' }}>查詢失敗：{error}</div>}
          {result && (
            <div style={{ marginTop:12, padding:12, border:'1px solid #ddd', borderRadius:8 }}>
              <div><b>來源：</b>{result.source}</div>
              <div><b>品名：</b>{result.product?.name}</div>
              <div><b>品牌：</b>{result.product?.brand || '-'}</div>
              <div><b>數量：</b>{result.product?.quantity || '-'}</div>
              <button style={{ marginTop:12 }} onClick={() => { setBarcode(null); setResult(null); setError(null); }}>掃下一個</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
