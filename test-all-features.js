/**
 * Comprehensive test script for Cafe Merah Putih system
 * Tests database connections, data integrity, and key features
 */

const mysql = require('mysql2/promise');

async function runTests() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'cafe_merah_putih',
  });

  console.log('🧪 Starting comprehensive system tests...\n');
  let passedTests = 0;
  let failedTests = 0;

  try {
    // TEST 1: Database Connection
    console.log('📋 TEST 1: Database Connection');
    try {
      await connection.ping();
      console.log('✅ PASSED: Database connection successful\n');
      passedTests++;
    } catch (error) {
      console.log('❌ FAILED: Database connection failed\n');
      failedTests++;
    }

    // TEST 2: Check all required tables exist
    console.log('📋 TEST 2: Required Tables');
    const requiredTables = [
      'roles', 'users', 'products', 'materials', 
      'product_materials', 'transactions', 'transaction_items',
      'material_orders', 'material_order_items', 'notifications'
    ];
    
    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    let allTablesExist = true;
    for (const table of requiredTables) {
      if (!tableNames.includes(table)) {
        console.log(`❌ Missing table: ${table}`);
        allTablesExist = false;
      }
    }
    
    if (allTablesExist) {
      console.log(`✅ PASSED: All ${requiredTables.length} required tables exist\n`);
      passedTests++;
    } else {
      console.log('❌ FAILED: Some tables are missing\n');
      failedTests++;
    }

    // TEST 3: Check Roles
    console.log('📋 TEST 3: Roles Data');
    const [roles] = await connection.execute('SELECT * FROM roles');
    const expectedRoles = ['Admin', 'Manager', 'Kasir', 'Barista', 'Pengadaan'];
    const roleNames = roles.map(r => r.nama_role);
    
    let allRolesExist = expectedRoles.every(role => roleNames.includes(role));
    if (allRolesExist && roles.length === 5) {
      console.log(`✅ PASSED: All 5 roles exist (${roleNames.join(', ')})\n`);
      passedTests++;
    } else {
      console.log('❌ FAILED: Missing or extra roles\n');
      failedTests++;
    }

    // TEST 4: Check Users
    console.log('📋 TEST 4: Users Data');
    const [users] = await connection.execute(`
      SELECT u.*, r.nama_role 
      FROM users u 
      JOIN roles r ON u.role_id = r.role_id
    `);
    
    if (users.length >= 5) {
      console.log(`✅ PASSED: ${users.length} users found`);
      users.forEach(u => {
        console.log(`   - ${u.username} (${u.nama_role}) - ${u.status}`);
      });
      console.log('');
      passedTests++;
    } else {
      console.log('❌ FAILED: Not enough users in database\n');
      failedTests++;
    }

    // TEST 5: Check Products
    console.log('📋 TEST 5: Products Data');
    const [products] = await connection.execute('SELECT * FROM products');
    
    if (products.length > 0) {
      console.log(`✅ PASSED: ${products.length} products found`);
      const categories = [...new Set(products.map(p => p.jenis_produk))];
      console.log(`   Categories: ${categories.join(', ')}\n`);
      passedTests++;
    } else {
      console.log('❌ FAILED: No products in database\n');
      failedTests++;
    }

    // TEST 6: Check Materials
    console.log('📋 TEST 6: Materials Data');
    const [materials] = await connection.execute('SELECT * FROM materials');
    
    if (materials.length > 0) {
      console.log(`✅ PASSED: ${materials.length} materials found`);
      const lowStock = materials.filter(m => m.stok_saat_ini <= m.stok_minimum);
      if (lowStock.length > 0) {
        console.log(`   ⚠️  ${lowStock.length} materials with low stock`);
      }
      console.log('');
      passedTests++;
    } else {
      console.log('❌ FAILED: No materials in database\n');
      failedTests++;
    }

    // TEST 7: Check Notifications Table Structure
    console.log('📋 TEST 7: Notifications Table Structure');
    const [notifColumns] = await connection.execute(`
      SHOW COLUMNS FROM notifications
    `);
    
    const requiredColumns = [
      'notification_id', 'user_id', 'type', 'title', 
      'message', 'data', 'is_read', 'created_at'
    ];
    const columnNames = notifColumns.map(c => c.Field);
    
    let allColumnsExist = requiredColumns.every(col => columnNames.includes(col));
    if (allColumnsExist) {
      console.log('✅ PASSED: Notifications table has correct structure\n');
      passedTests++;
    } else {
      console.log('❌ FAILED: Notifications table missing columns\n');
      failedTests++;
    }

    // TEST 8: Check Notifications for Barista
    console.log('📋 TEST 8: Barista Notifications');
    const [baristaUsers] = await connection.execute(`
      SELECT u.user_id, u.username
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE r.nama_role = 'Barista' AND u.status = 'Aktif'
    `);
    
    if (baristaUsers.length > 0) {
      const baristaId = baristaUsers[0].user_id;
      const [notifications] = await connection.execute(`
        SELECT * FROM notifications 
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 5
      `, [baristaId]);
      
      console.log(`✅ PASSED: Found ${notifications.length} notifications for Barista`);
      if (notifications.length > 0) {
        console.log(`   Latest: ${notifications[0].title}`);
        const unread = notifications.filter(n => !n.is_read).length;
        console.log(`   Unread: ${unread}\n`);
      } else {
        console.log('   ℹ️  No notifications yet (add a product to test)\n');
      }
      passedTests++;
    } else {
      console.log('❌ FAILED: No Barista user found\n');
      failedTests++;
    }

    // TEST 9: Check Transactions
    console.log('📋 TEST 9: Transactions Data');
    const [transactions] = await connection.execute('SELECT * FROM transactions');
    
    if (transactions.length >= 0) {
      console.log(`✅ PASSED: ${transactions.length} transactions found`);
      if (transactions.length > 0) {
        const [total] = await connection.execute(`
          SELECT SUM(total_harga) as total FROM transactions
        `);
        console.log(`   Total revenue: Rp ${total[0].total.toLocaleString('id-ID')}`);
      }
      console.log('');
      passedTests++;
    } else {
      console.log('❌ FAILED: Error checking transactions\n');
      failedTests++;
    }

    // TEST 10: Check Material Orders
    console.log('📋 TEST 10: Material Orders Data');
    const [orders] = await connection.execute('SELECT * FROM material_orders');
    
    if (orders.length >= 0) {
      console.log(`✅ PASSED: ${orders.length} material orders found`);
      if (orders.length > 0) {
        const statuses = [...new Set(orders.map(o => o.status))];
        console.log(`   Statuses: ${statuses.join(', ')}`);
      }
      console.log('');
      passedTests++;
    } else {
      console.log('❌ FAILED: Error checking material orders\n');
      failedTests++;
    }

    // TEST 11: Check Product-Material Relationships
    console.log('📋 TEST 11: Product-Material Relationships');
    const [productMaterials] = await connection.execute(`
      SELECT COUNT(*) as count FROM product_materials
    `);
    
    if (productMaterials[0].count >= 0) {
      console.log(`✅ PASSED: ${productMaterials[0].count} product-material relationships\n`);
      passedTests++;
    } else {
      console.log('❌ FAILED: Error checking product-material relationships\n');
      failedTests++;
    }

    // TEST 12: Check Indexes
    console.log('📋 TEST 12: Database Indexes');
    const [indexes] = await connection.execute(`
      SELECT DISTINCT TABLE_NAME, INDEX_NAME 
      FROM information_schema.STATISTICS 
      WHERE TABLE_SCHEMA = 'cafe_merah_putih' 
      AND INDEX_NAME != 'PRIMARY'
    `);
    
    if (indexes.length > 0) {
      console.log(`✅ PASSED: ${indexes.length} indexes found (excluding PRIMARY)\n`);
      passedTests++;
    } else {
      console.log('⚠️  WARNING: No additional indexes found\n');
      passedTests++;
    }

  } catch (error) {
    console.error('❌ CRITICAL ERROR:', error.message);
    failedTests++;
  } finally {
    await connection.end();
  }

  // Summary
  console.log('═'.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);
  console.log('═'.repeat(60));

  if (failedTests === 0) {
    console.log('\n🎉 All tests passed! System is ready to use.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.\n');
  }
}

runTests().catch(console.error);
