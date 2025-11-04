import { Router } from 'express';
import Product from '../models/Product.js';
const router = Router();

// 查詢 Open Food Facts API
async function queryOpenFoodFacts(barcode) {
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.status !== 1 || !data.product) return null;
    
    const product = data.product;
    return {
      barcode: barcode,
      name: product.product_name || product.product_name_zh || product.abbreviated_product_name || '未知商品',
      brand: product.brands || product.brand_owner || '',
      quantity: product.quantity || product.serving_size || '',
      category: product.categories || '',
      ingredients: product.ingredients_text || '',
      nutrition_grade: product.nutrition_grades || '',
      image_url: product.image_front_url || product.image_url || '',
      countries: product.countries || '',
      source: 'openfoodfacts'
    };
  } catch (error) {
    console.error('Open Food Facts API error:', error);
    return null;
  }
}

// UPC Database API (備用)
async function queryUPCDatabase(barcode) {
  try {
    // 需要申請 API key: https://upcdatabase.org/api
    const API_KEY = process.env.UPC_DATABASE_API_KEY;
    if (!API_KEY) return null;
    
    const response = await fetch(`https://api.upcdatabase.org/product/${barcode}/${API_KEY}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data.valid) return null;
    
    return {
      barcode: barcode,
      name: data.title || '未知商品',
      brand: data.brand || '',
      quantity: data.size || '',
      category: data.category || '',
      description: data.description || '',
      source: 'upcdatabase'
    };
  } catch (error) {
    console.error('UPC Database API error:', error);
    return null;
  }
}

router.get('/lookup', async (req, res) => {
  const barcode = (req.query.barcode || '').trim();
  if (!barcode) return res.status(400).json({ error: 'barcode required' });

  // 1. 先查本地資料庫 (最快)
  let product = await Product.findOne({ barcode }).lean();
  if (product) {
    return res.json({ source: 'local', product });
  }

  // 2. 查詢 Open Food Facts API (免費，食品專用)
  let externalProduct = await queryOpenFoodFacts(barcode);
  
  // 3. 如果沒有，嘗試 UPC Database API (付費，但覆蓋率更廣)
  if (!externalProduct) {
    externalProduct = await queryUPCDatabase(barcode);
  }

  // 4. 如果找到外部資料，儲存到本地資料庫以加速未來查詢
  if (externalProduct) {
    try {
      // 移除不屬於 schema 的欄位
      const { source, ...productData } = externalProduct;
      
      // 設定資料來源
      productData.source = source;
      
      const savedProduct = await Product.create(productData);
      return res.json({ 
        source: source, 
        product: savedProduct.toObject() 
      });
    } catch (error) {
      // 如果儲存失敗（可能是重複條碼），直接回傳外部資料
      console.warn('Failed to save product to database:', error.message);
      return res.json({ 
        source: externalProduct.source, 
        product: externalProduct 
      });
    }
  }

  // 5. 都找不到 - 返回 NOT_FOUND
  return res.status(404).json({ error: 'NOT_FOUND' });
});

export default router;