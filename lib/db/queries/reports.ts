import { query, RowDataPacket } from '../connection';

// Report summary interface
export interface ReportSummary {
  revenue: number;
  expenses: number;
  profit: number;
  transactions: number;
  period: string;
}

// Revenue vs expense data interface
export interface RevenueExpenseData {
  month: string;
  revenue: number;
  expense: number;
}

// Category sales data interface
export interface CategorySalesData {
  jenis_produk: string;
  percentage: number;
  total: number;
}

interface RevenueExpenseRow extends RowDataPacket, RevenueExpenseData { }
interface CategorySalesRow extends RowDataPacket {
  jenis_produk: string;
  total: number;
}

/**
 * Get report summary for a specific period
 */
export async function getSummary(period: 'daily' | 'weekly' | 'monthly'): Promise<ReportSummary> {
  let dateCondition: string;
  let periodLabel: string;

  switch (period) {
    case 'daily':
      dateCondition = 'DATE(tanggal) = CURDATE()';
      periodLabel = 'Hari Ini';
      break;
    case 'weekly':
      dateCondition = 'tanggal >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
      periodLabel = 'Minggu Ini';
      break;
    case 'monthly':
      dateCondition = 'MONTH(tanggal) = MONTH(CURDATE()) AND YEAR(tanggal) = YEAR(CURDATE())';
      periodLabel = 'Bulan Ini';
      break;
    default:
      dateCondition = 'DATE(tanggal) = CURDATE()';
      periodLabel = 'Hari Ini';
  }

  // Get revenue from transactions
  const revenueSql = `
    SELECT COALESCE(SUM(total_harga), 0) as revenue, COUNT(*) as transactions
    FROM transactions
    WHERE ${dateCondition}
  `;
  const revenueRows = await query<(RowDataPacket & { revenue: number; transactions: number })[]>(revenueSql);

  // Get expenses from material orders (received orders)
  let expenseDateCondition: string;
  switch (period) {
    case 'daily':
      expenseDateCondition = 'DATE(tanggal_terima) = CURDATE()';
      break;
    case 'weekly':
      expenseDateCondition = 'tanggal_terima >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
      break;
    case 'monthly':
      expenseDateCondition = 'MONTH(tanggal_terima) = MONTH(CURDATE()) AND YEAR(tanggal_terima) = YEAR(CURDATE())';
      break;
    default:
      expenseDateCondition = 'DATE(tanggal_terima) = CURDATE()';
  }

  // Note: Using harga field from material_orders for actual expenses
  const expensesSql = `
    SELECT COALESCE(SUM(harga), 0) as expenses
    FROM material_orders
    WHERE status = 'Diterima' AND ${expenseDateCondition}
  `;
  const expensesRows = await query<(RowDataPacket & { expenses: number })[]>(expensesSql);

  const revenue = revenueRows[0].revenue;
  const expenses = expensesRows[0].expenses;
  const profit = revenue - expenses;
  const transactions = revenueRows[0].transactions;

  return {
    revenue,
    expenses,
    profit,
    transactions,
    period: periodLabel
  };
}

/**
 * Get revenue vs expense data for the last N months
 */
export async function getRevenueExpense(months: number = 6): Promise<RevenueExpenseData[]> {
  // Get revenue by month
  const revenueSql = `
    SELECT 
      DATE_FORMAT(tanggal, '%b') as month,
      DATE_FORMAT(tanggal, '%Y-%m') as yearMonth,
      COALESCE(SUM(total_harga), 0) as revenue
    FROM transactions
    WHERE tanggal >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
    GROUP BY DATE_FORMAT(tanggal, '%Y-%m'), DATE_FORMAT(tanggal, '%b')
    ORDER BY yearMonth ASC
  `;
  const revenueRows = await query<(RowDataPacket & { month: string; yearMonth: string; revenue: number })[]>(
    revenueSql,
    [months]
  );

  // Get expenses by month (from received material orders using harga field)
  const expenseSql = `
    SELECT 
      DATE_FORMAT(tanggal_terima, '%b') as month,
      DATE_FORMAT(tanggal_terima, '%Y-%m') as yearMonth,
      COALESCE(SUM(harga), 0) as expense
    FROM material_orders
    WHERE status = 'Diterima' AND tanggal_terima >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
    GROUP BY DATE_FORMAT(tanggal_terima, '%Y-%m'), DATE_FORMAT(tanggal_terima, '%b')
    ORDER BY yearMonth ASC
  `;
  const expenseRows = await query<(RowDataPacket & { month: string; yearMonth: string; expense: number })[]>(
    expenseSql,
    [months]
  );

  // Combine revenue and expense data
  const monthsData = new Map<string, RevenueExpenseData>();

  // Initialize with last N months
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthName = date.toLocaleString('en-US', { month: 'short' });
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthsData.set(yearMonth, { month: monthName, revenue: 0, expense: 0 });
  }

  // Fill in revenue data
  for (const row of revenueRows) {
    const existing = monthsData.get(row.yearMonth);
    if (existing) {
      existing.revenue = row.revenue;
    }
  }

  // Fill in expense data
  for (const row of expenseRows) {
    const existing = monthsData.get(row.yearMonth);
    if (existing) {
      existing.expense = row.expense;
    }
  }

  return Array.from(monthsData.values());
}

