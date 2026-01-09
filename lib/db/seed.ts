/**
 * Database Seed Script for Cafe Merah Putih
 * 
 * This script populates the database with sample data for testing.
 * Run with: npx tsx lib/db/seed.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { v4 as uuidv4 } from 'uuid';
import { getPool, execute, query, closePool, RowDataPacket } from './connection';
import { hashPassword } from '../utils/password';

// ==================== Seed Data ====================

// Roles
const roles = [
  { nama_role: 'Admin' },
  { nama_role: 'Manager' },
  { nama_role: 'Kasir' },
  { nama_role: 'Barista' },
  { nama_role: 'Pengadaan' },
];

// Users (will be created with hashed passwords)
const users = [
  {
    username: 'Admin User',
    email: 'admin@cafemerahputih.com',
    password: 'admin123',
    phone: '081234567890',
    role: 'Admin',
    status: 'Aktif' as const,
  },
  {
    username: 'Manajer User',
    email: 'manajer@cafemerahputih.com',
    password: 'manajer123',
    phone: '081234567891',
    role: 'Manager',
    status: 'Aktif' as const,
  },
  {
    username: 'Kasir User',
    email: 'kasir@cafemerahputih.com',
    password: 'kasir123',
    phone: '081234567892',
    role: 'Kasir',
    status: 'Aktif' as const,
  },
  {
    username: 'Barista User',
    email: 'barista@cafemerahputih.com',
    password: 'barista123',
    phone: '081234567893',
    role: 'Barista',
    status: 'Aktif' as const,
  },
  {
    username: 'Pengadaan User',
    email: 'pengadaan@cafemerahputih.com',
    password: 'pengadaan123',
    phone: '081234567894',
    role: 'Pengadaan',
    status: 'Aktif' as const,
  },
];

// Products
const products = [
  { nama_produk: 'Espresso', harga: 18000, deskripsi: 'Kopi espresso klasik', jenis_produk: 'Kopi' as const },
  { nama_produk: 'Americano', harga: 22000, deskripsi: 'Espresso dengan air panas', jenis_produk: 'Kopi' as const },
  { nama_produk: 'Cappuccino', harga: 28000, deskripsi: 'Espresso dengan susu dan foam', jenis_produk: 'Kopi' as const },
  { nama_produk: 'Latte', harga: 28000, deskripsi: 'Espresso dengan susu steamed', jenis_produk: 'Kopi' as const },
  { nama_produk: 'Mocha', harga: 32000, deskripsi: 'Espresso dengan coklat dan susu', jenis_produk: 'Kopi' as const },
  { nama_produk: 'Caramel Macchiato', harga: 35000, deskripsi: 'Latte dengan sirup caramel', jenis_produk: 'Kopi' as const },
  { nama_produk: 'Green Tea Latte', harga: 30000, deskripsi: 'Matcha dengan susu', jenis_produk: 'Non-Kopi' as const },
  { nama_produk: 'Chocolate', harga: 25000, deskripsi: 'Coklat panas/dingin', jenis_produk: 'Non-Kopi' as const },
  { nama_produk: 'Lemon Tea', harga: 18000, deskripsi: 'Teh lemon segar', jenis_produk: 'Non-Kopi' as const },
  { nama_produk: 'Croissant', harga: 25000, deskripsi: 'Croissant butter klasik', jenis_produk: 'Makanan' as const },
  { nama_produk: 'Sandwich', harga: 35000, deskripsi: 'Sandwich dengan berbagai isian', jenis_produk: 'Makanan' as const },
  { nama_produk: 'Cheesecake', harga: 40000, deskripsi: 'New York style cheesecake', jenis_produk: 'Makanan' as const },
];

// Materials (Bahan Baku)
const materials = [
  { nama_bahan: 'Biji Kopi Arabica', stok_saat_ini: 50, stok_minimum: 10, satuan: 'kg' as const },
  { nama_bahan: 'Biji Kopi Robusta', stok_saat_ini: 30, stok_minimum: 10, satuan: 'kg' as const },
  { nama_bahan: 'Susu Full Cream', stok_saat_ini: 100, stok_minimum: 20, satuan: 'liter' as const },
  { nama_bahan: 'Susu Oat', stok_saat_ini: 25, stok_minimum: 10, satuan: 'liter' as const },
  { nama_bahan: 'Gula Pasir', stok_saat_ini: 40, stok_minimum: 10, satuan: 'kg' as const },
  { nama_bahan: 'Sirup Caramel', stok_saat_ini: 15, stok_minimum: 5, satuan: 'liter' as const },
  { nama_bahan: 'Sirup Vanilla', stok_saat_ini: 12, stok_minimum: 5, satuan: 'liter' as const },
  { nama_bahan: 'Bubuk Coklat', stok_saat_ini: 20, stok_minimum: 5, satuan: 'kg' as const },
  { nama_bahan: 'Matcha Powder', stok_saat_ini: 8, stok_minimum: 3, satuan: 'kg' as const },
  { nama_bahan: 'Teh Hitam', stok_saat_ini: 15, stok_minimum: 5, satuan: 'kg' as const },
  { nama_bahan: 'Lemon', stok_saat_ini: 50, stok_minimum: 20, satuan: 'pcs' as const },
  { nama_bahan: 'Butter', stok_saat_ini: 10, stok_minimum: 5, satuan: 'kg' as const },
  { nama_bahan: 'Tepung Terigu', stok_saat_ini: 25, stok_minimum: 10, satuan: 'kg' as const },
  { nama_bahan: 'Cream Cheese', stok_saat_ini: 8, stok_minimum: 3, satuan: 'kg' as const },
  { nama_bahan: 'Roti Tawar', stok_saat_ini: 30, stok_minimum: 10, satuan: 'pcs' as const },
];

// Product-Material relationships (which materials are used in which products)
const productMaterials = [
  // Espresso
  { product: 'Espresso', material: 'Biji Kopi Arabica', jumlah: 0.02 },
  // Americano
  { product: 'Americano', material: 'Biji Kopi Arabica', jumlah: 0.02 },
  // Cappuccino
  { product: 'Cappuccino', material: 'Biji Kopi Arabica', jumlah: 0.02 },
  { product: 'Cappuccino', material: 'Susu Full Cream', jumlah: 0.15 },
  // Latte
  { product: 'Latte', material: 'Biji Kopi Arabica', jumlah: 0.02 },
  { product: 'Latte', material: 'Susu Full Cream', jumlah: 0.2 },
  // Mocha
  { product: 'Mocha', material: 'Biji Kopi Arabica', jumlah: 0.02 },
  { product: 'Mocha', material: 'Susu Full Cream', jumlah: 0.15 },
  { product: 'Mocha', material: 'Bubuk Coklat', jumlah: 0.02 },
  // Caramel Macchiato
  { product: 'Caramel Macchiato', material: 'Biji Kopi Arabica', jumlah: 0.02 },
  { product: 'Caramel Macchiato', material: 'Susu Full Cream', jumlah: 0.2 },
  { product: 'Caramel Macchiato', material: 'Sirup Caramel', jumlah: 0.03 },
  // Green Tea Latte
  { product: 'Green Tea Latte', material: 'Matcha Powder', jumlah: 0.01 },
  { product: 'Green Tea Latte', material: 'Susu Full Cream', jumlah: 0.2 },
  // Chocolate
  { product: 'Chocolate', material: 'Bubuk Coklat', jumlah: 0.03 },
  { product: 'Chocolate', material: 'Susu Full Cream', jumlah: 0.2 },
  // Lemon Tea
  { product: 'Lemon Tea', material: 'Teh Hitam', jumlah: 0.005 },
  { product: 'Lemon Tea', material: 'Lemon', jumlah: 1 },
  // Croissant
  { product: 'Croissant', material: 'Butter', jumlah: 0.05 },
  { product: 'Croissant', material: 'Tepung Terigu', jumlah: 0.1 },
  // Sandwich
  { product: 'Sandwich', material: 'Roti Tawar', jumlah: 2 },
  { product: 'Sandwich', material: 'Butter', jumlah: 0.02 },
  // Cheesecake
  { product: 'Cheesecake', material: 'Cream Cheese', jumlah: 0.1 },
  { product: 'Cheesecake', material: 'Butter', jumlah: 0.03 },
];

// ==================== Helper Functions ====================

interface RoleRow extends RowDataPacket {
  role_id: string;
  nama_role: string;
}

interface ProductRow extends RowDataPacket {
  produk_id: string;
  nama_produk: string;
}

interface MaterialRow extends RowDataPacket {
  bahan_id: string;
  nama_bahan: string;
}

interface UserRow extends RowDataPacket {
  user_id: string;
}

async function clearTables(): Promise<void> {
  console.log('Clearing existing data...');

  // Delete in reverse order of dependencies
  await execute('DELETE FROM transaction_items');
  await execute('DELETE FROM transactions');
  await execute('DELETE FROM material_orders');
  await execute('DELETE FROM product_materials');
  await execute('DELETE FROM materials');
  await execute('DELETE FROM products');
  await execute('DELETE FROM users');
  await execute('DELETE FROM roles');

  console.log('All tables cleared.');
}

async function seedRoles(): Promise<Map<string, string>> {
  console.log('Seeding roles...');
  const roleMap = new Map<string, string>();

  for (const role of roles) {
    const roleId = uuidv4();
    await execute(
      'INSERT INTO roles (role_id, nama_role) VALUES (?, ?)',
      [roleId, role.nama_role]
    );
    roleMap.set(role.nama_role, roleId);
  }

  console.log(`Inserted ${roles.length} roles.`);
  return roleMap;
}

async function seedUsers(roleMap: Map<string, string>): Promise<Map<string, string>> {
  console.log('Seeding users...');
  const userMap = new Map<string, string>();

  for (const user of users) {
    const userId = uuidv4();
    const roleId = roleMap.get(user.role);

    if (!roleId) {
      console.error(`Role not found: ${user.role}`);
      continue;
    }

    const hashedPassword = await hashPassword(user.password);

    await execute(
      'INSERT INTO users (user_id, username, password, email, phone, role_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, user.username, hashedPassword, user.email, user.phone || null, roleId, user.status]
    );

    userMap.set(user.email, userId);
  }

  console.log(`Inserted ${users.length} users.`);
  return userMap;
}


async function seedProducts(): Promise<Map<string, string>> {
  console.log('Seeding products...');
  const productMap = new Map<string, string>();

  for (const product of products) {
    const productId = uuidv4();
    await execute(
      'INSERT INTO products (produk_id, nama_produk, harga, deskripsi, jenis_produk) VALUES (?, ?, ?, ?, ?)',
      [productId, product.nama_produk, product.harga, product.deskripsi, product.jenis_produk]
    );
    productMap.set(product.nama_produk, productId);
  }

  console.log(`Inserted ${products.length} products.`);
  return productMap;
}

async function seedMaterials(): Promise<Map<string, string>> {
  console.log('Seeding materials...');
  const materialMap = new Map<string, string>();

  for (const material of materials) {
    const materialId = uuidv4();
    await execute(
      'INSERT INTO materials (bahan_id, nama_bahan, stok_saat_ini, stok_minimum, satuan) VALUES (?, ?, ?, ?, ?)',
      [materialId, material.nama_bahan, material.stok_saat_ini, material.stok_minimum, material.satuan]
    );
    materialMap.set(material.nama_bahan, materialId);
  }

  console.log(`Inserted ${materials.length} materials.`);
  return materialMap;
}

async function seedProductMaterials(
  productMap: Map<string, string>,
  materialMap: Map<string, string>
): Promise<void> {
  console.log('Seeding product-material relationships...');

  let count = 0;
  for (const pm of productMaterials) {
    const productId = productMap.get(pm.product);
    const materialId = materialMap.get(pm.material);

    if (!productId || !materialId) {
      console.error(`Product or material not found: ${pm.product} - ${pm.material}`);
      continue;
    }

    await execute(
      'INSERT INTO product_materials (produk_id, bahan_id, jumlah) VALUES (?, ?, ?)',
      [productId, materialId, pm.jumlah]
    );
    count++;
  }

  console.log(`Inserted ${count} product-material relationships.`);
}

async function seedSampleTransactions(
  userMap: Map<string, string>,
  productMap: Map<string, string>
): Promise<void> {
  console.log('Seeding sample transactions (6 months history)...');

  const kasirId = userMap.get('kasir@cafemerahputih.com');
  if (!kasirId) {
    console.error('Kasir user not found, skipping transactions.');
    return;
  }

  // Get product prices
  const productPrices = new Map<string, number>();
  for (const p of products) {
    productPrices.set(p.nama_produk, p.harga);
  }

  const productNames = products.map(p => p.nama_produk);

  // Generate transactions for the past 6 months
  let transactionCount = 0;
  const today = new Date();

  for (let monthsAgo = 5; monthsAgo >= 0; monthsAgo--) {
    // Generate 20-40 transactions per month (more recent months have more)
    const txPerMonth = 20 + (5 - monthsAgo) * 5 + Math.floor(Math.random() * 10);

    for (let i = 0; i < txPerMonth; i++) {
      const transactionId = uuidv4();

      // Random date within the month
      const txDate = new Date(today);
      txDate.setMonth(txDate.getMonth() - monthsAgo);
      txDate.setDate(Math.floor(Math.random() * 28) + 1);
      txDate.setHours(Math.floor(Math.random() * 12) + 8);

      // Random items (1-4 items per transaction)
      const numItems = Math.floor(Math.random() * 4) + 1;
      const items: { product: string; jumlah: number }[] = [];
      const usedProducts = new Set<string>();

      for (let j = 0; j < numItems; j++) {
        let product: string;
        do {
          product = productNames[Math.floor(Math.random() * productNames.length)];
        } while (usedProducts.has(product));
        usedProducts.add(product);

        items.push({
          product,
          jumlah: Math.floor(Math.random() * 3) + 1,
        });
      }

      // Calculate total
      let totalHarga = 0;
      for (const item of items) {
        const price = productPrices.get(item.product) || 0;
        totalHarga += price * item.jumlah;
      }

      // Insert transaction
      await execute(
        'INSERT INTO transactions (transaksi_id, user_id, tanggal, total_harga) VALUES (?, ?, ?, ?)',
        [transactionId, kasirId, txDate, totalHarga]
      );

      // Insert transaction items
      for (const item of items) {
        const productId = productMap.get(item.product);
        const price = productPrices.get(item.product) || 0;

        if (!productId) continue;

        const detailId = uuidv4();
        await execute(
          'INSERT INTO transaction_items (detail_id, transaksi_id, produk_id, jumlah, harga_satuan) VALUES (?, ?, ?, ?, ?)',
          [detailId, transactionId, productId, item.jumlah, price]
        );
      }

      transactionCount++;
    }
  }

  // Add some transactions for today
  const todayTransactions = [
    { items: [{ product: 'Cappuccino', jumlah: 2 }, { product: 'Croissant', jumlah: 1 }] },
    { items: [{ product: 'Latte', jumlah: 1 }, { product: 'Cheesecake', jumlah: 1 }] },
    { items: [{ product: 'Americano', jumlah: 3 }, { product: 'Sandwich', jumlah: 2 }] },
  ];

  for (const tx of todayTransactions) {
    const transactionId = uuidv4();
    let totalHarga = 0;

    for (const item of tx.items) {
      const price = productPrices.get(item.product) || 0;
      totalHarga += price * item.jumlah;
    }

    const txDate = new Date();
    txDate.setHours(Math.floor(Math.random() * 8) + 8);

    await execute(
      'INSERT INTO transactions (transaksi_id, user_id, tanggal, total_harga) VALUES (?, ?, ?, ?)',
      [transactionId, kasirId, txDate, totalHarga]
    );

    for (const item of tx.items) {
      const productId = productMap.get(item.product);
      const price = productPrices.get(item.product) || 0;
      if (!productId) continue;

      const detailId = uuidv4();
      await execute(
        'INSERT INTO transaction_items (detail_id, transaksi_id, produk_id, jumlah, harga_satuan) VALUES (?, ?, ?, ?, ?)',
        [detailId, transactionId, productId, item.jumlah, price]
      );
    }
    transactionCount++;
  }

  console.log(`Inserted ${transactionCount} sample transactions.`);
}


async function seedSampleMaterialOrders(
  userMap: Map<string, string>,
  materialMap: Map<string, string>
): Promise<void> {
  console.log('Seeding sample material orders (6 months history)...');

  const managerId = userMap.get('manajer@cafemerahputih.com');
  const pengadaanId = userMap.get('pengadaan@cafemerahputih.com');

  if (!managerId || !pengadaanId) {
    console.error('Manager or Pengadaan user not found, skipping material orders.');
    return;
  }

  const materialNames = materials.map(m => m.nama_bahan);
  const materialPrices: Record<string, number> = {
    'Biji Kopi Arabica': 150000,
    'Biji Kopi Robusta': 100000,
    'Susu Full Cream': 25000,
    'Susu Oat': 45000,
    'Gula Pasir': 15000,
    'Sirup Caramel': 85000,
    'Sirup Vanilla': 80000,
    'Bubuk Coklat': 75000,
    'Matcha Powder': 200000,
    'Teh Hitam': 50000,
    'Lemon': 5000,
    'Butter': 120000,
    'Tepung Terigu': 12000,
    'Cream Cheese': 180000,
    'Roti Tawar': 15000,
  };

  let orderCount = 0;
  const today = new Date();

  // Generate orders for the past 6 months
  for (let monthsAgo = 5; monthsAgo >= 0; monthsAgo--) {
    // 3-6 orders per month
    const ordersPerMonth = Math.floor(Math.random() * 4) + 3;

    for (let i = 0; i < ordersPerMonth; i++) {
      const orderId = uuidv4();
      const material = materialNames[Math.floor(Math.random() * materialNames.length)];
      const materialId = materialMap.get(material);

      if (!materialId) continue;

      const orderDate = new Date(today);
      orderDate.setMonth(orderDate.getMonth() - monthsAgo);
      orderDate.setDate(Math.floor(Math.random() * 28) + 1);

      const jumlah = Math.floor(Math.random() * 20) + 5;
      const harga = (materialPrices[material] || 50000) * jumlah;

      // Older orders are more likely to be received
      let status: 'Pending' | 'Dikirim' | 'Diterima';
      let receiveDate: Date | null = null;

      if (monthsAgo >= 1) {
        status = 'Diterima';
        receiveDate = new Date(orderDate);
        receiveDate.setDate(receiveDate.getDate() + Math.floor(Math.random() * 5) + 2);
      } else if (monthsAgo === 0 && Math.random() > 0.5) {
        status = 'Diterima';
        receiveDate = new Date(orderDate);
        receiveDate.setDate(receiveDate.getDate() + Math.floor(Math.random() * 5) + 2);
      } else if (Math.random() > 0.5) {
        status = 'Dikirim';
      } else {
        status = 'Pending';
      }

      const userId = Math.random() > 0.5 ? managerId : pengadaanId;

      await execute(
        'INSERT INTO material_orders (pengadaan_id, bahan_id, user_id, jumlah, harga, tanggal_pesan, tanggal_terima, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [orderId, materialId, userId, jumlah, harga, orderDate, receiveDate, status]
      );

      orderCount++;
    }
  }

  // Add some recent pending orders
  const recentOrders = [
    { material: 'Biji Kopi Arabica', jumlah: 20, status: 'Dikirim' as const, daysAgo: 3 },
    { material: 'Susu Full Cream', jumlah: 50, status: 'Pending' as const, daysAgo: 1 },
    { material: 'Matcha Powder', jumlah: 5, status: 'Pending' as const, daysAgo: 0 },
  ];

  for (const order of recentOrders) {
    const materialId = materialMap.get(order.material);
    if (!materialId) continue;

    const orderId = uuidv4();
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - order.daysAgo);

    const harga = (materialPrices[order.material] || 50000) * order.jumlah;

    await execute(
      'INSERT INTO material_orders (pengadaan_id, bahan_id, user_id, jumlah, harga, tanggal_pesan, tanggal_terima, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [orderId, materialId, pengadaanId, order.jumlah, harga, orderDate, null, order.status]
    );

    orderCount++;
  }

  console.log(`Inserted ${orderCount} sample material orders.`);
}

// ==================== Main Seed Function ====================

async function seed(): Promise<void> {
  console.log('========================================');
  console.log('Starting database seed...');
  console.log('========================================\n');

  try {
    // Initialize pool
    getPool();

    // Clear existing data
    await clearTables();

    // Seed data in order of dependencies
    const roleMap = await seedRoles();
    const userMap = await seedUsers(roleMap);
    const productMap = await seedProducts();
    const materialMap = await seedMaterials();

    // Seed relationships
    await seedProductMaterials(productMap, materialMap);

    // Seed sample data
    await seedSampleTransactions(userMap, productMap);
    await seedSampleMaterialOrders(userMap, materialMap);

    console.log('\n========================================');
    console.log('Database seed completed successfully!');
    console.log('========================================');

    console.log('\nDefault users created:');
    console.log('  - admin@cafemerahputih.com / admin123 (Admin)');
    console.log('  - manajer@cafemerahputih.com / manajer123 (Manager)');
    console.log('  - kasir@cafemerahputih.com / kasir123 (Kasir)');
    console.log('  - barista@cafemerahputih.com / barista123 (Barista)');
    console.log('  - pengadaan@cafemerahputih.com / pengadaan123 (Pengadaan)');
    console.log('  - pengadaan@cafemerahputih.com / pengadaan123 (Pengadaan)');

  } catch (error) {
    console.error('\n========================================');
    console.error('Database seed failed!');
    console.error('========================================');
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run seed if this file is executed directly
seed();
