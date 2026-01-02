'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Transaction } from '@/lib/types';
import { getTransactions, calculateTotalSales } from '@/lib/services/transactions';
import { Card, SearchInput, Button } from '@/components/ui';
import { Calendar, TrendingUp, Receipt, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

interface TransactionListProps {
  onViewDetail?: (transaction: Transaction) => void;
}

export function TransactionList({ onViewDetail }: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch transactions based on date filter
  useEffect(() => {
    async function fetchTransactions() {
      setIsLoading(true);
      try {
        const now = new Date();
        let startDate: Date | undefined;
        let endDate: Date | undefined;

        switch (dateFilter) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
            break;
          case 'week':
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 7);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
            break;
          case 'all':
            // No date filter
            break;
        }

        const data = await getTransactions(startDate, endDate);
        setTransactions(data);
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTransactions();
  }, [dateFilter]);

  // Filter transactions by search query
  const filteredTransactions = useMemo(() => {
    if (!searchQuery) return transactions;
    const query = searchQuery.toLowerCase();
    return transactions.filter(
      (t) =>
        t.id.toLowerCase().includes(query) ||
        t.items.some((item) => item.productName.toLowerCase().includes(query))
    );
  }, [transactions, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  // Stats
  const totalSales = calculateTotalSales(filteredTransactions);
  const totalTransactions = filteredTransactions.length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Penjualan</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalSales)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Receipt className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Jumlah Transaksi</p>
              <p className="text-xl font-bold text-gray-900">{totalTransactions}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <SearchInput
          placeholder="Cari transaksi..."
          value={searchQuery}
          onSearch={(value) => {
            setSearchQuery(value);
            setCurrentPage(1);
          }}
          className="flex-1 max-w-md"
        />
        <div className="flex items-center gap-4">
          {totalPages > 1 && (
            <span className="text-sm text-gray-500">
              Halaman {currentPage} dari {totalPages}
            </span>
          )}
          <div className="flex gap-2">
            {(['today', 'week', 'month', 'all'] as const).map((filter) => (
              <Button
                key={filter}
                variant={dateFilter === filter ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => {
                  setDateFilter(filter);
                  setCurrentPage(1);
                }}
              >
                {filter === 'today' && 'Hari Ini'}
                {filter === 'week' && '7 Hari'}
                {filter === 'month' && 'Bulan Ini'}
                {filter === 'all' && 'Semua'}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <Card padding="none">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500">Memuat transaksi...</p>
            </div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Receipt className="h-12 w-12 mb-2" />
            <p>Tidak ada transaksi ditemukan</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ID Transaksi
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tanggal
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Item
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedTransactions.map((transaction, index) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono text-gray-900">
                          #{transaction.id.slice(-8).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {formatDate(transaction.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">
                          {transaction.items.length > 0 ? (
                            <span>
                              {transaction.items[0].productName}
                              {transaction.items.length > 1 && (
                                <span className="text-gray-500">
                                  {' '}+{transaction.items.length - 1} lainnya
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-green-600">
                          {formatCurrency(transaction.total)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onViewDetail?.(transaction)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredTransactions.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{' '}
                  {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} dari{' '}
                  {filteredTransactions.length} transaksi
                </p>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
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
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
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
    </div>
  );
}

export default TransactionList;
