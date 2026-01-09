'use client';

import { useState, useEffect } from 'react';
import { StockReceipt, StockReceiptItem, MaterialOrder } from '@/lib/types';
import { getOrders } from '@/lib/services/orders';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface ReceiptFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<StockReceipt, 'id' | 'status' | 'createdAt'>) => void;
}

function ReceiptFormContent({ onClose, onSubmit }: Omit<ReceiptFormProps, 'isOpen'>) {
  // Get orders that can be received (Dikirim or Pending status)
  const [availableOrders, setAvailableOrders] = useState<MaterialOrder[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const orders = await getOrders();
      setAvailableOrders(orders.filter((o) => o.status === 'Dikirim' || o.status === 'Pending'));
    };
    fetchOrders();
  }, []);

  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<StockReceiptItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedOrder = availableOrders.find((o) => o.id === selectedOrderId);

  // When order is selected, populate items from order
  const handleOrderChange = (orderId: string) => {
    setSelectedOrderId(orderId);
    const order = availableOrders.find((o) => o.id === orderId);
    if (order) {
      const receiptItems: StockReceiptItem[] = order.items.map((item) => ({
        materialId: item.materialId,
        materialName: item.materialName,
        orderedQuantity: item.quantity,
        receivedQuantity: item.quantity, // Default to full quantity
        unit: item.unit,
      }));
      setItems(receiptItems);
    } else {
      setItems([]);
    }
  };

  const updateItemQuantity = (index: number, receivedQuantity: number) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      receivedQuantity: Math.max(0, receivedQuantity),
    };
    setItems(newItems);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedOrderId) {
      newErrors.orderId = 'Pesanan wajib dipilih';
    }

    if (!receiptDate) {
      newErrors.receiptDate = 'Tanggal penerimaan wajib diisi';
    }

    if (items.length === 0) {
      newErrors.items = 'Tidak ada item untuk diterima';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !selectedOrder) return;

    onSubmit({
      orderId: selectedOrderId,
      supplierId: selectedOrder.supplierId,
      supplierName: selectedOrder.supplierName,
      items,
      receiptDate: new Date(receiptDate),
    });

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pilih Pesanan
          </label>
          <select
            value={selectedOrderId}
            onChange={(e) => handleOrderChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${errors.orderId ? 'border-red-500' : 'border-gray-300'
              }`}
          >
            <option value="">-- Pilih Pesanan --</option>
            {availableOrders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.id} - {order.supplierName} ({order.status})
              </option>
            ))}
          </select>
          {errors.orderId && (
            <p className="mt-1 text-sm text-red-600">{errors.orderId}</p>
          )}
        </div>

        <Input
          label="Tanggal Penerimaan"
          type="date"
          value={receiptDate}
          onChange={(e) => setReceiptDate(e.target.value)}
          error={errors.receiptDate}
        />
      </div>

      {selectedOrder && (
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Supplier:</span> {selectedOrder.supplierName}
          </p>
        </div>
      )}

      {/* Items Section */}
      {items.length > 0 && (
        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Item Penerimaan
          </label>
          {errors.items && (
            <p className="text-sm text-red-600 mb-3">{errors.items}</p>
          )}

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Bahan Baku
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Dipesan
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Diterima
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {item.materialName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {item.orderedQuantity} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <input
                          type="number"
                          value={item.receivedQuantity}
                          onChange={(e) => updateItemQuantity(index, Number(e.target.value))}
                          min="0"
                          max={item.orderedQuantity}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                        />
                        <span className="text-sm text-gray-500 w-12">{item.unit}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {availableOrders.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Tidak ada pesanan yang dapat diterima.
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" disabled={availableOrders.length === 0 || !selectedOrderId}>
          Simpan Penerimaan
        </Button>
      </div>
    </form>
  );
}

export function ReceiptForm({ isOpen, onClose, onSubmit }: ReceiptFormProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Catat Penerimaan Stok" className="max-w-2xl">
      {isOpen && <ReceiptFormContent onClose={onClose} onSubmit={onSubmit} />}
    </Modal>
  );
}

export default ReceiptForm;
