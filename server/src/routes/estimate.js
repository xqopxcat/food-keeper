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
router.post('/', async (req, res) => {
  const {
    barcode, manualName,
    itemKey, storageMode, state,
    container = 'none', season = 'summer', locale = 'TW',
    save = false,
    // 新增的庫存管理欄位
    quantity, purchaseDate, location, source = 'manual', notes, tags
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

  // 3) 算出日期（以 purchaseDate 為基準，若無則用當前時間）
  const now = new Date();
  const baseDate = purchaseDate ? new Date(purchaseDate) : now;
  const addDays = (d) => new Date(baseDate.getTime() + d * 24*60*60*1000);
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
    baseDateISO: baseDate.toISOString(), // 計算基準日期
    expiresMinAtISO: expiresMinAt.toISOString(),
    expiresMaxAtISO: expiresMaxAt.toISOString(),
    usingPurchaseDate: !!purchaseDate // 是否使用了購買日期
  };

  // 5) 可選：存檔（入庫）
  if (save) {
    const itemData = {
      userId: '', // 暫時使用 ''
      barcode: payload.barcode, 
      name: payload.name, 
      brand: payload.brand,
      itemKey, storageMode, state, container, season, locale,
      acquiredAt: now,
      expiresMinAt, expiresMaxAt,
      daysMin: result.daysMin, 
      daysMax: result.daysMax,
      tips: result.tips, 
      confidence: result.confidence, 
      ruleId: result.ruleId,
      // 新增庫存欄位
      quantity: quantity || { amount: 1, unit: '個' },
      purchaseDate: purchaseDate ? new Date(purchaseDate) : now,
      location: location || 'fridge_main',
      source: barcode ? 'barcode' : source,
      notes: notes || '',
      tags: tags || []
    };
    
    const savedItem = await Item.create(itemData);
    payload.saved = true;
    payload.itemId = savedItem._id;
  }

  res.json(payload);
});

export default router;
