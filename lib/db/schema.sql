-- Database: cafe_merah_putih
-- Schema for Cafe Merah Putih Management System

-- Drop tables if exist (in reverse order of dependencies)
DROP TABLE IF EXISTS transaction_items;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS material_orders;
DROP TABLE IF EXISTS product_materials;
DROP TABLE IF EXISTS materials;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

-- Role table
CREATE TABLE roles (
  role_id VARCHAR(36) PRIMARY KEY,
  nama_role VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Akun table (Users/Employees)
CREATE TABLE users (
  user_id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  role_id VARCHAR(36) NOT NULL,
  status ENUM('Aktif', 'Nonaktif') DEFAULT 'Aktif',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE RESTRICT
);

-- Produk table
CREATE TABLE products (
  produk_id VARCHAR(36) PRIMARY KEY,
  nama_produk VARCHAR(100) NOT NULL,
  harga DECIMAL(12, 2) NOT NULL,
  deskripsi TEXT,
  jenis_produk ENUM('Kopi', 'Non-Kopi', 'Makanan') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- Bahan Baku table (Materials)
CREATE TABLE materials (
  bahan_id VARCHAR(36) PRIMARY KEY,
  nama_bahan VARCHAR(100) NOT NULL,
  stok_saat_ini DECIMAL(10, 2) DEFAULT 0,
  stok_minimum DECIMAL(10, 2) NOT NULL,
  satuan ENUM('kg', 'liter', 'pcs', 'gram', 'ml') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bahan Baku per Produk table (Product-Material junction)
CREATE TABLE product_materials (
  produk_id VARCHAR(36) NOT NULL,
  bahan_id VARCHAR(36) NOT NULL,
  jumlah DECIMAL(10, 2) NOT NULL,
  PRIMARY KEY (produk_id, bahan_id),
  FOREIGN KEY (produk_id) REFERENCES products(produk_id) ON DELETE CASCADE,
  FOREIGN KEY (bahan_id) REFERENCES materials(bahan_id) ON DELETE CASCADE
);

-- Pengadaan Bahan Baku table (Material Procurement/Orders)
CREATE TABLE material_orders (
  pengadaan_id VARCHAR(36) PRIMARY KEY,
  bahan_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  jumlah DECIMAL(10, 2) NOT NULL,
  tanggal_pesan DATE NOT NULL,
  tanggal_terima DATE,
  status ENUM('Pending', 'Dikirim', 'Diterima') DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (bahan_id) REFERENCES materials(bahan_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Transaksi Penjualan table (Sales Transactions)
CREATE TABLE transactions (
  transaksi_id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_harga DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Detail Penjualan table (Transaction Items)
CREATE TABLE transaction_items (
  detail_id VARCHAR(36) PRIMARY KEY,
  transaksi_id VARCHAR(36) NOT NULL,
  produk_id VARCHAR(36) NOT NULL,
  jumlah INT NOT NULL,
  harga_satuan DECIMAL(12, 2) NOT NULL,
  FOREIGN KEY (transaksi_id) REFERENCES transactions(transaksi_id) ON DELETE CASCADE,
  FOREIGN KEY (produk_id) REFERENCES products(produk_id) ON DELETE CASCADE
);

-- Barista Orders table (Orders from Kasir to Barista)
CREATE TABLE barista_orders (
  order_id VARCHAR(36) PRIMARY KEY,
  order_number VARCHAR(20) NOT NULL,
  transaksi_id VARCHAR(36),
  cashier_id VARCHAR(36) NOT NULL,
  status ENUM('waiting', 'processing', 'ready', 'completed') DEFAULT 'waiting',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (transaksi_id) REFERENCES transactions(transaksi_id) ON DELETE SET NULL,
  FOREIGN KEY (cashier_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Barista Order Items table
CREATE TABLE barista_order_items (
  item_id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL,
  produk_id VARCHAR(36) NOT NULL,
  jumlah INT NOT NULL,
  notes TEXT,
  FOREIGN KEY (order_id) REFERENCES barista_orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (produk_id) REFERENCES products(produk_id) ON DELETE CASCADE
);


-- Indexes for better query performance
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_products_jenis ON products(jenis_produk);
CREATE INDEX idx_products_nama ON products(nama_produk);
CREATE INDEX idx_materials_stok ON materials(stok_saat_ini);
CREATE INDEX idx_materials_nama ON materials(nama_bahan);
CREATE INDEX idx_material_orders_status ON material_orders(status);
CREATE INDEX idx_material_orders_bahan ON material_orders(bahan_id);
CREATE INDEX idx_material_orders_user ON material_orders(user_id);
CREATE INDEX idx_material_orders_tanggal ON material_orders(tanggal_pesan);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_tanggal ON transactions(tanggal);
CREATE INDEX idx_transaction_items_transaksi ON transaction_items(transaksi_id);
CREATE INDEX idx_transaction_items_produk ON transaction_items(produk_id);
CREATE INDEX idx_barista_orders_status ON barista_orders(status);
CREATE INDEX idx_barista_orders_cashier ON barista_orders(cashier_id);
CREATE INDEX idx_barista_orders_created ON barista_orders(created_at);
CREATE INDEX idx_barista_order_items_order ON barista_order_items(order_id);

-- Insert default roles
INSERT INTO roles (role_id, nama_role) VALUES 
  (UUID(), 'Admin'),
  (UUID(), 'Manager'),
  (UUID(), 'Kasir');
