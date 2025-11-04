import { Router } from 'express';
import fetch from 'node-fetch';
import Product from '../models/Product.js';
const router = Router();

// 單筆查 OFF product API
// GET /api/off/lookup?barcode=471xxxxxxx
router.get('/off/lookup', async (req, res) => {
  const code = (req.query.barcode || '').trim();
  if (!/^\d{13}$/.test(code)) return res.status(400).json({ error: 'bad code' });

  const url = `https://world.openfoodfacts.org/api/v2/product/${code}`;
  const r = await fetch(url);
  if (!r.ok) return res.status(404).json({ error: 'OFF_NOT_FOUND' });
  const j = await r.json();
  const p = j.product;
  if (!p) return res.status(404).json({ error: 'OFF_NOT_FOUND' });

  const doc = {
    barcode: code,
    name: p.product_name || null,
    brand: p.brands || null,
    category: p.categories || null,
    quantity: p.quantity || null,
    country: p.countries || null,
    // 推斷預設 facts（讓你馬上可估算）
    itemKey: null,
    storageMode: null,
    source: 'openfoodfacts',
    off_meta: { lang: p.lang || null }
  };

  // 可在這裡用既有的 inferDefaults() 推斷
  // const { itemKey, storageMode } = inferDefaults(p);
  // doc.itemKey = itemKey; doc.storageMode = storageMode;

  await Product.updateOne({ barcode: code }, { $set: doc }, { upsert: true });
  res.json({ source: 'openfoodfacts', product: doc });
});

export default router;
