/**
 * Test script to verify notifications are created for Barista users
 */

const mysql = require('mysql2/promise');

async function testNotifications() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'cafe_merah_putih',
  });

  console.log('🔍 Testing notifications system...\n');

  try {
    // 1. Check if there are Barista users
    const [baristas] = await connection.execute(`
      SELECT u.user_id, u.username, u.email, r.nama_role
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE r.nama_role = 'Barista' AND u.status = 'Aktif'
    `);

    console.log(`✅ Found ${baristas.length} active Barista user(s):`);
    baristas.forEach(b => {
      console.log(`   - ${b.username} (${b.email})`);
    });
    console.log('');

    if (baristas.length === 0) {
      console.log('❌ No Barista users found! Please run seed script first.');
      return;
    }

    // 2. Check notifications for Barista users
    const baristaIds = baristas.map(b => b.user_id);
    const placeholders = baristaIds.map(() => '?').join(',');
    
    const [notifications] = await connection.execute(`
      SELECT n.*, u.username
      FROM notifications n
      JOIN users u ON n.user_id = u.user_id
      WHERE n.user_id IN (${placeholders})
      ORDER BY n.created_at DESC
      LIMIT 10
    `, baristaIds);

    console.log(`📬 Found ${notifications.length} notification(s) for Barista users:`);
    if (notifications.length > 0) {
      notifications.forEach(n => {
        console.log(`   - [${n.type}] ${n.title}`);
        console.log(`     For: ${n.username}`);
        console.log(`     Message: ${n.message}`);
        console.log(`     Read: ${n.is_read ? 'Yes' : 'No'}`);
        console.log(`     Created: ${n.created_at}`);
        console.log('');
      });
    } else {
      console.log('   No notifications found. Try adding a product from admin dashboard.\n');
    }

    // 3. Check recent products
    const [products] = await connection.execute(`
      SELECT produk_id, nama_produk, jenis_produk, created_at
      FROM products
      ORDER BY created_at DESC
      LIMIT 5
    `);

    console.log(`📦 Recent products (${products.length}):`);
    products.forEach(p => {
      console.log(`   - ${p.nama_produk} (${p.jenis_produk}) - Created: ${p.created_at}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
    console.log('\n✅ Test completed!');
  }
}

testNotifications();
