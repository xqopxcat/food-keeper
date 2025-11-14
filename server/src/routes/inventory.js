import { Router } from 'express';
import Item from '../models/Item.js';
import { evaluateShelfLife } from '../services/shelfLife.js';

const router = Router();

// 新增食材到庫存
router.post('/add', async (req, res) => {
  try {
    const {
      userId = '', // 暫時使用''之後可以改成真實的用戶認證
      itemKey,
      name,
      brand,
      quantity,
      purchaseDate,
      expirationDate, // 新增：包裝上標示的到期日
      storageMode,
      state = 'whole',
      container = 'none',
      location,
      source = 'manual',
      notes,
    } = req.body;

    // 驗證必要欄位
    if (!itemKey || !name) {
      return res.status(400).json({ 
        error: 'itemKey 和 name 為必填欄位' 
      });
    }

    // 使用現有的保存期限估算服務
    const result = await evaluateShelfLife({ 
      itemKey, 
      storageMode, 
      state, 
      container, 
      season: 'summer', 
      locale: 'TW' 
    });

    if (!result) {
      return res.status(404).json({ 
        error: '找不到對應的保存期限規則' 
      });
    }

    // 計算到期日期
    const now = new Date();
    const purchaseDateTime = purchaseDate ? new Date(purchaseDate) : now;
    
    let expiresMinAt, expiresMaxAt;
    
    if (expirationDate) {
      // 如果有包裝標示的到期日，則以此為準
      const expDate = new Date(expirationDate);
      expiresMinAt = expDate;
      expiresMaxAt = expDate;
      console.log(`使用包裝標示到期日: ${expDate.toISOString()}`);
    } else {
      // 沒有包裝到期日，則根據規則計算
      const addDays = (d) => new Date(purchaseDateTime.getTime() + d * 24*60*60*1000);
      expiresMinAt = addDays(result.daysMin || 0);
      expiresMaxAt = addDays(result.daysMax || 0);
      console.log(`根據規則計算到期日: ${expiresMinAt.toISOString()} ~ ${expiresMaxAt.toISOString()}`);
    }

    // 創建庫存項目
    const inventoryItem = new Item({
      userId,
      itemKey,
      name,
      brand,
      quantity: quantity || { amount: 1, unit: '個' },
      purchaseDate: purchaseDateTime,
      storageMode,
      state,
      container,
      location,
      source,
      notes,
      // 保存期限相關
      acquiredAt: now,
      expiresMinAt,
      expiresMaxAt,
      daysMin: result.daysMin,
      daysMax: result.daysMax,
      tips: result.tips,
      confidence: result.confidence,
      ruleId: result.ruleId,
      season: 'summer',
      locale: 'TW',
      // 包裝標示到期日（如果有的話）
      ...(expirationDate && { expirationDate: new Date(expirationDate) })
    });

    const saved = await inventoryItem.save();
    
    res.json({
      success: true,
      item: saved,
      estimate: {
        confidence: result.confidence,
        shelfLifeDays: {
          min: result.daysMin,
          max: result.daysMax
        },
        tips: result.tips,
        // 指示是否使用了包裝到期日
        usedPackageExpiration: !!expirationDate,
        expirationSource: expirationDate ? 'package' : 'calculated'
      }
    });

  } catch (error) {
    console.error('新增庫存失敗:', error);
    res.status(500).json({ 
      error: '新增庫存失敗', 
      details: error.message 
    });
  }
});

