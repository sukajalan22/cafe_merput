'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useOrders } from '@/lib/context/OrderContext';
import { BaristaOrderStatus } from '@/lib/types';
import {
  BaristaHeader,
  OrderStatusStats,
  OrderTabs,
  OrderCard,
  EmptyOrders,
  OrderTabType,
} from '@/components/features/barista';

export default function BaristaDashboardPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const { orders, updateOrderStatus, refreshOrders } = useOrders();
  const [activeTab, setActiveTab] = useState<OrderTabType>('all');

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleRefresh = useCallback(async () => {
    await refreshOrders();
  }, [refreshOrders]);

  const handleNewProductClick = (productId: string) => {
    // Navigate to product page with the specific product highlighted
    router.push(`/barista/produk?highlight=${productId}`);
  };

  const handleStatusChange = useCallback(async (orderId: string, newStatus: BaristaOrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Gagal mengubah status pesanan');
    }
  }, [updateOrderStatus]);

  // Filter out completed orders for display
  const activeOrders = useMemo(() => {
    return orders.filter((o) => o.status !== 'completed');
  }, [orders]);

  // Calculate stats
  const stats = useMemo(() => ({
    waiting: activeOrders.filter((o) => o.status === 'waiting').length,
    processing: activeOrders.filter((o) => o.status === 'processing').length,
    ready: activeOrders.filter((o) => o.status === 'ready').length,
  }), [activeOrders]);

  const counts = useMemo(() => ({
    all: activeOrders.length,
    ...stats,
  }), [activeOrders.length, stats]);

  // Filter orders based on active tab
  const filteredOrders = useMemo(() => {
    if (activeTab === 'all') {
      return activeOrders;
    }
    return activeOrders.filter((order) => order.status === activeTab);
  }, [activeOrders, activeTab]);

  const activeOrdersCount = stats.waiting + stats.processing;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <BaristaHeader
        activeOrdersCount={activeOrdersCount}
        onRefresh={handleRefresh}
        onSignOut={handleLogout}
        onNewProductClick={handleNewProductClick}
      />

      {/* Order Stats */}
      <OrderStatusStats stats={stats} />

      {/* Tabs */}
      <OrderTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={counts}
      />

      {/* Order List */}
      <div className="flex-1 p-6">
        {filteredOrders.length === 0 ? (
          <EmptyOrders
            message={
              activeTab === 'all'
                ? 'Tidak ada pesanan'
                : `Tidak ada pesanan ${
                    activeTab === 'waiting'
                      ? 'menunggu'
                      : activeTab === 'processing'
                      ? 'diproses'
                      : 'siap'
                  }`
            }
            description={
              activeTab === 'all'
                ? 'Belum ada pesanan yang masuk'
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
