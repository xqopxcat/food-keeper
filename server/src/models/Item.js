import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema({
  // 使用者ID（之後要登入再補）
  userId: { type: String, default: '', index: true },

  // 來源與識別
  barcode: String,
  name: String,
  brand: String,

  // 保存情境（規則需要的 facts）
  itemKey: String,        // 例如 'Citrus_orange'
  storageMode: String,    // 'room' | 'fridge' | 'freezer'
  state: String,          // 'whole' | 'cut' | 'opened' | 'cooked'
  container: String,      // 'none' | 'ziplock' | 'box' | 'paper_bag' | ...
  season: String,         // 'summer' | 'winter' | 'spring' | 'autumn'
  locale: String,         // 'TW' | 'JP' | ...

  // 庫存管理欄位
  quantity: {
    amount: { type: Number, default: 1 },
    unit: { 
      type: String, 
      enum: ['個', '包', '袋', '公斤', 'kg', '公克', 'g', '毫升', 'ml', '公升', 'l', '片', '條', '罐', '瓶'],
      default: '個'
    }
  },
  
  purchaseDate: Date,     // 購買日期
  location: {             // 存放位置
    type: String,
    enum: ['fridge_main', 'fridge_freezer', 'fridge_door', 'pantry', 'counter', 'cabinet'],
    default: 'fridge_main'
  },
  
  // 狀態管理
  status: {
    type: String,
    enum: ['fresh', 'warning', 'expired', 'consumed', 'discarded'],
    default: 'fresh'
  },
  
  // 消耗記錄
  consumedAt: Date,
  consumedAmount: Number,
  
  // 來源追蹤
  source: {
    type: String,
    enum: ['manual', 'barcode', 'photo', 'receipt', 'ai-identified', 'ocr-identified', 'barcode-identified'],
    default: 'manual'
  },
  
  // 額外資訊
  notes: String,

  // 時間欄位
  acquiredAt: { type: Date, default: Date.now },    // 入庫時間（預設現在）
  expirationDate: Date,   // 包裝上標示的到期日期（如果有的話）
  openedAt: Date,         // 若有開封/切開時間
  expiresMinAt: Date,     // 依 daysMin 算出的日期
  expiresMaxAt: Date,     // 依 daysMax 算出的日期

  // 紀錄規則結果
  daysMin: Number,
  daysMax: Number,
  tips: String,
  confidence: Number,
  ruleId: String
}, { timestamps: true });

// 虛擬欄位：計算剩餘天數（使用 expiresMaxAt）
ItemSchema.virtual('daysLeft').get(function() {
  if (!this.expiresMaxAt) return null;
  const now = new Date();
  const diffTime = this.expiresMaxAt - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// 虛擬欄位：緊急程度
ItemSchema.virtual('urgency').get(function() {
  const daysLeft = this.daysLeft;
  if (daysLeft === null) return 'unknown';
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= 1) return 'urgent';
  if (daysLeft <= 3) return 'warning';
  return 'safe';
});

// 索引優化
ItemSchema.index({ userId: 1, status: 1 });
ItemSchema.index({ userId: 1, expiresMaxAt: 1 });
ItemSchema.index({ userId: 1, itemKey: 1 });
ItemSchema.index({ expiresMaxAt: 1, status: 1 }); // 用於到期提醒

// 中間件：自動更新狀態
ItemSchema.pre('save', function(next) {
  // 根據到期日自動更新狀態
  if (this.expiresMaxAt) {
    const daysLeft = Math.ceil((this.expiresMaxAt - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0 && this.status === 'fresh') {
      this.status = 'expired';
    } else if (daysLeft <= 3 && this.status === 'fresh') {
      this.status = 'warning';
    }
  }
  next();
});

// 靜態方法：取得用戶即將到期的食材
ItemSchema.statics.getExpiringItems = function(userId, days = 3) {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + days);
  
  return this.find({
    userId: userId,
    status: { $in: ['fresh', 'warning'] },
    expiresMaxAt: { $lte: targetDate }
  }).sort({ expiresMaxAt: 1 });
};

// 靜態方法：取得庫存統計
ItemSchema.statics.getInventoryStats = function(userId) {
  const now = new Date();
  
  return this.aggregate([
    { $match: { userId: userId } },
    {
      $addFields: {
        // 動態計算實際狀態
        actualStatus: {
          $cond: {
            if: { $eq: ['$status', 'consumed'] }, // 如果已消耗，保持不變
            then: '$status',
            else: {
              $cond: {
                if: { $eq: ['$status', 'discarded'] }, // 如果已丟棄，保持不變
                then: '$status',
                else: {
                  // 根據到期日動態計算狀態
                  $cond: {
                    if: { $lt: ['$expiresMaxAt', now] }, // 已過期
                    then: 'expired',
                    else: {
                      $let: {
                        vars: {
                          daysLeft: {
                            $divide: [
                              { $subtract: ['$expiresMaxAt', now] },
                              1000 * 60 * 60 * 24
                            ]
                          }
                        },
                        in: {
                          $cond: {
                            if: { $lte: ['$$daysLeft', 3] }, // 3天內到期
                            then: 'warning',
                            else: 'fresh'
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    {
      $group: {
        _id: '$actualStatus',
        count: { $sum: 1 },
        totalQuantity: { $sum: '$quantity.amount' }
      }
    }
  ]);
};

export default mongoose.model('Item', ItemSchema);
