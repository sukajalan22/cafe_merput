'use client';

import { useState, useCallback, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { MaterialOrder } from '@/lib/types';
import {
  getOrders,
  searchOrders,
} from '@/lib/services/orders';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Card } from '@/components/ui/Card';
import { OrdersTable } from '@/components/features/pemesanan-bahan/OrdersTable';
import { OrderForm } from '@/components/features/pemesanan-bahan/OrderForm';
import { OrderDetail } from '@/components/features/pemesanan-bahan/OrderDetail';

export default function PemesananBahanPage() {
  const [orders, setOrders] = useState<MaterialOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<MaterialOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  const refreshOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getOrders();
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch orders on mount
  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  // Apply search filter
  const filteredOrders = searchOrders(orders, searchQuery);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleCreateOrder = () => {
    setIsFormOpen(true);
  };

  const handleViewDetail = (order: MaterialOrder) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const handleFormSubmit = () => {
    refreshOrders();
    setIsFormOpen(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pemesanan Bahan</h1>
        <Button onClick={handleCreateOrder} icon={<Plus className="h-4 w-4" />}>
          Buat Pesanan
        </Button>
      </div>

      <Card>
        {/* Search */}
        <div className="mb-6 flex items-center justify-between">
          <SearchInput
            placeholder="Cari berdasarkan ID atau supplier..."
            value={searchQuery}
            onSearch={setSearchQuery}
            className="max-w-md"
          />
          {totalPages > 1 && (
            <span className="text-sm text-gray-500">
              Halaman {currentPage} dari {totalPages}
            </span>
          )}
        </div>

        {/* Orders Table */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500">Memuat data...</p>
            </div>
          </div>
        ) : (
          <>
            <OrdersTable
              orders={currentOrders}
              onViewDetail={handleViewDetail}
            />

            {/* Pagination */}
            {filteredOrders.length > 0 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">
                  Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredOrders.length)} dari {filteredOrders.length} pesanan
                </p>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'primary' : 'secondary'}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </Card>

      {/* Create Order Form Modal */}
      <OrderForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      {/* Order Detail Modal */}
      <OrderDetail
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
      />
    </div>
  );
}
