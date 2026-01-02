'use client';

import { useState, useCallback, useEffect } from 'react';
import { Check, Eye, Package, Truck, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { getAuthToken } from '@/lib/services/auth';

interface PendingOrder {
  pengadaan_id: string;
  bahan_id: string;
  nama_bahan: string;
  satuan: string;
  jumlah: number;
  tanggal_pesan: string;
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

export default function PengadaanPenerimaanPage() {
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchPendingOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      // Fetch orders with status Pending or Dikirim
      const [pendingRes, dikirimRes] = await Promise.all([
        fetch('/api/orders?status=Pending', { headers: getHeaders() }),
        fetch('/api/orders?status=Dikirim', { headers: getHeaders() }),
      ]);

      const pendingData = await pendingRes.json();
      const dikirimData = await dikirimRes.json();

      const allOrders: PendingOrder[] = [
        ...(pendingData.success ? pendingData.data : []),
        ...(dikirimData.success ? dikirimData.data : []),
      ];

      // Sort by date descending
      allOrders.sort((a, b) => 
        new Date(b.tanggal_pesan).getTime() - new Date(a.tanggal_pesan).getTime()
      );

      setOrders(allOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingOrders();
  }, [fetchPendingOrders]);

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

  const handleConfirmReceipt = async () => {
    if (!selectedOrder) return;

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/orders/${selectedOrder.pengadaan_id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          status: 'Diterima',
          tanggal_terima: new Date().toISOString().split('T')[0],
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert(`Penerimaan berhasil! Stok ${selectedOrder.nama_bahan} bertambah ${selectedOrder.jumlah} ${selectedOrder.satuan}`);
        setIsConfirmOpen(false);
        setSelectedOrder(null);
        fetchPendingOrders();
      } else {
        alert('Gagal mengkonfirmasi penerimaan: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to confirm receipt:', error);
      alert('Terjadi kesalahan saat mengkonfirmasi penerimaan');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateToShipped = async (order: PendingOrder) => {
    try {
      const response = await fetch(`/api/orders/${order.pengadaan_id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status: 'Dikirim' }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        fetchPendingOrders();
      } else {
        alert('Gagal mengubah status: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

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
      default:
        return <Badge variant="info">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'Dikirim':
        return <Truck className="h-4 w-4 text-blue-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Penerimaan Stok</h1>
          <p className="text-gray-500 mt-1">Verifikasi dan konfirmasi penerimaan bahan baku</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Menunggu Pengiriman</p>
              <p className="text-2xl font-bold text-gray-900">
                {orders.filter(o => o.status === 'Pending').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Truck className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Dalam Pengiriman</p>
              <p className="text-2xl font-bold text-gray-900">
                {orders.filter(o => o.status === 'Dikirim').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-6 flex items-center justify-between">
          <SearchInput
            placeholder="Cari berdasarkan ID pesanan atau nama bahan..."
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
            <p>{searchQuery ? 'Tidak ada pesanan ditemukan' : 'Tidak ada pesanan yang perlu diterima'}</p>
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
                      Tanggal Pesan
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
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(order.status)}
                          <span className="text-sm font-medium text-gray-900">
                            {order.nama_bahan}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {order.jumlah} {order.satuan}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {order.status === 'Pending' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleUpdateToShipped(order)}
                            >
                              <Truck className="h-4 w-4 mr-1" />
                              Dikirim
                            </Button>
                          )}
                          {order.status === 'Dikirim' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order);
                                setIsConfirmOpen(true);
                              }}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Terima
                            </Button>
                          )}
                        </div>
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

      {/* Confirm Receipt Modal */}
      <Modal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setSelectedOrder(null);
        }}
        title="Konfirmasi Penerimaan"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">ID Pesanan:</span>
                <span className="text-sm font-mono">{selectedOrder.pengadaan_id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Bahan Baku:</span>
                <span className="text-sm font-medium">{selectedOrder.nama_bahan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Jumlah:</span>
                <span className="text-sm font-medium">{selectedOrder.jumlah} {selectedOrder.satuan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Tanggal Pesan:</span>
                <span className="text-sm">{formatDate(selectedOrder.tanggal_pesan)}</span>
              </div>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                Dengan mengkonfirmasi penerimaan, stok <strong>{selectedOrder.nama_bahan}</strong> akan 
                bertambah sebanyak <strong>{selectedOrder.jumlah} {selectedOrder.satuan}</strong>.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsConfirmOpen(false);
                  setSelectedOrder(null);
                }}
                disabled={isProcessing}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmReceipt}
                disabled={isProcessing}
              >
                {isProcessing ? 'Memproses...' : 'Konfirmasi Penerimaan'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
