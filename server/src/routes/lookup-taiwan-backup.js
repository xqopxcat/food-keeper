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
      image_url: product.image_front_url || product.image_url || '',
      countries: product.countries || '',
      source: 'openfoodfacts'
    };
  } catch (error) {
    console.error('Open Food Facts API error:', error);
    return null;
  }
}

// 台灣官方資料庫查詢 (食藥署、經濟部、GS1 Taiwan)
async function queryTaiwanIntegratedAPI(barcode) {
  try {
    console.log(`查詢台灣官方資料庫: ${barcode}`);
    
    // 使用整合的台灣商品 API 查詢
    const result = await queryTaiwanProductAPIs(barcode);
    
    if (result) {
      return {
        barcode: barcode,
        name: result.name || '台灣官方註冊商品',
        brand: result.brand || result.manufacturer || '',
        quantity: result.quantity || '',
        category: result.category || '台灣商品',
        description: result.description || 
                    (result.registration_number ? `註冊字號: ${result.registration_number}` : '') +
                    (result.address ? `\n地址: ${result.address}` : '') +
                    (result.business_scope ? `\n營業項目: ${result.business_scope}` : ''),
        nutrition_info: result.nutrition,
        registration_number: result.registration_number,
        company_id: result.company_id,
        verified: result.verified,
        source: result.source
      };
    }
    
    return null;
  } catch (error) {
    console.error('Taiwan Official API error:', error);
    return null;
  }
}

// 台灣商品智能推斷 (基於條碼前綴)
async function queryTaiwanProducts(barcode) {
  try {
    // 台灣條碼通常以 471 開頭
    if (!barcode.startsWith('471')) return null;
    
    // 這裡可以整合更多台灣本土商品資料庫
    // 例如：統一、義美、味全等大廠的商品資料
    
    // 移除錯誤的品牌推斷邏輯
    // 實際上，僅從條碼前綴無法準確判斷品牌
    // 條碼前綴 471 只能確定是台灣商品，但不能確定具體品牌
    
    // 只有當我們有確實的資料庫匹配時才應該回傳品牌資訊
    // 這裡暫時移除品牌推斷，避免錯誤資訊
    
    // 暫時移除品牌推斷，避免錯誤資訊
    // 只有在有真實資料庫匹配時才提供品牌資訊
    
    // 通用台灣商品推斷
    if (barcode.startsWith('471')) {
      return {
        barcode: barcode,
        name: '台灣商品',
        brand: '台灣製造',
        quantity: '',
        category: '台灣食品',
        country: 'Taiwan',
        source: 'taiwan_generic'
      };
    }
    
    return null;
  } catch (error) {
    console.error('Taiwan products query error:', error);
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

  // 1. 先查本地資料庫
  let product = await Product.findOne({ barcode }).lean();
  if (product) {
    return res.json({ source: 'local', product });
  }

  // 2. 針對台灣商品，優先查詢台灣官方資料庫
  let externalProduct = null;
  if (barcode.startsWith('471')) {
    externalProduct = await queryTaiwanIntegratedAPI(barcode);
  }
  
  // 3. 如果台灣官方資料庫沒有，查詢 Open Food Facts
  if (!externalProduct) {
    externalProduct = await queryOpenFoodFacts(barcode);
  }
  
  // 4. 如果都沒有，嘗試 UPC Database (如果有設定 API key)
  if (!externalProduct) {
    externalProduct = await queryUPCDatabase(barcode);
  }
  
  // 5. 最後才使用台灣商品通用推斷 (避免覆蓋真實資料)
  if (!externalProduct && barcode.startsWith('471')) {
    externalProduct = await queryTaiwanProducts(barcode);
  }

  // 5. 如果找到外部資料，儲存到本地資料庫以加速未來查詢
  if (externalProduct) {
    try {
      // 移除不屬於 schema 的欄位
      const { source, nutrition_info, ...productData } = externalProduct;
      
      // 設定資料來源
      productData.source = source;
      
      // 如果有營養資訊，加入到 description
      if (nutrition_info && Object.values(nutrition_info).some(v => v)) {
        const nutritionText = Object.entries(nutrition_info)
          .filter(([key, value]) => value)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        productData.description = (productData.description || '') + 
          (productData.description ? '\n' : '') + `營養資訊: ${nutritionText}`;
      }
      
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

  // 5. 都找不到
  return res.status(404).json({ error: 'NOT_FOUND' });
});

export default router;
