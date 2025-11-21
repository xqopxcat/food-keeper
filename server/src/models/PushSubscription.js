import mongoose from 'mongoose';

const PushSubscriptionSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true,
    index: true 
  },
  endpoint: { 
    type: String, 
    required: true 
  },
  keys: { 
    p256dh: { type: String, required: true }, 
    auth: { type: String, required: true } 
  },
  enabled: { 
    type: Boolean, 
    default: true 
  },
  notifyBeforeDays: { 
    type: Number, 
    default: 3,
    min: 1,
    max: 30
  },
  notifyTime: { 
    type: String, 
    default: '09:00',
    validate: {
      validator: function(v) {
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: props => `${props.value} 不是有效的時間格式 (HH:MM)`
    }
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// 建立複合索引，確保每個使用者的每個 endpoint 唯一
PushSubscriptionSchema.index({ userId: 1, endpoint: 1 }, { unique: true });

const PushSubscription = mongoose.model('PushSubscription', PushSubscriptionSchema);

// 在應用啟動時自動刪除舊索引並建立新索引
(async () => {
  try {
    const collection = mongoose.connection.collection('pushsubscriptions');
    
    // 等待連接建立
    if (mongoose.connection.readyState !== 1) {
      await new Promise(resolve => {
        mongoose.connection.once('open', resolve);
      });
    }
    
    // 嘗試刪除舊的 endpoint_1 索引
    try {
      await collection.dropIndex('endpoint_1');
      console.log('✓ 已刪除舊的 endpoint_1 索引');
    } catch (error) {
      // 索引不存在或已被刪除，忽略錯誤
      if (error.code !== 27) {
        console.log('○ endpoint_1 索引已不存在');
      }
    }
    
    // 確保新索引存在
    await PushSubscription.syncIndexes();
    console.log('✓ PushSubscription 索引已同步');
  } catch (error) {
    console.error('同步 PushSubscription 索引時出錯:', error.message);
  }
})();

export default PushSubscription;
