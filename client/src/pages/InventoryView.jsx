import React, { useState } from 'react';
import InventoryItem from '../components/InventoryItem.jsx';
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
    <div style={{ padding: 20, fontFamily: 'ui-sans-serif, system-ui' }}>
      <h2>📦 我的食材庫存</h2>

      {/* 統計卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div style={{ padding: 16, backgroundColor: '#f0f9ff', borderRadius: 8, border: '1px solid #e0f2fe' }}>
          <div style={{ fontSize: 20, fontWeight: 'bold', color: '#0369a1' }}>{stats.total || 0}</div>
          <div style={{ color: '#0284c7', fontSize: 14 }}>總項目</div>
        </div>
        
        <div style={{ padding: 16, backgroundColor: '#f0fdf4', borderRadius: 8, border: '1px solid #dcfce7' }}>
          <div style={{ fontSize: 20, fontWeight: 'bold', color: '#16a34a' }}>{stats.available || 0}</div>
          <div style={{ color: '#15803d', fontSize: 14 }}>可用庫存</div>
        </div>
        
        <div style={{ padding: 16, backgroundColor: '#fef3c7', borderRadius: 8, border: '1px solid #fde68a' }}>
          <div style={{ fontSize: 20, fontWeight: 'bold', color: '#d97706' }}>{stats.warning || 0}</div>
          <div style={{ color: '#b45309', fontSize: 14 }}>即將到期</div>
        </div>
        
        <div style={{ padding: 16, backgroundColor: '#fee2e2', borderRadius: 8, border: '1px solid #fecaca' }}>
          <div style={{ fontSize: 20, fontWeight: 'bold', color: '#dc2626' }}>{stats.expired || 0}</div>
          <div style={{ color: '#b91c1c', fontSize: 14 }}>已過期</div>
        </div>
        
        <div style={{ padding: 16, backgroundColor: '#f3f4f6', borderRadius: 8, border: '1px solid #d1d5db' }}>
          <div style={{ fontSize: 20, fontWeight: 'bold', color: '#10b981' }}>{stats.consumed || 0}</div>
          <div style={{ color: '#059669', fontSize: 14 }}>已消耗</div>
        </div>
      </div>

      {/* 即將到期提醒 */}
      {expiringItems.length > 0 && (
        <div style={{ 
          padding: 16, 
          backgroundColor: '#fef3c7', 
          borderRadius: 8, 
          border: '1px solid #fde68a',
          marginBottom: 16
        }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#92400e' }}>⚠️ 即將到期提醒</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {expiringItems.slice(0, 3).map((item, index) => (
              <div key={item._id || index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{item.name} ({item.quantity?.amount || 1} {item.quantity?.unit || '個'})</span>
                <span style={{ color: urgencyConfig[item.urgency]?.color || '#666' }}>
                  {formatDate(item.expiresMaxAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 篩選和排序控制 */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <label style={{ marginRight: 8 }}>篩選:</label>
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">全部</option>
            <option value="available">可用庫存</option>
            <option value="fresh">新鮮</option>
            <option value="warning">即將到期</option>
            <option value="expired">已過期</option>
            <option value="consumed">已消耗</option>
          </select>
        </div>
        
        <div>
          <label style={{ marginRight: 8 }}>排序:</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="expiresMaxAt">到期日</option>
            <option value="acquiredAt">加入時間</option>
            <option value="name">名稱</option>
          </select>
        </div>
        
        {selectedItems.size > 0 && (
          <button 
            onClick={handleBatchConsume}
            style={{ 
              backgroundColor: '#10b981', 
              color: 'white', 
              border: 'none', 
              padding: '8px 16px', 
              borderRadius: '4px' 
            }}
          >
            標記已消耗 ({selectedItems.size})
          </button>
        )}
      </div>

      {/* 庫存清單 */}
      <div style={{ display: 'grid', gap: 12 }}>
        {inventory.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: 40, 
            color: '#6b7280',
            border: '2px dashed #d1d5db',
            borderRadius: 8 
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <div>目前沒有庫存項目</div>
            <div style={{ fontSize: 14, marginTop: 8 }}>掃描或手動添加食材來建立你的庫存</div>
          </div>
        ) : (
          inventory.map(item => (
            <InventoryItem
              key={item._id}
              item={item}
              isSelected={selectedItems.has(item._id)}
              onSelect={() => toggleItemSelection(item._id)}
              onStatusUpdate={handleStatusUpdate}
              onDelete={handleDeleteItem}
              showCheckbox={true}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default InventoryView;