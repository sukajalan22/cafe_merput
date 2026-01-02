-- Add notifications table for product workflow
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
);

-- Add index for better performance
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- Add status field to products to track if materials are configured
ALTER TABLE products ADD COLUMN material_configured BOOLEAN DEFAULT FALSE;