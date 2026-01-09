import { z } from 'zod';

/**
 * Create product-material relationship validation schema
 * Links a material to a product with quantity
 * Requirements: 3.4
 */
export const createProductMaterialSchema = z.object({
  produk_id: z
    .string({ message: 'ID produk wajib diisi' })
    .min(1, 'ID produk wajib diisi')
    .uuid('Format ID produk tidak valid'),
  bahan_id: z
    .string({ message: 'ID bahan wajib diisi' })
    .min(1, 'ID bahan wajib diisi')
    .uuid('Format ID bahan tidak valid'),
  jumlah: z
    .number({ message: 'Jumlah wajib diisi' })
    .positive('Jumlah harus lebih dari 0'),
});

/**
 * Add material to product validation schema (for nested route)
 * produk_id comes from URL parameter
 * Requirements: 3.4
 */
export const addMaterialToProductSchema = z.object({
  bahan_id: z
    .string({ message: 'ID bahan wajib diisi' })
    .min(1, 'ID bahan wajib diisi')
    .uuid('Format ID bahan tidak valid'),
  jumlah: z
    .number({ message: 'Jumlah wajib diisi' })
    .positive('Jumlah harus lebih dari 0'),
});

/**
 * Update product-material relationship validation schema
 * Requirements: 3.4
 */
export const updateProductMaterialSchema = z.object({
  jumlah: z
    .number({ message: 'Jumlah wajib diisi' })
    .positive('Jumlah harus lebih dari 0'),
});

export type CreateProductMaterialInput = z.infer<typeof createProductMaterialSchema>;
export type AddMaterialToProductInput = z.infer<typeof addMaterialToProductSchema>;
export type UpdateProductMaterialInput = z.infer<typeof updateProductMaterialSchema>;
