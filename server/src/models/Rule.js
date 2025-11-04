import mongoose from 'mongoose';
const RuleSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: true },
  priority: { type: Number, default: 10 },
  conditions: {
    itemKey: [String],        // ['Citrus_orange']
    storageMode: [String],    // ['room','fridge','freezer']
    state: [String],          // ['whole','cut','cooked','peeled']
    container: [String],      // ['mesh_bag','ziplock','box','paper_bag']
    season: [String],         // ['summer','winter','spring','autumn']
    locale: [String]          // ['TW','JP',...]
  },
  result: {
    daysMin: Number,
    daysMax: Number,
    tips: String,
    baseConfidence: { type: Number, default: 0.6 }
  },
  updatedAt: { type: Date, default: Date.now }
});
export default mongoose.model('Rule', RuleSchema);
