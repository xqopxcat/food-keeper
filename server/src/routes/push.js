import { Router } from 'express';
import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription.js';
import { auth } from '../middleware/auth.js';
import { sendExpiringNotifications } from '../services/notificationService.js';

const router = Router();

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:you@example.com';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// 獲取公鑰
router.get('/public-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// 訂閱推播（需要認證）
router.post('/subscribe', auth, async (req, res) => {
  try {
    const sub = req.body;
    const userId = req.userId;
    
    if (!sub?.endpoint) {
      return res.status(400).json({ error: 'bad subscription' });
    }
    
    await PushSubscription.updateOne(
      { userId, endpoint: sub.endpoint },
      { 
        $set: { 
          keys: sub.keys,
          updatedAt: new Date()
        },
        $setOnInsert: { 
          userId,
          endpoint: sub.endpoint,
          enabled: true,
          notifyBeforeDays: 3,
          notifyTime: '09:00',
          createdAt: new Date()
        }
      },
      { upsert: true }
    );
    
    res.json({ ok: true });
  } catch (error) {
    console.error('訂閱推播失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新通知設定（需要認證）
router.put('/settings', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { enabled, notifyBeforeDays, notifyTime } = req.body;
    
    const updateData = { updatedAt: new Date() };
    if (typeof enabled === 'boolean') updateData.enabled = enabled;
    if (notifyBeforeDays) updateData.notifyBeforeDays = notifyBeforeDays;
    if (notifyTime) updateData.notifyTime = notifyTime;
    
    await PushSubscription.updateMany(
      { userId },
      { $set: updateData }
    );
    
    res.json({ ok: true });
  } catch (error) {
    console.error('更新設定失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// 獲取通知設定（需要認證）
router.get('/settings', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const subscription = await PushSubscription.findOne({ userId }).lean();
    
    if (!subscription) {
      return res.json({
        isSubscribed: false,
        enabled: false,
        notifyBeforeDays: 3,
        notifyTime: '09:00'
      });
    }
    
    res.json({
      isSubscribed: true,
      enabled: subscription.enabled,
      notifyBeforeDays: subscription.notifyBeforeDays,
      notifyTime: subscription.notifyTime
    });
  } catch (error) {
    console.error('獲取設定失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// 測試推播（需要認證）
router.post('/test', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const subs = await PushSubscription.find({ userId, enabled: true }).lean();
    
    if (subs.length === 0) {
      return res.json({ sent: 0, message: '沒有啟用的訂閱' });
    }
    
    const payload = JSON.stringify({ 
      title: 'Food Keeper 測試', 
      body: '這是一則測試推播通知！',
      icon: '/icon-192.png',
      badge: '/icon-192.png'
    });
    
    const results = [];
    for (const s of subs) {
      try { 
        await webpush.sendNotification(s, payload); 
        results.push({ endpoint: s.endpoint, ok: true }); 
      } catch (e) { 
        results.push({ endpoint: s.endpoint, ok: false, error: e.message }); 
      }
    }
    
    res.json({ sent: results.length, results });
  } catch (error) {
    console.error('發送測試推播失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// 發送即將到期通知（內部 API 或定時任務調用）
router.post('/send-expiring-notifications', auth, async (req, res) => {
  try {
    const { userId, items } = req.body;
    
    if (!items || items.length === 0) {
      return res.json({ sent: 0, message: '沒有需要提醒的項目' });
    }
    
    const subs = await PushSubscription.find({ userId, enabled: true }).lean();
    
    if (subs.length === 0) {
      return res.json({ sent: 0, message: '使用者未啟用推播' });
    }
    
    const itemsText = items.slice(0, 3).map(item => item.name).join('、');
    const moreText = items.length > 3 ? `等 ${items.length} 項` : '';
    
    const payload = JSON.stringify({ 
      title: '⚠️ 食材即將到期提醒', 
      body: `${itemsText}${moreText}即將到期，請盡快食用！`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: '/inventory' }
    });
    
    const results = [];
    for (const s of subs) {
      try { 
        await webpush.sendNotification(s, payload); 
        results.push({ endpoint: s.endpoint, ok: true }); 
      } catch (e) { 
        results.push({ endpoint: s.endpoint, ok: false, error: e.message }); 
      }
    }
    
    res.json({ sent: results.length, results });
  } catch (error) {
    console.error('發送到期通知失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// 手動觸發檢查並發送即將到期通知（可用於測試或手動執行）
router.post('/check-and-notify', auth, async (req, res) => {
  try {
    const result = await sendExpiringNotifications();
    res.json(result);
  } catch (error) {
    console.error('執行通知檢查失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
