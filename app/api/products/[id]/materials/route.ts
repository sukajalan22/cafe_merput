import { NextRequest } from 'next/server';
import * as productsQuery from '@/lib/db/queries/products';
import * as productMaterialsQuery from '@/lib/db/queries/product-materials';
import * as materialsQuery from '@/lib/db/queries/materials';
import * as notificationsQuery from '@/lib/db/queries/notifications';
import { addMaterialToProductSchema } from '@/lib/validations/product-material';
import {
  successResponse,
  createdResponse,
  errorResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/utils/response';
import { sendNotificationToRole } from '@/lib/services/realtime-notifications';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/products/[id]/materials
 * Get all materials used by a product
 * Requirements: 3.4
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // Check if product exists
    const product = await productsQuery.getById(id);
    if (!product) {
      return notFoundResponse('Produk tidak ditemukan');
    }
    
    const materials = await productMaterialsQuery.getByProductId(id);
    return successResponse(materials);
  } catch (error) {
    console.error('Error fetching product materials:', error);
    return serverErrorResponse('Gagal mengambil data bahan baku produk');
  }
}

/**
 * POST /api/products/[id]/materials
 * Add a material to a product
 * Requirements: 3.4
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Check if product exists
    const product = await productsQuery.getById(id);
    if (!product) {
      return notFoundResponse('Produk tidak ditemukan');
    }
    
    // Validate input
    const validation = addMaterialToProductSchema.safeParse(body);
    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message || 'Data tidak valid';
      return errorResponse(errorMessage, 400);
    }

    // Check if material exists
    const material = await materialsQuery.getById(validation.data.bahan_id);
    if (!material) {
      return notFoundResponse('Bahan baku tidak ditemukan');
    }

    // Check if relationship already exists
    const existingRelation = await productMaterialsQuery.getOne(id, validation.data.bahan_id);
    if (existingRelation) {
      return errorResponse('Bahan baku sudah ditambahkan ke produk ini', 409);
    }

    // Create product-material relationship
    const productMaterial = await productMaterialsQuery.create({
      produk_id: id,
      bahan_id: validation.data.bahan_id,
      jumlah: validation.data.jumlah,
    });
    
    return createdResponse(productMaterial, 'Bahan baku berhasil ditambahkan ke produk');
  } catch (error) {
    console.error('Error adding material to product:', error);
    return serverErrorResponse('Gagal menambahkan bahan baku ke produk');
  }
}

/**
 * PUT /api/products/[id]/materials
 * Replace all materials for a product (bulk update)
 * Requirements: 3.4
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Check if product exists
    const product = await productsQuery.getById(id);
    if (!product) {
      return notFoundResponse('Produk tidak ditemukan');
    }
    
    const { materials } = body;
    if (!Array.isArray(materials)) {
      return errorResponse('Data materials harus berupa array', 400);
    }

    // Check if this is the first time adding materials (was empty before)
    const existingMaterials = await productMaterialsQuery.getByProductId(id);
    const isFirstTimeAddingMaterials = existingMaterials.length === 0 && materials.length > 0;

    // Delete all existing materials for this product
    await productMaterialsQuery.deleteAllByProductId(id);

    // Add new materials
    const addedMaterials = [];
    for (const mat of materials) {
      if (mat.bahan_id && mat.jumlah > 0) {
        // Check if material exists
        const material = await materialsQuery.getById(mat.bahan_id);
        if (material) {
          await productMaterialsQuery.create({
            produk_id: id,
            bahan_id: mat.bahan_id,
            jumlah: mat.jumlah,
          });
          addedMaterials.push({
            name: material.nama_bahan,
            quantity: mat.jumlah,
            unit: material.satuan
          });
        }
      }
    }

    // Send notification to admin if this is the first time adding materials
    if (isFirstTimeAddingMaterials && addedMaterials.length > 0) {
      try {
        const materialsText = addedMaterials
          .map(m => `${m.name} (${m.quantity} ${m.unit})`)
          .join(', ');

        const notificationData = {
          productId: product.produk_id,
          productName: product.nama_produk,
          materials: addedMaterials,
          action: 'composition_added'
        };

        await notificationsQuery.createForRole(
          'Admin',
          'MATERIAL_UPDATE',
          'Komposisi Produk Ditambahkan',
          `Komposisi bahan untuk produk "${product.nama_produk}" telah ditambahkan oleh barista. Bahan: ${materialsText}`,
          notificationData
        );

        // Send real-time notification
        await sendNotificationToRole('Admin', {
          id: Date.now().toString(), // Temporary ID for real-time
          type: 'MATERIAL_UPDATE',
          title: 'Komposisi Produk Ditambahkan',
          message: `Komposisi bahan untuk produk "${product.nama_produk}" telah ditambahkan oleh barista. Bahan: ${materialsText}`,
          data: notificationData,
          isRead: false,
          createdAt: new Date(),
        });

        // Also send to Manager role
        await sendNotificationToRole('Manager', {
          id: Date.now().toString(),
          type: 'MATERIAL_UPDATE',
          title: 'Komposisi Produk Ditambahkan',
          message: `Komposisi bahan untuk produk "${product.nama_produk}" telah ditambahkan oleh barista. Bahan: ${materialsText}`,
          data: notificationData,
          isRead: false,
          createdAt: new Date(),
        });
      } catch (notificationError) {
        console.error('Failed to send composition notification:', notificationError);
        // Don't fail the material update if notification fails
      }
    }

    // Get updated materials
    const updatedMaterials = await productMaterialsQuery.getByProductId(id);
    return successResponse(updatedMaterials, 'Komposisi bahan berhasil diperbarui');
  } catch (error) {
    console.error('Error updating product materials:', error);
    return serverErrorResponse('Gagal memperbarui komposisi bahan');
  }
}
