const nameToItemKey = [
  // === 水果類 ===
  { match: /橘|柳橙|orange/i, itemKey: 'Citrus_orange' },
  { match: /蘋果|apple/i, itemKey: 'Apple' },
  { match: /香蕉|banana/i, itemKey: 'Banana' },
  { match: /草莓|strawberry/i, itemKey: 'Strawberry' },
  { match: /藍莓|blueberry/i, itemKey: 'Blueberry' },
  { match: /葡萄|grape/i, itemKey: 'Grape' },
  { match: /檸檬|lemon/i, itemKey: 'Lemon' },
  { match: /萊姆|lime/i, itemKey: 'Lime' },
  { match: /鳳梨|pineapple/i, itemKey: 'Pineapple' },
  { match: /西瓜|watermelon/i, itemKey: 'Watermelon' },
  { match: /酪梨|avocado/i, itemKey: 'Avocado' },

  // === 蔬菜類 ===
  { match: /番茄|西紅柿|tomato/i, itemKey: 'Tomato' },
  { match: /小黃瓜|黃瓜|cucumber/i, itemKey: 'Cucumber' },
  { match: /甜椒|彩椒|bell.*pepper/i, itemKey: 'Bell_pepper' },
  { match: /菠菜|spinach/i, itemKey: 'Spinach' },
  { match: /萵苣|生菜|lettuce/i, itemKey: 'Lettuce_leafy' },
  { match: /小白菜|青江菜|bok.*choy/i, itemKey: 'Bok_choy' },
  { match: /花椰菜|綠花椰|broccoli/i, itemKey: 'Broccoli' },
  { match: /紅蘿蔔|胡蘿蔔|carrot/i, itemKey: 'Carrot' },
  { match: /馬鈴薯|potato/i, itemKey: 'Potato' },
  { match: /洋蔥|onion/i, itemKey: 'Onion' },
  { match: /薑|生薑|ginger/i, itemKey: 'Ginger' },
  { match: /蔥|青蔥|green.*onion/i, itemKey: 'Green_onion' },
  { match: /蒜|大蒜|garlic/i, itemKey: 'Garlic_bulb' },
  { match: /菇|蘑菇|mushroom/i, itemKey: 'Mushroom' },
  { match: /玉米|corn/i, itemKey: 'Corn' },

  // === 乳製品 ===
  { match: /鮮奶|牛奶|milk/i, itemKey: 'Milk' },
  { match: /優格|酸奶|優酪乳|yogurt/i, itemKey: 'Yogurt' },
  { match: /起司|乳酪|cheese/i, itemKey: 'Cheese' },
  { match: /奶油|butter/i, itemKey: 'Butter' },

  // === 蛋類 ===
  { match: /雞蛋|蛋|egg/i, itemKey: 'Egg' },

  // === 豆製品 ===
  { match: /豆腐|tofu/i, itemKey: 'Tofu' },

  // === 肉類 ===
  { match: /雞|雞肉|chicken/i, itemKey: 'Chicken_meat' },
  { match: /豬|豬肉|pork/i, itemKey: 'Pork_meat' },
  { match: /牛|牛肉|beef/i, itemKey: 'Beef_meat' },
  { match: /魚|fish/i, itemKey: 'Fish' },
  { match: /蝦|shrimp/i, itemKey: 'Shrimp' },

  // === 加工肉品 ===
  { match: /火腿|ham/i, itemKey: 'Ham_sliced' },
  { match: /培根|bacon/i, itemKey: 'Bacon' },
  { match: /香腸|sausage/i, itemKey: 'Sausage' },

  // === 主食類 ===
  { match: /白米|米|生米|rice.*uncooked/i, itemKey: 'Rice_uncooked' },
  { match: /熟飯|米飯|cooked.*rice/i, itemKey: 'Rice_cooked' },
  { match: /麵包|bread/i, itemKey: 'Bread' },

  // === 麵食類 ===
  { match: /拉麵|ramen|泡麵|instant.*noodle|方便面/i, itemKey: 'Instant_noodle' },
  { match: /義大利麵|意面|pasta|spaghetti/i, itemKey: 'Pasta' },
  { match: /新鮮麵條|生麵|fresh.*noodle/i, itemKey: 'Noodle_fresh' },

  // === 發酵食品 ===
  { match: /泡菜|kimchi/i, itemKey: 'Kimchi' },
  { match: /味噌|miso/i, itemKey: 'Miso_paste' },

  // === 調味料 ===
  { match: /醬油|soy.*sauce/i, itemKey: 'Soy_sauce' },
  { match: /食用油|烹飪油|cooking.*oil|vegetable.*oil/i, itemKey: 'Cooking_oil' },
  { match: /醋|vinegar/i, itemKey: 'Vinegar' },
  { match: /鹽|salt/i, itemKey: 'Salt' },
  { match: /糖|sugar/i, itemKey: 'Sugar' },

  // === 乾貨類 ===
  { match: /麵粉|flour/i, itemKey: 'Flour' },
  { match: /海苔|海藻|seaweed/i, itemKey: 'Seaweed_dried' },

  // === 冷凍食品 ===
  { match: /水餃|餃子|dumpling/i, itemKey: 'Dumpling' },
  { match: /冰淇淋|ice.*cream/i, itemKey: 'Ice_cream' },
  
  // === 零食 ===
  { match: /餅乾|泡芙|puff|cookies/i, itemKey: 'Snack' },
  { match: /薯片|potato.*chips/i, itemKey: 'Snack' },
  { match: /巧克力|chocolate/i, itemKey: 'Chocolate' },
];


