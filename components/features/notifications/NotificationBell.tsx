'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X, Package, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { getNotifications, markNotificationsAsRead, type Notification } from '@/lib/services/notifications';
import { getAuthToken } from '@/lib/services/auth';
import { useRealTimeNotifications } from '@/lib/hooks/useRealTimeNotifications';

interface NotificationBellProps {
  onNewProductClick?: (productId: string) => void;
}

export function NotificationBell({ onNewProductClick }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use real-time notifications with polling
  const { isConnected, unreadCount: realtimeUnreadCount, refresh: refreshRealtime } = useRealTimeNotifications();

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      // Check if token exists before fetching
      const token = getAuthToken();
      if (!token) {
        console.warn('No auth token found, skipping notification fetch');
        setIsLoading(false);
        return;
      }
      
      const data = await getNotifications();
      console.log('Fetched notifications:', data.length, 'items');
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Update unread count from real-time hook
  useEffect(() => {
    if (realtimeUnreadCount > 0) {
      setUnreadCount(realtimeUnreadCount);
      // Refresh full notifications list when count changes
      if (isOpen) {
        fetchNotifications();
      }
    }
  }, [realtimeUnreadCount, isOpen]);

  const handleMarkAsRead = async (notificationIds: string[]) => {
    try {
      const success = await markNotificationsAsRead(notificationIds);
      if (success) {
        setNotifications(prev => 
          prev.map(n => 
            notificationIds.includes(n.id) ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
      }
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if not already
    if (!notification.isRead) {
      handleMarkAsRead([notification.id]);
    }

    // Handle specific notification types
    if ((notification.type === 'NEW_PRODUCT' || notification.type === 'MATERIAL_UPDATE') && onNewProductClick && notification.data?.productId) {
      onNewProductClick(notification.data.productId as string);
      setIsOpen(false);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'NEW_PRODUCT':
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'STOCK_ALERT':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'MATERIAL_UPDATE':
        return <Info className="w-4 h-4 text-green-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Baru saja';
    if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} jam yang lalu`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} hari yang lalu`;
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2"
        title={isConnected ? 'Notifikasi (Auto-update aktif)' : 'Notifikasi (Offline)'}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
        {/* Connection indicator - green dot when connected */}
        <div 
          className={`absolute -bottom-1 -right-1 w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-gray-400'
          }`}
          title={isConnected ? 'Terhubung' : 'Terputus'}
        ></div>
      </Button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[420px] z-50">
          <Card className="shadow-xl border border-gray-200 bg-white rounded-lg">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex-1"></div>
                <div className="flex items-center gap-2">
                  {isConnected && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-gray-600">Auto-update</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 flex items-center justify-end gap-1">
                  <button
                    onClick={() => {
                      fetchNotifications();
                      refreshRealtime();
                    }}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                    title="Refresh manual"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  Memuat notifikasi...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>Tidak ada notifikasi</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                        !notification.isRead ? 'bg-blue-50/30' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            {getNotificationIcon(notification.type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-gray-900 text-sm">
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-gray-600 mt-0.5 text-xs leading-relaxed">
                            {notification.message}
                          </p>
                          <p className="text-gray-400 mt-1 text-xs">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {unreadCount > 0 && (
              <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    const unreadIds = notifications
                      .filter(n => !n.isRead)
                      .map(n => n.id);
                    if (unreadIds.length > 0) {
                      handleMarkAsRead(unreadIds);
                    }
                  }}
                  className="w-full text-xs text-blue-600 hover:text-blue-700 font-medium py-1.5 hover:bg-blue-50 rounded transition-colors"
                >
                  Tandai semua sebagai dibaca
                </button>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}