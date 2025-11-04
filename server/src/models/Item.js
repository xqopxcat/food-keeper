import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema({
  // 使用者ID（之後要登入再補）
  userId: String,

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

  // 時間欄位
  acquiredAt: Date,       // 入庫時間（預設現在）
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

export default mongoose.model('Item', ItemSchema);
