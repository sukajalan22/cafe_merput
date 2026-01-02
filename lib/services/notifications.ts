// Notifications service for Cafe Merah Putih Management System
// Handles notification operations via API endpoints

import { getAuthToken } from './auth';

export interface Notification {
  id: string;
  type: 'NEW_PRODUCT' | 'MATERIAL_UPDATE' | 'STOCK_ALERT';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}

// Helper to get auth headers
function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Map API response to Notification type
function mapApiNotification(apiNotification: Record<string, unknown>): Notification {
  return {
    id: apiNotification.notification_id as string,
    type: apiNotification.type as 'NEW_PRODUCT' | 'MATERIAL_UPDATE' | 'STOCK_ALERT',
    title: apiNotification.title as string,
    message: apiNotification.message as string,
    data: apiNotification.data as Record<string, unknown> | undefined,
    isRead: apiNotification.is_read as boolean,
    createdAt: new Date(apiNotification.created_at as string),
  };
}

/**
 * Get notifications for current user
 */
export async function getNotifications(unreadOnly: boolean = false): Promise<Notification[]> {
  try {
    // Check if token exists before making request
    const token = getAuthToken();
    if (!token) {
      console.warn('No auth token available');
      return [];
    }

    const params = new URLSearchParams();
    if (unreadOnly) {
      params.append('unread_only', 'true');
    }

    const url = `/api/notifications${params.toString() ? `?${params.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      console.error('Failed to fetch notifications:', data.error);
      return [];
    }

    // Ensure data.data exists and is an array
    if (!data.data || !Array.isArray(data.data)) {
      console.error('Invalid notification data format');
      return [];
    }

    return data.data.map(mapApiNotification);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

/**
 * Mark notifications as read
 */
export async function markNotificationsAsRead(notificationIds: string[]): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ notificationIds }),
    });

    const data = await response.json();
    return response.ok && data.success;
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return false;
  }
}

/**
 * Get unread notifications count
 */
export async function getUnreadCount(): Promise<number> {
  try {
    const notifications = await getNotifications(true);
    return notifications.length;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}