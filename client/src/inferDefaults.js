// 規則：由「產品名稱/品牌/分類」推 itemKey + storageMode
const MAPS = [
  // 乾麵／泡麵（常溫）
  { test: /拉王|拉麵|泡麵|拉面|instant\s*noodle|noodle/i, itemKey: 'Instant_noodle', storageMode: 'room' },

  // 乳品
  { test: /鮮奶|牛奶|milk/i, itemKey: 'Milk', storageMode: 'fridge' },
  { test: /優格|yogurt/i, itemKey: 'Yogurt', storageMode: 'fridge' },
  { test: /起司|乾酪|cheese/i, itemKey: 'Cheese', storageMode: 'fridge' },
  { test: /奶油|butter/i, itemKey: 'Butter', storageMode: 'fridge' },

  // 蔬果
  { test: /橘|柳橙|orange/i, itemKey: 'Citrus_orange', storageMode: 'fridge' },
  { test: /蘋果|apple/i, itemKey: 'Apple', storageMode: 'fridge' },
  { test: /香蕉|banana/i, itemKey: 'Banana', storageMode: 'room' },
  { test: /蒜|garlic/i, itemKey: 'Garlic_bulb', storageMode: 'room' },
  { test: /薑|ginger/i, itemKey: 'Ginger', storageMode: 'fridge' },
  { test: /洋蔥|onion/i, itemKey: 'Onion', storageMode: 'room' },
  { test: /番茄|tomato/i, itemKey: 'Tomato', storageMode: 'room' },

  // 肉類/海鮮（預設生鮮）
  { test: /雞|chicken/i, itemKey: 'Chicken_meat', storageMode: 'fridge' },
  { test: /豬|pork/i, itemKey: 'Pork_meat', storageMode: 'fridge' },
  { test: /牛|beef/i, itemKey: 'Beef_meat', storageMode: 'fridge' },
  { test: /魚|fish/i, itemKey: 'Fish', storageMode: 'fridge' },
  { test: /蝦|shrimp/i, itemKey: 'Shrimp', storageMode: 'freezer' },

  // 穀物乾貨
  { test: /米|生米|rice/i, itemKey: 'Rice_uncooked', storageMode: 'room' },
  { test: /麵粉|flour/i, itemKey: 'Flour', storageMode: 'room' },
  { test: /海苔|海藻|seaweed/i, itemKey: 'Seaweed_dried', storageMode: 'room' },
  { test: /麵包|bread/i, itemKey: 'Bread', storageMode: 'room' },
];

export function inferDefaultsFromProduct(product) {
  // 可用欄位：name / brand / category
  const hay = [
    product?.name || '',
    product?.brand || '',
    product?.category || ''
  ].join(' ');
  for (const r of MAPS) {
    if (r.test.test(hay)) {
      return {
        itemKey: r.itemKey,
        storageMode: r.storageMode,
        state: 'whole',
        container: 'none'
      };
    }
  }
  // 沒推到就回 null，交給 UI 提示
  return null;
}
