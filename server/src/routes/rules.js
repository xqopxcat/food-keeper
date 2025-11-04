import { Router } from 'express';
import { evaluateShelfLife } from '../services/shelfLife.js';
const router = Router();

/**
 * POST /api/rules/evaluate
 * body: { itemKey, storageMode, state, container, season, locale }
 */
router.post('/rules/evaluate', async (req, res) => {
  const facts = req.body || {};
  const result = await evaluateShelfLife({
    itemKey: facts.itemKey,
    storageMode: facts.storageMode || 'fridge',
    state: facts.state || 'whole',
    container: facts.container || 'none',
    season: facts.season || 'summer',
    locale: facts.locale || 'TW'
  });
  if (!result) return res.status(404).json({ error: 'NO_RULE_MATCH' });
  res.json(result);
});

export default router;
