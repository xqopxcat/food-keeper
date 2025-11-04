// 你可以隨時擴充；key 可以是品牌或關鍵字（都轉小寫）
export const nameToItemKey = [
  { match: /鮮奶|milk/i, itemKey: 'Milk' },
  { match: /優格|yogurt/i, itemKey: 'Yogurt' },
  { match: /起司|cheese/i, itemKey: 'Cheese' },

  { match: /橘|柳橙|orange/i, itemKey: 'Citrus_orange' },
  { match: /檸檬|lemon/i, itemKey: 'Lemon' },
  { match: /萊姆|lime/i, itemKey: 'Lime' },

  { match: /蒜|garlic/i, itemKey: 'Garlic_bulb' },
  { match: /薑|ginger/i, itemKey: 'Ginger' },
  { match: /洋蔥|onion/i, itemKey: 'Onion' },

  { match: /蘋果|apple/i, itemKey: 'Apple' },
  { match: /香蕉|banana/i, itemKey: 'Banana' },
  { match: /草莓|strawberry/i, itemKey: 'Strawberry' },

  // 肉類（之後可用更嚴謹分類）
  { match: /雞|chicken/i, itemKey: 'Chicken_meat' },
  { match: /豬|pork/i, itemKey: 'Pork_meat' },
  { match: /牛|beef/i, itemKey: 'Beef_meat' },

  // 其他 ...
];

export function inferItemKeyFromName(name) {
  if (!name) return null;
  for (const rule of nameToItemKey) {
    if (rule.match.test(name)) return rule.itemKey;
  }
  return null;
}
