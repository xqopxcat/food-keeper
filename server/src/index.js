import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import lookupRoute from './routes/lookup.js';
import pushRoute from './routes/push.js';
import rulesRoute from './routes/rules.js';
import estimateRoute from './routes/estimate.js';
import offLookupRoute from './routes/offLookup.js';
import inventoryRoute from './routes/inventory.js';
import itemsRoute from './routes/items.js';
import aiRoute from './routes/ai.js';

const app = express();
app.use(cors());

// 增加 body parser 限制以支援大圖片上傳
app.use(express.json({ 
  limit: '50mb',  // 允許最大 50MB 的 JSON payload
  parameterLimit: 50000,
  extended: true
}));

app.use(express.urlencoded({ 
  limit: '50mb', 
  extended: true,
  parameterLimit: 50000
}));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/foodkeeper';

// 連接 MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('🗄️ MongoDB connected successfully'))
  .catch((error) => {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  });

app.get('/api/health', (_, res) => res.json({ ok: true }));
app.use('/api/lookup', lookupRoute);
app.use('/api/push', pushRoute);
app.use('/api/rules', rulesRoute);
app.use('/api/estimate', estimateRoute);
app.use('/api/off', offLookupRoute);
app.use('/api/inventory', inventoryRoute);
app.use('/api/items', itemsRoute);
app.use('/api/ai', aiRoute);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`[server] http://localhost:${PORT}`));
