import { NextRequest } from 'next/server';
import * as rolesQuery from '@/lib/db/queries/roles';
import { updateRoleSchema } from '@/lib/validations/role';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/utils/response';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/roles/[id]
 * Get role by ID
 * Requirements: 5.3
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const role = await rolesQuery.getById(id);
    
    if (!role) {
      return notFoundResponse('Role tidak ditemukan');
    }
    
    return successResponse(role);
  } catch (error) {
    console.error('Error fetching role:', error);
    return serverErrorResponse('Gagal mengambil data role');
  }
}

/**
 * PUT /api/roles/[id]
 * Update role
 * Requirements: 5.3
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Check if role exists
    const existingRole = await rolesQuery.getById(id);
    if (!existingRole) {
      return notFoundResponse('Role tidak ditemukan');
    }
    
    // Validate input
    const validation = updateRoleSchema.safeParse(body);
    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message || 'Data tidak valid';
      return errorResponse(errorMessage, 400);
    }

    // Check if new name already exists (if changing name)
    if (validation.data.nama_role && validation.data.nama_role !== existingRole.nama_role) {
      const duplicateRole = await rolesQuery.getByName(validation.data.nama_role);
      if (duplicateRole) {
        return errorResponse('Nama role sudah digunakan', 409);
      }
    }

    // Update role
    const role = await rolesQuery.update(id, validation.data);
    return successResponse(role, 'Role berhasil diupdate');
  } catch (error) {
    console.error('Error updating role:', error);
    return serverErrorResponse('Gagal mengupdate role');
  }
}

/**
 * DELETE /api/roles/[id]
 * Delete role
 * Requirements: 5.3
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // Check if role exists
    const existingRole = await rolesQuery.getById(id);
    if (!existingRole) {
      return notFoundResponse('Role tidak ditemukan');
    }
    
    // Delete role
    const deleted = await rolesQuery.deleteRole(id);
    
    if (!deleted) {
      return serverErrorResponse('Gagal menghapus role');
    }
    
    return successResponse(null, 'Role berhasil dihapus');
  } catch (error) {
    console.error('Error deleting role:', error);
    // Check if it's a foreign key constraint error
    if (error instanceof Error && error.message.includes('foreign key')) {
      return errorResponse('Role tidak dapat dihapus karena masih digunakan oleh user', 409);
    }
    return serverErrorResponse('Gagal menghapus role');
  }
}
