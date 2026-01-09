// Real-time notification service using Server-Sent Events
import { query } from '@/lib/db/connection';
import { RowDataPacket } from 'mysql2/promise';

// Store active connections
const connections = new Map<string, ReadableStreamDefaultController>();

/**
 * Send notification to specific user
 */
export function sendNotificationToUser(userId: string, notification: any) {
  const controller = connections.get(userId);
  if (controller) {
    try {
      controller.enqueue(`data: ${JSON.stringify({
        type: 'notification',
        data: notification
      })}\n\n`);
    } catch (error) {
      console.error('Failed to send notification to user:', userId, error);
      connections.delete(userId);
    }
  }
}

/**
 * Send notification to all users with specific role
 */
export async function sendNotificationToRole(role: string, notification: any) {
  try {
    // Get all users with the specified role
    const usersSql = `
      SELECT u.user_id 
      FROM users u 
      JOIN roles r ON u.role_id = r.role_id 
      WHERE r.nama_role = ? AND u.status = 'Aktif'
    `;

    interface UserRow extends RowDataPacket {
      user_id: string;
    }

    const users = await query<UserRow[]>(usersSql, [role]);

    // Send notification to each connected user
    users.forEach(user => {
      sendNotificationToUser(user.user_id, notification);
    });
  } catch (error) {
    console.error('Failed to send notification to role:', role, error);
  }
}

/**
 * Add connection for a user
 */
export function addConnection(userId: string, controller: ReadableStreamDefaultController) {
  connections.set(userId, controller);
}

/**
 * Remove connection for a user
 */
export function removeConnection(userId: string) {
  connections.delete(userId);
}

/**
 * Get connection for a user
 */
export function getConnection(userId: string): ReadableStreamDefaultController | undefined {
  return connections.get(userId);
}