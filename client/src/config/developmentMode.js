// 開發模式配置
export const DEV_CONFIG = {
  // 開發模式開關
  isDevelopment: import.meta.env.MODE === 'development',
  
  // API 成本控制 (從環境變數讀取)
  useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true',
  
  // API 調用限制 (從環境變數讀取)
  apiLimits: {
    vision: parseInt(import.meta.env.VITE_VISION_API_DAILY_LIMIT) || 10,
    gemini: parseInt(import.meta.env.VITE_GEMINI_API_DAILY_LIMIT) || 5,
    ocr: parseInt(import.meta.env.VITE_OCR_API_DAILY_LIMIT) || 8,
  },
  
  // 顯示開發面板
  showDevPanel: import.meta.env.VITE_SHOW_DEV_PANEL === 'true',
  
  // API 日誌記錄
  enableApiLogging: import.meta.env.VITE_ENABLE_API_LOGGING === 'true',
  
  // 當日已使用次數 (可以存在 localStorage)
  dailyUsage: {
    vision: 0,
    gemini: 0,
    ocr: 0,
  },
  
  // 重置時間 (每日重置)
  lastReset: new Date().toDateString(),
};

// 檢查是否可以調用 API
export const canUseAPI = (apiType) => {
  const today = new Date().toDateString();
  
  // 如果是新的一天，重置計數
  if (DEV_CONFIG.lastReset !== today) {
    DEV_CONFIG.dailyUsage = { vision: 0, gemini: 0, ocr: 0 };
    DEV_CONFIG.lastReset = today;
    localStorage.setItem('foodkeeper_api_usage', JSON.stringify(DEV_CONFIG.dailyUsage));
    localStorage.setItem('foodkeeper_last_reset', today);
  }
  
  // 從 localStorage 讀取使用記錄
  const savedUsage = localStorage.getItem('foodkeeper_api_usage');
  if (savedUsage) {
    Object.assign(DEV_CONFIG.dailyUsage, JSON.parse(savedUsage));
  }
  
  return DEV_CONFIG.dailyUsage[apiType] < DEV_CONFIG.apiLimits[apiType];
};

// 記錄 API 使用
export const recordAPIUsage = (apiType) => {
  DEV_CONFIG.dailyUsage[apiType]++;
  localStorage.setItem('foodkeeper_api_usage', JSON.stringify(DEV_CONFIG.dailyUsage));
};

// 獲取剩餘配額
export const getRemainingQuota = () => {
  return {
    vision: Math.max(0, DEV_CONFIG.apiLimits.vision - DEV_CONFIG.dailyUsage.vision),
    gemini: Math.max(0, DEV_CONFIG.apiLimits.gemini - DEV_CONFIG.dailyUsage.gemini),
    ocr: Math.max(0, DEV_CONFIG.apiLimits.ocr - DEV_CONFIG.dailyUsage.ocr),
  };
};