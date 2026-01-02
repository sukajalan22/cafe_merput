import { query, execute } from '../connection';
import { RowDataPacket } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

// Notification interface matching database schema
export interface Notification {
  notification_id: string;
  user_id: string;
  type: 'NEW_PRODUCT' | 'MATERIAL_UPDATE' | 'STOCK_ALERT';
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: Date;
}

interface NotificationRow extends RowDataPacket, Notification {}

// DTOs
export interface CreateNotificationDTO {
  user_id: string;
  type: 'NEW_PRODUCT' | 'MATERIAL_UPDATE' | 'STOCK_ALERT';
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * Get notifications for a user
 */
export async function getByUserId(userId: string, unreadOnly: boolean = false): Promise<Notification[]> {
  let sql = 'SELECT * FROM notifications WHERE user_id = ?';
  const params: string[] = [userId];

  if (unreadOnly) {
    sql += ' AND is_read = FALSE';
  }

  sql += ' ORDER BY created_at DESC LIMIT 50';

  const rows = await query<NotificationRow[]>(sql, params);
  return rows.map(row => {
    let parsedData = null;
    if (row.data) {
      try {
        // Handle if data is already an object or a string
        parsedData = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
      } catch (e) {
        console.error('Failed to parse notification data:', e);
        parsedData = null;
      }
    }
    
    return {
      ...row,
      data: parsedData,
    };
  });
}

/**
 * Create a new notification
 */
export async function create(data: CreateNotificationDTO): Promise<Notification> {
  const notificationId = uuidv4();
  
  const sql = `
    INSERT INTO notifications (notification_id, user_id, type, title, message, data)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  await execute(sql, [
    notificationId,
    data.user_id,
    data.type,
    data.title,
    data.message,
    data.data ? JSON.stringify(data.data) : null,
  ]);

  const created = await getById(notificationId);
  if (!created) {
    throw new Error('Failed to create notification');
  }

  return created;
}

/**
 * Get notification by ID
 */
export async function getById(id: string): Promise<Notification | null> {
  const sql = 'SELECT * FROM notifications WHERE notification_id = ?';
  const rows = await query<NotificationRow[]>(sql, [id]);
  
  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];
  let parsedData = null;
  if (row.data) {
    try {
      parsedData = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
    } catch (e) {
      console.error('Failed to parse notification data:', e);
      parsedData = null;
    }
  }
  
  return {
    ...row,
    data: parsedData,
  };
}

/**
 * Mark notifications as read
 */
export async function markAsRead(notificationIds: string[], userId: string): Promise<void> {
  if (notificationIds.length === 0) return;

  const placeholders = notificationIds.map(() => '?').join(',');
  const sql = `
    UPDATE notifications 
    SET is_read = TRUE 
    WHERE notification_id IN (${placeholders}) AND user_id = ?
  `;
  
  await execute(sql, [...notificationIds, userId]);
}

/**
 * Create notification for all users with specific role
 */
export async function createForRole(
  role: string,
  type: 'NEW_PRODUCT' | 'MATERIAL_UPDATE' | 'STOCK_ALERT',
  title: string,
  message: string,
  data?: Record<string, unknown>
): Promise<void> {
  // Get all users with the specified role
  const usersSql = `
    SELECT u.user_id 
    FROM users u 
    JOIN roles r ON u.role_id = r.role_id 
    WHERE r.nama_role = ? AND u.status = 'Aktif'
  `;
  
  const users = await query<{ user_id: string }[]>(usersSql, [role]);
  
  // Create notification for each user
  for (const user of users) {
    await create({
      user_id: user.user_id,
      type,
      title,
      message,
      data,
    });
  }
}

/**
 * Get unread count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const sql = 'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE';
  const rows = await query<{ count: number }[]>(sql, [userId]);
  return rows[0]?.count || 0;
}