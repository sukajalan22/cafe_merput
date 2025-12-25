/**
 * Database Initialization Script
 * This script creates all the necessary tables for the Cafe Merah Putih application
 */

import { getPool } from '../lib/db/connection';
import * as fs from 'fs';
import * as path from 'path';

async function initializeDatabase() {
  console.log('\n🔧 Cafe Merah Putih - Database Initialization\n');
  
  const pool = getPool();
  let connection;

  try {
    // Get a connection from the pool
    connection = await pool.getConnection();
    console.log('✓ Connected to database');

    // Read the schema.sql file
    const schemaPath = path.join(__dirname, '..', 'lib', 'db', 'schema.sql');
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
        await connection.query(statement);
        
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
        }
      } catch (error: any) {
        console.error(`  ✗ Error executing statement: ${error.message}`);
        console.error(`  Statement: ${statement.substring(0, 100)}...`);
        throw error;
      }
    }

    console.log('\n✅ Database initialized successfully!\n');
    console.log('You can now run: npx tsx scripts/test-queries.ts\n');

  } catch (error: any) {
    console.error('\n❌ Database initialization failed:');
    console.error(error.message);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
    }
    await pool.end();
    console.log('Database connection closed');
  }
}

// Run the initialization
initializeDatabase();
