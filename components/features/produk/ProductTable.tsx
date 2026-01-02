'use client';

import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Product } from '@/lib/types';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  highlightedProductId?: string | null;
  productsWithComposition?: string[]; // Array of product IDs that have composition
}

export function ProductTable({ products, onEdit, onDelete, highlightedProductId }: ProductTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const columns = [
    {
      key: 'name',
      header: 'Produk',
      render: (product: Product) => (
        <div className={`flex items-center gap-3 ${
          highlightedProductId === product.id ? 'bg-yellow-100 p-2 rounded-lg border-2 border-yellow-300' : ''
        }`}>
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <span className="text-red-600 font-semibold text-sm">
              {product.name.charAt(0)}
            </span>
          </div>
          <div>
            <span className="font-medium">{product.name}</span>
            {highlightedProductId === product.id && (
              <div className="text-xs text-yellow-700 font-medium">Komposisi Ditambahkan!</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Kategori',
    },
    {
      key: 'price',
      header: 'Harga',
      render: (product: Product) => formatCurrency(product.price),
    },
    {
      key: 'stock',
      header: 'Stok',
    },
    {
      key: 'status',
      header: 'Status',
      render: (product: Product) => (
        <Badge variant={product.status === 'Tersedia' ? 'success' : 'danger'}>
          {product.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (product: Product) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(product);
            }}
            icon={<Pencil className="h-4 w-4" />}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(product);
            }}
            icon={<Trash2 className="h-4 w-4" />}
          >
            Hapus
          </Button>
        </div>
      ),
    },
  ];

  return <Table columns={columns} data={products} />;
}

export default ProductTable;
