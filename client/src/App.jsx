import React, { useState, useEffect } from 'react';
import BarcodeScanner from './components/BarcodeScanner.jsx';
import { lookupByBarcode, subscribePush, sendTestPush } from './api.js';
import { ean13CheckDigit, isValidEan13, normalizeToEan13 } from './utils/ean.js';
import { estimateShelfLife } from './api.js';
import { inferItemKeyFromName } from './itemKeyMap.js';
import { inferDefaultsFromProduct } from './inferDefaults.js';


export default function App() {
  const [barcode, setBarcode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [pushOK, setPushOK] = useState(false);
  
  const [facts, setFacts] = useState({ itemKey:'', storageMode:'fridge', state:'whole', container:'none', season:'summer', locale:'TW' });
  const [estimate, setEstimate] = useState(null);
  
  const [manualInput, setManualInput] = useState('');
  const [calcOutput, setCalcOutput] = useState('');
  const [validateMsg, setValidateMsg] = useState('');
  
  
  useEffect(() => {
    if (result?.product) {
      const d = inferDefaultsFromProduct(result.product);
      if (d) {
        setFacts(f => ({
          ...f,
          itemKey: d.itemKey,
          storageMode: d.storageMode,
          state: d.state,
          container: d.container
        }));
      }
    }
  }, [result]);
  
  useEffect(() => {
    if (result?.product) {
      const guess = inferItemKeyFromName(result.product.name || '');
      setFacts(f => ({ ...f, itemKey: guess || f.itemKey }));
    }
  }, [result]);
  
  async function handleEstimate(save = false) {
    if (!facts.itemKey) { alert('請選擇食材種類'); return; }
    try {
      const payload = {
        barcode,
        manualName: result?.product?.name,
        ...facts,
        save
      };
      const data = await estimateShelfLife(payload);
      setEstimate(data);
    } catch (e) {
      alert(e?.message || '估算失敗');
    }
  }

  async function handleDetected(code) {
    await queryBarcode(code);
  }

  async function queryBarcode(code) {
    setBarcode(code); setResult(null); setError(null); setLoading(true);
    try {
      const data = await lookupByBarcode(code);
      setResult(data);
    } catch (e) {
      setError(e?.message || '查詢失敗');
    } finally {
      setLoading(false);
    }
  }

  async function enablePush() {
    try { await subscribePush(); setPushOK(true); alert('推播訂閱成功'); }
    catch (e) { alert(e?.message || '推播訂閱失敗'); }
  }

  // 手動：計算校驗碼（輸入 12 碼）
  function handleCalc() {
    try {
      const clean = manualInput.replace(/\D/g, '').slice(0, 12);
      if (clean.length !== 12) throw new Error('請先輸入 12 位數字');
      const cd = ean13CheckDigit(clean);
      const full = clean + cd;
      setCalcOutput(full);
      setValidateMsg(`✅ 13 碼：${full}（校驗碼 = ${cd}）`);
    } catch (e) {
      setValidateMsg(`❌ ${e.message}`);
      setCalcOutput('');
    }
  }

  // 手動：驗證 13 碼
  function handleValidate() {
    const clean = manualInput.replace(/\D/g, '').slice(0, 13);
    if (clean.length !== 13) { setValidateMsg('請輸入 13 位數字'); return; }
    setValidateMsg(isValidEan13(clean) ? '✅ 校驗碼正確' : '❌ 校驗碼錯誤');
    setCalcOutput(clean);
  }

  // 手動：直接查詢（可輸入 12 或 13 碼）
  async function handleQueryManual() {
    try {
      const clean = manualInput.replace(/\D/g, '');
      const ean13 = normalizeToEan13(clean);
      setValidateMsg(isValidEan13(ean13) ? '✅ 校驗碼正確' : '❌ 校驗碼錯誤');
      setCalcOutput(ean13);
      await queryBarcode(ean13);
    } catch (e) {
      setValidateMsg(`❌ ${e.message}`);
    }
  }
  
  const readyForEstimate = !!facts.itemKey && !!facts.storageMode;

  return (
    <div style={{ padding:16, fontFamily:'ui-sans-serif, system-ui' }}>
      <h1>Food Keeper（Web, JS）</h1>

      {/* 推播控制 */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        <button onClick={enablePush}>啟用推播</button>
        <button onClick={sendTestPush} disabled={!pushOK}>發送測試推播</button>
      </div>

      {/* 手動輸入條碼（12 或 13 碼） */}
      <div style={{ marginTop:16, padding:12, border:'1px solid #eee', borderRadius:8 }}>
        <h3>手動輸入條碼（支援 12/13 碼）</h3>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <input
            value={manualInput}
            onChange={e => setManualInput(e.target.value.replace(/\D/g,'').slice(0,13))}
            placeholder="輸入 12 或 13 位數字"
            inputMode="numeric"
            style={{ padding:'8px 10px', border:'1px solid #ccc', borderRadius:6, width:240 }}
          />
          <button onClick={handleCalc}>計算校驗碼（12 碼 → 13 碼）</button>
          <button onClick={handleValidate}>驗證 13 碼</button>
          <button onClick={handleQueryManual}>查詢此條碼</button>
        </div>
        <div style={{ marginTop:8, color:'#333' }}>
          {validateMsg && <div>{validateMsg}</div>}
          {calcOutput && <div>建議查詢的 13 碼：<b>{calcOutput}</b></div>}
        </div>
      </div>

      {/* 相機掃碼區 */}
      {!barcode && (
        <div style={{ marginTop:16 }}>
          <BarcodeScanner onDetected={handleDetected} />
        </div>
      )}

      {/* 查詢結果 */}
      {barcode && (
        <div style={{ marginTop:16 }}>
          <div>掃描/查詢到的條碼：<b>{barcode}</b></div>
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
      {/* 保存情境（規則需要的 facts） */}
      <div style={{ marginTop:12 }}>
        <h3>保存情境</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(160px,1fr))', gap:8 }}>
          <label>
            食材種類 (itemKey)
            <select value={facts.itemKey} onChange={e => setFacts(f => ({ ...f, itemKey: e.target.value }))}>
              <option value="">請選擇/或自動推斷</option>
              <option value="Citrus_orange">橘子 / Orange</option>
              <option value="Pasta">義大利麵 / Pasta</option>
              <option value="Instant_noodle">泡麵 / Instant Noodle</option>
              <option value="Garlic_bulb">蒜頭 / Garlic</option>
              <option value="Apple">蘋果 / Apple</option>
              <option value="Banana">香蕉 / Banana</option>
              <option value="Milk">鮮奶 / Milk</option>
              <option value="Chicken_meat">雞肉 / Chicken</option>
              {/* 依你的 rules.json 擴充 */}
            </select>
          </label>

          <label>
            保存方式 (storageMode)
            <select value={facts.storageMode} onChange={e => setFacts(f => ({ ...f, storageMode: e.target.value }))}>
              <option value="room">室溫</option>
              <option value="fridge">冷藏</option>
              <option value="freezer">冷凍</option>
            </select>
          </label>

          <label>
            狀態 (state)
            <select value={facts.state} onChange={e => setFacts(f => ({ ...f, state: e.target.value }))}>
              <option value="whole">完整</option>
              <option value="cut">切開</option>
              <option value="opened">開封</option>
              <option value="cooked">熟食</option>
            </select>
          </label>

          <label>
            容器 (container)
            <select value={facts.container} onChange={e => setFacts(f => ({ ...f, container: e.target.value }))}>
              <option value="none">無</option>
              <option value="ziplock">夾鏈袋</option>
              <option value="box">保鮮盒</option>
              <option value="paper_bag">紙袋</option>
            </select>
          </label>
        </div>

        <div style={{ display:'flex', gap:8, marginTop:10 }}>
          <button onClick={() => handleEstimate(false)} disabled={!readyForEstimate}>
            估算保存期限
          </button>

          {!readyForEstimate && (
            <div style={{ marginTop: 6, color: '#b45309' }}>
              無法自動判斷食材類型，請手動選擇「食材種類」與「保存方式」後再估算。
            </div>
          )}
          <button onClick={() => handleEstimate(true)}>估算並入庫</button>
        </div>

        {estimate && (
          <div style={{ marginTop:10, padding:10, border:'1px dashed #aaa', borderRadius:8 }}>
            <div><b>估算天數：</b>{estimate.daysMin}–{estimate.daysMax} 天（信心 {Math.round(estimate.confidence*100)}%）</div>
            <div><b>建議：</b>{estimate.tips || '—'}</div>
            <div><b>入庫時間：</b>{new Date(estimate.nowISO).toLocaleString()}</div>
            <div><b>到期（Min）：</b>{new Date(estimate.expiresMinAtISO).toLocaleDateString()}</div>
            <div><b>到期（Max）：</b>{new Date(estimate.expiresMaxAtISO).toLocaleDateString()}</div>
          </div>
        )}
      </div>
    </div>
  );
}
