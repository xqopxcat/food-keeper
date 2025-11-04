import { Router } from 'express';
import Product from '../models/Product.js';
const router = Router();

router.get('/lookup', async (req, res) => {
  const barcode = (req.query.barcode || '').trim();
  if (!barcode) return res.status(400).json({ error: 'barcode required' });
  const product = await Product.findOne({ barcode }).lean();
  if (product) return res.json({ source: 'mongo', product });
  return res.status(404).json({ error: 'NOT_FOUND' });
});

export default router;
