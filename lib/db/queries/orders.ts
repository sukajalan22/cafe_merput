import { query, execute, transaction, RowDataPacket, PoolClient } from '../connection';
import { v4 as uuidv4 } from 'uuid';

// MaterialOrder interface matching database schema
export interface MaterialOrder {
  pengadaan_id: string;
  bahan_id: string;
  user_id: string;
  jumlah: number;
  harga: number;
  tanggal_pesan: Date;
  tanggal_terima: Date | null;
  status: 'Pending' | 'Dikirim' | 'Diterima';
  created_at: Date;
  updated_at: Date;
}

// MaterialOrder with details
export interface MaterialOrderWithDetails extends MaterialOrder {
  nama_bahan: string;
  satuan: string;
  username: string;
}

interface MaterialOrderRow extends RowDataPacket, MaterialOrder { }
interface MaterialOrderWithDetailsRow extends RowDataPacket, MaterialOrderWithDetails { }

// DTOs
export interface CreateMaterialOrderDTO {
  bahan_id: string;
  user_id: string;
  jumlah: number;
  harga?: number;
  tanggal_pesan?: Date;
}

export interface UpdateOrderStatusDTO {
  status: 'Pending' | 'Dikirim' | 'Diterima';
  tanggal_terima?: Date;
}

/**
 * Get all material orders with optional search filter
 */
export async function getAll(search?: string): Promise<MaterialOrderWithDetails[]> {
  let sql = `
    SELECT mo.*, m.nama_bahan, m.satuan, u.username
    FROM material_orders mo
    JOIN materials m ON mo.bahan_id = m.bahan_id
    JOIN users u ON mo.user_id = u.user_id
    WHERE 1=1
  `;
  const params: string[] = [];

  if (search) {
    sql += ' AND (mo.pengadaan_id LIKE ? OR m.nama_bahan LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  sql += ' ORDER BY mo.tanggal_pesan DESC';

  const rows = await query<MaterialOrderWithDetailsRow[]>(sql, params);
  return rows;
}

/**
 * Get material order by ID
 */
export async function getById(id: string): Promise<MaterialOrderWithDetails | null> {
  const sql = `
    SELECT mo.*, m.nama_bahan, m.satuan, u.username
    FROM material_orders mo
    JOIN materials m ON mo.bahan_id = m.bahan_id
    JOIN users u ON mo.user_id = u.user_id
    WHERE mo.pengadaan_id = ?
  `;
  const rows = await query<MaterialOrderWithDetailsRow[]>(sql, [id]);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Create a new material order
 */
export async function create(data: CreateMaterialOrderDTO): Promise<MaterialOrderWithDetails> {
  const id = uuidv4();
  const sql = `
    INSERT INTO material_orders (pengadaan_id, bahan_id, user_id, jumlah, harga, tanggal_pesan)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  await execute(sql, [
    id,
    data.bahan_id,
    data.user_id,
    data.jumlah,
    data.harga || 0,
    data.tanggal_pesan || new Date()
  ]);

  const order = await getById(id);
  if (!order) {
    throw new Error('Failed to create material order');
  }
  return order;
}

/**
 * Update order status (with stock update when status is 'Diterima')
 */
export async function updateStatus(id: string, data: UpdateOrderStatusDTO): Promise<MaterialOrderWithDetails> {
  const existing = await getById(id);
  if (!existing) {
    throw new Error('Material order not found');
  }

  // If status is changing to 'Diterima', update stock in a transaction
  if (data.status === 'Diterima' && existing.status !== 'Diterima') {
    return transaction(async (conn: PoolClient) => {
      const tanggalTerima = data.tanggal_terima || new Date();

      // Update order status
      await conn.query(
        'UPDATE material_orders SET status = $1, tanggal_terima = $2 WHERE pengadaan_id = $3',
        [data.status, tanggalTerima, id]
      );

      // Update material stock
      await conn.query(
        'UPDATE materials SET stok_saat_ini = stok_saat_ini + $1 WHERE bahan_id = $2',
        [existing.jumlah, existing.bahan_id]
      );

      // Return updated order with details (query within transaction)
      const result = await conn.query(`
        SELECT mo.*, m.nama_bahan, m.satuan, u.username
        FROM material_orders mo
        JOIN materials m ON mo.bahan_id = m.bahan_id
        JOIN users u ON mo.user_id = u.user_id
        WHERE mo.pengadaan_id = $1
      `, [id]);
      const rows = result.rows;

      if (rows.length === 0) {
        throw new Error('Failed to update material order');
      }
      return rows[0] as MaterialOrderWithDetails;
    });
  }

  // Regular status update without stock change
  const updates: string[] = ['status = ?'];
  const params: (string | Date)[] = [data.status];

  if (data.tanggal_terima) {
    updates.push('tanggal_terima = ?');
    params.push(data.tanggal_terima);
  }

  params.push(id);
  const sql = `UPDATE material_orders SET ${updates.join(', ')} WHERE pengadaan_id = ?`;
  await execute(sql, params);

  const updated = await getById(id);
  if (!updated) {
    throw new Error('Failed to update material order');
  }
  return updated;
}

/**
 * Get orders by status
 */
export async function getByStatus(status: 'Pending' | 'Dikirim' | 'Diterima'): Promise<MaterialOrderWithDetails[]> {
  const sql = `
    SELECT mo.*, m.nama_bahan, m.satuan, u.username
    FROM material_orders mo
    JOIN materials m ON mo.bahan_id = m.bahan_id
    JOIN users u ON mo.user_id = u.user_id
    WHERE mo.status = ?
    ORDER BY mo.tanggal_pesan DESC
  `;
  const rows = await query<MaterialOrderWithDetailsRow[]>(sql, [status]);
  return rows;
}

/**
 * Get orders by material ID
 */
export async function getByMaterialId(materialId: string): Promise<MaterialOrder[]> {
  const sql = 'SELECT * FROM material_orders WHERE bahan_id = ? ORDER BY tanggal_pesan DESC';
  const rows = await query<MaterialOrderRow[]>(sql, [materialId]);
  return rows;
}

/**
 * Get pending orders count
 */
export async function getPendingCount(): Promise<number> {
  const sql = "SELECT COUNT(*) as count FROM material_orders WHERE status = 'Pending'";
  const rows = await query<(RowDataPacket & { count: number })[]>(sql);
  return rows[0].count;
}
