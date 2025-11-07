import OpenAI from 'openai';

// 初始化 OpenAI 客戶端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 使用 OpenAI GPT-4V 識別圖片中的食物
 * @param {string} imageBase64 - Base64 編碼的圖片
 * @param {object} options - 識別選項
 * @returns {Promise<object>} 識別結果
 */
export async function identifyFoodItems(imageBase64, options = {}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const {
    language = 'zh-TW',
    includeQuantity = true,
    includeExpiration = true,
    includeBrand = true
  } = options;

  try {
    const prompt = `
請仔細分析這張圖片中的食物或食材，並以 JSON 格式回傳識別結果。

要求：
1. 識別所有可見的食物/食材/包裝食品
2. 對每個項目提供以下資訊：
   - name: 食物名稱 (繁體中文)
   - englishName: 英文名稱
   - category: 食物分類 (水果類/蔬菜類/肉類/乳製品等)
   - itemKey: 對應的系統食材代碼 (參考常見食材如: Apple, Banana, Milk, Bread 等)
   - brand: 品牌名稱 (如果可識別)
   - quantity: 估計數量和單位 (如: {amount: 3, unit: "個"})
   - confidence: 識別信心度 (0-1)
   - storageMode: 建議保存方式 ("room"/"fridge"/"freezer")
   - state: 食物狀態 ("whole"/"cut"/"opened"/"cooked")
   - notes: 額外觀察 (如：新鮮度、包裝狀況等)

3. 如果能識別包裝上的文字：
   - packageText: 包裝上的文字內容
   - expirationDate: 保存期限 (如果可見)
   - productCode: 產品條碼 (如果可見)

請以此格式回傳：
{
  "success": true,
  "items": [
    {
      "name": "蘋果",
      "englishName": "Apple", 
      "category": "水果類",
      "itemKey": "Apple",
      "brand": null,
      "quantity": {"amount": 2, "unit": "個"},
      "confidence": 0.95,
      "storageMode": "fridge",
      "state": "whole",
      "notes": "外觀新鮮，無明顯損傷",
      "packageText": null,
      "expirationDate": null,
      "productCode": null
    }
  ],
  "totalItems": 1,
  "language": "zh-TW"
}

如果無法識別任何食物，請回傳：
{
  "success": false,
  "error": "無法識別圖片中的食物",
  "items": [],
  "totalItems": 0
}
`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // 嘗試解析 JSON 回應
    try {
      const result = JSON.parse(content);
      
      // 驗證回應格式
      if (!result.hasOwnProperty('success') || !Array.isArray(result.items)) {
        throw new Error('Invalid response format from AI');
      }

      return {
        success: result.success,
        items: result.items || [],
        totalItems: result.totalItems || result.items?.length || 0,
        language: result.language || language,
        aiProvider: 'openai',
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        processingTime: Date.now()
      };

    } catch (parseError) {
      // 如果 JSON 解析失敗，嘗試從文本中提取資訊
      console.error('Failed to parse AI response as JSON:', parseError);
      console.log('Raw response:', content);
      
      return {
        success: false,
        error: 'AI 回應格式錯誤',
        items: [],
        totalItems: 0,
        rawResponse: content,
        aiProvider: 'openai'
      };
    }

  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    return {
      success: false,
      error: error.message || 'AI 識別服務暫時無法使用',
      items: [],
      totalItems: 0,
      aiProvider: 'openai'
    };
  }
}

/**
 * 使用 OpenAI 進行文字識別 (OCR)
 * @param {string} imageBase64 - Base64 編碼的圖片
 * @returns {Promise<object>} OCR 結果
 */
export async function extractTextFromImage(imageBase64) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const prompt = `
請識別這張圖片中的所有文字內容，特別注意：
1. 產品名稱
2. 品牌名稱  
3. 保存期限/有效日期
4. 條碼號碼
5. 營養標示
6. 成分表
7. 其他包裝文字

請以 JSON 格式回傳：
{
  "success": true,
  "text": {
    "productName": "產品名稱",
    "brand": "品牌名稱", 
    "expirationDate": "保存期限",
    "barcode": "條碼號碼",
    "ingredients": "成分表",
    "nutrition": "營養標示",
    "allText": "所有識別到的文字"
  },
  "confidence": 0.95
}
`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 1500,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const result = JSON.parse(content);
    return {
      ...result,
      aiProvider: 'openai',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
    };

  } catch (error) {
    console.error('OpenAI OCR Error:', error);
    
    return {
      success: false,
      error: error.message || 'OCR 服務暫時無法使用',
      text: {},
      aiProvider: 'openai'
    };
  }
}