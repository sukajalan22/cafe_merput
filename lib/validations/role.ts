import { z } from 'zod';

/**
 * Create role validation schema
 * Requirements: 5.3
 */
export const createRoleSchema = z.object({
  nama_role: z
    .string({ message: 'Nama role wajib diisi' })
    .min(1, 'Nama role wajib diisi')
    .max(50, 'Nama role maksimal 50 karakter'),
});

/**
 * Update role validation schema
 * Requirements: 5.3
 */
export const updateRoleSchema = z.object({
  nama_role: z
    .string()
    .min(1, 'Nama role wajib diisi')
    .max(50, 'Nama role maksimal 50 karakter')
    .optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
