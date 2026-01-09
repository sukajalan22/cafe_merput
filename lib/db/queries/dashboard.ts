import { query, RowDataPacket } from '../connection';

// Dashboard statistics interface
export interface DashboardStats {
  totalSales: number;
  todayTransactions: number;
  activeEmployees: number;
  productsSold: number;
}

// Weekly sales data interface
export interface WeeklySalesData {
  day: string;
  sales: number;
}

// Top product interface
export interface TopProduct {
  produk_id: string;
  nama_produk: string;
  jenis_produk: string;
  totalSold: number;
  revenue: number;
}

interface StatsRow extends RowDataPacket {
  totalSales: number;
  todayTransactions: number;
  activeEmployees: number;
  productsSold: number;
}

interface WeeklySalesRow extends RowDataPacket, WeeklySalesData { }
interface TopProductRow extends RowDataPacket, TopProduct { }

/**
 * Get dashboard statistics
 */
export async function getStats(): Promise<DashboardStats> {
  // Total sales today
  const totalSalesSql = `
    SELECT COALESCE(SUM(total_harga), 0) as totalSales
    FROM transactions
    WHERE DATE(tanggal) = CURDATE()
  `;
  const totalSalesRows = await query<(RowDataPacket & { totalSales: number })[]>(totalSalesSql);

  // Today's transactions count
  const todayTransactionsSql = `
    SELECT COUNT(*) as todayTransactions
    FROM transactions
    WHERE DATE(tanggal) = CURDATE()
  `;
  const todayTransactionsRows = await query<(RowDataPacket & { todayTransactions: number })[]>(todayTransactionsSql);

  // Active employees count
  const activeEmployeesSql = `
    SELECT COUNT(*) as activeEmployees
    FROM users
    WHERE status = 'Aktif'
  `;
  const activeEmployeesRows = await query<(RowDataPacket & { activeEmployees: number })[]>(activeEmployeesSql);

  // Products sold today
  const productsSoldSql = `
    SELECT COALESCE(SUM(ti.jumlah), 0) as productsSold
    FROM transaction_items ti
    JOIN transactions t ON ti.transaksi_id = t.transaksi_id
    WHERE DATE(t.tanggal) = CURDATE()
  `;
  const productsSoldRows = await query<(RowDataPacket & { productsSold: number })[]>(productsSoldSql);

  return {
    totalSales: totalSalesRows[0].totalSales,
    todayTransactions: todayTransactionsRows[0].todayTransactions,
    activeEmployees: activeEmployeesRows[0].activeEmployees,
    productsSold: productsSoldRows[0].productsSold
  };
}

/**
 * Get weekly sales data (last 7 days)
 */
export async function getWeeklySales(): Promise<WeeklySalesData[]> {
  const sql = `
    SELECT 
      DATE_FORMAT(tanggal, '%a') as day,
      COALESCE(SUM(total_harga), 0) as sales
    FROM transactions
    WHERE tanggal >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
    GROUP BY DATE(tanggal), DATE_FORMAT(tanggal, '%a')
    ORDER BY DATE(tanggal) ASC
  `;
  const rows = await query<WeeklySalesRow[]>(sql);

  // Ensure we have all 7 days
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const result: WeeklySalesData[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayName = days[date.getDay()];

    const existingData = rows.find(r => r.day === dayName);
    result.push({
      day: dayName,
      sales: existingData ? existingData.sales : 0
    });
  }

  return result;
}

/**
 * Get top selling products
 */
export async function getTopProducts(limit: number = 5): Promise<TopProduct[]> {
  const sql = `
    SELECT 
      p.produk_id,
      p.nama_produk,
      p.jenis_produk,
      COALESCE(SUM(ti.jumlah), 0) as totalSold,
      COALESCE(SUM(ti.jumlah * p.harga), 0) as revenue
    FROM products p
    LEFT JOIN transaction_items ti ON p.produk_id = ti.produk_id
    LEFT JOIN transactions t ON ti.transaksi_id = t.transaksi_id
    WHERE t.tanggal >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) OR t.tanggal IS NULL
    GROUP BY p.produk_id, p.nama_produk, p.jenis_produk
    ORDER BY totalSold DESC
    LIMIT ?
  `;
  const rows = await query<TopProductRow[]>(sql, [limit]);
  return rows;
}

/**
 * Get sales comparison with previous period
 */
export async function getSalesComparison(): Promise<{ current: number; previous: number; change: number }> {
  // Current period (today)
  const currentSql = `
    SELECT COALESCE(SUM(total_harga), 0) as total
    FROM transactions
    WHERE DATE(tanggal) = CURDATE()
  `;
  const currentRows = await query<(RowDataPacket & { total: number })[]>(currentSql);

  // Previous period (yesterday)
  const previousSql = `
    SELECT COALESCE(SUM(total_harga), 0) as total
    FROM transactions
    WHERE DATE(tanggal) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
  `;
  const previousRows = await query<(RowDataPacket & { total: number })[]>(previousSql);

  const current = currentRows[0].total;
  const previous = previousRows[0].total;
  const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;

  return { current, previous, change };
}
