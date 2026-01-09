'use client';

import React, { useEffect, useState } from 'react';
import { X, Package, Info, AlertTriangle, Bell } from 'lucide-react';
import { useRealTimeNotifications } from '@/lib/hooks/useRealTimeNotifications';
import { type Notification } from '@/lib/services/notifications';

interface ToastNotification extends Notification {
  id: string;
  showTime: number;
}

interface RealTimeNotificationToastProps {
  onNotificationClick?: (notification: Notification) => void;
}

export function RealTimeNotificationToast({ onNotificationClick }: RealTimeNotificationToastProps) {
  const { notifications } = useRealTimeNotifications();
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Add new notifications as toasts
  useEffect(() => {
    console.log('🔍 Checking notifications for toasts:', notifications.length);

    notifications.forEach(notification => {
      console.log('📋 Processing notification:', notification);

      // Check if this notification is already shown as toast
      const exists = toasts.some(toast =>
        toast.type === notification.type &&
        toast.title === notification.title &&
        Math.abs(new Date(toast.createdAt).getTime() - new Date(notification.createdAt).getTime()) < 5000
      );

      if (!exists) {
        console.log('🆕 Adding new toast for notification:', notification.title);

        const toastNotification: ToastNotification = {
          ...notification,
          id: `toast-${Date.now()}-${Math.random()}`,
          showTime: Date.now(),
        };

        setToasts(prev => {
          const newToasts = [toastNotification, ...prev.slice(0, 2)]; // Show max 3 toasts
          console.log('📱 Updated toasts:', newToasts.length);
          return newToasts;
        });

        // Auto remove after 5 seconds
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toastNotification.id));
        }, 5000);
      } else {
        console.log('⏭️ Notification already exists as toast, skipping');
      }
    });
  }, [notifications, toasts]); // Add toasts as dependency

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleToastClick = (toast: ToastNotification) => {
    console.log('Toast clicked:', toast);
    if (onNotificationClick) {
      onNotificationClick(toast);
    }
    removeToast(toast.id);
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'NEW_PRODUCT':
        return <Package className="w-5 h-5 text-blue-600" />;
      case 'MATERIAL_UPDATE':
        return <Info className="w-5 h-5 text-green-600" />;
      case 'STOCK_ALERT':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getToastColor = (type: Notification['type']) => {
    switch (type) {
      case 'NEW_PRODUCT':
        return 'border-blue-200 bg-blue-50';
      case 'MATERIAL_UPDATE':
        return 'border-green-200 bg-green-50';
      case 'STOCK_ALERT':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`max-w-sm w-full bg-white border-l-4 rounded-lg shadow-lg p-4 cursor-pointer transform transition-all duration-300 hover:scale-105 ${getToastColor(toast.type)}`}
          onClick={() => handleToastClick(toast)}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3 mt-0.5">
              {getIcon(toast.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {toast.title}
              </p>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {toast.message}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Baru saja
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
              className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}