/**
 * Get sales by product category (jenis_produk)
 */
export async function getCategorySales(): Promise<CategorySalesData[]> {
  const sql = `
    SELECT 
      p.jenis_produk,
      COALESCE(SUM(ti.jumlah * ti.harga_satuan), 0) as total
    FROM transaction_items ti
    INNER JOIN transactions t ON ti.transaksi_id = t.transaksi_id
    INNER JOIN products p ON ti.produk_id = p.produk_id
    WHERE t.tanggal >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY p.jenis_produk
    ORDER BY total DESC
  `;
  const rows = await query<CategorySalesRow[]>(sql);

  // Calculate total for percentage
  const grandTotal = rows.reduce((sum, row) => sum + Number(row.total), 0);

  return rows.map(row => ({
    jenis_produk: row.jenis_produk,
    total: Number(row.total),
    percentage: grandTotal > 0 ? (Number(row.total) / grandTotal) * 100 : 0
  }));
}

/**
 * Get monthly revenue trend
 */
export async function getMonthlyRevenueTrend(months: number = 12): Promise<{ month: string; revenue: number }[]> {
  const sql = `
    SELECT 
      DATE_FORMAT(tanggal, '%b %Y') as month,
      COALESCE(SUM(total_harga), 0) as revenue
    FROM transactions
    WHERE tanggal >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
    GROUP BY DATE_FORMAT(tanggal, '%Y-%m'), DATE_FORMAT(tanggal, '%b %Y')
    ORDER BY DATE_FORMAT(tanggal, '%Y-%m') ASC
  `;
  const rows = await query<(RowDataPacket & { month: string; revenue: number })[]>(sql, [months]);
  return rows;
}

/**
 * Get daily revenue for a specific month
 */
export async function getDailyRevenue(year: number, month: number): Promise<{ day: number; revenue: number }[]> {
  const sql = `
    SELECT 
      DAY(tanggal) as day,
      COALESCE(SUM(total_harga), 0) as revenue
    FROM transactions
    WHERE YEAR(tanggal) = ? AND MONTH(tanggal) = ?
    GROUP BY DAY(tanggal)
    ORDER BY day ASC
  `;
  const rows = await query<(RowDataPacket & { day: number; revenue: number })[]>(sql, [year, month]);
  return rows;
}

// Daily revenue expense data interface
export interface DailyRevenueExpenseData {
  label: string;
  revenue: number;
  expense: number;
}

/**
 * Get daily revenue vs expense data for the last N days
 */
