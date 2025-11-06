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

const app = express();
app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/foodkeeper';
await mongoose.connect(MONGODB_URI);

app.get('/api/health', (_, res) => res.json({ ok: true }));
app.use('/api/lookup', lookupRoute);
app.use('/api/push', pushRoute);
app.use('/api/rules', rulesRoute);
app.use('/api/estimate', estimateRoute);
app.use('/api/off', offLookupRoute);
app.use('/api/inventory', inventoryRoute);
app.use('/api/items', itemsRoute);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`[server] http://localhost:${PORT}`));
