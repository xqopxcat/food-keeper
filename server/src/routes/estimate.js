import { Router } from 'express';
import { evaluateShelfLife } from '../services/shelfLife.js';
import Product from '../models/Product.js';
import Item from '../models/Item.js';

const router = Router();

/**
 * POST /api/estimate
 * body: {
 *   barcode?: string,
 *   manualName?: string,         // 沒條碼時可給
 *   itemKey: string,             // ex: 'Citrus_orange'
 *   storageMode: 'room'|'fridge'|'freezer',
 *   state: 'whole'|'cut'|'opened'|'cooked',
 *   container?: string,
 *   season?: string,             // 預設簡單推 summer/winter 等
 *   locale?: string,             // 'TW'
 *   save?: boolean               // true 的話順便存 Item（可選）
 * }
 */
router.post('/estimate', async (req, res) => {
  const {
    barcode, manualName,
    itemKey, storageMode, state,
    container = 'none', season = 'summer', locale = 'TW',
    save = false
  } = req.body || {};

  if (!itemKey || !storageMode || !state) {
    return res.status(400).json({ error: 'itemKey, storageMode, state required' });
  }

  // 1) 對應商品（若有條碼）
  let name = manualName || null, brand = null;
  if (barcode) {
    const p = await Product.findOne({ barcode }).lean();
    if (p) { name = p.name; brand = p.brand || null; }
  }

  // 2) 評估規則
  const result = await evaluateShelfLife({ itemKey, storageMode, state, container, season, locale });
  if (!result) return res.status(404).json({ error: 'NO_RULE_MATCH' });

  // 3) 算出日期（用 now + daysMin/Max；若 state=opened 可視需求再縮短係數）
  const now = new Date();
  const addDays = (d) => new Date(now.getTime() + d * 24*60*60*1000);
  const expiresMinAt = addDays(result.daysMin || 0);
  const expiresMaxAt = addDays(result.daysMax || 0);

  // 4) 組回傳
  const payload = {
    barcode: barcode || null,
    name, brand,
    itemKey, storageMode, state, container, season, locale,
    daysMin: result.daysMin, daysMax: result.daysMax,
    tips: result.tips, confidence: result.confidence, ruleId: result.ruleId,
    nowISO: now.toISOString(),
    expiresMinAtISO: expiresMinAt.toISOString(),
    expiresMaxAtISO: expiresMaxAt.toISOString()
  };

  // 5) 可選：存檔（入庫）
  if (save) {
    await Item.create({
      userId: '',
      barcode: payload.barcode, name: payload.name, brand: payload.brand,
      itemKey, storageMode, state, container, season, locale,
      acquiredAt: now,
      expiresMinAt, expiresMaxAt,
      daysMin: result.daysMin, daysMax: result.daysMax,
      tips: result.tips, confidence: result.confidence, ruleId: result.ruleId
    });
    payload.saved = true;
  }

  res.json(payload);
});

export default router;
