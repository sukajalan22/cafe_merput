'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Coffee, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';

export default function KasirLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
    // Redirect non-kasir users to their appropriate pages
    if (!isLoading && isAuthenticated) {
      if (user?.role === 'Barista') {
        router.push('/barista');
      } else if (user?.role === 'Manager') {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500">Memuat...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated or not kasir
  if (!isAuthenticated || user?.role !== 'Kasir') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-primary text-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <Coffee className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold">Caffe Merah Putih</h1>
              <p className="text-sm text-white/80">Kasir - {user?.name}</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            title="Keluar"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Keluar</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}
