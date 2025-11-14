import { useState } from 'react';
import { 
  useAddInventoryItemMutation,
  useEstimateShelfLifeMutation 
} from '../redux/services/foodCoreAPI';
import { inferDefaultsFromProduct } from '../inferDefaults';

/**
 * 添加庫存項目的自定義 hook
 * 統一處理庫存添加邏輯和成功訊息
 */
export const useAddToInventory = () => {
  const [addInventoryItem] = useAddInventoryItemMutation();
  
  const addToInventory = async (item, inventoryData, facts) => {
    try {
      console.log('Adding to inventory:', item);
      
      // 如果已經有保存期限資訊就直接使用，否則使用 inferDefaults
      let itemKey = item.itemKey || facts.itemKey;
      let storageMode = item.storageMode || facts.storageMode;
      let state = item.state || facts.state || 'whole';
      
      // 如果沒有 itemKey，嘗試使用 inferDefaults
      if (!itemKey) {
        const inferred = inferDefaultsFromProduct({
          name: item.name,
          brand: item.brand,
          category: item.category
        });
        
        if (inferred) {
          itemKey = inferred.itemKey;
          storageMode = inferred.storageMode;
          state = inferred.state;
        }
      }

      // 根據來源設置不同的標籤和備註
      const sourceInfo = {
        'google-vision': { source: 'ai-identified', prefix: 'AI 物件識別' },
        'ocr-identified': { source: 'ocr-identified', prefix: 'OCR 文字識別' },
        'barcode_lookup': { source: 'barcode-identified', prefix: '條碼查詢' },
        'barcode': { source: 'barcode-identified', prefix: '條碼查詢' }
      };
      
      const sourceData = sourceInfo[item.source] || { source: 'ai-identified', prefix: 'AI 識別' };
      
      // 構建新增庫存的資料
      const inventoryPayload = {
        itemKey: itemKey || `${sourceData.source.toUpperCase()}_${Date.now()}`,
        name: item.name || item.englishName || '未知食材',
        brand: item.brand || null,
        quantity: item.quantity || inventoryData.quantity || { amount: 1, unit: '個' },
        purchaseDate: inventoryData.purchaseDate || new Date().toISOString().split('T')[0],
        storageMode: storageMode || 'fridge',
        state: state,
        container: facts.container || 'none',
        source: sourceData.source,
        location: inventoryData.location || 'fridge_main',
        notes: buildItemNotes(item, sourceData.prefix, inventoryData.notes),
        // 包裝到期日（如果有的話）
        ...(item.source === 'ocr-identified' && item.expirationDate && {
          expirationDate: item.expirationDate,
        })
      };

      console.log('Inventory data to submit:', inventoryPayload);

      // 呼叫 API 新增到庫存
      const result = await addInventoryItem(inventoryPayload).unwrap();
      
      if (result.success) {
        const expirationInfo = result.estimate?.usedPackageExpiration 
          ? '📦 使用包裝標示效期' 
          : '🧠 根據食材規則計算';
          
        return {
          success: true,
          message: `✅ 已成功新增「${item.name}」到庫存！\n\n保存期限: ${result.estimate?.shelfLifeDays?.min || 0}-${result.estimate?.shelfLifeDays?.max || 0} 天\n到期日計算: ${expirationInfo}\n保存建議: ${result.estimate?.tips || '無'}`,
          result
        };
      } else {
        throw new Error(result.error || '新增失敗');
      }
      
    } catch (error) {
      console.error('Add to inventory failed:', error);
      return {
        success: false,
        message: `❌ 新增庫存失敗：${error.message || '未知錯誤'}`,
        error
      };
    }
  };

  // 建構項目備註的輔助函數
  const buildItemNotes = (item, sourcePrefix, additionalNotes = '') => {
    const notes = [sourcePrefix];
    
    if (item.confidence) {
      notes.push(`信心度: ${Math.round(item.confidence * 100)}%`);
    }
    
    if (item.shelfLife) {
      notes.push(`預估保存期限: ${item.shelfLife.daysMin}-${item.shelfLife.daysMax}天`);
    }
    
    if (item.expirationDate) {
      notes.push(`包裝標示效期: ${item.expirationDate}`);
    }
    
    if (item.category) {
      notes.push(`類別: ${item.category}`);
    }
    
    if (item.notes) {
      notes.push(item.notes);
    }

    if (additionalNotes) {
      notes.push(additionalNotes);
    }
    
    return notes.join(' | ');
  };

  return { addToInventory };
};

/**
 * 保存期限估算的自定義 hook
 */
export const useShelfLifeEstimate = () => {
  const [estimateShelfLife] = useEstimateShelfLifeMutation();

  const estimateAndSave = async (facts, inventoryData, barcode = null, manualName = null, shouldSave = false) => {
    try {
      if (!facts.itemKey) {
        throw new Error('請選擇食材種類');
      }

      const payload = {
        barcode,
        manualName,
        ...facts,
        save: shouldSave,
        // 庫存相關資料（如果要保存）
        ...(shouldSave && {
          quantity: inventoryData.quantity,
          purchaseDate: inventoryData.purchaseDate,
          location: inventoryData.location,
          source: barcode ? 'barcode' : 'manual',
          notes: inventoryData.notes
        })
      };

      const response = await estimateShelfLife(payload).unwrap();
      
      if (shouldSave && response.saved) {
        return {
          success: true,
          message: `✅ 已成功加入庫存！\n預估保存期限：${response.daysMin || 'N/A'}~${response.daysMax || 'N/A'} 天`,
          data: response
        };
      }

      return {
        success: true,
        data: response
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ ${shouldSave ? '加入庫存' : '估算'}失敗：${error.message || '未知錯誤'}`,
        error
      };
    }
  };

  return { estimateAndSave };
};