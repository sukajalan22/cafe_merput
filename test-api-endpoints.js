/**
 * Automated API Endpoint Testing
 * Tests all major API endpoints and features
 */

const BASE_URL = 'http://localhost:3000';

let adminToken = null;
let baristaToken = null;
let testProductId = null;

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    const data = await response.json();
    return { response, data };
  } catch (error) {
    return { error: error.message };
  }
}

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function logTest(name, passed, details = '') {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`✅ ${name}`);
    if (details) console.log(`   ${details}`);
  } else {
    failedTests++;
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
  }
}

async function runTests() {
  console.log('🧪 Starting Automated API Tests...\n');
  console.log('⚠️  Make sure the development server is running on http://localhost:3000\n');

  // Wait a bit to ensure message is read
  await new Promise(resolve => setTimeout(resolve, 1000));

  try {
    // ==================== AUTHENTICATION TESTS ====================
    console.log('📋 AUTHENTICATION TESTS\n');

    // Test 1: Admin Login
    const { response: loginRes, data: loginData } = await apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@cafemerahputih.com',
        password: 'admin123',
      }),
    });

    logTest(
      'Admin Login',
      loginRes.ok && loginData.success && loginData.data.token,
      loginData.success ? `Token: ${loginData.data.token.substring(0, 20)}...` : loginData.error
    );

    if (loginData.success) {
      adminToken = loginData.data.token;
    }

    // Test 2: Barista Login
    const { response: baristaLoginRes, data: baristaLoginData } = await apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'barista@cafemerahputih.com',
        password: 'barista123',
      }),
    });

    logTest(
      'Barista Login',
      baristaLoginRes.ok && baristaLoginData.success,
      baristaLoginData.success ? 'Login successful' : baristaLoginData.error
    );

    if (baristaLoginData.success) {
      baristaToken = baristaLoginData.data.token;
    }

    // Test 3: Invalid Login
    const { response: invalidLoginRes, data: invalidLoginData } = await apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid@test.com',
        password: 'wrongpassword',
      }),
    });

    logTest(
      'Invalid Login Rejected',
      !invalidLoginRes.ok || !invalidLoginData.success,
      'Invalid credentials properly rejected'
    );

    // Test 4: Get Current User (Admin)
    if (adminToken) {
      const { response: meRes, data: meData } = await apiCall('/api/auth/me', {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      logTest(
        'Get Current User (Admin)',
        meRes.ok && meData.success && meData.data.role_name === 'Admin',
        meData.success ? `User: ${meData.data.username}` : meData.error
      );
    }

    console.log('');

    // ==================== PRODUCTS TESTS ====================
    console.log('📋 PRODUCTS API TESTS\n');

    // Test 5: Get All Products
    const { response: productsRes, data: productsData } = await apiCall('/api/products');

    logTest(
      'Get All Products',
      productsRes.ok && productsData.success && Array.isArray(productsData.data),
      productsData.success ? `Found ${productsData.data.length} products` : productsData.error
    );

    // Test 6: Search Products
    const { response: searchRes, data: searchData } = await apiCall('/api/products?search=kopi');

    logTest(
      'Search Products',
      searchRes.ok && searchData.success,
      searchData.success ? `Found ${searchData.data.length} products matching "kopi"` : searchData.error
    );

    // Test 7: Filter Products by Category
    const { response: filterRes, data: filterData } = await apiCall('/api/products?category=Kopi');

    logTest(
      'Filter Products by Category',
      filterRes.ok && filterData.success,
      filterData.success ? `Found ${filterData.data.length} Kopi products` : filterData.error
    );

    // Test 8: Create Product (Admin)
    if (adminToken) {
      const newProduct = {
        nama_produk: `Test Product ${Date.now()}`,
        harga: 25000,
        deskripsi: 'Test product for automated testing',
        jenis_produk: 'Kopi',
      };

      const { response: createRes, data: createData } = await apiCall('/api/products', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify(newProduct),
      });

      logTest(
        'Create Product (Admin)',
        createRes.ok && createData.success,
        createData.success ? `Created: ${createData.data.nama_produk}` : createData.error
      );

      if (createData.success) {
        testProductId = createData.data.produk_id;
      }
    }

    console.log('');

    // ==================== NOTIFICATIONS TESTS ====================
    console.log('📋 NOTIFICATIONS API TESTS\n');

    // Wait a bit for notification to be created
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 9: Get Notifications (Barista)
    if (baristaToken) {
      const { response: notifRes, data: notifData } = await apiCall('/api/notifications', {
        method: 'GET',
        headers: { Authorization: `Bearer ${baristaToken}` },
      });

      logTest(
        'Get Notifications (Barista)',
        notifRes.ok && notifData.success && Array.isArray(notifData.data),
        notifData.success ? `Found ${notifData.data.length} notifications` : notifData.error
      );

      // Test 10: Check if new product notification was created
      if (notifData.success && testProductId) {
        const hasNewProductNotif = notifData.data.some(
          n => n.type === 'NEW_PRODUCT' && n.data?.productId === testProductId
        );

        logTest(
          'New Product Notification Created',
          hasNewProductNotif,
          hasNewProductNotif ? 'Notification found for new product' : 'Notification not found'
        );
      }

      // Test 11: Get Unread Notifications Only
      const { response: unreadRes, data: unreadData } = await apiCall('/api/notifications?unread_only=true', {
        method: 'GET',
        headers: { Authorization: `Bearer ${baristaToken}` },
      });

      logTest(
        'Get Unread Notifications',
        unreadRes.ok && unreadData.success,
        unreadData.success ? `Found ${unreadData.data.length} unread notifications` : unreadData.error
      );

      // Test 12: Mark Notifications as Read
      if (notifData.success && notifData.data.length > 0) {
        const notificationIds = notifData.data.slice(0, 2).map(n => n.notification_id);

        const { response: markReadRes, data: markReadData } = await apiCall('/api/notifications', {
          method: 'PUT',
          headers: { Authorization: `Bearer ${baristaToken}` },
          body: JSON.stringify({ notificationIds }),
        });

        logTest(
          'Mark Notifications as Read',
          markReadRes.ok && markReadData.success,
          markReadData.success ? `Marked ${notificationIds.length} notifications as read` : markReadData.error
        );
      }
    }

    // Test 13: Notifications without token
    const { response: noTokenRes, data: noTokenData } = await apiCall('/api/notifications');

    logTest(
      'Notifications Require Authentication',
      !noTokenRes.ok || !noTokenData.success,
      'Properly rejected request without token'
    );

    console.log('');

    // ==================== MATERIALS TESTS ====================
    console.log('📋 MATERIALS API TESTS\n');

    // Test 14: Get All Materials
    const { response: materialsRes, data: materialsData } = await apiCall('/api/materials');

    logTest(
      'Get All Materials',
      materialsRes.ok && materialsData.success && Array.isArray(materialsData.data),
      materialsData.success ? `Found ${materialsData.data.length} materials` : materialsData.error
    );

    // Test 15: Search Materials
    const { response: matSearchRes, data: matSearchData } = await apiCall('/api/materials?search=kopi');

    logTest(
      'Search Materials',
      matSearchRes.ok && matSearchData.success,
      matSearchData.success ? `Found ${matSearchData.data.length} materials matching "kopi"` : matSearchData.error
    );

    console.log('');

    // ==================== TRANSACTIONS TESTS ====================
    console.log('📋 TRANSACTIONS API TESTS\n');

    // Test 16: Get Transactions (Admin)
    if (adminToken) {
      const { response: transRes, data: transData } = await apiCall('/api/transactions', {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      logTest(
        'Get Transactions (Admin)',
        transRes.ok && transData.success && Array.isArray(transData.data),
        transData.success ? `Found ${transData.data.length} transactions` : transData.error
      );
    }

    console.log('');

    // ==================== DASHBOARD STATS TESTS ====================
    console.log('📋 DASHBOARD API TESTS\n');

    // Test 17: Get Dashboard Stats
    if (adminToken) {
      const { response: statsRes, data: statsData } = await apiCall('/api/dashboard/stats', {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      logTest(
        'Get Dashboard Stats',
        statsRes.ok && statsData.success,
        statsData.success ? `Total Sales: Rp ${statsData.data.totalSales}` : statsData.error
      );
    }

    // Test 18: Get Weekly Sales
    if (adminToken) {
      const { response: weeklyRes, data: weeklyData } = await apiCall('/api/dashboard/weekly-sales', {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      logTest(
        'Get Weekly Sales',
        weeklyRes.ok && weeklyData.success && Array.isArray(weeklyData.data),
        weeklyData.success ? `Found ${weeklyData.data.length} days of data` : weeklyData.error
      );
    }

    // Test 19: Get Top Products
    if (adminToken) {
      const { response: topRes, data: topData } = await apiCall('/api/dashboard/top-products', {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      logTest(
        'Get Top Products',
        topRes.ok && topData.success && Array.isArray(topData.data),
        topData.success ? `Found ${topData.data.length} top products` : topData.error
      );
    }

    console.log('');

    // ==================== CLEANUP ====================
    console.log('📋 CLEANUP\n');

    // Test 20: Delete Test Product
    if (adminToken && testProductId) {
      const { response: deleteRes, data: deleteData } = await apiCall(`/api/products/${testProductId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      logTest(
        'Delete Test Product',
        deleteRes.ok && deleteData.success,
        deleteData.success ? 'Test product deleted' : deleteData.error
      );
    }

    console.log('');

  } catch (error) {
    console.error('❌ CRITICAL ERROR:', error.message);
    failedTests++;
  }

  // ==================== SUMMARY ====================
  console.log('═'.repeat(60));
  console.log('📊 API TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log('═'.repeat(60));

  if (failedTests === 0) {
    console.log('\n🎉 All API tests passed! System is working correctly.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.\n');
  }

  console.log('💡 Note: Make sure the development server is running before running these tests.\n');
}

// Check if server is running first
async function checkServer() {
  try {
    const response = await fetch(BASE_URL);
    return response.ok || response.status === 404; // 404 is ok, means server is running
  } catch (error) {
    return false;
  }
}

// Main execution
(async () => {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Development server is not running!');
    console.log('Please start the server with: npm run dev');
    console.log('Then run this test again.\n');
    process.exit(1);
  }

  await runTests();
})();
