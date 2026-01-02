import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/utils/jwt';
import { addConnection, removeConnection } from '@/lib/services/realtime-notifications';

/**
 * GET /api/notifications/stream
 * Server-Sent Events endpoint for real-time notifications
 */
export async function GET(request: NextRequest) {
  // Get token from query parameter since EventSource doesn't support custom headers
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  
  if (!token) {
    return new Response('Token required', { status: 401 });
  }

  const payload = verifyToken(token);
  
  if (!payload) {
    return new Response('Invalid token', { status: 401 });
  }

  const userId = payload.userId;

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      // Store connection for this user
      addConnection(userId, controller);
      
      // Send initial connection message
      controller.enqueue(`data: ${JSON.stringify({ type: 'connected', message: 'Connected to notifications' })}\n\n`);
      
      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`);
        } catch (error) {
          clearInterval(heartbeat);
          removeConnection(userId);
        }
      }, 30000); // Send heartbeat every 30 seconds

      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        removeConnection(userId);
        try {
          controller.close();
        } catch (error) {
          // Connection already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Authorization',
    },
  });
}