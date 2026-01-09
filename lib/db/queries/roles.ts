import { query, execute, RowDataPacket } from '../connection';
import { v4 as uuidv4 } from 'uuid';

// Role interface matching database schema
export interface Role {
  role_id: string;
  nama_role: string;
  created_at: Date;
  updated_at: Date;
}

interface RoleRow extends RowDataPacket, Role { }

// DTOs
export interface CreateRoleDTO {
  nama_role: string;
}

export interface UpdateRoleDTO {
  nama_role?: string;
}

/**
 * Get all roles
 */
export async function getAll(): Promise<Role[]> {
  const sql = 'SELECT * FROM roles ORDER BY nama_role ASC';
  const rows = await query<RoleRow[]>(sql);
  return rows;
}

/**
 * Get role by ID
 */
export async function getById(id: string): Promise<Role | null> {
  const sql = 'SELECT * FROM roles WHERE role_id = ?';
  const rows = await query<RoleRow[]>(sql, [id]);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Get role by name
 */
export async function getByName(namaRole: string): Promise<Role | null> {
  const sql = 'SELECT * FROM roles WHERE nama_role = ?';
  const rows = await query<RoleRow[]>(sql, [namaRole]);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Create a new role
 */
export async function create(data: CreateRoleDTO): Promise<Role> {
  const id = uuidv4();
  const sql = 'INSERT INTO roles (role_id, nama_role) VALUES (?, ?)';
  await execute(sql, [id, data.nama_role]);

  const role = await getById(id);
  if (!role) {
    throw new Error('Failed to create role');
  }
  return role;
}

/**
 * Update a role
 */
export async function update(id: string, data: UpdateRoleDTO): Promise<Role> {
  const existing = await getById(id);
  if (!existing) {
    throw new Error('Role not found');
  }

  if (data.nama_role) {
    const sql = 'UPDATE roles SET nama_role = ? WHERE role_id = ?';
    await execute(sql, [data.nama_role, id]);
  }

  const updated = await getById(id);
  if (!updated) {
    throw new Error('Failed to update role');
  }
  return updated;
}

/**
 * Delete a role
 */
export async function deleteRole(id: string): Promise<boolean> {
  const sql = 'DELETE FROM roles WHERE role_id = ?';
  const result = await execute(sql, [id]);
  return result.affectedRows > 0;
}
