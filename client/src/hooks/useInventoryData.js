import { useState } from 'react';

/**
 * 庫存管理相關的自定義 hook
 * 統一處理庫存數據狀態和默認值
 */
export const useInventoryManagement = () => {
  const [inventoryData, setInventoryData] = useState({
    quantity: { amount: 1, unit: '個' },
    purchaseDate: new Date().toISOString().split('T')[0],
    location: 'fridge_main',
    notes: ''
  });

  const resetInventoryData = () => {
    setInventoryData({
      quantity: { amount: 1, unit: '個' },
      purchaseDate: new Date().toISOString().split('T')[0],
      location: 'fridge_main',
      notes: ''
    });
  };

  const updateInventoryData = (updates) => {
    setInventoryData(prev => ({
      ...prev,
      ...updates
    }));
  };

  return {
    inventoryData,
    setInventoryData,
    resetInventoryData,
    updateInventoryData
  };
};

/**
 * 保存情境相關的自定義 hook
 * 統一處理保存方式、狀態等配置
 */
export const useStorageContext = () => {
  const [facts, setFacts] = useState({ 
    itemKey: '', 
    storageMode: 'fridge', 
    state: 'whole', 
    container: 'none', 
    season: 'summer', 
    locale: 'TW' 
  });

  const resetFacts = () => {
    setFacts({ 
      itemKey: '', 
      storageMode: 'fridge', 
      state: 'whole', 
      container: 'none', 
      season: 'summer', 
      locale: 'TW' 
    });
  };

  const updateFacts = (updates) => {
    setFacts(prev => ({
      ...prev,
      ...updates
    }));
  };

  return {
    facts,
    setFacts,
    resetFacts,
    updateFacts
  };
};