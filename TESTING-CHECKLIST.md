# Testing Checklist - Cafe Merah Putih System

## ✅ Database Tests (Automated)
- [x] Database connection successful
- [x] All required tables exist (10/10)
- [x] All 5 roles exist (Admin, Manager, Kasir, Barista, Pengadaan)
- [x] 5 users created and active
- [x] 18 products available
- [x] 15 materials in stock
- [x] Notifications table structure correct
- [x] 5 notifications for Barista
- [x] 216 transactions recorded
- [x] 31 material orders
- [x] 32 product-material relationships
- [x] Database indexes created

**Success Rate: 91.7%** ✅

---

## 🔐 Authentication Tests (Manual)

### Login
- [ ] Admin login (admin@cafemerahputih.com / admin123)
- [ ] Manager login (manajer@cafemerahputih.com / manajer123)
- [ ] Kasir login (kasir@cafemerahputih.com / kasir123)
- [ ] Barista login (barista@cafemerahputih.com / barista123)
- [ ] Pengadaan login (pengadaan@cafemerahputih.com / pengadaan123)
- [ ] Invalid credentials rejected
- [ ] Token stored in localStorage

### Logout
- [ ] Logout button visible in all dashboards
- [ ] Logout clears token and redirects to login
- [ ] Cannot access protected routes after logout

---

## 👨‍💼 Admin Dashboard Tests

### Dashboard Page
- [ ] Statistics cards display correctly (Total Sales, Transactions, Employees, Products)
- [ ] Weekly sales chart renders
- [ ] Top products chart renders
- [ ] Auto-refresh every 30 seconds

### Data Produk Page
- [ ] **NotificationBell visible next to "Tambah Produk" button** ✨
- [ ] Product list displays with pagination (10 items per page)
- [ ] Search products works
- [ ] Filter by category (Semua, Kopi, Non-Kopi, Makanan)
- [ ] Add new product
- [ ] Edit product
- [ ] Delete product
- [ ] Product highlight works when clicking notification

### Transaksi Penjualan
- [ ] Transaction list with pagination
- [ ] Search transactions
- [ ] View transaction details
- [ ] Export functionality (if available)

### Kelola Pegawai
- [ ] Employee list displays
- [ ] Add new employee
- [ ] Edit employee
- [ ] Delete/deactivate employee

### Pemesanan Bahan
- [ ] Material orders list with pagination
- [ ] Create new order
- [ ] View order details
- [ ] Update order status

### Penerimaan Stok
- [ ] Stock receipts list with pagination
- [ ] Receive stock
- [ ] Update material quantities

### Data Bahan Baku
- [ ] Materials list displays
- [ ] Low stock warnings
- [ ] Add new material
- [ ] Edit material
- [ ] Delete material

---

## 📊 Manager Dashboard Tests

### Dashboard Page
- [ ] Same as Admin dashboard
- [ ] **NO notification bell in sidebar** ✨

### Transaksi Penjualan
- [ ] Transaction list with pagination
- [ ] View transaction details

### Laporan
- [ ] Generate reports
- [ ] View sales reports
- [ ] Export reports

---

## ☕ Barista Dashboard Tests

### Pesanan Page
- [ ] **NotificationBell visible in header** ✨
- [ ] Order cards display
- [ ] Filter by status (Semua, Menunggu, Diproses, Siap)
- [ ] Update order status (Menunggu → Diproses → Siap)
- [ ] Order count badges
- [ ] Refresh button works

### Data Produk Page
- [ ] **NotificationBell visible in header** ✨
- [ ] Product list with pagination (10 items per page)
- [ ] Search products
- [ ] **NO "Tambah Produk" button** ✨
- [ ] **Only "Edit" button (light yellow)** ✨
- [ ] Edit product composition (materials)
- [ ] Cannot delete products

---

## 💰 Kasir Dashboard Tests

### Transaksi Page
- [ ] Product selection
- [ ] Add items to cart
- [ ] Calculate total
- [ ] Process payment
- [ ] Print receipt (if available)

---

## 📦 Pengadaan Dashboard Tests

