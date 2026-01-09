import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
export type { PoolClient } from 'pg';

// Create connection pool (singleton pattern)
let pool: Pool | null = null;

/**
 * Get or create the database connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    // Read DATABASE_URL at runtime (after dotenv.config() has been called)
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    console.log('Connecting to:', connectionString.substring(0, 50) + '...');

    const dbConfig = {
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

    pool = new Pool(dbConfig);
    console.log('PostgreSQL connection pool created');
  }
  return pool;
}

/**
 * Get a connection from the pool
 */
export async function getConnection(): Promise<PoolClient> {
  const pool = getPool();
  try {
    const client = await pool.connect();
    return client;
  } catch (error) {
    console.error('Failed to get database connection:', error);
    throw new Error('Database connection failed. Please check your database configuration.');
  }
}

// RowDataPacket compatible type for backward compatibility with existing queries
export interface RowDataPacket {
  constructor: { name: 'RowDataPacket' };
  [column: string]: unknown;
}

/**
 * Execute a SELECT query with prepared statements
 * @param sql - SQL query string with placeholders ($1, $2, etc)
 * @param params - Array of parameters to bind
 * @returns Array of rows
 */
export async function query<T extends RowDataPacket[]>(
  sql: string,
  params: (string | number | boolean | Date | null)[] = []
): Promise<T> {
  const pool = getPool();
  try {
    // Convert MySQL-style ? placeholders to PostgreSQL $1, $2 style
    let paramIndex = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++paramIndex}`);

    const result: QueryResult<QueryResultRow> = await pool.query(pgSql, params);
    // Add RowDataPacket compatibility
    return result.rows.map(row => ({
      ...row,
      constructor: { name: 'RowDataPacket' as const }
    })) as T;
  } catch (error) {
    console.error('Query execution failed:', error);
    throw error;
  }
}

// ResultSetHeader compatible type for backward compatibility
export interface ResultSetHeader {
  affectedRows: number;
  insertId: number;
  warningStatus: number;
}

/**
 * Execute an INSERT, UPDATE, or DELETE query with prepared statements
 * @param sql - SQL query string with placeholders ($1, $2, etc)
 * @param params - Array of parameters to bind
 * @returns ResultSetHeader with affectedRows, insertId, etc.
 */
export async function execute(
  sql: string,
  params: (string | number | boolean | Date | null)[] = []
): Promise<ResultSetHeader> {
  const pool = getPool();
  try {
    // Convert MySQL-style ? placeholders to PostgreSQL $1, $2 style
    let paramIndex = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++paramIndex}`);

    const result: QueryResult = await pool.query(pgSql, params);
    return {
      affectedRows: result.rowCount || 0,
      insertId: 0, // PostgreSQL doesn't have auto-increment insertId in the same way
      warningStatus: 0,
    };
  } catch (error) {
    console.error('Execute failed:', error);
    throw error;
  }
}

/**
 * Execute multiple queries in a transaction
 * @param callback - Function that receives a connection and executes queries
 * @returns Result of the callback function
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getConnection();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction failed, rolled back:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Test database connection
 * @returns true if connection is successful
 * @throws Error if connection fails (for detailed error handling)
 */
export async function testConnection(): Promise<boolean> {
  const pool = getPool();
  const client = await pool.connect();
  await client.query('SELECT 1');
  client.release();
  console.log('Database connection test successful');
  return true;
}

/**
 * Close the connection pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('PostgreSQL connection pool closed');
  }
}
