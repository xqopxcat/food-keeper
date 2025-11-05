import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  barcode: { type: String, index: true, unique: true, required: true },
  name: { type: String, required: true },
  brand: String,
  quantity: String,
  
  // 從外部 API 取得的額外資訊
  category: String,           // 商品分類
  ingredients: String,        // 成分列表
  image_url: String,         // 商品圖片 URL
  countries: String,         // 販售國家
  description: String,       // 商品描述
  
  // 資料來源追蹤
  source: {                  // 資料來源
    type: String,
    enum: ['manual', 'openfoodfacts', 'upcdatabase', 'import'],
    default: 'manual'
  },
  external_id: String,       // 外部 API 的 ID
  last_updated: {            // 最後更新時間
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// 建立複合索引以加速查詢
ProductSchema.index({ barcode: 1, source: 1 });
ProductSchema.index({ name: 'text', brand: 'text' }); // 支援文字搜尋

export default mongoose.model('Product', ProductSchema);
