// server/scripts/ingest_off.js
// 拉取 Open Food Facts（OFF）資料 → 驗證 EAN13 → 推斷 itemKey/storageMode → 寫入 Mongo
import 'dotenv/config';
import mongoose from 'mongoose';
import fetch from 'node-fetch';
import Product from '../src/models/Product.js';

// --- 新增在檔案上方 ---
const TAIWAN_PREFIXES = ['471']; // GS1 Taiwan
const MAX_PAGES = 200;           // 可酌量放大
const PAGE_SIZE = 200;

function isTaiwanGTIN(code) {
  return TAIWAN_PREFIXES.some(p => code.startsWith(p));
}

// --- 1) EAN-13 檢驗 ---
function ean13CheckDigit(d12) {
  const ds = d12.split('').map(Number);
  const sumOdd  = ds[0] + ds[2] + ds[4] + ds[6] + ds[8] + ds[10];
  const sumEven = ds[1] + ds[3] + ds[5] + ds[7] + ds[9] + ds[11];
  const s = sumOdd + sumEven * 3;
  return (10 - (s % 10)) % 10;
}
function isValidEan13(code) {
  return /^\d{13}$/.test(code) && ean13CheckDigit(code.slice(0,12)) === Number(code[12]);
}

// --- 2) itemKey/storageMode 映射（可持續擴充） ---
const MAPS = [
  { test: /milk|牛奶|鮮奶/i, itemKey: 'Milk', storageMode: 'fridge' },
  { test: /yogurt|優格/i, itemKey: 'Yogurt', storageMode: 'fridge' },
  { test: /cheese|起司|乳酪/i, itemKey: 'Cheese', storageMode: 'fridge' },
  { test: /bread|麵包/i, itemKey: 'Bread', storageMode: 'room' },
  { test: /rice|白米|米/i, itemKey: 'Rice_uncooked', storageMode: 'room' },
  { test: /pasta|義大利麵/i, itemKey: 'Pasta', storageMode: 'room' },
  { test: /instant.*noodle|泡麵|方便麵|拉麵|cup\s*noodle/i, itemKey: 'Instant_noodle', storageMode: 'room' },
  { test: /chicken|雞/i, itemKey: 'Chicken_meat', storageMode: 'fridge' },
  { test: /pork|豬/i,    itemKey: 'Pork_meat', storageMode: 'fridge' },
  { test: /beef|牛肉/i,  itemKey: 'Beef_meat', storageMode: 'fridge' },
  { test: /tofu|豆腐/i,  itemKey: 'Tofu', storageMode: 'fridge' },
  { test: /butter|奶油/i, itemKey: 'Butter', storageMode: 'fridge' },
  { test: /soy.*sauce|醬油/i, itemKey: 'Soy_sauce', storageMode: 'room' },
  { test: /vinegar|醋/i, itemKey: 'Vinegar', storageMode: 'room' },
  { test: /oil|橄欖油|食用油/i, itemKey: 'Cooking_oil', storageMode: 'room' },
  // 你可再把水果、蔬菜逐步補上
];
function inferDefaults(p) {
  const hay = [p.product_name, p.categories, p.brands, p.generic_name].filter(Boolean).join(' ');
  for (const r of MAPS) if (r.test.test(hay)) return { itemKey: r.itemKey, storageMode: r.storageMode };
  return { itemKey: null, storageMode: null };
}

// --- 4) 寫入 Mongo（去重、保留來源） ---
async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Mongo connected');

  let seen = 0, kept = 0, skippedBad = 0, upserted = 0;

  // 用多種條件去拉，避免 countries 標記不一致
  const queries = [
    { countries: 'Taiwan' },
    { countries: '台灣' },
    { countries: 'Taiwan, Province of China' },
    { countries: '' } // 全量掃一部分，靠前綴再過濾
  ];

  for (const q of queries) {
    let emptyPages = 0;
    for (let page = 1; page <= MAX_PAGES; page++) {
      const url = `${OFF_BASE}?countries=${encodeURIComponent(q.countries)}&page=${page}&page_size=${PAGE_SIZE}`
        + `&fields=code,product_name,brands,categories,countries,quantity,packaging,lang,lang_code`;
      const res = await fetch(url);
      if (!res.ok) break;
      const json = await res.json();
      const list = json.products || [];
      if (list.length === 0) { emptyPages++; if (emptyPages >= 2) break; else continue; }

      for (const p of list) {
        const code = (p.code || '').trim();
        seen++;
        if (!/^\d{13}$/.test(code) || !isValidEan13(code)) { skippedBad++; continue; }
        if (!isTaiwanGTIN(code)) continue; // ★ 只保留 471 開頭

        const { itemKey, storageMode } = inferDefaults(p);
        const doc = {
          barcode: code,
          name: p.product_name || null,
          brand: p.brands || null,
          category: p.categories || null,
          quantity: p.quantity || null,
          country: p.countries || null,
          itemKey, storageMode,
          source: 'openfoodfacts',
          off_meta: { lang: p.lang_code || p.lang || null }
        };
        kept++;

        const r = await Product.updateOne(
          { barcode: code },
          { $set: doc },
          { upsert: true }
        );
        if (r.upsertedCount || r.modifiedCount) upserted++;
      }
      console.log(`[OFF][${q.countries||'ALL'}] page=${page} seen=${seen} kept=${kept} skippedBad=${skippedBad} upserted=${upserted}`);
    }
  }

  console.log('Done. seen=%d kept=%d skipped_bad=%d upserted=%d', seen, kept, skippedBad, upserted);
  await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
