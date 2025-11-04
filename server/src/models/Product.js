import mongoose from 'mongoose';
const ProductSchema = new mongoose.Schema({
  barcode: { type: String, index: true, unique: true, required: true },
  name: { type: String, required: true },
  brand: String,
  quantity: String
}, { timestamps: true });
export default mongoose.model('Product', ProductSchema);
