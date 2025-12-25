import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { getById } from '@/lib/db/queries/users';
import { successResponse, notFoundResponse, serverErrorResponse } from '@/lib/utils/response';

/**
 * GET /api/auth/me
 * Get current user data
 * Requirements: 2.4, 2.5
 * 
 * Protected route - requires valid JWT token
 */
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { userId } = request.user;
    
    // Get user data from database
    const user = await getById(userId);
    
    if (!user) {
      return notFoundResponse('User tidak ditemukan');
    }
    
    // Return user data (without password)
    return successResponse({
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role_id: user.role_id,
      nama_role: user.nama_role,
      status: user.status,
      created_at: user.created_at,
      updated_at: user.updated_at,
    });
    
  } catch (error) {
    console.error('Get current user error:', error);
    return serverErrorResponse('Terjadi kesalahan saat mengambil data user');
  }
});
