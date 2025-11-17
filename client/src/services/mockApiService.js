// 模擬 API 響應數據
export const MOCK_RESPONSES = {
  // Google Vision 物件識別模擬數據
  vision: {
    success: true,
    totalItems: 3,
    items: [
      {
        name: '蘋果',
        englishName: 'Apple',
        itemKey: 'apple_red',
        confidence: 0.92,
        category: '水果',
        quantity: { amount: 3, unit: '個' },
        storageMode: 'fridge',
        state: 'whole',
        brand: null,
        shelfLife: {
          daysMin: 7,
          daysMax: 14,
          confidence: 0.85,
          tips: '放冷藏可保存更久，避免碰撞'
        },
        source: 'ai-identified'
      },
      {
        name: '香蕉',
        englishName: 'Banana',
        itemKey: 'banana_yellow',
        confidence: 0.88,
        category: '水果',
        quantity: { amount: 5, unit: '根' },
        storageMode: 'room',
        state: 'whole',
        brand: null,
        shelfLife: {
          daysMin: 3,
          daysMax: 7,
          confidence: 0.80,
          tips: '室溫保存，避免陽光直射'
        },
        source: 'ai-identified'
      },
      {
        name: '牛奶',
        englishName: 'Milk',
        itemKey: 'milk_whole',
        confidence: 0.95,
        category: '乳製品',
        quantity: { amount: 1, unit: '瓶' },
        storageMode: 'fridge',
        state: 'unopened',
        brand: '光泉',
        shelfLife: {
          daysMin: 5,
          daysMax: 10,
          confidence: 0.90,
          tips: '開封後請儘速飲用，冷藏保存'
        },
        source: 'ai-identified'
      }
    ]
  },

  // Gemini OCR 結構化文字識別模擬數據
  ocr: {
    success: true,
    confidence: 0.87,
    text: {
      name: '義美純鮮乳',
      englishName: 'I-Mei Fresh Milk',
      itemKey: 'milk_whole',
      brand: '義美',
      category: '乳製品',
      quantity: { amount: 936, unit: 'ml' },
      expirationDate: '2024-12-15',
      barcode: '4710077341234',
      ingredients: ['生乳100%'],
      nutrition: {
        calories: '64kcal/100ml',
        protein: '3.4g',
        fat: '3.5g',
        carbs: '4.6g'
      },
      storageMode: 'fridge',
      state: 'unopened',
      tips: '開封後請於3日內飲用完畢',
      notes: '全脂鮮乳',
      allText: '義美純鮮乳\nI-MEI FRESH MILK\n936ML\n保存期限：2024.12.15\n全脂鮮乳\n生乳100%\n營養標示\n每100ml含有\n熱量 64大卡\n蛋白質 3.4公克\n脂肪 3.5公克\n碳水化合物 4.6公克\n4710077341234'
    }
  },

  // 條碼查詢模擬數據
  barcode: {
    success: true,
    products: [
      {
        barcode: '4710077341234',
        product: {
          name: '義美純鮮乳',
          brand: '義美',
          category: '乳製品',
          quantity: { amount: 936, unit: 'ml' },
          itemKey: 'milk_whole',
          storageMode: 'fridge'
        },
        source: 'barcode-lookup'
      }
    ]
  },

  // 錯誤響應模擬
  error: {
    success: false,
    error: '模擬 API 錯誤：請檢查網路連線'
  }
};

// 模擬 API 延遲
const simulateDelay = (ms = 1000) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// 模擬 Google Vision API
export const mockIdentifyFood = async (imageBase64) => {
  console.log('🧪 使用模擬 Google Vision API');
  await simulateDelay(1500);
  
  // 隨機決定成功或失敗
  if (Math.random() > 0.1) { // 90% 成功率
    return MOCK_RESPONSES.vision;
  } else {
    return MOCK_RESPONSES.error;
  }
};

// 模擬 Gemini OCR API
export const mockExtractText = async (imageBase64) => {
  console.log('🧪 使用模擬 Gemini OCR API');
  await simulateDelay(2000);
  
  // 隨機決定成功或失敗
  if (Math.random() > 0.15) { // 85% 成功率
    return MOCK_RESPONSES.ocr;
  } else {
    return MOCK_RESPONSES.error;
  }
};

// 模擬條碼查詢 API
export const mockLookupBarcode = async (barcode) => {
  console.log('🧪 使用模擬條碼查詢 API');
  await simulateDelay(800);
  
  // 模擬不同的條碼結果
  if (barcode === '4710077341234') {
    return MOCK_RESPONSES.barcode;
  } else {
    return {
      success: false,
      message: '未找到該條碼的產品資訊'
    };
  }
};

// 生成隨機模擬數據
export const generateRandomMockData = (type) => {
  const foodItems = [
    { name: '蘋果', itemKey: 'apple_red', category: '水果' },
    { name: '香蕉', itemKey: 'banana_yellow', category: '水果' },
    { name: '牛奶', itemKey: 'milk_whole', category: '乳製品' },
    { name: '雞蛋', itemKey: 'egg_chicken', category: '蛋類' },
    { name: '麵包', itemKey: 'bread_white', category: '穀物' },
    { name: '優格', itemKey: 'yogurt_plain', category: '乳製品' },
    { name: '番茄', itemKey: 'tomato_red', category: '蔬菜' },
    { name: '起司', itemKey: 'cheese_cheddar', category: '乳製品' }
  ];

  const randomItem = foodItems[Math.floor(Math.random() * foodItems.length)];
  
  if (type === 'vision') {
    return {
      ...MOCK_RESPONSES.vision,
      items: [
        {
          ...randomItem,
          englishName: `${randomItem.name} (English)`,
          confidence: 0.8 + Math.random() * 0.2,
          quantity: { amount: Math.ceil(Math.random() * 5), unit: '個' },
          storageMode: Math.random() > 0.5 ? 'fridge' : 'room',
          shelfLife: {
            daysMin: Math.ceil(Math.random() * 7),
            daysMax: Math.ceil(Math.random() * 14) + 7,
            confidence: 0.7 + Math.random() * 0.3,
            tips: '保存建議：避免陽光直射'
          }
        }
      ]
    };
  }
  
  return MOCK_RESPONSES[type];
};