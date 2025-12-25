/**
 * Database Seed Script for Cafe Merah Putih
 * 
 * This script populates the database with sample data for testing.
 * Run with: npx tsx lib/db/seed.ts
 */

import { v4 as uuidv4 } from 'uuid';
import { getPool, execute, query, closePool } from './connection';
import { hashPassword } from '../utils/password';
import { RowDataPacket } from 'mysql2/promise';

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
    role: 'Admin',
    status: 'Aktif' as const,
  },
  {
    username: 'Manajer User',
    email: 'manajer@cafemerahputih.com',
    password: 'manajer123',
    role: 'Manager',
    status: 'Aktif' as const,
  },
  {
    username: 'Kasir User',
    email: 'kasir@cafemerahputih.com',
    password: 'kasir123',
    role: 'Kasir',
    status: 'Aktif' as const,
  },
  {
    username: 'Barista User',
    email: 'barista@cafemerahputih.com',
    password: 'barista123',
    role: 'Barista',
    status: 'Aktif' as const,
  },
  {
    username: 'Pengadaan User',
    email: 'pengadaan@cafemerahputih.com',
    password: 'pengadaan123',
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
      'INSERT INTO users (user_id, username, password, email, role_id, status) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, user.username, hashedPassword, user.email, roleId, user.status]
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
  console.log('Seeding sample transactions...');
  
  const kasirId = userMap.get('kasir@cafemerahputih.com');
  if (!kasirId) {
    console.error('Kasir user not found, skipping transactions.');
    return;
  }
  
  // Create sample transactions for the past 7 days
  const sampleTransactions = [
    {
      items: [
        { product: 'Cappuccino', jumlah: 2 },
        { product: 'Croissant', jumlah: 1 },
      ],
      daysAgo: 0,
    },
    {
      items: [
        { product: 'Latte', jumlah: 1 },
        { product: 'Cheesecake', jumlah: 1 },
      ],
      daysAgo: 0,
    },
    {
      items: [
        { product: 'Americano', jumlah: 3 },
        { product: 'Sandwich', jumlah: 2 },
      ],
      daysAgo: 1,
    },
    {
      items: [
        { product: 'Mocha', jumlah: 2 },
        { product: 'Green Tea Latte', jumlah: 1 },
      ],
      daysAgo: 1,
    },
    {
      items: [
        { product: 'Espresso', jumlah: 4 },
      ],
      daysAgo: 2,
    },
    {
      items: [
        { product: 'Caramel Macchiato', jumlah: 2 },
        { product: 'Chocolate', jumlah: 2 },
      ],
      daysAgo: 2,
    },
    {
      items: [
        { product: 'Lemon Tea', jumlah: 3 },
        { product: 'Croissant', jumlah: 3 },
      ],
      daysAgo: 3,
    },
    {
      items: [
        { product: 'Cappuccino', jumlah: 1 },
        { product: 'Latte', jumlah: 1 },
        { product: 'Cheesecake', jumlah: 2 },
      ],
      daysAgo: 4,
    },
    {
      items: [
        { product: 'Americano', jumlah: 2 },
        { product: 'Sandwich', jumlah: 1 },
      ],
      daysAgo: 5,
    },
    {
      items: [
        { product: 'Green Tea Latte', jumlah: 2 },
        { product: 'Mocha', jumlah: 1 },
      ],
      daysAgo: 6,
    },
  ];
  
  // Get product prices
  const productPrices = new Map<string, number>();
  for (const p of products) {
    productPrices.set(p.nama_produk, p.harga);
  }
  
  let transactionCount = 0;
  for (const tx of sampleTransactions) {
    const transactionId = uuidv4();
    
    // Calculate total
    let totalHarga = 0;
    for (const item of tx.items) {
      const price = productPrices.get(item.product) || 0;
      totalHarga += price * item.jumlah;
    }
    
    // Calculate date
    const txDate = new Date();
    txDate.setDate(txDate.getDate() - tx.daysAgo);
    txDate.setHours(Math.floor(Math.random() * 12) + 8); // Random hour between 8-20
    
    // Insert transaction
    await execute(
      'INSERT INTO transactions (transaksi_id, user_id, tanggal, total_harga) VALUES (?, ?, ?, ?)',
      [transactionId, kasirId, txDate, totalHarga]
    );
    
    // Insert transaction items
    for (const item of tx.items) {
      const productId = productMap.get(item.product);
      const price = productPrices.get(item.product) || 0;
      
      if (!productId) {
        console.error(`Product not found: ${item.product}`);
        continue;
      }
      
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
  console.log('Seeding sample material orders...');
  
  const managerId = userMap.get('manajer@cafemerahputih.com');
  if (!managerId) {
    console.error('Manager user not found, skipping material orders.');
    return;
  }
  
  const sampleOrders = [
    { material: 'Biji Kopi Arabica', jumlah: 20, status: 'Diterima', daysAgo: 10 },
    { material: 'Susu Full Cream', jumlah: 50, status: 'Diterima', daysAgo: 7 },
    { material: 'Bubuk Coklat', jumlah: 10, status: 'Dikirim', daysAgo: 3 },
    { material: 'Sirup Caramel', jumlah: 5, status: 'Pending', daysAgo: 1 },
    { material: 'Matcha Powder', jumlah: 5, status: 'Pending', daysAgo: 0 },
  ];
  
  let orderCount = 0;
  for (const order of sampleOrders) {
    const materialId = materialMap.get(order.material);
    
    if (!materialId) {
      console.error(`Material not found: ${order.material}`);
      continue;
    }
    
    const orderId = uuidv4();
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - order.daysAgo);
    
    let receiveDate: Date | null = null;
    if (order.status === 'Diterima') {
      receiveDate = new Date();
      receiveDate.setDate(receiveDate.getDate() - order.daysAgo + 2); // Received 2 days after order
    }
    
    await execute(
      'INSERT INTO material_orders (pengadaan_id, bahan_id, user_id, jumlah, tanggal_pesan, tanggal_terima, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [orderId, materialId, managerId, order.jumlah, orderDate, receiveDate, order.status]
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
