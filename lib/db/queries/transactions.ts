import { query, transaction, RowDataPacket, PoolClient } from '../connection';
import { v4 as uuidv4 } from 'uuid';

// Transaction interface matching database schema
export interface Transaction {
  transaksi_id: string;
  user_id: string;
  tanggal: Date;
  total_harga: number;
  created_at: Date;
}

// Transaction item interface
export interface TransactionItem {
  detail_id: string;
  transaksi_id: string;
  produk_id: string;
  jumlah: number;
  harga_satuan: number;
}

// Transaction item with product details
export interface TransactionItemWithProduct extends TransactionItem {
  nama_produk: string;
  harga: number;
  subtotal: number;
}

// Transaction with items
export interface TransactionWithItems extends Transaction {
  items: TransactionItemWithProduct[];
  username: string;
}

interface TransactionRow extends RowDataPacket, Transaction { }
interface TransactionItemRow extends RowDataPacket, TransactionItemWithProduct { }

// Transaction with username for list queries
interface TransactionWithUser extends Transaction {
  username: string;
}
interface TransactionWithUserRow extends RowDataPacket, TransactionWithUser { }

// DTOs
export interface CreateTransactionItemDTO {
  produk_id: string;
  jumlah: number;
}

export interface CreateTransactionDTO {
  user_id: string;
  items: CreateTransactionItemDTO[];
}

/**
 * Get all transactions with optional date filter (includes items)
 */
export async function getAll(startDate?: Date, endDate?: Date): Promise<TransactionWithItems[]> {
  let sql = `
    SELECT t.*, u.username
    FROM transactions t
    JOIN users u ON t.user_id = u.user_id
    WHERE 1=1
  `;
  const params: (string | Date)[] = [];

  if (startDate) {
    sql += ' AND t.tanggal >= ?';
    params.push(startDate);
  }

  if (endDate) {
    sql += ' AND t.tanggal <= ?';
    params.push(endDate);
  }

  sql += ' ORDER BY t.tanggal DESC';

  const rows = await query<TransactionWithUserRow[]>(sql, params);

  // Get items for each transaction
  const transactionsWithItems: TransactionWithItems[] = await Promise.all(
    rows.map(async (t) => {
      const itemsSql = `
        SELECT ti.*, p.nama_produk, p.harga, (ti.jumlah * ti.harga_satuan) as subtotal
        FROM transaction_items ti
        JOIN products p ON ti.produk_id = p.produk_id
        WHERE ti.transaksi_id = ?
      `;
      const items = await query<TransactionItemRow[]>(itemsSql, [t.transaksi_id]);
      return { ...t, items };
    })
  );

  return transactionsWithItems;
}

/**
 * Get transaction by ID with items
 */
export async function getById(id: string): Promise<TransactionWithItems | null> {
  const transactionSql = `
    SELECT t.*, u.username
    FROM transactions t
    JOIN users u ON t.user_id = u.user_id
    WHERE t.transaksi_id = ?
  `;
  const transactions = await query<TransactionWithUserRow[]>(transactionSql, [id]);

  if (transactions.length === 0) {
    return null;
  }

  const itemsSql = `
    SELECT ti.*, p.nama_produk, p.harga, (ti.jumlah * p.harga) as subtotal
    FROM transaction_items ti
    JOIN products p ON ti.produk_id = p.produk_id
    WHERE ti.transaksi_id = ?
  `;
  const items = await query<TransactionItemRow[]>(itemsSql, [id]);

  return {
    ...transactions[0],
    items
  };
}

/**
 * Create a new transaction with items
 * Also deducts material stock based on product compositions
 */
export async function create(data: CreateTransactionDTO): Promise<TransactionWithItems> {
  return transaction(async (conn: PoolClient) => {
    const transactionId = uuidv4();

    // Calculate total from items
    let totalHarga = 0;
    const itemsWithPrices: { produk_id: string; jumlah: number; harga: number; nama_produk: string }[] = [];

    for (const item of data.items) {
      const productsResult = await conn.query(
        'SELECT harga, nama_produk FROM products WHERE produk_id = $1',
        [item.produk_id]
      );
      const products = productsResult.rows;

      if (products.length === 0) {
        throw new Error(`Product not found: ${item.produk_id}`);
      }

      const harga = products[0].harga;
      const nama_produk = products[0].nama_produk;
      totalHarga += harga * item.jumlah;
      itemsWithPrices.push({ ...item, harga, nama_produk });
    }

    // Insert transaction
    await conn.query(
      'INSERT INTO transactions (transaksi_id, user_id, total_harga) VALUES ($1, $2, $3)',
      [transactionId, data.user_id, totalHarga]
    );

    // Insert transaction items and build items array
    const items: TransactionItemWithProduct[] = [];
    for (const item of itemsWithPrices) {
      const detailId = uuidv4();
      await conn.query(
        'INSERT INTO transaction_items (detail_id, transaksi_id, produk_id, jumlah, harga_satuan) VALUES ($1, $2, $3, $4, $5)',
        [detailId, transactionId, item.produk_id, item.jumlah, item.harga]
      );

      items.push({
        detail_id: detailId,
        transaksi_id: transactionId,
        produk_id: item.produk_id,
        jumlah: item.jumlah,
        harga_satuan: item.harga,
        nama_produk: item.nama_produk,
        harga: item.harga,
        subtotal: item.harga * item.jumlah,
      });

      // Deduct material stock based on product composition
      const pmResult = await conn.query(
        'SELECT bahan_id, jumlah FROM product_materials WHERE produk_id = $1',
        [item.produk_id]
      );
      const productMaterials = pmResult.rows;

      for (const pm of productMaterials) {
        // Calculate total material needed (composition amount * quantity ordered)
        const materialNeeded = pm.jumlah * item.jumlah;

        // Deduct from material stock
        await conn.query(
          'UPDATE materials SET stok_saat_ini = stok_saat_ini - $1 WHERE bahan_id = $2',
          [materialNeeded, pm.bahan_id]
        );
      }
    }

    // Get user info for the response
    const usersResult = await conn.query(
      'SELECT username FROM users WHERE user_id = $1',
      [data.user_id]
    );
    const users = usersResult.rows;

    const username = users.length > 0 ? users[0].username : '';

    // Return the created transaction with items
    return {
      transaksi_id: transactionId,
      user_id: data.user_id,
      tanggal: new Date(),
      total_harga: totalHarga,
      created_at: new Date(),
      username,
      items,
    };
  });
}

/**
 * Get transactions by user ID
 */
export async function getByUserId(userId: string): Promise<Transaction[]> {
  const sql = 'SELECT * FROM transactions WHERE user_id = ? ORDER BY tanggal DESC';
  const rows = await query<TransactionRow[]>(sql, [userId]);
  return rows;
}

/**
 * Get today's transactions count
 */
export async function getTodayCount(): Promise<number> {
  const sql = `
    SELECT COUNT(*) as count 
    FROM transactions 
    WHERE DATE(tanggal) = CURDATE()
  `;
  const rows = await query<(RowDataPacket & { count: number })[]>(sql);
  return rows[0].count;
}

/**
 * Get today's total sales
 */
export async function getTodayTotal(): Promise<number> {
  const sql = `
    SELECT COALESCE(SUM(total_harga), 0) as total 
    FROM transactions 
    WHERE DATE(tanggal) = CURDATE()
  `;
  const rows = await query<(RowDataPacket & { total: number })[]>(sql);
  return rows[0].total;
}
