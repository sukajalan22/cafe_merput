import { query, execute, RowDataPacket } from '../connection';
import { v4 as uuidv4 } from 'uuid';

// Barista Order Status
export type BaristaOrderStatus = 'waiting' | 'processing' | 'ready' | 'completed';

// Barista Order interface
export interface BaristaOrder {
  order_id: string;
  order_number: string;
  transaksi_id: string | null;
  cashier_id: string;
  cashier_name?: string;
  status: BaristaOrderStatus;
  created_at: Date;
  updated_at: Date;
}

export interface BaristaOrderItem {
  item_id: string;
  order_id: string;
  produk_id: string;
  nama_produk?: string;
  jumlah: number;
  notes: string | null;
}

export interface BaristaOrderWithItems extends BaristaOrder {
  items: BaristaOrderItem[];
}

interface BaristaOrderRow extends RowDataPacket, BaristaOrder { }
interface BaristaOrderItemRow extends RowDataPacket, BaristaOrderItem { }

// DTOs
export interface CreateBaristaOrderDTO {
  transaksi_id?: string;
  cashier_id: string;
  items: {
    produk_id: string;
    jumlah: number;
    notes?: string;
  }[];
}

// Generate order number (HHMM + random 2 digits)
function generateOrderNumber(): string {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `${hours}${minutes}${random}`;
}

/**
 * Get all barista orders with optional status filter
 */
export async function getAll(status?: BaristaOrderStatus | 'active'): Promise<BaristaOrderWithItems[]> {
  let sql = `
    SELECT bo.*, u.username as cashier_name
    FROM barista_orders bo
    LEFT JOIN users u ON bo.cashier_id = u.user_id
    WHERE 1=1
  `;
  const params: string[] = [];

  if (status === 'active') {
    sql += ` AND bo.status != 'completed'`;
  } else if (status) {
    sql += ` AND bo.status = ?`;
    params.push(status);
  }

  sql += ' ORDER BY bo.created_at DESC';

  const orders = await query<BaristaOrderRow[]>(sql, params);

  // Get items for each order
  const ordersWithItems: BaristaOrderWithItems[] = await Promise.all(
    orders.map(async (order) => {
      const items = await getOrderItems(order.order_id);
      return { ...order, items };
    })
  );

  return ordersWithItems;
}

/**
 * Get order items with product names
 */
async function getOrderItems(orderId: string): Promise<BaristaOrderItem[]> {
  const sql = `
    SELECT boi.*, p.nama_produk
    FROM barista_order_items boi
    JOIN products p ON boi.produk_id = p.produk_id
    WHERE boi.order_id = ?
  `;
  return query<BaristaOrderItemRow[]>(sql, [orderId]);
}

/**
 * Get barista order by ID
 */
export async function getById(id: string): Promise<BaristaOrderWithItems | null> {
  const sql = `
    SELECT bo.*, u.username as cashier_name
    FROM barista_orders bo
    LEFT JOIN users u ON bo.cashier_id = u.user_id
    WHERE bo.order_id = ?
  `;
  const rows = await query<BaristaOrderRow[]>(sql, [id]);

  if (rows.length === 0) {
    return null;
  }

  const items = await getOrderItems(id);
  return { ...rows[0], items };
}

/**
 * Create a new barista order
 */
export async function create(data: CreateBaristaOrderDTO): Promise<BaristaOrderWithItems> {
  const orderId = uuidv4();
  const orderNumber = generateOrderNumber();

  // Insert order
  const orderSql = `
    INSERT INTO barista_orders (order_id, order_number, transaksi_id, cashier_id, status)
    VALUES (?, ?, ?, ?, 'waiting')
  `;
  await execute(orderSql, [orderId, orderNumber, data.transaksi_id || null, data.cashier_id]);

  // Insert items
  for (const item of data.items) {
    const itemId = uuidv4();
    const itemSql = `
      INSERT INTO barista_order_items (item_id, order_id, produk_id, jumlah, notes)
      VALUES (?, ?, ?, ?, ?)
    `;
    await execute(itemSql, [itemId, orderId, item.produk_id, item.jumlah, item.notes || null]);
  }

  const order = await getById(orderId);
  if (!order) {
    throw new Error('Failed to create barista order');
  }
  return order;
}

/**
 * Update barista order status
 */
export async function updateStatus(id: string, status: BaristaOrderStatus): Promise<BaristaOrderWithItems | null> {
  const sql = 'UPDATE barista_orders SET status = ? WHERE order_id = ?';
  await execute(sql, [status, id]);
  return getById(id);
}

/**
 * Delete a barista order
 */
export async function deleteOrder(id: string): Promise<boolean> {
  const sql = 'DELETE FROM barista_orders WHERE order_id = ?';
  const result = await execute(sql, [id]);
  return result.affectedRows > 0;
}

/**
 * Reduce material stock when order is completed
 */
export async function reduceMaterialStock(orderId: string): Promise<void> {
  const order = await getById(orderId);
  if (!order) return;

  for (const item of order.items) {
    // Get materials needed for this product
    const materialsSql = `
      SELECT pm.bahan_id, pm.jumlah
      FROM product_materials pm
      WHERE pm.produk_id = ?
    `;

    interface MaterialRow extends RowDataPacket {
      bahan_id: string;
      jumlah: number;
    }

    const materials = await query<MaterialRow[]>(materialsSql, [item.produk_id]);

    // Reduce stock for each material
    for (const material of materials) {
      const reduction = material.jumlah * item.jumlah;
      const updateSql = `
        UPDATE materials 
        SET stok_saat_ini = GREATEST(0, stok_saat_ini - ?)
        WHERE bahan_id = ?
      `;
      await execute(updateSql, [reduction, material.bahan_id]);
    }
  }
}
