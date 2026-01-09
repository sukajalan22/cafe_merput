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
  let expenseDateCondition: string;
  let periodLabel: string;

  switch (period) {
    case 'daily':
      dateCondition = "DATE(tanggal) = CURRENT_DATE";
      expenseDateCondition = "DATE(tanggal_terima) = CURRENT_DATE";
      periodLabel = 'Hari Ini';
      break;
    case 'weekly':
      dateCondition = "tanggal >= CURRENT_DATE - INTERVAL '7 days'";
      expenseDateCondition = "tanggal_terima >= CURRENT_DATE - INTERVAL '7 days'";
      periodLabel = 'Minggu Ini';
      break;
    case 'monthly':
      dateCondition = "EXTRACT(MONTH FROM tanggal) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM tanggal) = EXTRACT(YEAR FROM CURRENT_DATE)";
      expenseDateCondition = "EXTRACT(MONTH FROM tanggal_terima) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM tanggal_terima) = EXTRACT(YEAR FROM CURRENT_DATE)";
      periodLabel = 'Bulan Ini';
      break;
    default:
      dateCondition = "DATE(tanggal) = CURRENT_DATE";
      expenseDateCondition = "DATE(tanggal_terima) = CURRENT_DATE";
      periodLabel = 'Hari Ini';
  }

  // Get revenue from transactions
  const revenueSql = `
    SELECT COALESCE(SUM(total_harga), 0) as revenue, COUNT(*) as transactions
    FROM transactions
    WHERE ${dateCondition}
  `;
  const revenueRows = await query<(RowDataPacket & { revenue: number; transactions: number })[]>(revenueSql);

  // Note: Using harga field from material_orders for actual expenses
  const expensesSql = `
    SELECT COALESCE(SUM(harga), 0) as expenses
    FROM material_orders
    WHERE status = 'Diterima' AND ${expenseDateCondition}
  `;
  const expensesRows = await query<(RowDataPacket & { expenses: number })[]>(expensesSql);

  const revenue = Number(revenueRows[0].revenue) || 0;
  const expenses = Number(expensesRows[0].expenses) || 0;
  const profit = revenue - expenses;
  const transactions = Number(revenueRows[0].transactions) || 0;

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
      TO_CHAR(tanggal, 'Mon') as month,
      TO_CHAR(tanggal, 'YYYY-MM') as "yearMonth",
      COALESCE(SUM(total_harga), 0) as revenue
    FROM transactions
    WHERE tanggal >= CURRENT_DATE - INTERVAL '${months} months'
    GROUP BY TO_CHAR(tanggal, 'YYYY-MM'), TO_CHAR(tanggal, 'Mon')
    ORDER BY "yearMonth" ASC
  `;
  const revenueRows = await query<(RowDataPacket & { month: string; yearMonth: string; revenue: number })[]>(revenueSql);

  // Get expenses by month (from received material orders using harga field)
  const expenseSql = `
    SELECT 
      TO_CHAR(tanggal_terima, 'Mon') as month,
      TO_CHAR(tanggal_terima, 'YYYY-MM') as "yearMonth",
      COALESCE(SUM(harga), 0) as expense
    FROM material_orders
    WHERE status = 'Diterima' AND tanggal_terima >= CURRENT_DATE - INTERVAL '${months} months'
    GROUP BY TO_CHAR(tanggal_terima, 'YYYY-MM'), TO_CHAR(tanggal_terima, 'Mon')
    ORDER BY "yearMonth" ASC
  `;
  const expenseRows = await query<(RowDataPacket & { month: string; yearMonth: string; expense: number })[]>(expenseSql);

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
      existing.revenue = Number(row.revenue);
    }
  }

  // Fill in expense data
  for (const row of expenseRows) {
    const existing = monthsData.get(row.yearMonth);
    if (existing) {
      existing.expense = Number(row.expense);
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
      p.jenis_produk::text as jenis_produk,
      COALESCE(SUM(ti.jumlah * ti.harga_satuan), 0) as total
    FROM transaction_items ti
    INNER JOIN transactions t ON ti.transaksi_id = t.transaksi_id
    INNER JOIN products p ON ti.produk_id = p.produk_id
    WHERE t.tanggal >= CURRENT_DATE - INTERVAL '30 days'
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
      TO_CHAR(tanggal, 'Mon YYYY') as month,
      COALESCE(SUM(total_harga), 0) as revenue
    FROM transactions
    WHERE tanggal >= CURRENT_DATE - INTERVAL '${months} months'
    GROUP BY TO_CHAR(tanggal, 'YYYY-MM'), TO_CHAR(tanggal, 'Mon YYYY')
    ORDER BY TO_CHAR(tanggal, 'YYYY-MM') ASC
  `;
  const rows = await query<(RowDataPacket & { month: string; revenue: number })[]>(sql);
  return rows.map(r => ({ month: r.month, revenue: Number(r.revenue) }));
}

