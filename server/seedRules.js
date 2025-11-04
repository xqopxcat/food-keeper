import mongoose from 'mongoose';
import fs from 'fs';
import 'dotenv/config';
import Rule from './src/models/Rule.js';

await mongoose.connect(process.env.MONGODB_URI);
console.log('✅ Connected to MongoDB');

await Rule.deleteMany({});
console.log('🧹 Cleared old rules');

const data = JSON.parse(fs.readFileSync('./data/rules.json', 'utf8'));
await Rule.insertMany(data);
console.log(`🌱 Inserted ${data.length} rules.`);

await mongoose.disconnect();
console.log('✅ Done.');
