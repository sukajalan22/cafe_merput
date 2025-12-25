import { query, execute } from '../connection';
import { RowDataPacket } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

// User interface matching database schema
export interface User {
  user_id: string;
  username: string;
  email: string;
  phone: string | null;
  role_id: string;
  status: 'Aktif' | 'Nonaktif';
  created_at: Date;
  updated_at: Date;
}

// User with password (for internal use only)
export interface UserWithPassword extends User {
  password: string;
}

// User with role name (for API responses)
export interface UserWithRole extends User {
  nama_role: string;
}

interface UserRow extends RowDataPacket, User {}
interface UserWithPasswordRow extends RowDataPacket, UserWithPassword {}
interface UserWithRoleRow extends RowDataPacket, UserWithRole {}

// DTOs
export interface CreateUserDTO {
  username: string;
  password: string;
  email: string;
  phone?: string;
  role_id: string;
  status?: 'Aktif' | 'Nonaktif';
}

export interface UpdateUserDTO {
  username?: string;
  password?: string;
  email?: string;
  phone?: string;
  role_id?: string;
  status?: 'Aktif' | 'Nonaktif';
}

/**
 * Get all users (without password)
 */
export async function getAll(search?: string): Promise<UserWithRole[]> {
  let sql = `
    SELECT u.user_id, u.username, u.email, u.phone, u.role_id, u.status, u.created_at, u.updated_at, r.nama_role
    FROM users u
    JOIN roles r ON u.role_id = r.role_id
  `;
  const params: string[] = [];

  if (search) {
    sql += ' WHERE u.username LIKE ? OR u.email LIKE ?';
    params.push(`%${search}%`, `%${search}%`);
  }

  sql += ' ORDER BY u.username ASC';
  
  const rows = await query<UserWithRoleRow[]>(sql, params);
  return rows;
}

/**
 * Get user by ID (without password)
 */
export async function getById(id: string): Promise<UserWithRole | null> {
  const sql = `
    SELECT u.user_id, u.username, u.email, u.phone, u.role_id, u.status, u.created_at, u.updated_at, r.nama_role
    FROM users u
    JOIN roles r ON u.role_id = r.role_id
    WHERE u.user_id = ?
  `;
  const rows = await query<UserWithRoleRow[]>(sql, [id]);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Get user by email (with password for authentication)
 */
export async function getByEmail(email: string): Promise<UserWithPassword | null> {
  const sql = 'SELECT * FROM users WHERE email = ?';
  const rows = await query<UserWithPasswordRow[]>(sql, [email]);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Create a new user
 */
export async function create(data: CreateUserDTO): Promise<UserWithRole> {
  const id = uuidv4();
  const sql = `
    INSERT INTO users (user_id, username, password, email, phone, role_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  await execute(sql, [
    id,
    data.username,
    data.password,
    data.email,
    data.phone || null,
    data.role_id,
    data.status || 'Aktif'
  ]);

  const user = await getById(id);
  if (!user) {
    throw new Error('Failed to create user');
  }
  return user;
}

/**
 * Update a user
 */
export async function update(id: string, data: UpdateUserDTO): Promise<UserWithRole> {
  const existing = await getById(id);
  if (!existing) {
    throw new Error('User not found');
  }

  const updates: string[] = [];
  const params: (string | null)[] = [];

  if (data.username !== undefined) {
    updates.push('username = ?');
    params.push(data.username);
  }
  if (data.password !== undefined) {
    updates.push('password = ?');
    params.push(data.password);
  }
  if (data.email !== undefined) {
    updates.push('email = ?');
    params.push(data.email);
  }
  if (data.phone !== undefined) {
    updates.push('phone = ?');
    params.push(data.phone || null);
  }
  if (data.role_id !== undefined) {
    updates.push('role_id = ?');
    params.push(data.role_id);
  }
  if (data.status !== undefined) {
    updates.push('status = ?');
    params.push(data.status);
  }

  if (updates.length > 0) {
    params.push(id);
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`;
    await execute(sql, params);
  }

  const updated = await getById(id);
  if (!updated) {
    throw new Error('Failed to update user');
  }
  return updated;
}

/**
 * Delete a user
 */
export async function deleteUser(id: string): Promise<boolean> {
  const sql = 'DELETE FROM users WHERE user_id = ?';
  const result = await execute(sql, [id]);
  return result.affectedRows > 0;
}

/**
 * Check if email exists (for validation)
 */
export async function emailExists(email: string, excludeUserId?: string): Promise<boolean> {
  let sql = 'SELECT COUNT(*) as count FROM users WHERE email = ?';
  const params: string[] = [email];

  if (excludeUserId) {
    sql += ' AND user_id != ?';
    params.push(excludeUserId);
  }

  const rows = await query<(RowDataPacket & { count: number })[]>(sql, params);
  return rows[0].count > 0;
}
