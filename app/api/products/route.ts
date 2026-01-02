import { NextRequest } from 'next/server';
import * as productsQuery from '@/lib/db/queries/products';
import * as notificationsQuery from '@/lib/db/queries/notifications';
import { createProductSchema } from '@/lib/validations/product';
import {
  successResponse,
  createdResponse,
  errorResponse,
  serverErrorResponse,
} from '@/lib/utils/response';
import { sendNotificationToRole } from '@/lib/services/realtime-notifications';

/**
 * GET /api/products
 * Get all products with optional search and jenis_produk filter
 * Includes availability status based on material stock
 * Requirements: 3.1, 3.2, 3.3
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const jenisProduk = searchParams.get('jenis_produk') || searchParams.get('category') || undefined;

    // Get products with availability status
    const products = await productsQuery.getAllWithAvailability(search, jenisProduk);
    return successResponse(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return serverErrorResponse('Gagal mengambil data produk');
  }
}

/**
 * POST /api/products
 * Create a new product
 * Requirements: 3.4
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = createProductSchema.safeParse(body);
    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message || 'Data tidak valid';
      return errorResponse(errorMessage, 400);
    }

    // Create product
    const product = await productsQuery.create(validation.data);

    // Send notification to all baristas about new product
    try {
      const notificationData = {
        productId: product.produk_id,
        productName: product.nama_produk,
        category: product.jenis_produk,
        price: product.harga,
      };

      await notificationsQuery.createForRole(
        'Barista',
        'NEW_PRODUCT',
        'Produk Baru Ditambahkan',
        `Produk "${product.nama_produk}" telah ditambahkan. Silakan atur komposisi bahan untuk produk ini.`,
        notificationData
      );

      // Send real-time notification
      await sendNotificationToRole('Barista', {
        id: Date.now().toString(), // Temporary ID for real-time
        type: 'NEW_PRODUCT',
        title: 'Produk Baru Ditambahkan',
        message: `Produk "${product.nama_produk}" telah ditambahkan. Silakan atur komposisi bahan untuk produk ini.`,
        data: notificationData,
        isRead: false,
        createdAt: new Date(),
      });
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
      // Don't fail the product creation if notification fails
    }

    return createdResponse(product, 'Produk berhasil dibuat');
  } catch (error) {
    console.error('Error creating product:', error);
    return serverErrorResponse('Gagal membuat produk');
  }
}
