import { Router } from 'express';
import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription.js';

const router = Router();

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:you@example.com';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

router.get('/public-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

router.post('/subscribe', async (req, res) => {
  const sub = req.body;
  if (!sub?.endpoint) return res.status(400).json({ error: 'bad subscription' });
  await PushSubscription.updateOne(
    { endpoint: sub.endpoint },
    { $set: sub, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );
  res.json({ ok: true });
});

// 方便測試推播
router.post('/test', async (req, res) => {
  const subs = await PushSubscription.find().lean();
  const payload = JSON.stringify({ title: 'Food Keeper', body: '測試推播：今天有食材要先用！' });
  const results = [];
  for (const s of subs) {
    try { await webpush.sendNotification(s, payload); results.push({ endpoint: s.endpoint, ok: true }); }
    catch (e) { results.push({ endpoint: s.endpoint, ok: false, error: e.message }); }
  }
  res.json({ sent: results.length, results });
});

export default router;
