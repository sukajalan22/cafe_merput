'use client';

import { useState, useCallback, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { StockReceipt } from '@/lib/types';
import {
  getReceipts,
  searchReceipts,
  createReceipt,
} from '@/lib/services/receipts';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Card } from '@/components/ui/Card';
import { ReceiptsTable } from '@/components/features/penerimaan-stok/ReceiptsTable';
import { ReceiptForm } from '@/components/features/penerimaan-stok/ReceiptForm';
import { ReceiptDetail } from '@/components/features/penerimaan-stok/ReceiptDetail';

export default function PenerimaanStokPage() {
  const [receipts, setReceipts] = useState<StockReceipt[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<StockReceipt | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  const refreshReceipts = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getReceipts();
      setReceipts(data);
    } catch (error) {
      console.error('Failed to fetch receipts:', error);
      setReceipts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshReceipts();
  }, [refreshReceipts]);

  // Apply search filter
  const filteredReceipts = searchReceipts(receipts, searchQuery);

  // Pagination
  const totalPages = Math.ceil(filteredReceipts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentReceipts = filteredReceipts.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleCreateReceipt = () => {
    setIsFormOpen(true);
  };

  const handleViewDetail = (receipt: StockReceipt) => {
    setSelectedReceipt(receipt);
    setIsDetailOpen(true);
  };

  const handleFormSubmit = (data: Omit<StockReceipt, 'id' | 'status' | 'createdAt'>) => {
    createReceipt(data);
    refreshReceipts();
    setIsFormOpen(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Penerimaan Stok</h1>
        <Button onClick={handleCreateReceipt} icon={<Plus className="h-4 w-4" />}>
          Catat Penerimaan
        </Button>
      </div>

      <Card>
        {/* Search */}
        <div className="mb-6 flex items-center justify-between">
          <SearchInput
            placeholder="Cari berdasarkan ID penerimaan, ID pesanan, atau supplier..."
            value={searchQuery}
            onSearch={setSearchQuery}
            className="max-w-md"
          />
          {totalPages > 1 && (
            <span className="text-sm text-gray-500">
              Halaman {currentPage} dari {totalPages}
            </span>
          )}
        </div>

        {/* Receipts Table */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500">Memuat data...</p>
            </div>
          </div>
        ) : (
          <>
            <ReceiptsTable
              receipts={currentReceipts}
              onViewDetail={handleViewDetail}
            />

            {/* Pagination */}
            {filteredReceipts.length > 0 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">
                  Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredReceipts.length)} dari {filteredReceipts.length} penerimaan
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
      </Card>

      {/* Create Receipt Form Modal */}
      <ReceiptForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      {/* Receipt Detail Modal */}
      <ReceiptDetail
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedReceipt(null);
        }}
        receipt={selectedReceipt}
      />
    </div>
  );
}