export async function getDailyRevenueExpense(days: number = 7): Promise<DailyRevenueExpenseData[]> {
  // Get revenue by day
  const revenueSql = `
    SELECT 
      DATE_FORMAT(tanggal, '%d/%m') as label,
      DATE(tanggal) as dateKey,
      COALESCE(SUM(total_harga), 0) as revenue
    FROM transactions
    WHERE tanggal >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    GROUP BY DATE(tanggal), DATE_FORMAT(tanggal, '%d/%m')
    ORDER BY dateKey ASC
  `;
  const revenueRows = await query<(RowDataPacket & { label: string; dateKey: string; revenue: number })[]>(
    revenueSql,
    [days]
  );

  // Get expenses by day (from received material orders using harga field)
  const expenseSql = `
    SELECT 
      DATE_FORMAT(tanggal_terima, '%d/%m') as label,
      DATE(tanggal_terima) as dateKey,
      COALESCE(SUM(harga), 0) as expense
    FROM material_orders
    WHERE status = 'Diterima' AND tanggal_terima >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    GROUP BY DATE(tanggal_terima), DATE_FORMAT(tanggal_terima, '%d/%m')
    ORDER BY dateKey ASC
  `;
  const expenseRows = await query<(RowDataPacket & { label: string; dateKey: string; expense: number })[]>(
    expenseSql,
    [days]
  );

  // Combine revenue and expense data
  const daysData = new Map<string, DailyRevenueExpenseData>();

  // Initialize with last N days
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    const label = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
    daysData.set(dateKey, { label, revenue: 0, expense: 0 });
  }

  // Fill in revenue data
  for (const row of revenueRows) {
    const dateKey = new Date(row.dateKey).toISOString().split('T')[0];
    const existing = daysData.get(dateKey);
    if (existing) {
      existing.revenue = row.revenue;
    }
  }

  // Fill in expense data
  for (const row of expenseRows) {
    const dateKey = new Date(row.dateKey).toISOString().split('T')[0];
    const existing = daysData.get(dateKey);
    if (existing) {
      existing.expense = row.expense;
    }
  }

  return Array.from(daysData.values());
}

// Weekly revenue expense data interface
export interface WeeklyRevenueExpenseData {
  label: string;
  revenue: number;
  expense: number;
}

/**
 * Get weekly revenue vs expense data for the last N weeks
 */
export async function getWeeklyRevenueExpense(weeks: number = 4): Promise<WeeklyRevenueExpenseData[]> {
  // Get revenue by week
  const revenueSql = `
    SELECT 
      CONCAT('Minggu ', WEEK(tanggal, 1) - WEEK(DATE_SUB(CURDATE(), INTERVAL ? WEEK), 1) + 1) as label,
      YEARWEEK(tanggal, 1) as weekKey,
      COALESCE(SUM(total_harga), 0) as revenue
    FROM transactions
    WHERE tanggal >= DATE_SUB(CURDATE(), INTERVAL ? WEEK)
    GROUP BY YEARWEEK(tanggal, 1)
    ORDER BY weekKey ASC
  `;
  const revenueRows = await query<(RowDataPacket & { label: string; weekKey: number; revenue: number })[]>(
    revenueSql,
    [weeks, weeks]
  );

  // Get expenses by week
  const expenseSql = `
    SELECT 
      CONCAT('Minggu ', WEEK(tanggal_terima, 1) - WEEK(DATE_SUB(CURDATE(), INTERVAL ? WEEK), 1) + 1) as label,
      YEARWEEK(tanggal_terima, 1) as weekKey,
      COALESCE(SUM(harga), 0) as expense
    FROM material_orders
    WHERE status = 'Diterima' AND tanggal_terima >= DATE_SUB(CURDATE(), INTERVAL ? WEEK)
    GROUP BY YEARWEEK(tanggal_terima, 1)
    ORDER BY weekKey ASC
  `;
  const expenseRows = await query<(RowDataPacket & { label: string; weekKey: number; expense: number })[]>(
    expenseSql,
    [weeks, weeks]
  );

  // Combine revenue and expense data
  const weeksData = new Map<number, WeeklyRevenueExpenseData>();

  // Initialize with last N weeks
  for (let i = weeks - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - (i * 7));
    const weekKey = getYearWeek(date);
    const label = `Minggu ${weeks - i}`;
    weeksData.set(weekKey, { label, revenue: 0, expense: 0 });
  }

  // Fill in revenue data
  for (const row of revenueRows) {
    const existing = weeksData.get(row.weekKey);
    if (existing) {
      existing.revenue = Number(row.revenue);
    }
  }

  // Fill in expense data
  for (const row of expenseRows) {
    const existing = weeksData.get(row.weekKey);
    if (existing) {
      existing.expense = Number(row.expense);
    }
  }

  return Array.from(weeksData.values());
}

// Helper function to get YEARWEEK equivalent
function getYearWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return d.getUTCFullYear() * 100 + weekNo;
}
