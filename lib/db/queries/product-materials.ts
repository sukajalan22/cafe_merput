import { query, execute, RowDataPacket } from '../connection';

// ProductMaterial interface matching database schema
export interface ProductMaterial {
  produk_id: string;
  bahan_id: string;
  jumlah: number;
}

// ProductMaterial with material details
export interface ProductMaterialWithDetails extends ProductMaterial {
  nama_bahan: string;
  satuan: string;
  stok_saat_ini: number;
}

// ProductMaterial with product details
export interface ProductMaterialWithProduct extends ProductMaterial {
  nama_produk: string;
  jenis_produk: string;
}

interface ProductMaterialRow extends RowDataPacket, ProductMaterial { }
interface ProductMaterialWithDetailsRow extends RowDataPacket, ProductMaterialWithDetails { }
interface ProductMaterialWithProductRow extends RowDataPacket, ProductMaterialWithProduct { }

// DTOs
export interface CreateProductMaterialDTO {
  produk_id: string;
  bahan_id: string;
  jumlah: number;
}

/**
 * Get all materials for a product
 */
export async function getByProductId(productId: string): Promise<ProductMaterialWithDetails[]> {
  const sql = `
    SELECT pm.produk_id, pm.bahan_id, pm.jumlah, m.nama_bahan, m.satuan, m.stok_saat_ini
    FROM product_materials pm
    JOIN materials m ON pm.bahan_id = m.bahan_id
    WHERE pm.produk_id = ?
    ORDER BY m.nama_bahan ASC
  `;
  const rows = await query<ProductMaterialWithDetailsRow[]>(sql, [productId]);
  return rows;
}

/**
 * Get all products using a material
 */
export async function getByMaterialId(materialId: string): Promise<ProductMaterialWithProduct[]> {
  const sql = `
    SELECT pm.produk_id, pm.bahan_id, pm.jumlah, p.nama_produk, p.jenis_produk
    FROM product_materials pm
    JOIN products p ON pm.produk_id = p.produk_id
    WHERE pm.bahan_id = ?
    ORDER BY p.nama_produk ASC
  `;
  const rows = await query<ProductMaterialWithProductRow[]>(sql, [materialId]);
  return rows;
}

/**
 * Get a specific product-material relationship
 */
export async function getOne(productId: string, materialId: string): Promise<ProductMaterial | null> {
  const sql = 'SELECT * FROM product_materials WHERE produk_id = ? AND bahan_id = ?';
  const rows = await query<ProductMaterialRow[]>(sql, [productId, materialId]);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Create a product-material relationship
 */
export async function create(data: CreateProductMaterialDTO): Promise<ProductMaterial> {
  const sql = `
    INSERT INTO product_materials (produk_id, bahan_id, jumlah)
    VALUES (?, ?, ?)
  `;
  await execute(sql, [data.produk_id, data.bahan_id, data.jumlah]);

  const created = await getOne(data.produk_id, data.bahan_id);
  if (!created) {
    throw new Error('Failed to create product-material relationship');
  }
  return created;
}

/**
 * Update a product-material relationship
 */
export async function update(
  productId: string,
  materialId: string,
  jumlah: number
): Promise<ProductMaterial> {
  const existing = await getOne(productId, materialId);
  if (!existing) {
    throw new Error('Product-material relationship not found');
  }

  const sql = 'UPDATE product_materials SET jumlah = ? WHERE produk_id = ? AND bahan_id = ?';
  await execute(sql, [jumlah, productId, materialId]);

  const updated = await getOne(productId, materialId);
  if (!updated) {
    throw new Error('Failed to update product-material relationship');
  }
  return updated;
}

/**
 * Delete a product-material relationship
 */
export async function deleteProductMaterial(productId: string, materialId: string): Promise<boolean> {
  const sql = 'DELETE FROM product_materials WHERE produk_id = ? AND bahan_id = ?';
  const result = await execute(sql, [productId, materialId]);
  return result.affectedRows > 0;
}

/**
 * Delete all materials for a product
 */
export async function deleteAllByProductId(productId: string): Promise<boolean> {
  const sql = 'DELETE FROM product_materials WHERE produk_id = ?';
  const result = await execute(sql, [productId]);
  return result.affectedRows > 0;
}
