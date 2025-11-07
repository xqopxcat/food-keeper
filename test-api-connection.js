#!/usr/bin/env node

/**
 * API 連接測試腳本
 * 用於驗證 OpenAI 和 Google Vision API 的設定是否正確
 * 
 * 使用方法:
 * node test-api-connection.js
 * node test-api-connection.js --openai
 * node test-api-connection.js --google
 */

import 'dotenv/config';

// 測試 OpenAI API 連接
async function testOpenAI() {
  console.log('\n🤖 測試 OpenAI API 連接...');
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log('❌ 未設定 OPENAI_API_KEY 環境變數');
    return false;
  }

  if (!apiKey.startsWith('sk-')) {
    console.log('❌ OPENAI_API_KEY 格式錯誤（應該以 sk- 開頭）');
    return false;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      const gptModels = data.data.filter(model => 
        model.id.includes('gpt-4') && model.id.includes('vision') || 
        model.id.includes('gpt-4o')
      );
      
      console.log('✅ OpenAI API 連接成功！');
      console.log(`📊 可用的視覺模型數量: ${gptModels.length}`);
      console.log(`🎯 推薦模型: ${process.env.OPENAI_MODEL || 'gpt-4o-mini'}`);
      
      if (gptModels.length > 0) {
        console.log('🔍 可用模型:');
        gptModels.slice(0, 3).forEach(model => {
          console.log(`   - ${model.id}`);
        });
      }
      return true;
    } else {
      const error = await response.text();
      console.log(`❌ OpenAI API 錯誤 (${response.status}): ${error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ OpenAI API 連接失敗: ${error.message}`);
    return false;
  }
}

// 測試 Google Vision API 連接
async function testGoogleVision() {
  console.log('\n👁️ 測試 Google Vision API 連接...');
  
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  if (!projectId) {
    console.log('❌ 未設定 GOOGLE_CLOUD_PROJECT_ID 環境變數');
    return false;
  }

  if (!credentials) {
    console.log('❌ 未設定 GOOGLE_APPLICATION_CREDENTIALS 環境變數');
    return false;
  }

  try {
    // 檢查憑證檔案是否存在
    const fs = await import('fs');
    if (!fs.existsSync(credentials)) {
      console.log(`❌ 找不到憑證檔案: ${credentials}`);
      return false;
    }

    // 嘗試讀取憑證檔案
    const credentialsContent = JSON.parse(fs.readFileSync(credentials, 'utf8'));
    console.log(`✅ 憑證檔案載入成功`);
    console.log(`📧 服務帳號: ${credentialsContent.client_email}`);
    console.log(`🆔 專案 ID: ${credentialsContent.project_id}`);

    // 檢查專案 ID 是否一致
    if (credentialsContent.project_id !== projectId) {
      console.log(`⚠️  警告: 環境變數中的專案 ID (${projectId}) 與憑證檔案中的不一致 (${credentialsContent.project_id})`);
    }

    // 嘗試初始化 Vision 客戶端
    const vision = await import('@google-cloud/vision');
    const client = new vision.ImageAnnotatorClient({
      projectId: projectId,
      keyFilename: credentials
    });

    console.log('✅ Google Vision API 初始化成功！');
    console.log(`🎯 專案 ID: ${projectId}`);
    console.log(`💰 每月免費額度: 1000 次請求`);
    
    return true;
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('❌ Google Vision SDK 未安裝');
      console.log('💡 請執行: npm install @google-cloud/vision');
    } else {
      console.log(`❌ Google Vision API 設定錯誤: ${error.message}`);
    }
    return false;
  }
}

// 測試環境變數完整性
function testEnvironmentVariables() {
  console.log('\n⚙️ 檢查環境變數設定...');
  
  const requiredVars = {
    'MONGODB_URI': process.env.MONGODB_URI,
    'OPENAI_API_KEY': process.env.OPENAI_API_KEY,
    'OPENAI_MODEL': process.env.OPENAI_MODEL,
    'GOOGLE_CLOUD_PROJECT_ID': process.env.GOOGLE_CLOUD_PROJECT_ID,
    'GOOGLE_APPLICATION_CREDENTIALS': process.env.GOOGLE_APPLICATION_CREDENTIALS
  };

  let allSet = true;
  
  Object.entries(requiredVars).forEach(([key, value]) => {
    if (value) {
      console.log(`✅ ${key}: ${key.includes('KEY') ? '已設定 (已隱藏)' : value}`);
    } else {
      console.log(`❌ ${key}: 未設定`);
      allSet = false;
    }
  });

  return allSet;
}

