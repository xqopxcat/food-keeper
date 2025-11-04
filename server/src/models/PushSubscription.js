import mongoose from 'mongoose';
const PushSubscriptionSchema = new mongoose.Schema({
  endpoint: { type: String, unique: true },
  keys: { p256dh: String, auth: String },
  createdAt: { type: Date, default: Date.now }
});
export default mongoose.model('PushSubscription', PushSubscriptionSchema);