/**
 * Get daily revenue for a specific month
 */
export async function getDailyRevenue(year: number, month: number): Promise<{ day: number; revenue: number }[]> {
  const sql = `
    SELECT 
      EXTRACT(DAY FROM tanggal)::int as day,
      COALESCE(SUM(total_harga), 0) as revenue
    FROM transactions
    WHERE EXTRACT(YEAR FROM tanggal) = ? AND EXTRACT(MONTH FROM tanggal) = ?
    GROUP BY EXTRACT(DAY FROM tanggal)
    ORDER BY day ASC
  `;
  const rows = await query<(RowDataPacket & { day: number; revenue: number })[]>(sql, [year, month]);
  return rows.map(r => ({ day: r.day, revenue: Number(r.revenue) }));
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
      TO_CHAR(tanggal, 'DD/MM') as label,
      DATE(tanggal) as "dateKey",
      COALESCE(SUM(total_harga), 0) as revenue
    FROM transactions
    WHERE tanggal >= CURRENT_DATE - INTERVAL '${days} days'
    GROUP BY DATE(tanggal), TO_CHAR(tanggal, 'DD/MM')
    ORDER BY "dateKey" ASC
  `;
  const revenueRows = await query<(RowDataPacket & { label: string; dateKey: string; revenue: number })[]>(revenueSql);

  // Get expenses by day (from received material orders using harga field)
  const expenseSql = `
    SELECT 
      TO_CHAR(tanggal_terima, 'DD/MM') as label,
      DATE(tanggal_terima) as "dateKey",
      COALESCE(SUM(harga), 0) as expense
    FROM material_orders
    WHERE status = 'Diterima' AND tanggal_terima >= CURRENT_DATE - INTERVAL '${days} days'
    GROUP BY DATE(tanggal_terima), TO_CHAR(tanggal_terima, 'DD/MM')
    ORDER BY "dateKey" ASC
  `;
  const expenseRows = await query<(RowDataPacket & { label: string; dateKey: string; expense: number })[]>(expenseSql);

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
      existing.revenue = Number(row.revenue);
    }
  }

  // Fill in expense data
  for (const row of expenseRows) {
    const dateKey = new Date(row.dateKey).toISOString().split('T')[0];
    const existing = daysData.get(dateKey);
    if (existing) {
      existing.expense = Number(row.expense);
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
  // Get revenue by week using ISO week
  const revenueSql = `
    SELECT 
      'Minggu ' || EXTRACT(WEEK FROM tanggal)::text as label,
      EXTRACT(YEAR FROM tanggal) * 100 + EXTRACT(WEEK FROM tanggal) as "weekKey",
      COALESCE(SUM(total_harga), 0) as revenue
    FROM transactions
    WHERE tanggal >= CURRENT_DATE - INTERVAL '${weeks} weeks'
    GROUP BY EXTRACT(YEAR FROM tanggal), EXTRACT(WEEK FROM tanggal)
    ORDER BY "weekKey" ASC
  `;
  const revenueRows = await query<(RowDataPacket & { label: string; weekKey: number; revenue: number })[]>(revenueSql);

  // Get expenses by week
  const expenseSql = `
    SELECT 
      'Minggu ' || EXTRACT(WEEK FROM tanggal_terima)::text as label,
      EXTRACT(YEAR FROM tanggal_terima) * 100 + EXTRACT(WEEK FROM tanggal_terima) as "weekKey",
      COALESCE(SUM(harga), 0) as expense
    FROM material_orders
    WHERE status = 'Diterima' AND tanggal_terima >= CURRENT_DATE - INTERVAL '${weeks} weeks'
    GROUP BY EXTRACT(YEAR FROM tanggal_terima), EXTRACT(WEEK FROM tanggal_terima)
    ORDER BY "weekKey" ASC
  `;
  const expenseRows = await query<(RowDataPacket & { label: string; weekKey: number; expense: number })[]>(expenseSql);

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
