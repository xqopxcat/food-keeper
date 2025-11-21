import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription.js';
import Item from '../models/Item.js';
import cron from 'node-cron';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:you@example.com';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

/**
 * 檢查並發送即將到期的食材通知
 */
export async function sendExpiringNotifications() {
  try {
    console.log('[通知服務] 開始檢查即將到期的食材...');
    
    // 獲取所有啟用推播的訂閱
    const subscriptions = await PushSubscription.find({ enabled: true }).lean();
    
    if (subscriptions.length === 0) {
      console.log('[通知服務] 沒有啟用推播的使用者');
      return { sent: 0, message: '沒有啟用推播的使用者' };
    }
    
    const results = [];
    
    // 對每個使用者檢查到期食材
    for (const sub of subscriptions) {
      try {
        const { userId, notifyBeforeDays } = sub;
        
        // 計算截止日期
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const notifyDate = new Date(today);
        notifyDate.setDate(notifyDate.getDate() + notifyBeforeDays);
        
        // 查詢即將到期的項目
        const expiringItems = await Item.find({
          userId,
          status: { $in: ['fresh', 'warning'] }, // 只通知可用的項目
          expiresMaxAt: { $lte: notifyDate }
        }).sort({ expiresMaxAt: 1 }).limit(10).lean();
        
        if (expiringItems.length === 0) {
          console.log(`[通知服務] 使用者 ${userId} 沒有即將到期的食材`);
          continue;
        }
        
        // 準備通知內容
        const itemNames = expiringItems.slice(0, 3).map(item => item.name).join('、');
        const moreText = expiringItems.length > 3 ? `等 ${expiringItems.length} 項` : '';
        
        const payload = JSON.stringify({
          title: '⚠️ 食材即將到期提醒',
          body: `${itemNames}${moreText}即將到期，請盡快食用！`,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          data: {
            url: '/inventory',
            count: expiringItems.length
          }
        });
        
        // 發送通知
        await webpush.sendNotification(sub, payload);
        
        results.push({
          userId,
          endpoint: sub.endpoint,
          itemCount: expiringItems.length,
          ok: true
        });
        
        console.log(`[通知服務] 已發送通知給使用者 ${userId}，共 ${expiringItems.length} 項即將到期`);
        
      } catch (error) {
        console.error(`[通知服務] 發送通知失敗:`, error);
        results.push({
          userId: sub.userId,
          endpoint: sub.endpoint,
          ok: false,
          error: error.message
        });
        
        // 如果是 410 Gone，表示訂閱已過期，刪除它
        if (error.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: sub._id });
          console.log(`[通知服務] 已刪除過期的訂閱: ${sub.endpoint}`);
        }
      }
    }
    
    console.log(`[通知服務] 完成，發送了 ${results.filter(r => r.ok).length} 則通知`);
    
    return {
      sent: results.filter(r => r.ok).length,
      failed: results.filter(r => !r.ok).length,
      results
    };
    
  } catch (error) {
    console.error('[通知服務] 執行失敗:', error);
    throw error;
  }
}

/**
 * 設定定時任務 - 根據使用者設定的時間發送通知
 * 每分鐘檢查一次，看是否有使用者需要在當前時間收到通知
 */
export function setupNotificationSchedule() {
  // 每分鐘執行一次檢查
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      console.log(`[通知排程] 檢查時間: ${currentTime}`);
      
      // 查找所有在當前時間需要收到通知的使用者
      const subscriptions = await PushSubscription.find({
        enabled: true,
        notifyTime: currentTime
      }).lean();
      
      if (subscriptions.length === 0) {
        return;
      }
      
      console.log(`[通知排程] 找到 ${subscriptions.length} 位使用者需要在 ${currentTime} 收到通知`);
      
      // 對每個使用者發送通知
      for (const sub of subscriptions) {
        try {
          const { userId, notifyBeforeDays } = sub;
          
          // 計算截止日期
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const notifyDate = new Date(today);
          notifyDate.setDate(notifyDate.getDate() + notifyBeforeDays);
          
          // 查詢即將到期的項目
          const expiringItems = await Item.find({
            userId,
            status: { $in: ['fresh', 'warning'] },
            expiresMaxAt: { $lte: notifyDate }
          }).sort({ expiresMaxAt: 1 }).limit(10).lean();
          
          if (expiringItems.length === 0) {
            console.log(`[通知排程] 使用者 ${userId} 沒有即將到期的食材`);
            continue;
          }
          
          // 準備通知內容
          const itemNames = expiringItems.slice(0, 3).map(item => item.name).join('、');
          const moreText = expiringItems.length > 3 ? `等 ${expiringItems.length} 項` : '';
          
          const payload = JSON.stringify({
            title: '⚠️ 食材即將到期提醒',
            body: `${itemNames}${moreText}即將到期，請盡快食用！`,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            data: {
              url: '/inventory',
              count: expiringItems.length
            }
          });
          
          // 發送通知
          await webpush.sendNotification(sub, payload);
          
          console.log(`[通知排程] 已發送通知給使用者 ${userId}，共 ${expiringItems.length} 項即將到期`);
          
        } catch (error) {
          console.error(`[通知排程] 發送通知失敗:`, error.message);
          
          // 如果是 410 Gone，表示訂閱已過期，刪除它
          if (error.statusCode === 410) {
            await PushSubscription.deleteOne({ _id: sub._id });
            console.log(`[通知排程] 已刪除過期的訂閱: ${sub.endpoint}`);
          }
        }
      }
      
    } catch (error) {
      console.error('[通知排程] 執行失敗:', error);
    }
  });
  
  console.log('[通知服務] ✓ 通知排程已啟動（每分鐘檢查一次）');
}
