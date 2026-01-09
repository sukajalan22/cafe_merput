/**
 * Database Initialization Script for PostgreSQL
 * This script creates all the necessary tables for the Cafe Merah Putih application
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { getPool, getConnection, closePool } from '../lib/db/connection';
import * as fs from 'fs';
import * as path from 'path';

async function initializeDatabase() {
  console.log('\n🔧 Cafe Merah Putih - Database Initialization (PostgreSQL)\n');

  const pool = getPool();
  let client;

  try {
    // Get a connection from the pool
    client = await getConnection();
    console.log('✓ Connected to PostgreSQL database');

    // Read the PostgreSQL schema file
    const schemaPath = path.join(__dirname, '..', 'lib', 'db', 'schema-postgres.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Remove comments and split into statements
    const lines = schema.split('\n');
    let cleanedSQL = '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      // Skip comment-only lines
      if (trimmedLine.startsWith('--')) {
        continue;
      }
      // Remove inline comments
      const commentIndex = line.indexOf('--');
      if (commentIndex > 0) {
        cleanedSQL += line.substring(0, commentIndex) + '\n';
      } else {
        cleanedSQL += line + '\n';
      }
    }

    // Split by semicolon and filter empty statements
    const statements = cleanedSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`\n📝 Executing ${statements.length} SQL statements...\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      try {
        await client.query(statement);

        // Log progress for important operations
        if (statement.toUpperCase().includes('CREATE TABLE')) {
          const match = statement.match(/CREATE TABLE\s+(\w+)/i);
          if (match) {
            console.log(`  ✓ Created table: ${match[1]}`);
          }
        } else if (statement.toUpperCase().includes('INSERT INTO ROLES')) {
          console.log(`  ✓ Inserted default roles`);
        } else if (statement.toUpperCase().includes('DROP TABLE')) {
          const match = statement.match(/DROP TABLE IF EXISTS\s+(\w+)/i);
          if (match) {
            console.log(`  ✓ Dropped table (if exists): ${match[1]}`);
          }
        } else if (statement.toUpperCase().includes('CREATE INDEX')) {
          const match = statement.match(/CREATE INDEX\s+(\w+)/i);
          if (match) {
            console.log(`  ✓ Created index: ${match[1]}`);
          }
        } else if (statement.toUpperCase().includes('CREATE TYPE')) {
          const match = statement.match(/CREATE TYPE\s+(\w+)/i);
          if (match) {
            console.log(`  ✓ Created type: ${match[1]}`);
          }
        } else if (statement.toUpperCase().includes('CREATE TRIGGER')) {
          const match = statement.match(/CREATE TRIGGER\s+(\w+)/i);
          if (match) {
            console.log(`  ✓ Created trigger: ${match[1]}`);
          }
        }
      } catch (error: any) {
        // Ignore "type already exists" errors
        if (error.message.includes('already exists')) {
          console.log(`  ⚠ Skipped (already exists): ${error.message.substring(0, 50)}...`);
        } else {
          console.error(`  ✗ Error executing statement: ${error.message}`);
          console.error(`  Statement: ${statement.substring(0, 100)}...`);
          throw error;
        }
      }
    }

    console.log('\n✅ Database initialized successfully!\n');
    console.log('You can now run: npm run dev\n');

  } catch (error: any) {
    console.error('\n❌ Database initialization failed:');
    console.error(error.message);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await closePool();
    console.log('Database connection closed');
  }
}

// Run the initialization
initializeDatabase();
