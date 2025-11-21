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
import authRoute from './routes/auth.js';
import session from 'express-session';
import passport from './config/passport.js';
import { setupNotificationSchedule } from './services/notificationService.js';

const app = express();
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true // 允許攜帶 cookies
}));

// 設定 session 中介軟體
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // 僅在生產環境使用 HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 1 天
  }
}));

// 初始化 Passport
app.use(passport.initialize());
app.use(passport.session());

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
  .then(() => {
    console.log('🗄️ MongoDB connected successfully');
    // 啟動通知排程
    setupNotificationSchedule();
  })
  .catch((error) => {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  });

app.get('/api/health', (_, res) => res.json({ ok: true }));
app.use('/api/auth', authRoute);
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
