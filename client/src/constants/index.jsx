// 食材選項資料
export const foodOptions = [
  // === 水果類 ===
  { category: '🍎 水果類', value: 'Citrus_orange', label: '橘子 / Orange' },
  { category: '🍎 水果類', value: 'Apple', label: '蘋果 / Apple' },
  { category: '🍎 水果類', value: 'Banana', label: '香蕉 / Banana' },
  { category: '🍎 水果類', value: 'Strawberry', label: '草莓 / Strawberry' },
  { category: '🍎 水果類', value: 'Blueberry', label: '藍莓 / Blueberry' },
  { category: '🍎 水果類', value: 'Grape', label: '葡萄 / Grape' },
  { category: '🍎 水果類', value: 'Lemon', label: '檸檬 / Lemon' },
  { category: '🍎 水果類', value: 'Lime', label: '萊姆 / Lime' },
  { category: '🍎 水果類', value: 'Pineapple', label: '鳳梨 / Pineapple' },
  { category: '🍎 水果類', value: 'Watermelon', label: '西瓜 / Watermelon' },
  { category: '🍎 水果類', value: 'Avocado', label: '酪梨 / Avocado' },

  // === 蔬菜類 ===
  { category: '🥬 蔬菜類', value: 'Tomato', label: '番茄 / Tomato' },
  { category: '🥬 蔬菜類', value: 'Cucumber', label: '小黃瓜 / Cucumber' },
  { category: '🥬 蔬菜類', value: 'Bell_pepper', label: '甜椒 / Bell Pepper' },
  { category: '🥬 蔬菜類', value: 'Spinach', label: '菠菜 / Spinach' },
  { category: '🥬 蔬菜類', value: 'Lettuce_leafy', label: '萵苣 / Lettuce' },
  { category: '🥬 蔬菜類', value: 'Bok_choy', label: '小白菜 / Bok Choy' },
  { category: '🥬 蔬菜類', value: 'Broccoli', label: '花椰菜 / Broccoli' },
  { category: '🥬 蔬菜類', value: 'Carrot', label: '紅蘿蔔 / Carrot' },
  { category: '🥬 蔬菜類', value: 'Potato', label: '馬鈴薯 / Potato' },
  { category: '🥬 蔬菜類', value: 'Onion', label: '洋蔥 / Onion' },
  { category: '🥬 蔬菜類', value: 'Ginger', label: '薑 / Ginger' },
  { category: '🥬 蔬菜類', value: 'Green_onion', label: '蔥 / Green Onion' },
  { category: '🥬 蔬菜類', value: 'Garlic_bulb', label: '蒜頭 / Garlic' },
  { category: '🥬 蔬菜類', value: 'Mushroom', label: '菇類 / Mushroom' },
  { category: '🥬 蔬菜類', value: 'Corn', label: '玉米 / Corn' },

  // === 乳製品 ===
  { category: '🥛 乳製品', value: 'Milk', label: '鮮奶 / Milk' },
  { category: '🥛 乳製品', value: 'Yogurt', label: '優格 / Yogurt' },
  { category: '🥛 乳製品', value: 'Cheese', label: '起司 / Cheese' },
  { category: '🥛 乳製品', value: 'Butter', label: '奶油 / Butter' },

  // === 蛋類 ===
  { category: '🥚 蛋類', value: 'Egg', label: '雞蛋 / Egg' },

  // === 豆製品 ===
  { category: '🥡 豆製品', value: 'Tofu', label: '豆腐 / Tofu' },

  // === 肉類 ===
  { category: '🥩 肉類', value: 'Chicken_meat', label: '雞肉 / Chicken' },
  { category: '🥩 肉類', value: 'Pork_meat', label: '豬肉 / Pork' },
  { category: '🥩 肉類', value: 'Beef_meat', label: '牛肉 / Beef' },
  { category: '🥩 肉類', value: 'Fish', label: '魚 / Fish' },
  { category: '🥩 肉類', value: 'Shrimp', label: '蝦 / Shrimp' },

  // === 加工肉品 ===
  { category: '🍖 加工肉品', value: 'Ham_sliced', label: '火腿 / Ham' },
  { category: '🍖 加工肉品', value: 'Bacon', label: '培根 / Bacon' },
  { category: '🍖 加工肉品', value: 'Sausage', label: '香腸 / Sausage' },

  // === 主食類 ===
  { category: '🍚 主食類', value: 'Rice_uncooked', label: '白米 / Rice' },
  { category: '🍚 主食類', value: 'Rice_cooked', label: '熟飯 / Cooked Rice' },
  { category: '🍚 主食類', value: 'Bread', label: '麵包 / Bread' },

  // === 麵食類 ===
  { category: '🍜 麵食類', value: 'Instant_noodle', label: '泡麵 / Instant Noodle' },
  { category: '🍜 麵食類', value: 'Pasta', label: '義大利麵 / Pasta' },
  { category: '🍜 麵食類', value: 'Noodle_fresh', label: '新鮮麵條 / Fresh Noodle' },

  // === 發酵食品 ===
  { category: '🥒 發酵食品', value: 'Kimchi', label: '泡菜 / Kimchi' },
  { category: '🥒 發酵食品', value: 'Miso_paste', label: '味噌 / Miso' },

  // === 調味料 ===
  { category: '🧂 調味料', value: 'Soy_sauce', label: '醬油 / Soy Sauce' },
  { category: '🧂 調味料', value: 'Cooking_oil', label: '食用油 / Cooking Oil' },
  { category: '🧂 調味料', value: 'Vinegar', label: '醋 / Vinegar' },
  { category: '🧂 調味料', value: 'Salt', label: '鹽 / Salt' },
  { category: '🧂 調味料', value: 'Sugar', label: '糖 / Sugar' },

  // === 乾貨類 ===
  { category: '🌾 乾貨類', value: 'Flour', label: '麵粉 / Flour' },
  { category: '🌾 乾貨類', value: 'Seaweed_dried', label: '海苔 / Seaweed' },

  // === 冷凍食品 ===
  { category: '🥟 冷凍食品', value: 'Dumpling', label: '水餃 / Dumpling' },
  { category: '🥟 冷凍食品', value: 'Ice_cream', label: '冰淇淋 / Ice Cream' },

  // === 零食 ===
  { category: '🍫 零食', value: 'Snack', label: '餅乾 / Snack' },
  { category: '🍫 零食', value: 'Chocolate', label: '巧克力 / Chocolate' }
];