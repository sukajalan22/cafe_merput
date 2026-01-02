import { useEffect, useRef, useState } from 'react';
import { getNotifications, type Notification } from '@/lib/services/notifications';
import { getAuthToken } from '@/lib/services/auth';

interface UseRealTimeNotificationsReturn {
  isConnected: boolean;
  notifications: Notification[];
  unreadCount: number;
  refresh: () => void;
}

/**
 * Hook for real-time notifications using polling (fetch every 5 seconds)
 * Automatically updates notifications without page refresh
 */
export function useRealTimeNotifications(): UseRealTimeNotificationsReturn {
  const [isConnected, setIsConnected] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousCountRef = useRef(0);
  const previousIdsRef = useRef<Set<string>>(new Set());

  const fetchNotifications = async () => {
    try {
      // Check if token exists before fetching
      const token = getAuthToken();
      if (!token) {
        console.warn('No auth token found, skipping notification fetch');
        setIsConnected(false);
        return;
      }
      
      const data = await getNotifications();
      setNotifications(data);
      
      const newUnreadCount = data.filter(n => !n.isRead).length;
      setUnreadCount(newUnreadCount);
      
      // Check for new notifications by comparing IDs
      const currentIds = new Set(data.map(n => n.id));
      const newNotifications = data.filter(n => 
        !previousIdsRef.current.has(n.id) && !n.isRead
      );
      
      // Just update the count, no browser notification
      // Visual feedback will be shown through the bell icon badge
      
      previousIdsRef.current = currentIds;
      previousCountRef.current = newUnreadCount;
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setIsConnected(false);
    }
  };

  const refresh = () => {
    fetchNotifications();
  };

  useEffect(() => {
    // No need to request notification permission
    // We're only using bell icon with badge
    
    // Initial fetch
    fetchNotifications();

    // Set up polling interval (every 5 seconds)
    intervalRef.current = setInterval(() => {
      fetchNotifications();
    }, 5000); // 5 seconds

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isConnected,
    notifications,
    unreadCount,
    refresh,
  };
}
