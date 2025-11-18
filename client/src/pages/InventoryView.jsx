import React, { useState } from 'react';
import InventoryItem from '../components/InventoryItem.jsx';
import HeaderBar from '../components/HeaderBar.jsx';
import Card, { StatusCard, ActionCard } from '../components/Card.jsx';
import { DESIGN_SYSTEM, COMMON_STYLES } from '../styles/designSystem.js';
import { 
  useGetInventoryQuery,
  useGetExpiringItemsQuery,
  useGetInventoryStatsQuery,
  useUpdateInventoryItemMutation,
  useDeleteInventoryItemMutation,
  useConsumeItemsMutation
} from '../redux/services/foodCoreAPI';
import { urgencyConfig } from '../constants';

const InventoryView = () => {
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [filter, setFilter] = useState('all'); // all, fresh, warning, expired, consumed, available
  const [sortBy, setSortBy] = useState('expiresMaxAt');

  // RTK Query hooks
  const inventoryParams = {
    ...(filter !== 'all' && { status: filter }),
    sortBy,
    order: sortBy === 'expiryDate' ? 'asc' : 'desc'
  };
  
  const {
    data: inventoryData,
    isLoading: inventoryLoading,
    error: inventoryError
  } = useGetInventoryQuery(inventoryParams);

  const {
    data: expiringData,
    isLoading: expiringLoading,
  } = useGetExpiringItemsQuery(3);

  const {
    data: statsData,
    isLoading: statsLoading,
  } = useGetInventoryStatsQuery();

  // Mutations
  const [updateInventoryItem] = useUpdateInventoryItemMutation();
  const [deleteInventoryItem] = useDeleteInventoryItemMutation();
  const [consumeItems] = useConsumeItemsMutation();

  // 處理函數
  async function handleStatusUpdate(itemId, newStatus) {
    try {
      await updateInventoryItem({ itemId, updateData: { status: newStatus } }).unwrap();
    } catch (err) {
      alert(`更新失敗: ${err.message || '未知錯誤'}`);
    }
  }

  async function handleDeleteItem(itemId) {
    if (!confirm('確定要刪除這個項目嗎？')) return;
    
    try {
      await deleteInventoryItem(itemId).unwrap();
    } catch (err) {
      alert(`刪除失敗: ${err.message || '未知錯誤'}`);
    }
  }

  async function handleBatchConsume() {
    if (selectedItems.size === 0) return;
    
    try {
      await consumeItems(Array.from(selectedItems)).unwrap();
      setSelectedItems(new Set());
    } catch (err) {
      alert(`批量處理失敗: ${err.message || '未知錯誤'}`);
    }
  }

  function toggleItemSelection(itemId) {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  }

  function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const today = new Date();
    const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '明天';
    if (diffDays === -1) return '昨天';
    if (diffDays > 0) return `${diffDays} 天後`;
    return `${Math.abs(diffDays)} 天前`;
  }

  // 載入狀態
  const isLoading = inventoryLoading || expiringLoading || statsLoading;
  
  // 錯誤處理
  if (inventoryError) {
    return <div style={{ padding: 20, color: 'red' }}>錯誤: {inventoryError.message || '載入失敗'}</div>;
  }

  // 載入中
  if (isLoading) {
    return <div style={{ padding: 20 }}>載入中...</div>;
  }

  // 數據處理
  const inventory = inventoryData?.items || [];
  const expiringItems = expiringData?.expiringItems || [];
  const stats = statsData?.stats || {};

  return (
    <div style={COMMON_STYLES.pageContainer}>
      <HeaderBar 
        title="📦 我的庫存"
        subtitle={`${inventory.length} 項食材`}
      />

      <div className="responsive-container" style={COMMON_STYLES.container}>
        {/* 統計卡片區域 */}
        <div className="grid-responsive-stats" style={{
          marginBottom: DESIGN_SYSTEM.spacing.xl
        }}>
          <StatusCard
            status="info"
            icon="📊"
            title="總項目"
            value={stats.total || 0}
            unit=""
          />
          
          <StatusCard
            status="success"
            icon="✅"
            title="可用"
            value={stats.available || 0}
            unit=""
          />
          
          <StatusCard
            status="warning"
            icon="⚠️"
            title="即將到期"
            value={stats.warning || 0}
            unit=""
          />
          
          <StatusCard
            status="error"
            icon="❌"
            title="已過期"
            value={stats.expired || 0}
            unit=""
          />
        </div>

        {/* 即將到期提醒 */}
        {expiringItems.length > 0 && (
          <Card 
            title="⚠️ 即將到期提醒"
            style={{
              marginBottom: DESIGN_SYSTEM.spacing.lg,
              backgroundColor: DESIGN_SYSTEM.colors.warning + '10',
              borderColor: DESIGN_SYSTEM.colors.warning + '30'
            }}
          >
            <div style={{ display: 'grid', gap: DESIGN_SYSTEM.spacing.sm }}>
              {expiringItems.slice(0, 3).map((item, index) => (
                <div key={item._id || index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: DESIGN_SYSTEM.spacing.md,
                  backgroundColor: DESIGN_SYSTEM.colors.white,
                  borderRadius: DESIGN_SYSTEM.borderRadius.lg,
                  border: `1px solid ${DESIGN_SYSTEM.colors.warning}20`,
                  fontSize: DESIGN_SYSTEM.typography.sizes.sm
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: DESIGN_SYSTEM.spacing.sm }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: urgencyConfig[item.urgency]?.color || DESIGN_SYSTEM.colors.warning
                    }} />
                    <span style={{ fontWeight: '500' }}>
                      {item.name} ({item.quantity?.amount || 1} {item.quantity?.unit || '個'})
                    </span>
                  </div>
                  <span style={{
                    color: urgencyConfig[item.urgency]?.color || DESIGN_SYSTEM.colors.gray[600],
                    fontWeight: '600',
                    fontSize: DESIGN_SYSTEM.typography.sizes.xs
                  }}>
                    {formatDate(item.expiresMaxAt)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 篩選控制區 */}
        <Card 
          title="🔍 篩選與排序"
          style={{ marginBottom: DESIGN_SYSTEM.spacing.lg }}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: DESIGN_SYSTEM.spacing.md,
            marginBottom: DESIGN_SYSTEM.spacing.md
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: DESIGN_SYSTEM.spacing.xs,
                fontSize: DESIGN_SYSTEM.typography.sizes.sm,
                fontWeight: '500',
                color: DESIGN_SYSTEM.colors.gray[700]
              }}>
                篩選狀態
              </label>
              <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: DESIGN_SYSTEM.spacing.sm,
                  border: `1px solid ${DESIGN_SYSTEM.colors.gray[300]}`,
                  borderRadius: DESIGN_SYSTEM.borderRadius.lg,
                  fontSize: DESIGN_SYSTEM.typography.sizes.sm,
                  backgroundColor: DESIGN_SYSTEM.colors.white,
                  cursor: 'pointer'
                }}
              >
                <option value="all">全部項目</option>
                <option value="available">可用庫存</option>
                <option value="fresh">新鮮狀態</option>
                <option value="warning">即將到期</option>
                <option value="expired">已過期</option>
                <option value="consumed">已消耗</option>
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: DESIGN_SYSTEM.spacing.xs,
                fontSize: DESIGN_SYSTEM.typography.sizes.sm,
                fontWeight: '500',
                color: DESIGN_SYSTEM.colors.gray[700]
              }}>
                排序方式
              </label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{
                  width: '100%',
                  padding: DESIGN_SYSTEM.spacing.sm,
                  border: `1px solid ${DESIGN_SYSTEM.colors.gray[300]}`,
                  borderRadius: DESIGN_SYSTEM.borderRadius.lg,
                  fontSize: DESIGN_SYSTEM.typography.sizes.sm,
                  backgroundColor: DESIGN_SYSTEM.colors.white,
                  cursor: 'pointer'
                }}
              >
                <option value="expiresMaxAt">到期日期</option>
                <option value="acquiredAt">加入時間</option>
                <option value="name">名稱排序</option>
              </select>
            </div>
          </div>

          {selectedItems.size > 0 && (
            <button
              onClick={handleBatchConsume}
              style={{
                ...COMMON_STYLES.primaryButton,
                width: '100%'
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
              ✅ 標記已消耗 ({selectedItems.size} 項)
            </button>
          )}
        </Card>

        {/* 庫存清單 */}
        <Card 
          title={`📋 庫存清單 ${inventory.length > 0 ? `(${inventory.length})` : ''}`}
        >
          {inventory.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: `${DESIGN_SYSTEM.spacing.xl} ${DESIGN_SYSTEM.spacing.lg}`,
              color: DESIGN_SYSTEM.colors.gray[500]
            }}>
              <div style={{
                fontSize: '64px',
                marginBottom: DESIGN_SYSTEM.spacing.lg,
                opacity: 0.6
              }}>
                📭
              </div>
              <div style={{
                fontSize: DESIGN_SYSTEM.typography.sizes.lg,
                fontWeight: '600',
                marginBottom: DESIGN_SYSTEM.spacing.sm,
                color: DESIGN_SYSTEM.colors.gray[600]
              }}>
                目前沒有庫存項目
              </div>
              <div style={{
                fontSize: DESIGN_SYSTEM.typography.sizes.sm,
                lineHeight: '1.5',
                marginBottom: DESIGN_SYSTEM.spacing.lg
              }}>
                掃描條碼或使用 AI 識別來建立你的食材庫存
              </div>
              <div style={{
                display: 'flex',
                gap: DESIGN_SYSTEM.spacing.sm,
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => window.location.href = '/scanner'}
                  style={{
                    ...COMMON_STYLES.primaryButton,
                    padding: `${DESIGN_SYSTEM.spacing.sm} ${DESIGN_SYSTEM.spacing.md}`
                  }}
                >
                  📱 條碼掃描
                </button>
                <button
                  onClick={() => window.location.href = '/ai-identification'}
                  style={{
                    ...COMMON_STYLES.secondaryButton,
                    padding: `${DESIGN_SYSTEM.spacing.sm} ${DESIGN_SYSTEM.spacing.md}`
                  }}
                >
                  🤖 AI 識別
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gap: DESIGN_SYSTEM.spacing.md
            }}>
              {inventory.map(item => (
                <div key={item._id} style={{
                  padding: DESIGN_SYSTEM.spacing.md,
                  backgroundColor: DESIGN_SYSTEM.colors.gray[50],
                  borderRadius: DESIGN_SYSTEM.borderRadius.lg,
                  border: `1px solid ${DESIGN_SYSTEM.colors.gray[200]}`,
                  transition: 'all 0.2s ease'
                }}>
                  <InventoryItem
                    item={item}
                    isSelected={selectedItems.has(item._id)}
                    onSelect={() => toggleItemSelection(item._id)}
                    onStatusUpdate={handleStatusUpdate}
                    onDelete={handleDeleteItem}
                    showCheckbox={true}
                  />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default InventoryView;