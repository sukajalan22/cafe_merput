'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Coffee, RefreshCw, LogOut, ClipboardList, Package } from 'lucide-react';
import { NotificationBell } from '@/components/features/notifications/NotificationBell';

interface BaristaHeaderProps {
  activeOrdersCount?: number;
  onRefresh?: () => void;
  onSignOut?: () => void;
  onNewProductClick?: (productId: string) => void;
}

export function BaristaHeader({ activeOrdersCount = 0, onRefresh, onSignOut, onNewProductClick }: BaristaHeaderProps) {
  const pathname = usePathname();
  
  const navItems = [
    { href: '/barista', label: 'Pesanan', icon: ClipboardList },
    { href: '/barista/produk', label: 'Data Produk', icon: Package },
  ];

  return (
    <header className="bg-primary text-white">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <Coffee className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold">Caffe Merah Putih</h1>
              <p className="text-sm text-white/80">Dashboard Barista</p>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex items-center gap-2 ml-6">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-white text-primary font-medium'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <NotificationBell onNewProductClick={onNewProductClick} />
          
          {pathname === '/barista' && (
            <>
              <div className="text-right">
                <p className="text-sm text-white/80">Pesanan Aktif</p>
                <p className="text-2xl font-bold">{activeOrdersCount}</p>
              </div>
              <button
                onClick={onRefresh}
                className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
                title="Refresh"
              >
                <RefreshCw size={20} />
              </button>
            </>
          )}
          <button
            onClick={onSignOut}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            title="Keluar"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default BaristaHeader;
