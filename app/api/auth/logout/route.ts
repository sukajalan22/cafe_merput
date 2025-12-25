import { successResponse } from '@/lib/utils/response';

/**
 * POST /api/auth/logout
 * Logout dan mengakhiri sesi
 * Requirements: 2.3
 * 
 * Note: Karena menggunakan JWT stateless, logout dilakukan di client-side
 * dengan menghapus token dari storage. Endpoint ini hanya memberikan
 * konfirmasi bahwa logout berhasil.
 * 
 * Untuk implementasi yang lebih secure, bisa ditambahkan:
 * - Token blacklist di Redis/database
 * - Refresh token rotation
 */
export async function POST() {
  // JWT adalah stateless, jadi logout sebenarnya dilakukan di client
  // dengan menghapus token dari localStorage/cookie
  // Endpoint ini hanya memberikan response sukses
  
  return successResponse(null, 'Logout berhasil');
}
