'use client';

import { useState, useCallback, useEffect } from 'react';
import { Plus, Eye, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { OrderForm } from '@/components/features/pemesanan-bahan/OrderForm';
import { getAuthToken } from '@/lib/services/auth';

interface MaterialOrder {
  pengadaan_id: string;
  bahan_id: string;
  nama_bahan: string;
  satuan: string;
  jumlah: number;
  tanggal_pesan: string;
  tanggal_terima: string | null;
  status: 'Pending' | 'Dikirim' | 'Diterima';
  username: string;
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  const token = getAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

const ITEMS_PER_PAGE = 10;

export default function PengadaanPemesananPage() {
  const [orders, setOrders] = useState<MaterialOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<MaterialOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/orders', {
        headers: getHeaders(),
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.pengadaan_id.toLowerCase().includes(query) ||
      order.nama_bahan.toLowerCase().includes(query)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'Dikirim':
        return <Badge variant="info">Dikirim</Badge>;
      case 'Diterima':
        return <Badge variant="success">Diterima</Badge>;
      default:
        return <Badge variant="info">{status}</Badge>;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pemesanan Bahan</h1>
          <p className="text-gray-500 mt-1">Kelola pemesanan bahan baku</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} icon={<Plus className="h-4 w-4" />}>
          Buat Pesanan
        </Button>
      </div>

      <Card>
        <div className="mb-6 flex items-center justify-between">
          <SearchInput
            placeholder="Cari berdasarkan ID atau nama bahan..."
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

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500">Memuat data...</p>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Package className="h-12 w-12 mb-2" />
            <p>{searchQuery ? 'Tidak ada pesanan ditemukan' : 'Belum ada pesanan'}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ID Pesanan
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tanggal
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Bahan Baku
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Jumlah
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentOrders.map((order, index) => (
                    <tr key={order.pengadaan_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-gray-900">
                          {order.pengadaan_id.slice(0, 8)}...
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(order.tanggal_pesan)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {order.nama_bahan}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {order.jumlah} {order.satuan}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsDetailOpen(true);
                          }}
                          icon={<Eye className="h-4 w-4" />}
                        >
                          Detail
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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

      {/* Order Form Modal */}
      <OrderForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={fetchOrders}
      />

      {/* Order Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedOrder(null);
        }}
        title="Detail Pesanan"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">ID Pesanan</p>
                <p className="font-mono text-sm">{selectedOrder.pengadaan_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                {getStatusBadge(selectedOrder.status)}
              </div>
              <div>
                <p className="text-sm text-gray-500">Bahan Baku</p>
                <p className="font-medium">{selectedOrder.nama_bahan}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Jumlah</p>
                <p className="font-medium">{selectedOrder.jumlah} {selectedOrder.satuan}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tanggal Pesan</p>
                <p>{formatDate(selectedOrder.tanggal_pesan)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tanggal Terima</p>
                <p>{selectedOrder.tanggal_terima ? formatDate(selectedOrder.tanggal_terima) : '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Dibuat oleh</p>
                <p>{selectedOrder.username}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
