const mysql = require('mysql2/promise');

async function addNotificationsTable() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'cafe_merah_putih',
    });

    console.log('✅ Connected to database\n');

    // Check if notifications table already exists
    console.log('🔍 Checking if notifications table exists...');
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'notifications'"
    );

    if (tables.length > 0) {
      console.log('⚠️  Notifications table already exists. Skipping creation.');
      return;
    }

    console.log('📝 Creating notifications table...');
    
    // Create notifications table
    await connection.execute(`
      CREATE TABLE notifications (
        notification_id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        type ENUM('NEW_PRODUCT', 'MATERIAL_UPDATE', 'STOCK_ALERT') NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSON,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Notifications table created');

    // Create indexes
    console.log('📝 Creating indexes...');
    
    await connection.execute(
      'CREATE INDEX idx_notifications_user ON notifications(user_id)'
    );
    await connection.execute(
      'CREATE INDEX idx_notifications_is_read ON notifications(is_read)'
    );
    await connection.execute(
      'CREATE INDEX idx_notifications_created ON notifications(created_at)'
    );

    console.log('✅ Indexes created');
    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run migration
addNotificationsTable();
