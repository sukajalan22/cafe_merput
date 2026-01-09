import { query, execute, RowDataPacket } from '../connection';
import { v4 as uuidv4 } from 'uuid';

// Product interface matching database schema
export interface Product {
  produk_id: string;
  nama_produk: string;
  harga: number;
  deskripsi: string | null;
  jenis_produk: 'Kopi' | 'Non-Kopi' | 'Makanan';
  created_at: Date;
  updated_at: Date;
}

// Product with materials
export interface ProductMaterial {
  bahan_id: string;
  nama_bahan: string;
  jumlah: number;
  satuan: string;
}

export interface ProductWithMaterials extends Product {
  materials: ProductMaterial[];
}

interface ProductRow extends RowDataPacket, Product { }
interface ProductMaterialRow extends RowDataPacket, ProductMaterial { }

// DTOs
export interface CreateProductDTO {
  nama_produk: string;
  harga: number;
  deskripsi?: string | null;
  jenis_produk: 'Kopi' | 'Non-Kopi' | 'Makanan';
}

export interface UpdateProductDTO {
  nama_produk?: string;
  harga?: number;
  deskripsi?: string | null;
  jenis_produk?: 'Kopi' | 'Non-Kopi' | 'Makanan';
}

/**
 * Get all products with optional search and jenis_produk filter
 */
export async function getAll(search?: string, jenisProduk?: string): Promise<Product[]> {
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params: string[] = [];

  if (search) {
    sql += ' AND nama_produk LIKE ?';
    params.push(`%${search}%`);
  }

  if (jenisProduk) {
    sql += ' AND jenis_produk = ?';
    params.push(jenisProduk);
  }

  sql += ' ORDER BY nama_produk ASC';

  const rows = await query<ProductRow[]>(sql, params);
  return rows;
}

/**
 * Get product by ID
 */
export async function getById(id: string): Promise<Product | null> {
  const sql = 'SELECT * FROM products WHERE produk_id = ?';
  const rows = await query<ProductRow[]>(sql, [id]);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Get product with its materials
 */
export async function getWithMaterials(id: string): Promise<ProductWithMaterials | null> {
  const product = await getById(id);
  if (!product) {
    return null;
  }

  const materialsSql = `
    SELECT m.bahan_id, m.nama_bahan, pm.jumlah, m.satuan
    FROM product_materials pm
    JOIN materials m ON pm.bahan_id = m.bahan_id
    WHERE pm.produk_id = ?
  `;
  const materials = await query<ProductMaterialRow[]>(materialsSql, [id]);

  return {
    ...product,
    materials
  };
}

/**
 * Create a new product
 */
export async function create(data: CreateProductDTO): Promise<Product> {
  const id = uuidv4();
  const sql = `
    INSERT INTO products (produk_id, nama_produk, harga, deskripsi, jenis_produk)
    VALUES (?, ?, ?, ?, ?)
  `;
  await execute(sql, [
    id,
    data.nama_produk,
    data.harga,
    data.deskripsi || null,
    data.jenis_produk
  ]);

  const product = await getById(id);
  if (!product) {
    throw new Error('Failed to create product');
  }
  return product;
}

/**
 * Update a product
 */
export async function update(id: string, data: UpdateProductDTO): Promise<Product> {
  const existing = await getById(id);
  if (!existing) {
    throw new Error('Product not found');
  }

  const updates: string[] = [];
  const params: (string | number | null)[] = [];

  if (data.nama_produk !== undefined) {
    updates.push('nama_produk = ?');
    params.push(data.nama_produk);
  }
  if (data.harga !== undefined) {
    updates.push('harga = ?');
    params.push(data.harga);
  }
  if (data.deskripsi !== undefined) {
    updates.push('deskripsi = ?');
    params.push(data.deskripsi);
  }
  if (data.jenis_produk !== undefined) {
    updates.push('jenis_produk = ?');
    params.push(data.jenis_produk);
  }

  if (updates.length > 0) {
    params.push(id);
    const sql = `UPDATE products SET ${updates.join(', ')} WHERE produk_id = ?`;
    await execute(sql, params);
  }

  const updated = await getById(id);
  if (!updated) {
    throw new Error('Failed to update product');
  }
  return updated;
}

/**
 * Delete a product (cascade deletes product_materials)
 */
export async function deleteProduct(id: string): Promise<boolean> {
  const sql = 'DELETE FROM products WHERE produk_id = ?';
  const result = await execute(sql, [id]);
  return result.affectedRows > 0;
}

/**
 * Check product availability based on material stock
 * Returns true if all required materials have sufficient stock
 */
export async function checkProductAvailability(productId: string): Promise<boolean> {
  const sql = `
    SELECT 
      pm.bahan_id,
      pm.jumlah as required_qty,
      m.stok_saat_ini as current_stock
    FROM product_materials pm
    JOIN materials m ON pm.bahan_id = m.bahan_id
    WHERE pm.produk_id = ?
  `;

  interface MaterialStockRow extends RowDataPacket {
    bahan_id: string;
    required_qty: number;
    current_stock: number;
  }

  const rows = await query<MaterialStockRow[]>(sql, [productId]);

  // If no materials defined, product is available
  if (rows.length === 0) {
    return true;
  }

  // Check if all materials have sufficient stock
  return rows.every(row => row.current_stock >= row.required_qty);
}

/**
 * Get all products with availability status based on material stock
 */
export async function getAllWithAvailability(search?: string, jenisProduk?: string): Promise<(Product & { is_available: boolean })[]> {
  // First get all products
  const products = await getAll(search, jenisProduk);

  // Check availability for each product
  const productsWithAvailability = await Promise.all(
    products.map(async (product) => {
      const isAvailable = await checkProductAvailability(product.produk_id);
      return {
        ...product,
        is_available: isAvailable,
      };
    })
  );

  return productsWithAvailability;
}
