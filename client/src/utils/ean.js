// web/src/utils/ean.js
export function ean13CheckDigit(d12) {
  if (!/^\d{12}$/.test(d12)) throw new Error('需要 12 位數字');
  const ds = d12.split('').map(Number);
  const sumOdd  = ds[0] + ds[2] + ds[4] + ds[6] + ds[8] + ds[10];
  const sumEven = ds[1] + ds[3] + ds[5] + ds[7] + ds[9] + ds[11];
  const s = sumOdd + sumEven * 3;
  return (10 - (s % 10)) % 10;
}

export function isValidEan13(d13) {
  if (!/^\d{13}$/.test(d13)) return false;
  return ean13CheckDigit(d13.slice(0, 12)) === Number(d13[12]);
}

export function normalizeToEan13(input) {
  // 傳入 12 或 13 碼數字字串；回傳正確的 13 碼（12 碼會自動補第 13 碼）
  if (/^\d{12}$/.test(input)) {
    return input + ean13CheckDigit(input);
  }
  if (/^\d{13}$/.test(input)) {
    return input;
  }
  throw new Error('請輸入 12 或 13 位數字');
}
