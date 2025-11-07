#!/usr/bin/env node

/**
 * AI 識別測試和比較工具
 * 用於測試和比較 OpenAI 和 Google Vision API 的性能
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// API 端點配置
const SERVER_BASE = 'http://localhost:4000/api';

/**
 * 測試單張圖片的識別效果
 */
async function testSingleImage(imagePath, options = {}) {
  try {
    console.log(`\n🧪 測試圖片: ${path.basename(imagePath)}`);
    
    // 讀取並轉換圖片為 base64
    const imageBuffer = fs.readFileSync(imagePath);
    const imageBase64 = imageBuffer.toString('base64');
    
    console.log(`📏 圖片大小: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
    
    // 測試混合識別策略
    const strategies = ['auto', 'openai', 'google', 'both'];
    const results = {};
    
    for (const strategy of strategies) {
      console.log(`\n🤖 測試策略: ${strategy}`);
      
      try {
        const startTime = Date.now();
        
        const response = await fetch(`${SERVER_BASE}/ai/identify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64,
            options: { ...options, strategy }
          })
        });
        
        const result = await response.json();
        const processingTime = Date.now() - startTime;
        
        results[strategy] = {
          ...result,
          actualProcessingTime: processingTime
        };
        
        console.log(`⏱️  處理時間: ${processingTime}ms`);
        console.log(`✅ 成功: ${result.success}`);
        console.log(`📊 識別項目: ${result.totalItems || 0}`);
        
        if (result.success && result.items) {
          result.items.forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.name} (${(item.confidence * 100).toFixed(1)}%)`);
          });
        }
        
        if (result.error) {
          console.log(`❌ 錯誤: ${result.error}`);
        }
        
      } catch (error) {
        console.log(`❌ 請求失敗: ${error.message}`);
        results[strategy] = { 
          success: false, 
          error: error.message,
          actualProcessingTime: null
        };
      }
    }
    
    return results;
    
  } catch (error) {
    console.error(`❌ 測試失敗: ${error.message}`);
    return null;
  }
}

/**
 * 測試 OCR 功能
 */
async function testOCR(imagePath, options = {}) {
  try {
    console.log(`\n📝 測試 OCR: ${path.basename(imagePath)}`);
    
    const imageBuffer = fs.readFileSync(imagePath);
    const imageBase64 = imageBuffer.toString('base64');
    
    const strategies = ['auto', 'openai', 'google', 'both'];
    const results = {};
    
    for (const strategy of strategies) {
      console.log(`\n🔍 OCR 策略: ${strategy}`);
      
      try {
        const startTime = Date.now();
        
        const response = await fetch(`${SERVER_BASE}/ai/hybrid-ocr`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64,
            options: { ...options, strategy }
          })
        });
        
        const result = await response.json();
        const processingTime = Date.now() - startTime;
        
        results[strategy] = {
          ...result,
          actualProcessingTime: processingTime
        };
        
        console.log(`⏱️  處理時間: ${processingTime}ms`);
        console.log(`✅ 成功: ${result.success}`);
        
        if (result.success && result.text) {
          Object.entries(result.text).forEach(([key, value]) => {
            if (value && key !== 'allText') {
              console.log(`   ${key}: ${value}`);
            }
          });
          
          if (result.text.allText) {
            const textLength = result.text.allText.length;
            console.log(`   📄 全文長度: ${textLength} 字元`);
            if (textLength < 200) {
              console.log(`   📄 全文: ${result.text.allText.replace(/\n/g, ' ').substring(0, 100)}...`);
            }
          }
        }
        
      } catch (error) {
        console.log(`❌ OCR 請求失敗: ${error.message}`);
        results[strategy] = { 
          success: false, 
          error: error.message,
          actualProcessingTime: null
        };
      }
    }
    
    return results;
    
  } catch (error) {
    console.error(`❌ OCR 測試失敗: ${error.message}`);
    return null;
  }
}

/**
 * 生成比較報告
 */
function generateComparisonReport(results, type = 'identification') {
  console.log(`\n📊 ${type === 'identification' ? '食材識別' : 'OCR'} 比較報告`);
  console.log('='.repeat(60));
  
  const strategies = Object.keys(results);
  
  // 成功率比較
  console.log('\n📈 成功率比較:');
  strategies.forEach(strategy => {
    const success = results[strategy]?.success || false;
    const emoji = success ? '✅' : '❌';
    console.log(`   ${strategy.padEnd(10)} ${emoji} ${success ? '成功' : '失敗'}`);
  });
  
  // 處理時間比較
  console.log('\n⏱️  處理時間比較:');
  strategies.forEach(strategy => {
    const time = results[strategy]?.actualProcessingTime;
    if (time !== null && time !== undefined) {
      console.log(`   ${strategy.padEnd(10)} ${time.toString().padStart(6)}ms`);
    } else {
      console.log(`   ${strategy.padEnd(10)}      - ms`);
    }
  });
  
  if (type === 'identification') {
    // 識別項目數量比較
    console.log('\n📊 識別項目數量:');
    strategies.forEach(strategy => {
      const count = results[strategy]?.totalItems || 0;
      console.log(`   ${strategy.padEnd(10)} ${count.toString().padStart(6)} 項`);
    });
    
    // 平均信心度比較
    console.log('\n🎯 平均信心度:');
    strategies.forEach(strategy => {
      const items = results[strategy]?.items || [];
      if (items.length > 0) {
        const avgConfidence = items.reduce((sum, item) => sum + (item.confidence || 0), 0) / items.length;
        console.log(`   ${strategy.padEnd(10)} ${(avgConfidence * 100).toFixed(1).padStart(5)}%`);
      } else {
        console.log(`   ${strategy.padEnd(10)}     -%`);
      }
    });
  }
  
  // 推薦策略
  console.log('\n💡 推薦策略:');
  const successfulStrategies = strategies.filter(s => results[s]?.success);
  
  if (successfulStrategies.length === 0) {
    console.log('   ❌ 沒有成功的策略');
  } else {
    // 按處理時間排序 (成功的策略中)
    const sortedByTime = successfulStrategies
      .filter(s => results[s].actualProcessingTime !== null)
      .sort((a, b) => (results[a].actualProcessingTime || 0) - (results[b].actualProcessingTime || 0));
    
    if (sortedByTime.length > 0) {
      console.log(`   🚀 速度最快: ${sortedByTime[0]} (${results[sortedByTime[0]].actualProcessingTime}ms)`);
    }
    
    // 按準確度排序 (識別模式下)
    if (type === 'identification') {
      const sortedByAccuracy = successfulStrategies
        .filter(s => (results[s].totalItems || 0) > 0)
        .sort((a, b) => {
          const avgA = (results[a].items || []).reduce((sum, item) => sum + (item.confidence || 0), 0) / (results[a].items?.length || 1);
          const avgB = (results[b].items || []).reduce((sum, item) => sum + (item.confidence || 0), 0) / (results[b].items?.length || 1);
          return avgB - avgA;
        });
      
      if (sortedByAccuracy.length > 0) {
        const bestStrategy = sortedByAccuracy[0];
        const avgConfidence = (results[bestStrategy].items || []).reduce((sum, item) => sum + (item.confidence || 0), 0) / (results[bestStrategy].items?.length || 1);
        console.log(`   🎯 準確度最高: ${bestStrategy} (${(avgConfidence * 100).toFixed(1)}%)`);
      }
    }
  }
}

/**
 * 檢查 AI 服務狀態
 */
async function checkAIStatus() {
  try {
    console.log('🔍 檢查 AI 服務狀態...');
    
    const response = await fetch(`${SERVER_BASE}/ai/status`);
    const status = await response.json();
    
    console.log('\n🤖 AI 服務狀態:');
    console.log(`   AI 啟用: ${status.aiEnabled ? '✅ 是' : '❌ 否'}`);
    
    if (status.providers && status.providers.length > 0) {
      console.log('\n🔧 可用提供商:');
      status.providers.forEach(provider => {
        console.log(`   📡 ${provider.name}`);
        if (provider.model) {
          console.log(`      模型: ${provider.model}`);
        }
        console.log(`      功能: ${provider.capabilities.join(', ')}`);
      });
    }
    
    if (status.hybrid) {
      console.log('\n🔄 混合策略:');
      console.log(`   啟用: ${status.hybrid.enabled ? '✅ 是' : '❌ 否'}`);
      console.log(`   可用策略: ${status.hybrid.strategies.join(', ')}`);
      console.log(`   推薦策略: ${status.hybrid.recommended}`);
    }
    
    return status;
    
  } catch (error) {
    console.error(`❌ 檢查服務狀態失敗: ${error.message}`);
    return null;
  }
}

/**
 * 主函數
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🤖 AI 識別測試和比較工具

使用方式:
  node test-ai.js <command> [options]

指令:
  status                    檢查 AI 服務狀態
  identify <image_path>     測試食材識別
  ocr <image_path>         測試 OCR 功能
  compare <image_path>      比較所有策略
  help                     顯示幫助

範例:
  node test-ai.js status
  node test-ai.js identify ./test-images/apple.jpg
  node test-ai.js ocr ./test-images/package.jpg  
  node test-ai.js compare ./test-images/mixed.jpg
`);
    return;
  }
  
  const command = args[0];
  
  switch (command) {
    case 'status':
      await checkAIStatus();
      break;
      
    case 'identify':
      if (args.length < 2) {
        console.error('❌ 請提供圖片路徑');
        return;
      }
      const identifyResults = await testSingleImage(args[1]);
      if (identifyResults) {
        generateComparisonReport(identifyResults, 'identification');
      }
      break;
      
    case 'ocr':
      if (args.length < 2) {
        console.error('❌ 請提供圖片路徑');
        return;
      }
      const ocrResults = await testOCR(args[1]);
      if (ocrResults) {
        generateComparisonReport(ocrResults, 'ocr');
      }
      break;
      
    case 'compare':
      if (args.length < 2) {
        console.error('❌ 請提供圖片路徑');
        return;
      }
      console.log('🔄 執行完整比較測試...');
      const status = await checkAIStatus();
      if (status && status.aiEnabled) {
        const identifyResults = await testSingleImage(args[1]);
        const ocrResults = await testOCR(args[1]);
        
        if (identifyResults) {
          generateComparisonReport(identifyResults, 'identification');
        }
        
        if (ocrResults) {
          generateComparisonReport(ocrResults, 'ocr');
        }
      } else {
        console.log('❌ AI 服務未啟用，請檢查配置');
      }
      break;
      
    case 'help':
    default:
      console.log('使用 "node test-ai.js" 查看幫助');
      break;
  }
}

// 執行主函數
main().catch(console.error);