'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product, ProductCategory } from '@/lib/types';
import {
  getProducts,
  searchProducts,
  filterProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/lib/services/products';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Card } from '@/components/ui/Card';
import { ProductTable } from '@/components/features/produk/ProductTable';
import { ProductForm } from '@/components/features/produk/ProductForm';
import { NotificationBell } from '@/components/features/notifications/NotificationBell';

const categories: (ProductCategory | 'Semua')[] = ['Semua', 'Kopi', 'Non-Kopi', 'Makanan'];

export default function ProdukPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'Semua'>('Semua');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  const handleProductNotificationClick = (productId: string) => {
    setHighlightedProductId(productId);
    // Remove highlight after 5 seconds
    setTimeout(() => setHighlightedProductId(null), 5000);
  };

  // Check for highlight parameter from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const highlight = urlParams.get('highlight');
    if (highlight) {
      setHighlightedProductId(highlight);
      // Remove highlight after 5 seconds
      setTimeout(() => setHighlightedProductId(null), 5000);
    }
  }, []);

  const refreshProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  // Apply search and category filters
  const filteredProducts = filterProductsByCategory(
    searchProducts(products, searchQuery),
    activeCategory
  );

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to page 1 when search or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCategory]);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setDeleteConfirm(product);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteProduct(deleteConfirm.id);
      refreshProducts();
      setDeleteConfirm(null);
    }
  };

  const handleFormSubmit = (data: Omit<Product, 'id' | 'status' | 'createdAt'>) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, data);
    } else {
      createProduct(data);
    }
    refreshProducts();
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Data Produk</h1>
        <div className="flex items-center gap-3">
          <NotificationBell onNewProductClick={handleProductNotificationClick} />
          <Button onClick={handleAddProduct} icon={<Plus className="h-4 w-4" />}>
            Tambah Produk
          </Button>
        </div>
      </div>

      <Card>
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between">
          <SearchInput
            placeholder="Cari produk..."
            value={searchQuery}
            onSearch={setSearchQuery}
            className="flex-1 max-w-md"
          />
          <div className="flex items-center gap-4">
            {totalPages > 1 && (
              <span className="text-sm text-gray-500">
                Halaman {currentPage} dari {totalPages}
              </span>
            )}
            <div className="flex gap-2">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Products Table */}
        <ProductTable
          products={currentProducts}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
          highlightedProductId={highlightedProductId}
        />

        {/* Pagination */}
        {filteredProducts.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-gray-500">
              Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} dari {filteredProducts.length} produk
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Add/Edit Form Modal */}
      <ProductForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleFormSubmit}
        product={editingProduct}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Konfirmasi Hapus
              </h3>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin menghapus produk &quot;{deleteConfirm.name}&quot;?
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
                  Batal
                </Button>
                <Button variant="danger" onClick={confirmDelete}>
                  Hapus
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