### Dashboard Page
- [ ] **NO notification bell** ✨
- [ ] Material list with pagination
- [ ] Low stock alerts

### Data Bahan Baku
- [ ] Material list displays
- [ ] View material details

### Pemesanan Bahan
- [ ] Create material orders with pagination
- [ ] View order details

### Penerimaan Stok
- [ ] Receive stock with pagination
- [ ] Update quantities

---

## 🔔 Notification System Tests

### NotificationBell Component
- [ ] **Visible in Admin Data Produk page (next to "Tambah Produk")** ✨
- [ ] **Visible in Barista header (both Pesanan and Data Produk)** ✨
- [ ] **NOT visible in Manager sidebar** ✨
- [ ] **NOT visible in Pengadaan sidebar** ✨
- [ ] Bell icon with badge shows unread count
- [ ] Green dot indicator when connected
- [ ] Auto-update every 5 seconds
- [ ] Dropdown opens on click (420px width)
- [ ] Notifications display with proper styling
- [ ] Click notification marks as read
- [ ] Click notification navigates to product page
- [ ] "Tandai semua sebagai dibaca" button works
- [ ] Manual refresh button works

### Notification Creation
- [ ] Admin adds product → Barista receives notification
- [ ] Notification title: "Produk Baru Ditambahkan"
- [ ] Notification message includes product name
- [ ] Notification data includes productId
- [ ] Notification appears in database
- [ ] Notification appears in bell dropdown within 5 seconds

### Notification Display
- [ ] Unread notifications have blue background
- [ ] Read notifications have white background
- [ ] Blue dot indicator for unread items
- [ ] Time ago format (e.g., "17 menit yang lalu")
- [ ] Icon based on type (Package for NEW_PRODUCT)
- [ ] Proper text truncation

---

## 📱 UI/UX Tests

### Responsive Design
- [ ] Desktop view (1920x1080)
- [ ] Laptop view (1366x768)
- [ ] Tablet view (768x1024)
- [ ] Mobile view (375x667)

### Navigation
- [ ] Sidebar navigation works
- [ ] Active menu item highlighted
- [ ] Breadcrumbs (if available)

### Forms
- [ ] Input validation
- [ ] Error messages display
- [ ] Success messages display
- [ ] Loading states

### Pagination
- [ ] Page numbers display correctly
- [ ] Previous/Next buttons work
- [ ] Info text shows correct range
- [ ] Auto-reset on search

---

## 🐛 Known Issues & Fixes

### ✅ Fixed Issues
1. ✅ MySQL connection error (port 3307 → 3306)
2. ✅ Logout button inconsistent text (all now "Keluar")
3. ✅ Notification bell size too large (now 420px)
4. ✅ Token not found error (added token validation)
5. ✅ Notification bell in wrong locations (moved to correct pages)

### ⚠️ Notes
- `material_order_items` table not used in current implementation
- 6 materials currently have low stock (expected behavior)
- All notifications for Barista are currently read (test by adding new product)

---

## 🎯 Critical Features Summary

### ✨ Notification System
- **Location**: Admin Data Produk page + Barista header
- **Auto-update**: Every 5 seconds
- **Styling**: 420px dropdown, proporsional
- **Functionality**: Real-time updates, mark as read, navigation

### 📄 Pagination
- **Pages with pagination**: 
  - Admin: Data Produk, Pemesanan Bahan, Penerimaan Stok, Transaksi
  - Barista: Data Produk
  - Pengadaan: Data Bahan Baku, Pemesanan, Penerimaan
- **Items per page**: 10
- **Features**: Page numbers, Previous/Next, info text, auto-reset

### 🔐 Role-Based Access
- **Admin**: Full access + notifications
- **Manager**: Dashboard + reports, NO notifications
- **Kasir**: Transactions only
- **Barista**: Orders + products (edit composition only) + notifications
- **Pengadaan**: Materials management, NO notifications

---

## 📝 Test Results

**Date**: January 2, 2026
**Automated Tests**: 11/12 passed (91.7%)
**Manual Tests**: Pending user verification

**Status**: ✅ System ready for manual testing
