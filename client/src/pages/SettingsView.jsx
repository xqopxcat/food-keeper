import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderBar from '../components/HeaderBar';
import { useAuth } from '../contexts/AuthContext.jsx';
import { DESIGN_SYSTEM, COMMON_STYLES } from '../styles/designSystem.js';
import {
  useGetPushPublicKeyQuery,
  useSubscribePushMutation,
  useGetNotificationSettingsQuery,
  useUpdateNotificationSettingsMutation,
  useSendTestPushMutation,
} from '../redux/services/foodCoreAPI';

// 輔助函數：將 base64 轉為 Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

const SettingsView = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [notificationDays, setNotificationDays] = useState(3);
  const [notificationTime, setNotificationTime] = useState('09:00');
  const [isSubscribed, setIsSubscribed] = useState(false);

  // RTK Query hooks
  const { data: publicKeyData } = useGetPushPublicKeyQuery();
  const { data: settingsData, refetch: refetchSettings } = useGetNotificationSettingsQuery();
  const [subscribePush] = useSubscribePushMutation();
  const [updateSettings] = useUpdateNotificationSettingsMutation();
  const [sendTestPush] = useSendTestPushMutation();

  // 初始化設定
  useEffect(() => {
    if (settingsData) {
      setNotificationEnabled(settingsData.enabled || false);
      setNotificationDays(settingsData.notifyBeforeDays || 3);
      setNotificationTime(settingsData.notifyTime || '09:00');
      setIsSubscribed(settingsData.isSubscribed || false);
    }
  }, [settingsData]);

  const handleLogout = () => {
    // 顯示確認對話框
    if (window.confirm('確定要登出嗎？')) {
      logout();
      navigate('/login');
    }
  };

  // 訂閱推播
  const handleEnablePush = async () => {
    try {
      // 檢查瀏覽器支援
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        alert('您的瀏覽器不支援推播通知功能');
        return;
      }

      // 請求通知權限
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('請允許通知權限以使用推播功能');
        return;
      }

      // 註冊 Service Worker
      const registration = await navigator.serviceWorker.ready;

      // 訂閱推播
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKeyData?.publicKey)
      });

      // 發送訂閱資訊到後端
      await subscribePush(subscription.toJSON()).unwrap();
      
      setIsSubscribed(true);
      setNotificationEnabled(true);
      
      // 更新設定
      await updateSettings({
        enabled: true,
        notifyBeforeDays: notificationDays,
        notifyTime: notificationTime
      }).unwrap();
      
      alert('推播通知已啟用！');
      refetchSettings();
    } catch (error) {
      console.error('啟用推播失敗:', error);
      alert('啟用推播失敗: ' + (error.message || '未知錯誤'));
    }
  };

  // 更新設定
  const handleSaveSettings = async () => {
    try {
      await updateSettings({
        enabled: notificationEnabled,
        notifyBeforeDays: notificationDays,
        notifyTime: notificationTime
      }).unwrap();
      
      alert('設定已儲存！');
      refetchSettings();
    } catch (error) {
      console.error('儲存設定失敗:', error);
      alert('儲存設定失敗: ' + (error.message || '未知錯誤'));
    }
  };

  // 測試推播
  const handleTestPush = async () => {
    try {
      await sendTestPush().unwrap();
      alert('測試推播已發送！請檢查通知');
    } catch (error) {
      console.error('發送測試推播失敗:', error);
      alert('發送測試推播失敗: ' + (error.message || '未知錯誤'));
    }
  };

  const settingsItems = [
    {
      icon: '🎨',
      title: '主題設定',
      description: '選擇應用程式主題',
      action: () => alert('主題設定功能開發中...')
    },
    {
      icon: '📱',
      title: '關於應用程式',
      description: '版本資訊和使用條款',
      action: () => alert('關於應用程式功能開發中...')
    },
    {
      icon: '❓',
      title: '幫助與支援',
      description: '常見問題和客服聯繫',
      action: () => alert('幫助與支援功能開發中...')
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: DESIGN_SYSTEM.colors.gray[50],
      paddingBottom: DESIGN_SYSTEM.layout.bottomNavHeight
    }}>
      <HeaderBar title="設定" />
      
      <div className="responsive-container" style={{
        paddingTop: DESIGN_SYSTEM.spacing.lg,
        paddingBottom: DESIGN_SYSTEM.spacing.xl
      }}>
        {/* 使用者資訊卡片 */}
        {user && (
          <div style={{
            ...COMMON_STYLES.card,
            marginBottom: DESIGN_SYSTEM.spacing.lg,
            padding: DESIGN_SYSTEM.spacing.lg
          }}>
            <h3 style={{
              margin: 0,
              marginBottom: DESIGN_SYSTEM.spacing.lg,
              fontSize: DESIGN_SYSTEM.typography.sizes.lg,
              fontWeight: DESIGN_SYSTEM.typography.weights.semibold,
              color: DESIGN_SYSTEM.colors.gray[900]
            }}>
              帳戶資訊
            </h3>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: DESIGN_SYSTEM.spacing.md,
              marginBottom: DESIGN_SYSTEM.spacing.lg
            }}>
              {user.profile?.avatar ? (
                <img 
                  src={user.profile.avatar} 
                  alt={user.username}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: DESIGN_SYSTEM.colors.primary[100],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: DESIGN_SYSTEM.typography.sizes['2xl'],
                  fontWeight: DESIGN_SYSTEM.typography.weights.bold,
                  color: DESIGN_SYSTEM.colors.primary[600]
                }}>
                  {user.username ? user.username[0].toUpperCase() : '👤'}
                </div>
              )}
              
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: DESIGN_SYSTEM.typography.sizes.lg,
                  fontWeight: DESIGN_SYSTEM.typography.weights.semibold,
                  color: DESIGN_SYSTEM.colors.gray[900],
                  marginBottom: DESIGN_SYSTEM.spacing.xs
                }}>
                  {user.username}
                </div>
                <div style={{
                  fontSize: DESIGN_SYSTEM.typography.sizes.sm,
                  color: DESIGN_SYSTEM.colors.gray[600]
                }}>
                  {user.email}
                </div>
              </div>
              
              <div style={{
                padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.sm}`,
                backgroundColor: DESIGN_SYSTEM.colors.success + '20',
                borderRadius: DESIGN_SYSTEM.borderRadius.md,
                fontSize: DESIGN_SYSTEM.typography.sizes.xs,
                fontWeight: DESIGN_SYSTEM.typography.weights.semibold,
                color: DESIGN_SYSTEM.colors.success
              }}>
                已驗證
              </div>
            </div>
          </div>
        )}

        {/* 通知設定卡片 */}
        <div style={{
          ...COMMON_STYLES.card,
          marginBottom: DESIGN_SYSTEM.spacing.lg,
          padding: DESIGN_SYSTEM.spacing.lg
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: DESIGN_SYSTEM.spacing.md,
            marginBottom: DESIGN_SYSTEM.spacing.lg
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: DESIGN_SYSTEM.borderRadius.lg,
              backgroundColor: DESIGN_SYSTEM.colors.primary[50],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              🔔
            </div>
            <div>
              <h3 style={{
                margin: 0,
                fontSize: DESIGN_SYSTEM.typography.sizes.lg,
                fontWeight: DESIGN_SYSTEM.typography.weights.semibold,
                color: DESIGN_SYSTEM.colors.gray[900]
              }}>
                通知設定
              </h3>
              <p style={{
                margin: 0,
                fontSize: DESIGN_SYSTEM.typography.sizes.sm,
                color: DESIGN_SYSTEM.colors.gray[600]
              }}>
                管理應用程式通知與到期提醒
              </p>
            </div>
          </div>

          {/* 推播狀態 */}
          <div style={{
            padding: DESIGN_SYSTEM.spacing.md,
            backgroundColor: isSubscribed ? DESIGN_SYSTEM.colors.success + '10' : DESIGN_SYSTEM.colors.gray[50],
            borderRadius: DESIGN_SYSTEM.borderRadius.lg,
            marginBottom: DESIGN_SYSTEM.spacing.lg,
            border: `1px solid ${isSubscribed ? DESIGN_SYSTEM.colors.success + '30' : DESIGN_SYSTEM.colors.gray[200]}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: DESIGN_SYSTEM.spacing.sm
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isSubscribed ? DESIGN_SYSTEM.colors.success : DESIGN_SYSTEM.colors.gray[400]
              }} />
              <span style={{
                fontSize: DESIGN_SYSTEM.typography.sizes.sm,
                fontWeight: DESIGN_SYSTEM.typography.weights.medium,
                color: isSubscribed ? DESIGN_SYSTEM.colors.success : DESIGN_SYSTEM.colors.gray[600]
              }}>
                {isSubscribed ? '推播通知已啟用' : '推播通知未啟用'}
              </span>
            </div>
          </div>

          {!isSubscribed && (
            <button
              onClick={handleEnablePush}
              style={{
                ...COMMON_STYLES.primaryButton,
                width: '100%',
                marginBottom: DESIGN_SYSTEM.spacing.lg
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = DESIGN_SYSTEM.shadows.lg;
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = DESIGN_SYSTEM.shadows.button;
              }}
            >
              🔔 啟用推播通知
            </button>
          )}

          {isSubscribed && (
            <>
              {/* 通知開關 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: DESIGN_SYSTEM.spacing.md,
                backgroundColor: DESIGN_SYSTEM.colors.gray[50],
                borderRadius: DESIGN_SYSTEM.borderRadius.lg,
                marginBottom: DESIGN_SYSTEM.spacing.md
              }}>
                <div>
                  <div style={{
                    fontSize: DESIGN_SYSTEM.typography.sizes.base,
                    fontWeight: DESIGN_SYSTEM.typography.weights.semibold,
                    color: DESIGN_SYSTEM.colors.gray[900],
                    marginBottom: DESIGN_SYSTEM.spacing.xs
                  }}>
                    啟用通知
                  </div>
                  <div style={{
                    fontSize: DESIGN_SYSTEM.typography.sizes.sm,
                    color: DESIGN_SYSTEM.colors.gray[600]
                  }}>
                    接收食材到期提醒
                  </div>
                </div>
                <label style={{
                  position: 'relative',
                  display: 'inline-block',
                  width: '50px',
                  height: '28px'
                }}>
                  <input
                    type="checkbox"
                    checked={notificationEnabled}
                    onChange={(e) => setNotificationEnabled(e.target.checked)}
                    style={{
                      opacity: 0,
                      width: 0,
                      height: 0
                    }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: notificationEnabled ? DESIGN_SYSTEM.colors.primary[500] : DESIGN_SYSTEM.colors.gray[300],
                    borderRadius: '28px',
                    transition: '0.3s'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '',
                      height: '20px',
                      width: '20px',
                      left: notificationEnabled ? '26px' : '4px',
                      bottom: '4px',
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      transition: '0.3s'
                    }} />
                  </span>
                </label>
              </div>

              {/* 提醒天數 */}
              <div style={{
                marginBottom: DESIGN_SYSTEM.spacing.md
              }}>
                <label style={{
                  display: 'block',
                  marginBottom: DESIGN_SYSTEM.spacing.sm,
                  fontSize: DESIGN_SYSTEM.typography.sizes.sm,
                  fontWeight: DESIGN_SYSTEM.typography.weights.medium,
                  color: DESIGN_SYSTEM.colors.gray[700]
                }}>
                  提前提醒天數
                </label>
                <select
                  value={notificationDays}
                  onChange={(e) => setNotificationDays(Number(e.target.value))}
                  disabled={!notificationEnabled}
                  style={{
                    width: '100%',
                    padding: DESIGN_SYSTEM.spacing.md,
                    border: `1px solid ${DESIGN_SYSTEM.colors.gray[300]}`,
                    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
                    fontSize: DESIGN_SYSTEM.typography.sizes.base,
                    backgroundColor: DESIGN_SYSTEM.colors.white,
                    cursor: notificationEnabled ? 'pointer' : 'not-allowed',
                    opacity: notificationEnabled ? 1 : 0.5
                  }}
                >
                  <option value={1}>到期前 1 天</option>
                  <option value={2}>到期前 2 天</option>
                  <option value={3}>到期前 3 天</option>
                  <option value={5}>到期前 5 天</option>
                  <option value={7}>到期前 7 天</option>
                </select>
              </div>

              {/* 提醒時間 */}
              <div style={{
                marginBottom: DESIGN_SYSTEM.spacing.lg
              }}>
                <label style={{
                  display: 'block',
                  marginBottom: DESIGN_SYSTEM.spacing.sm,
                  fontSize: DESIGN_SYSTEM.typography.sizes.sm,
                  fontWeight: DESIGN_SYSTEM.typography.weights.medium,
                  color: DESIGN_SYSTEM.colors.gray[700]
                }}>
                  每日提醒時間
                </label>
                <input
                  type="time"
                  value={notificationTime}
                  onChange={(e) => setNotificationTime(e.target.value)}
                  disabled={!notificationEnabled}
                  style={{
                    width: '100%',
                    padding: DESIGN_SYSTEM.spacing.md,
                    border: `1px solid ${DESIGN_SYSTEM.colors.gray[300]}`,
                    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
                    fontSize: DESIGN_SYSTEM.typography.sizes.base,
                    backgroundColor: DESIGN_SYSTEM.colors.white,
                    cursor: notificationEnabled ? 'pointer' : 'not-allowed',
                    opacity: notificationEnabled ? 1 : 0.5
                  }}
                />
              </div>

              {/* 操作按鈕 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: DESIGN_SYSTEM.spacing.sm
              }}>
                <button
                  onClick={handleSaveSettings}
                  disabled={!notificationEnabled}
                  style={{
                    ...COMMON_STYLES.primaryButton,
                    opacity: notificationEnabled ? 1 : 0.5,
                    cursor: notificationEnabled ? 'pointer' : 'not-allowed'
                  }}
                >
                  💾 儲存設定
                </button>
                <button
                  onClick={handleTestPush}
                  disabled={!notificationEnabled}
                  style={{
                    ...COMMON_STYLES.secondaryButton,
                    opacity: notificationEnabled ? 1 : 0.5,
                    cursor: notificationEnabled ? 'pointer' : 'not-allowed'
                  }}
                >
                  📤 測試推播
                </button>
              </div>
            </>
          )}
        </div>

        {/* 其他設定選項 */}
        <div style={{
          ...COMMON_STYLES.card,
          marginBottom: DESIGN_SYSTEM.spacing.lg,
          padding: 0,
          overflow: 'hidden'
        }}>
          <h3 style={{
            margin: 0,
            padding: DESIGN_SYSTEM.spacing.lg,
            paddingBottom: 0,
            fontSize: DESIGN_SYSTEM.typography.sizes.lg,
            fontWeight: DESIGN_SYSTEM.typography.weights.semibold,
            color: DESIGN_SYSTEM.colors.gray[900]
          }}>
            應用程式設定
          </h3>
          
          {settingsItems.map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              style={{
                width: '100%',
                padding: DESIGN_SYSTEM.spacing.lg,
                border: 'none',
                borderBottom: index < settingsItems.length - 1 ? `1px solid ${DESIGN_SYSTEM.colors.gray[100]}` : 'none',
                backgroundColor: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: DESIGN_SYSTEM.spacing.md
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = DESIGN_SYSTEM.colors.gray[50];
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: DESIGN_SYSTEM.borderRadius.lg,
                backgroundColor: DESIGN_SYSTEM.colors.primary[50],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                {item.icon}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: DESIGN_SYSTEM.typography.sizes.base,
                  fontWeight: DESIGN_SYSTEM.typography.weights.semibold,
                  color: DESIGN_SYSTEM.colors.gray[900],
                  marginBottom: DESIGN_SYSTEM.spacing.xs
                }}>
                  {item.title}
                </div>
                <div style={{
                  fontSize: DESIGN_SYSTEM.typography.sizes.sm,
                  color: DESIGN_SYSTEM.colors.gray[600]
                }}>
                  {item.description}
                </div>
              </div>
              
              <div style={{
                fontSize: DESIGN_SYSTEM.typography.sizes.lg,
                color: DESIGN_SYSTEM.colors.gray[400]
              }}>
                ›
              </div>
            </button>
          ))}
        </div>

        {/* 登出按鈕 */}
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: `${DESIGN_SYSTEM.spacing.lg} ${DESIGN_SYSTEM.spacing.xl}`,
            backgroundColor: DESIGN_SYSTEM.colors.white,
            border: `2px solid ${DESIGN_SYSTEM.colors.error}30`,
            borderRadius: DESIGN_SYSTEM.borderRadius.lg,
            fontSize: DESIGN_SYSTEM.typography.sizes.base,
            fontWeight: DESIGN_SYSTEM.typography.weights.semibold,
            color: DESIGN_SYSTEM.colors.error,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: DESIGN_SYSTEM.spacing.sm,
            boxShadow: DESIGN_SYSTEM.shadows.button
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = DESIGN_SYSTEM.colors.error + '10';
            e.target.style.borderColor = DESIGN_SYSTEM.colors.error + '60';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = DESIGN_SYSTEM.shadows.md;
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = DESIGN_SYSTEM.colors.white;
            e.target.style.borderColor = DESIGN_SYSTEM.colors.error + '30';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = DESIGN_SYSTEM.shadows.button;
          }}
        >
          <span style={{ fontSize: '20px' }}>🔓</span>
          <span>登出帳戶</span>
        </button>

        {/* 版本資訊 */}
        <div style={{
          marginTop: DESIGN_SYSTEM.spacing.xl,
          textAlign: 'center',
          color: DESIGN_SYSTEM.colors.gray[500],
          fontSize: DESIGN_SYSTEM.typography.sizes.sm
        }}>
          <div>Food Keeper v1.0.0</div>
          <div style={{ marginTop: DESIGN_SYSTEM.spacing.xs }}>
            © 2025 智慧食材管理系統
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;