// 顯示幫助信息
function showHelp() {
  console.log(`
🧪 API 連接測試工具 - 當前專注 Google Vision API

使用方法:
  node test-api-connection.js           # 測試所有 API (優先 Google Vision)
  node test-api-connection.js --google  # 測試 Google Vision (推薦)  
  node test-api-connection.js --openai  # 測試 OpenAI (備用)
  node test-api-connection.js --env     # 只檢查環境變數
  node test-api-connection.js --help    # 顯示此幫助

當前設定策略:
🎯 主要服務: Google Vision API (每月1000次免費)
🔄 備用服務: OpenAI API (保留程式碼，可重新啟用)

設定步驟:
1. 優先設定 Google Vision API (推薦)
2. 複製 .env.example 到 .env  
3. 填入 Google Cloud 專案 ID 和憑證路徑
4. 執行此測試腳本驗證設定

必要的環境變數:
- GOOGLE_CLOUD_PROJECT_ID      # Google Cloud 專案 ID (優先)
- GOOGLE_APPLICATION_CREDENTIALS # 服務帳號 JSON 檔案路徑 (優先)
- OPENAI_API_KEY              # OpenAI API 金鑰 (可選，備用)
- MONGODB_URI                 # MongoDB 連接字串
`);
}

// 主函數
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  console.log('🚀 Food Keeper API 連接測試');
  console.log('=' .repeat(40));

  let testResults = {
    env: false,
    openai: false,
    google: false
  };

  // 總是先檢查環境變數
  testResults.env = testEnvironmentVariables();

  if (args.includes('--env')) {
    return; // 只檢查環境變數就結束
  }

  // 根據參數決定要測試什麼
  if (args.includes('--openai')) {
    testResults.openai = await testOpenAI();
  } else if (args.includes('--google')) {
    testResults.google = await testGoogleVision();
  } else {
    // 預設優先測試 Google Vision，然後測試 OpenAI
    testResults.google = await testGoogleVision();
    testResults.openai = await testOpenAI();
  }

  // 顯示結果摘要
  console.log('\n📊 測試結果摘要');
  console.log('=' .repeat(40));
  
  if (testResults.env !== null) {
    console.log(`環境變數: ${testResults.env ? '✅ 完整' : '❌ 缺失'}`);
  }
  
  if (testResults.openai !== null) {
    console.log(`OpenAI API: ${testResults.openai ? '✅ 正常' : '❌ 錯誤'}`);
  }
  
  if (testResults.google !== null) {
    console.log(`Google Vision: ${testResults.google ? '✅ 正常' : '❌ 錯誤'}`);
  }

  // 給出建議
  const googlePassed = testResults.google === true;
  const openaiPassed = testResults.openai === true;
  
  if (googlePassed) {
    console.log('\n🎉 Google Vision API 測試通過！推薦使用此服務');
    console.log('💰 每月1000次免費額度，適合大多數使用場景');
    console.log('\n💡 下一步: 啟動伺服器並測試識別功能');
    console.log('   cd server && npm run dev');
    
    if (openaiPassed) {
      console.log('\n✨ OpenAI 也已設定，可作為備用服務');
    }
  } else if (openaiPassed) {
    console.log('\n⚠️ Google Vision 設定失敗，但 OpenAI 可用作為備援');
    console.log('💡 建議優先設定 Google Vision API 以享受免費額度');
  } else {
    console.log('\n❌ 所有 API 測試失败，請檢查上述錯誤訊息並修正設定');
    console.log('\n📖 詳細設定指南請參考: API_SETUP_GUIDE.md');
    console.log('🚀 快速設定請參考: QUICK_SETUP_CHECKLIST.md');
  }
}

// 執行主函數
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}