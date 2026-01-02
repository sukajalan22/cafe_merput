'use client';

import { useState, useEffect } from 'react';
import { Bell, Package, Info, AlertTriangle, Clock, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { getNotifications, markNotificationsAsRead, type Notification } from '@/lib/services/notifications';
import { useRealTimeNotifications } from '@/lib/hooks/useRealTimeNotifications';

interface NotificationPanelProps {
  onNotificationClick?: (notification: Notification) => void;
  className?: string;
}

interface ProminentNotificationPanelProps extends NotificationPanelProps {
  variant?: 'default' | 'prominent';
}

export function NotificationPanel({ onNotificationClick, className = '', variant = 'default' }: ProminentNotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use real-time notifications
  const { isConnected, notifications: realTimeNotifications } = useRealTimeNotifications();

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data.slice(0, 5)); // Show only latest 5
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

  // Update when real-time notifications arrive
  useEffect(() => {
    if (realTimeNotifications.length > 0) {
      setUnreadCount(prev => prev + realTimeNotifications.length);
      fetchNotifications();
    }
  }, [realTimeNotifications]);

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

    // Handle click
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const handleMarkAllAsRead = () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    if (unreadIds.length > 0) {
      handleMarkAsRead(unreadIds);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'NEW_PRODUCT':
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'MATERIAL_UPDATE':
        return <Info className="w-4 h-4 text-green-600" />;
      case 'STOCK_ALERT':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'NEW_PRODUCT':
        return 'border-l-blue-500 bg-blue-50';
      case 'MATERIAL_UPDATE':
        return 'border-l-green-500 bg-green-50';
      case 'STOCK_ALERT':
        return 'border-l-red-500 bg-red-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
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

  // Prominent variant styling
  const isProminent = variant === 'prominent';
  const buttonClasses = isProminent
    ? `relative flex items-center gap-2 ${unreadCount > 0 ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' : 'bg-white hover:bg-gray-50 border-2 border-gray-300'} px-4 py-2.5 rounded-lg font-medium transition-all`
    : 'relative flex items-center gap-2';

  return (
    <div className={`relative ${className}`}>
      {/* Notification Button */}
      <Button
        variant={isProminent ? undefined : (unreadCount > 0 ? "primary" : "secondary")}
        onClick={() => setIsExpanded(!isExpanded)}
        className={buttonClasses}
      >
        <Bell className={`${isProminent ? 'w-5 h-5' : 'w-4 h-4'} ${unreadCount > 0 && isProminent ? 'animate-pulse' : ''}`} />
        <span className={isProminent ? 'text-base' : ''}>Notifikasi</span>
        {unreadCount > 0 && (
          <Badge 
            variant="danger" 
            className={`ml-1 ${isProminent ? 'px-2 py-1 text-sm font-bold' : ''}`}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
        {/* Connection indicator */}
        {isConnected && (
          <div className={`absolute ${isProminent ? '-top-1 -right-1 w-3 h-3' : '-top-1 -right-1 w-2 h-2'} bg-green-500 rounded-full ${isProminent ? 'animate-pulse' : ''}`}></div>
        )}
      </Button>

      {/* Notification Panel */}
      {isExpanded && (
        <div className="absolute top-full right-0 mt-2 w-96 z-50">
          <Card className="shadow-lg border">
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Notifikasi Terbaru</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      className="text-xs"
                    >
                      Tandai semua dibaca
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(false)}
                    className="p-1"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Connection Status */}
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs text-gray-600">
                  {isConnected ? 'Terhubung - Real-time' : 'Terputus'}
                </span>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="animate-spin w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full mx-auto mb-2"></div>
                  Memuat notifikasi...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>Tidak ada notifikasi</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 ${getNotificationColor(notification.type)} ${
                        !notification.isRead ? 'bg-opacity-100' : 'bg-opacity-50'
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-medium truncate ${
                              !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <p className="text-xs text-gray-400">
                              {formatTimeAgo(notification.createdAt)}
                            </p>
                            {notification.isRead && (
                              <CheckCircle className="w-3 h-3 text-green-500 ml-auto" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 border-t bg-gray-50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Navigate to full notifications page if exists
                    setIsExpanded(false);
                  }}
                  className="w-full text-sm text-gray-600 hover:text-gray-900"
                >
                  Lihat semua notifikasi
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}