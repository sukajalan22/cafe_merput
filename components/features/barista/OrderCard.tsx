'use client';

import { Clock, ChefHat, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BaristaOrder, BaristaOrderStatus } from '@/lib/types';

interface OrderCardProps {
  order: BaristaOrder;
  onStatusChange: (orderId: string, newStatus: BaristaOrderStatus) => void;
}

const statusConfig = {
  waiting: {
    label: 'Menunggu',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: Clock,
    nextStatus: 'processing' as const,
    nextLabel: 'Proses Pesanan',
  },
  processing: {
    label: 'Diproses',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: ChefHat,
    nextStatus: 'ready' as const,
    nextLabel: 'Selesai',
  },
  ready: {
    label: 'Siap',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: CheckCircle,
    nextStatus: 'completed' as const,
    nextLabel: 'Serahkan',
  },
  completed: {
    label: 'Selesai',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: CheckCircle,
    nextStatus: null,
    nextLabel: null,
  },
};

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getTimeDiff(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;

  const diffHours = Math.floor(diffMins / 60);
  return `${diffHours} jam lalu`;
}

export function OrderCard({ order, onStatusChange }: OrderCardProps) {
  const config = statusConfig[order.status];
  const StatusIcon = config.icon;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">#{order.orderNumber}</span>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${config.color}`}>
            <StatusIcon size={14} />
            <span className="text-xs font-medium">{config.label}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock size={14} />
          <span>{formatTime(order.createdAt)}</span>
          <span className="text-gray-300">•</span>
          <span>{getTimeDiff(order.createdAt)}</span>
        </div>
      </div>

      <div className="p-4">
        <ul className="space-y-2">
          {order.items.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                {item.quantity}x
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                {item.notes && (
                  <p className="text-xs text-gray-500 mt-0.5">{item.notes}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {config.nextStatus && (
        <div className="px-4 pb-4">
          <Button
            variant={order.status === 'waiting' ? 'primary' : 'success'}
            className="w-full"
            onClick={() => onStatusChange(order.id, config.nextStatus!)}
          >
            {config.nextLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

export default OrderCard;
