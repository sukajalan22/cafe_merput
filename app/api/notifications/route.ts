import { NextRequest } from 'next/server';
import * as notificationsQuery from '@/lib/db/queries/notifications';
import { verifyToken } from '@/lib/utils/jwt';
import {
  successResponse,
  errorResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from '@/lib/utils/response';

/**
 * GET /api/notifications
 * Get notifications for current user
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedResponse('Token tidak ditemukan');
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    if (!payload) {
      return unauthorizedResponse('Token tidak valid');
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread_only') === 'true';

    const notifications = await notificationsQuery.getByUserId(payload.userId, unreadOnly);
    return successResponse(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return serverErrorResponse('Gagal mengambil notifikasi');
  }
}

/**
 * PUT /api/notifications/mark-read
 * Mark notifications as read
 */
export async function PUT(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedResponse('Token tidak ditemukan');
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    if (!payload) {
      return unauthorizedResponse('Token tidak valid');
    }

    const body = await request.json();
    const { notificationIds } = body;

    if (!Array.isArray(notificationIds)) {
      return errorResponse('notificationIds harus berupa array', 400);
    }

    await notificationsQuery.markAsRead(notificationIds, payload.userId);
    return successResponse({ message: 'Notifikasi berhasil ditandai sebagai dibaca' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return serverErrorResponse('Gagal menandai notifikasi sebagai dibaca');
  }
}