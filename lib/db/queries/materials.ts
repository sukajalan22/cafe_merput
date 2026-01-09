import { query, execute, RowDataPacket } from '../connection';
import { v4 as uuidv4 } from 'uuid';

// Material interface matching database schema
export interface Material {
  bahan_id: string;
  nama_bahan: string;
  stok_saat_ini: number;
  stok_minimum: number;
  satuan: 'kg' | 'liter' | 'pcs' | 'gram' | 'ml';
  created_at: Date;
  updated_at: Date;
}

// Material with derived status
export interface MaterialWithStatus extends Material {
  status: 'Aman' | 'Stok Rendah';
}

interface MaterialRow extends RowDataPacket, Material { }

// DTOs
export interface CreateMaterialDTO {
  nama_bahan: string;
  stok_saat_ini?: number;
  stok_minimum: number;
  satuan: 'kg' | 'liter' | 'pcs' | 'gram' | 'ml';
}

export interface UpdateMaterialDTO {
  nama_bahan?: string;
  stok_saat_ini?: number;
  stok_minimum?: number;
  satuan?: 'kg' | 'liter' | 'pcs' | 'gram' | 'ml';
}

/**
 * Derive status from stock levels
 */
function deriveStatus(stokSaatIni: number, stokMinimum: number): 'Aman' | 'Stok Rendah' {
  return stokSaatIni >= stokMinimum ? 'Aman' : 'Stok Rendah';
}

/**
 * Add status to material
 */
function addStatus(material: Material): MaterialWithStatus {
  return {
    ...material,
    status: deriveStatus(material.stok_saat_ini, material.stok_minimum)
  };
}

/**
 * Get all materials with optional search filter
 */
export async function getAll(search?: string): Promise<MaterialWithStatus[]> {
  let sql = 'SELECT * FROM materials WHERE 1=1';
  const params: string[] = [];

  if (search) {
    sql += ' AND nama_bahan LIKE ?';
    params.push(`%${search}%`);
  }

  sql += ' ORDER BY nama_bahan ASC';

  const rows = await query<MaterialRow[]>(sql, params);
  return rows.map(addStatus);
}

/**
 * Get material by ID
 */
export async function getById(id: string): Promise<MaterialWithStatus | null> {
  const sql = 'SELECT * FROM materials WHERE bahan_id = ?';
  const rows = await query<MaterialRow[]>(sql, [id]);
  return rows.length > 0 ? addStatus(rows[0]) : null;
}

/**
 * Get materials with low stock (stok_saat_ini < stok_minimum)
 */
export async function getLowStock(): Promise<MaterialWithStatus[]> {
  const sql = 'SELECT * FROM materials WHERE stok_saat_ini < stok_minimum ORDER BY nama_bahan ASC';
  const rows = await query<MaterialRow[]>(sql);
  return rows.map(addStatus);
}

/**
 * Create a new material
 */
export async function create(data: CreateMaterialDTO): Promise<MaterialWithStatus> {
  const id = uuidv4();
  const sql = `
    INSERT INTO materials (bahan_id, nama_bahan, stok_saat_ini, stok_minimum, satuan)
    VALUES (?, ?, ?, ?, ?)
  `;
  await execute(sql, [
    id,
    data.nama_bahan,
    data.stok_saat_ini ?? 0,
    data.stok_minimum,
    data.satuan
  ]);

  const material = await getById(id);
  if (!material) {
    throw new Error('Failed to create material');
  }
  return material;
}

/**
 * Update a material
 */
export async function update(id: string, data: UpdateMaterialDTO): Promise<MaterialWithStatus> {
  const existing = await getById(id);
  if (!existing) {
    throw new Error('Material not found');
  }

  const updates: string[] = [];
  const params: (string | number)[] = [];

  if (data.nama_bahan !== undefined) {
    updates.push('nama_bahan = ?');
    params.push(data.nama_bahan);
  }
  if (data.stok_saat_ini !== undefined) {
    updates.push('stok_saat_ini = ?');
    params.push(data.stok_saat_ini);
  }
  if (data.stok_minimum !== undefined) {
    updates.push('stok_minimum = ?');
    params.push(data.stok_minimum);
  }
  if (data.satuan !== undefined) {
    updates.push('satuan = ?');
    params.push(data.satuan);
  }

  if (updates.length > 0) {
    params.push(id);
    const sql = `UPDATE materials SET ${updates.join(', ')} WHERE bahan_id = ?`;
    await execute(sql, params);
  }

  const updated = await getById(id);
  if (!updated) {
    throw new Error('Failed to update material');
  }
  return updated;
}

/**
 * Delete a material
 */
export async function deleteMaterial(id: string): Promise<boolean> {
  const sql = 'DELETE FROM materials WHERE bahan_id = ?';
  const result = await execute(sql, [id]);
  return result.affectedRows > 0;
}

/**
 * Update material stock (add or subtract quantity)
 */
export async function updateStock(id: string, quantity: number): Promise<MaterialWithStatus> {
  const sql = 'UPDATE materials SET stok_saat_ini = stok_saat_ini + ? WHERE bahan_id = ?';
  await execute(sql, [quantity, id]);

  const updated = await getById(id);
  if (!updated) {
    throw new Error('Material not found');
  }
  return updated;
}
