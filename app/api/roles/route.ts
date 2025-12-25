import { NextRequest } from 'next/server';
import * as rolesQuery from '@/lib/db/queries/roles';
import { createRoleSchema } from '@/lib/validations/role';
import {
  successResponse,
  createdResponse,
  errorResponse,
  serverErrorResponse,
} from '@/lib/utils/response';

/**
 * GET /api/roles
 * Get all roles
 * Requirements: 5.3
 */
export async function GET() {
  try {
    const roles = await rolesQuery.getAll();
    return successResponse(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return serverErrorResponse('Gagal mengambil data roles');
  }
}

/**
 * POST /api/roles
 * Create a new role
 * Requirements: 5.3
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = createRoleSchema.safeParse(body);
    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message || 'Data tidak valid';
      return errorResponse(errorMessage, 400);
    }

    // Check if role name already exists
    const existingRole = await rolesQuery.getByName(validation.data.nama_role);
    if (existingRole) {
      return errorResponse('Nama role sudah digunakan', 409);
    }

    // Create role
    const role = await rolesQuery.create(validation.data);
    return createdResponse(role, 'Role berhasil dibuat');
  } catch (error) {
    console.error('Error creating role:', error);
    return serverErrorResponse('Gagal membuat role');
  }
}
