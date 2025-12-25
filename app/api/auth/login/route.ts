import { NextRequest } from 'next/server';
import { loginSchema } from '@/lib/validations/auth';
import { getByEmail } from '@/lib/db/queries/users';
import { comparePassword } from '@/lib/utils/password';
import { generateToken } from '@/lib/utils/jwt';
import { successResponse, errorResponse, serverErrorResponse, unauthorizedResponse } from '@/lib/utils/response';
import { getById } from '@/lib/db/queries/users';

/**
 * POST /api/auth/login
 * Login dengan email dan password
 * Requirements: 2.1, 2.2
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.issues.map((e) => e.message).join(', ');
      return errorResponse(errors, 400);
    }
    
    const { email, password } = validation.data;
    
    // Get user by email (includes password for verification)
    const userWithPassword = await getByEmail(email);
    
    if (!userWithPassword) {
      return unauthorizedResponse('Email atau password salah');
    }
    
    // Check if user is active
    if (userWithPassword.status === 'Nonaktif') {
      return unauthorizedResponse('Akun tidak aktif');
    }
    
    // Verify password
    const isPasswordValid = await comparePassword(password, userWithPassword.password);
    
    if (!isPasswordValid) {
      return unauthorizedResponse('Email atau password salah');
    }
    
    // Get user with role info (without password)
    const user = await getById(userWithPassword.user_id);
    
    if (!user) {
      return serverErrorResponse('Gagal mengambil data user');
    }
    
    // Generate JWT token
    const token = generateToken({
      userId: user.user_id,
      email: user.email,
      role: user.nama_role,
    });
    
    // Return token and user data (without password)
    return successResponse({
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role_id: user.role_id,
        nama_role: user.nama_role,
        status: user.status,
      },
    }, 'Login berhasil');
    
  } catch (error) {
    console.error('Login error:', error);
    return serverErrorResponse('Terjadi kesalahan saat login');
  }
}
