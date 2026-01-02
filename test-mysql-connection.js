const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    console.log('🔍 Testing MySQL connection...');
    console.log('Host: localhost');
    console.log('Port: 3306');
    console.log('User: root');
    console.log('Database: cafe_merah_putih\n');

    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'cafe_merah_putih'
    });

    console.log('✅ MySQL connection successful!\n');

    // Test query
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log(`✅ Found ${rows[0].count} users in database\n`);

    // Get sample user
    const [users] = await connection.execute('SELECT email, username, status FROM users LIMIT 3');
    console.log('📋 Sample users:');
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.username}) - Status: ${user.status}`);
    });

    await connection.end();
    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Make sure XAMPP MySQL is running');
    console.error('2. Check if port 3306 is available');
    console.error('3. Verify database "cafe_merah_putih" exists');
    console.error('4. Check .env configuration');
    process.exit(1);
  }
}

testConnection();
