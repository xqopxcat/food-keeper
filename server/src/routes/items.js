import { Router } from 'express';
import Item from '../models/Item.js';

const router = Router();

// 取得所有項目（包含庫存和已消耗的）
router.get('/', async (req, res) => {
  try {
    const { 
      userId = '',
      status,
      sortBy = 'createdAt',
      order = 'desc',
      limit = 50
    } = req.query;

    const filter = { userId };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;
    
    const items = await Item
      .find(filter)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .lean();
    // 添加計算欄位
    const itemsWithCalculated = items.map(item => {
      const daysLeft = item.expiresMaxAt ? 
        Math.ceil((new Date(item.expiresMaxAt) - new Date()) / (1000 * 60 * 60 * 24)) : null;
      
      let urgency = 'unknown';
      if (daysLeft !== null) {
        if (daysLeft < 0) urgency = 'expired';
        else if (daysLeft <= 1) urgency = 'urgent';
        else if (daysLeft <= 3) urgency = 'warning';
        else urgency = 'safe';
      }

      return {
        ...item,
        daysLeft,
        urgency
      };
    });

    res.json({
      success: true,
      items: itemsWithCalculated,
      total: itemsWithCalculated.length
    });

  } catch (error) {
    console.error('取得項目失敗:', error);
    res.status(500).json({ 
      error: '取得項目失敗', 
      details: error.message 
    });
  }
});

export default router;