// 從 nameToItemKey 生成 storageMode 的對照表
const itemKeyToStorageMode = {
  // === 水果類 ===
  'Citrus_orange': 'fridge',
  'Apple': 'fridge',
  'Banana': 'room',
  'Strawberry': 'fridge',
  'Blueberry': 'fridge',
  'Grape': 'fridge',
  'Lemon': 'fridge',
  'Lime': 'fridge',
  'Pineapple': 'room',
  'Watermelon': 'fridge',
  'Avocado': 'room',

  // === 蔬菜類 ===
  'Tomato': 'room',
  'Cucumber': 'fridge',
  'Bell_pepper': 'fridge',
  'Spinach': 'fridge',
  'Lettuce_leafy': 'fridge',
  'Bok_choy': 'fridge',
  'Broccoli': 'fridge',
  'Carrot': 'fridge',
  'Potato': 'room',
  'Onion': 'room',
  'Ginger': 'fridge',
  'Green_onion': 'fridge',
  'Garlic_bulb': 'room',
  'Mushroom': 'fridge',
  'Corn': 'fridge',

  // === 乳製品 ===
  'Milk': 'fridge',
  'Yogurt': 'fridge',
  'Cheese': 'fridge',
  'Butter': 'fridge',

  // === 蛋類 ===
  'Egg': 'fridge',

  // === 豆製品 ===
  'Tofu': 'fridge',

  // === 肉類 ===
  'Chicken_meat': 'fridge',
  'Pork_meat': 'fridge',
  'Beef_meat': 'fridge',
  'Fish': 'fridge',
  'Shrimp': 'freezer',

  // === 加工肉品 ===
  'Ham_sliced': 'fridge',
  'Bacon': 'fridge',
  'Sausage': 'fridge',

  // === 主食類 ===
  'Rice_uncooked': 'room',
  'Rice_cooked': 'fridge',
  'Bread': 'room',

  // === 麵食類 ===
  'Instant_noodle': 'room',
  'Pasta': 'room',
  'Noodle_fresh': 'fridge',

  // === 發酵食品 ===
  'Kimchi': 'fridge',
  'Miso_paste': 'fridge',

  // === 調味料 ===
  'Soy_sauce': 'room',
  'Cooking_oil': 'room',
  'Vinegar': 'room',
  'Salt': 'room',
  'Sugar': 'room',

  // === 乾貨類 ===
  'Flour': 'room',
  'Seaweed_dried': 'room',

  // === 冷凍食品 ===
  'Dumpling': 'freezer',
  'Ice_cream': 'freezer',
  
  // === 零食 ===
  'Snack': 'room',
  'Chocolate': 'room',
};

// 台灣品牌專用規則 (優先匹配，因為品牌可能有特殊包裝或保存需求)
const BRAND_SPECIFIC_RULES = [
  // === 台灣品牌專用規則 ===
  // 統一企業產品
  { match: /統一.*麵|統一.*拉麵/i, itemKey: 'Instant_noodle', storageMode: 'room' },
  { match: /統一.*鮮奶|統一.*牛奶/i, itemKey: 'Milk', storageMode: 'fridge' },
  
  // 義美食品
  { match: /義美.*鮮奶|義美.*牛奶/i, itemKey: 'Milk', storageMode: 'fridge' },
  
  // 味全產品
  { match: /味全.*鮮奶|味全.*牛奶/i, itemKey: 'Milk', storageMode: 'fridge' },
  { match: /味全.*優酪乳/i, itemKey: 'Yogurt', storageMode: 'fridge' },
  
  // 維力食品
  { match: /維力.*麵|維力.*炸醬麵/i, itemKey: 'Instant_noodle', storageMode: 'room' },
  
  // 可以繼續添加更多台灣品牌...
];

export function inferDefaultsFromProduct(product) {
  // 可用欄位：name / brand / category
  const hay = [
    product?.name || '',
    product?.brand || '',
    product?.category || ''
  ].join(' ');
  console.log(hay);
  // 先嘗試品牌特定規則（台灣品牌優先，因為可能有特殊包裝需求）
  for (const rule of BRAND_SPECIFIC_RULES) {
    if (rule.match.test(hay)) {
      console.log('Inferred from Taiwan brand:', rule);
      return {
        itemKey: rule.itemKey,
        storageMode: rule.storageMode,
        state: 'whole',
        container: 'none'
      };
    }
  }
  
  // 再嘗試一般食材分類（使用統一的 nameToItemKey）
  for (const item of nameToItemKey) {
    console.log(item)
    if (item.match.test(hay)) {
      const storageMode = itemKeyToStorageMode[item.itemKey] || 'room';
      console.log('Inferred from general food category:', { itemKey: item.itemKey, storageMode });
      return {
        itemKey: item.itemKey,
        storageMode: storageMode,
        state: 'whole',
        container: 'none'
      };
    }
  }
  
  // 沒推到就回 null，交給 UI 提示
  return null;
}