// 取得用戶所有庫存
router.get('/list', async (req, res) => {
  try {
    const { 
      userId = '',
      status,
      sortBy = 'expiryDate',
      order = 'asc'
    } = req.query;

    const filter = { userId };
    if (status) {
      filter.status = status;
    }

    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;

    const items = await Item
      .find(filter)
      .sort(sortOptions)
      .lean();

    // 添加虛擬欄位
    const itemsWithVirtuals = items.map(item => ({
      ...item,
      daysLeft: item.expiresMaxAt ? 
        Math.ceil((new Date(item.expiresMaxAt) - new Date()) / (1000 * 60 * 60 * 24)) : null,
      urgency: (() => {
        if (!item.expiresMaxAt) return 'unknown';
        const daysLeft = Math.ceil((new Date(item.expiresMaxAt) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) return 'expired';
        if (daysLeft <= 1) return 'urgent';
        if (daysLeft <= 3) return 'warning';
        return 'safe';
      })()
    }));

    res.json({
      success: true,
      items: itemsWithVirtuals,
      total: itemsWithVirtuals.length
    });

  } catch (error) {
    console.error('取得庫存失敗:', error);
    res.status(500).json({ 
      error: '取得庫存失敗', 
      details: error.message 
    });
  }
});

// 取得即將到期的食材
router.get('/expiring', async (req, res) => {
  try {
    const { 
      userId = '',
      days = 3 
    } = req.query;

    const items = await Item.getExpiringItems(userId, parseInt(days));
    
    res.json({
      success: true,
      expiringItems: items,
      count: items.length
    });

  } catch (error) {
    console.error('取得即將到期食材失敗:', error);
    res.status(500).json({ 
      error: '取得即將到期食材失敗', 
      details: error.message 
    });
  }
});

// 取得庫存統計
router.get('/stats', async (req, res) => {
  try {
    const { userId = '' } = req.query;
    
    const stats = await Item.getInventoryStats(userId);
    
    // 格式化統計結果
    const formattedStats = {
      total: 0,
      available: 0,
      fresh: 0,
      warning: 0,
      expired: 0,
      consumed: 0
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
      
      // 計算可用庫存（排除已消耗的）
      if (stat._id !== 'consumed') {
        formattedStats.available += stat.count;
      }
    });
    
    console.log('✅ Final formatted stats:', JSON.stringify(formattedStats, null, 2));

    res.json({
      success: true,
      stats: formattedStats
    });

  } catch (error) {
    console.error('取得庫存統計失敗:', error);
    res.status(500).json({ 
      error: '取得庫存統計失敗', 
      details: error.message 
    });
  }
});

// 更新食材狀態
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId = '', ...updateData } = req.body;

    // 檢查權限
    const item = await Item.findOne({ _id: id, userId });
    if (!item) {
      return res.status(404).json({ 
        error: '找不到該庫存項目' 
      });
    }

    // 如果是標記為已消耗，記錄時間
    if (updateData.status === 'consumed' && !updateData.consumedAt) {
      updateData.consumedAt = new Date();
    }

    const updated = await Item.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      item: updated
    });

  } catch (error) {
    console.error('更新庫存失敗:', error);
    res.status(500).json({ 
      error: '更新庫存失敗', 
      details: error.message 
    });
  }
});

// 刪除食材
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId = '' } = req.query;

    const result = await Item.findOneAndDelete({ _id: id, userId });
    if (!result) {
      return res.status(404).json({ 
        error: '找不到該庫存項目' 
      });
    }

    res.json({
      success: true,
      message: '已刪除庫存項目'
    });

  } catch (error) {
    console.error('刪除庫存失敗:', error);
    res.status(500).json({ 
      error: '刪除庫存失敗', 
      details: error.message 
    });
  }
});

// 批量操作：消耗多個食材
router.post('/consume', async (req, res) => {
  try {
    const { 
      userId = '', 
      itemIds, 
      consumedAmount 
    } = req.body;

    if (!itemIds || !Array.isArray(itemIds)) {
      return res.status(400).json({ 
        error: 'itemIds 必須是陣列' 
      });
    }

    const result = await Item.updateMany(
      { 
        _id: { $in: itemIds }, 
        userId 
      },
      { 
        status: 'consumed',
        consumedAt: new Date(),
        ...(consumedAmount && { consumedAmount })
      }
    );

    res.json({
      success: true,
      updated: result.modifiedCount,
      message: `已標記 ${result.modifiedCount} 個項目為已消耗`
    });

  } catch (error) {
    console.error('批量消耗失敗:', error);
    res.status(500).json({ 
      error: '批量消耗失敗', 
      details: error.message 
    });
  }
});

export default router;