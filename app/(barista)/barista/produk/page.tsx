'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { BaristaHeader } from '@/components/features/barista';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ProductCategory } from '@/lib/types';

interface ProductMaterial {
  bahan_id: string;
  jumlah: number;
  nama_bahan?: string;
  satuan?: string;
}

interface ApiProduct {
  produk_id: string;
  id?: string; // alias for Table component
  nama_produk: string;
  harga: number;
  jenis_produk: ProductCategory;
  is_available: boolean;
  materials?: ProductMaterial[];
}

interface ApiMaterial {
  bahan_id: string;
  nama_bahan: string;
  satuan: string;
  stok_saat_ini: number;
}

export default function BaristaProductPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [materials, setMaterials] = useState<ApiMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ApiProduct | null>(null);
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

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

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleNewProductClick = (productId: string) => {
    setHighlightedProductId(productId);
    // Remove highlight after 5 seconds
    setTimeout(() => setHighlightedProductId(null), 5000);
  };

  // Form state for compositions only
  const [formData, setFormData] = useState({
    compositions: [] as { bahan_id: string; jumlah: string }[],
  });

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) {
        // Fetch materials for each product
        const productsWithMaterials = await Promise.all(
          data.data.map(async (product: ApiProduct) => {
            const matRes = await fetch(`/api/products/${product.produk_id}/materials`);
            const matData = await matRes.json();
            return {
              ...product,
              id: product.produk_id, // Add id for Table component
              materials: matData.success ? matData.data : [],
            };
          })
        );
        setProducts(productsWithMaterials);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const res = await fetch('/api/materials');
      const data = await res.json();
      if (data.success) {
        setMaterials(data.data);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchMaterials();
  }, []);

  const openEditModal = (product: ApiProduct) => {
    setEditingProduct(product);
    setFormData({
      compositions: product.materials?.map((m) => ({
        bahan_id: m.bahan_id,
        jumlah: m.jumlah.toString(),
      })) || [],
    });
    setIsModalOpen(true);
  };

  const addComposition = () => {
    setFormData((prev) => ({
      ...prev,
      compositions: [...prev.compositions, { bahan_id: '', jumlah: '' }],
    }));
  };

  const removeComposition = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      compositions: prev.compositions.filter((_, i) => i !== index),
    }));
  };

  const updateComposition = (index: number, field: 'bahan_id' | 'jumlah', value: string) => {
    setFormData((prev) => ({
      ...prev,
      compositions: prev.compositions.map((c, i) =>
        i === index ? { ...c, [field]: value } : c
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      // Update materials/compositions only
      const validCompositions = formData.compositions.filter(
        (c) => c.bahan_id && c.jumlah && Number(c.jumlah) > 0
      );

      const res = await fetch(`/api/products/${editingProduct.produk_id}/materials`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materials: validCompositions.map((c) => ({
            bahan_id: c.bahan_id,
            jumlah: Number(c.jumlah),
          })),
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      setIsModalOpen(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error saving compositions:', error);
      alert('Gagal menyimpan komposisi');
    }
  };

  const filteredProducts = products.filter((p) =>
    p.nama_produk?.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

  const columns = [
    {
      key: 'nama_produk',
      header: 'Produk',
      render: (product: ApiProduct) => (
        <div className={`flex items-center gap-3 ${
          highlightedProductId === product.produk_id ? 'bg-yellow-100 p-2 rounded-lg border-2 border-yellow-300' : ''
        }`}>
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <span className="text-red-600 font-semibold text-sm">{product.nama_produk?.charAt(0)}</span>
          </div>
          <div>
            <span className="font-medium">{product.nama_produk}</span>
            {highlightedProductId === product.produk_id && (
              <div className="text-xs text-yellow-700 font-medium">Produk Baru!</div>
            )}
          </div>
        </div>
      ),
    },
    { key: 'jenis_produk', header: 'Kategori' },
    { key: 'harga', header: 'Harga', render: (p: ApiProduct) => formatCurrency(p.harga) },
    {
      key: 'compositions',
      header: 'Komposisi',
      render: (product: ApiProduct) => (
        <div className="text-sm text-gray-600">
          {product.materials && product.materials.length > 0
            ? product.materials.map((m) => `${m.nama_bahan} (${m.jumlah} ${m.satuan})`).join(', ')
            : '-'}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p: ApiProduct) => (
        <Badge variant={p.is_available ? 'success' : 'danger'}>
          {p.is_available ? 'Tersedia' : 'Habis'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (product: ApiProduct) => (
        <button
          onClick={() => openEditModal(product)}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 text-sm font-medium rounded-lg transition-colors duration-200 border border-yellow-200 hover:border-yellow-300"
        >
          <Pencil className="h-3.5 w-3.5" />
          <span>Edit</span>
        </button>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <BaristaHeader onSignOut={handleLogout} onNewProductClick={handleNewProductClick} />

      <div className="flex-1 p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Data Produk</h2>
              {totalPages > 1 && (
                <span className="text-sm text-gray-500">
                  Halaman {currentPage} dari {totalPages}
                </span>
              )}
            </div>
            <div className="mt-4 relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari produk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Memuat data...</div>
            ) : (
              <>
                <Table columns={columns} data={currentProducts} />
                
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
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit Compositions Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }} 
        title={`Edit Komposisi - ${editingProduct?.nama_produk}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Produk:</span>
                <p className="font-medium">{editingProduct?.nama_produk}</p>
              </div>
              <div>
                <span className="text-gray-600">Kategori:</span>
                <p className="font-medium">{editingProduct?.jenis_produk}</p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Komposisi Bahan</label>
              <Button type="button" variant="secondary" size="sm" onClick={addComposition}>
                + Tambah Bahan
              </Button>
            </div>
            {formData.compositions.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center bg-gray-50 rounded-lg">
                Belum ada komposisi bahan. Klik "Tambah Bahan" untuk menambahkan.
              </p>
            ) : (
              <div className="space-y-2">
                {formData.compositions.map((comp, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={comp.bahan_id}
                      onChange={(e) => updateComposition(idx, 'bahan_id', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    >
                      <option value="">Pilih bahan</option>
                      {materials.map((m) => (
                        <option key={m.bahan_id} value={m.bahan_id}>
                          {m.nama_bahan} ({m.satuan})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Jumlah"
                      value={comp.jumlah}
                      onChange={(e) => updateComposition(idx, 'jumlah', e.target.value)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    />
                    <Button 
                      type="button" 
                      variant="danger" 
                      size="sm" 
                      onClick={() => removeComposition(idx)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => {
                setIsModalOpen(false);
                setEditingProduct(null);
              }}
            >
              Batal
            </Button>
            <Button type="submit">Simpan Komposisi</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
