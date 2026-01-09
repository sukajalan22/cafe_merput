import * as dotenv from 'dotenv';
dotenv.config();

import { getPool, closePool } from '../lib/db/connection';

async function insertRoles() {
    console.log('Inserting default roles...');

    const pool = getPool();

    try {
        await pool.query(`
      INSERT INTO roles (role_id, nama_role) VALUES 
        (gen_random_uuid()::text, 'Admin'),
        (gen_random_uuid()::text, 'Manager'),
        (gen_random_uuid()::text, 'Kasir'),
        (gen_random_uuid()::text, 'Barista'),
        (gen_random_uuid()::text, 'Pengadaan')
      ON CONFLICT (nama_role) DO NOTHING
    `);

        console.log('✓ Default roles inserted');

        // Show roles
        const result = await pool.query('SELECT * FROM roles');
        console.log('Roles in database:');
        console.table(result.rows);

    } catch (error: any) {
        console.error('Error:', error.message);
    } finally {
        await closePool();
    }
}

insertRoles();
