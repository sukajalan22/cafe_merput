'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  FileText,
  Package,
  ClipboardList,
  Coffee,
  Boxes,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  roles?: string[]; // If undefined, visible to all roles
}

const menuItems: MenuItem[] = [
  { icon: <LayoutDashboard size={20} />, label: 'Dashboard', href: '/dashboard' },
  { icon: <ShoppingCart size={20} />, label: 'Transaksi Penjualan', href: '/dashboard/transaksi' },
  { icon: <Users size={20} />, label: 'Kelola Pegawai', href: '/dashboard/pegawai' },
  { icon: <FileText size={20} />, label: 'Laporan', href: '/dashboard/laporan' },
  { icon: <Package size={20} />, label: 'Pemesanan Bahan', href: '/dashboard/pemesanan-bahan', roles: ['Admin', 'Kasir'] },
  { icon: <ClipboardList size={20} />, label: 'Penerimaan Stok', href: '/dashboard/penerimaan-stok', roles: ['Admin', 'Kasir'] },
  { icon: <Coffee size={20} />, label: 'Data Produk', href: '/dashboard/produk', roles: ['Admin', 'Kasir'] },
  { icon: <Boxes size={20} />, label: 'Data Bahan Baku', href: '/dashboard/bahan-baku', roles: ['Admin', 'Kasir'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Coffee className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Caffe</h1>
            <p className="text-sm text-primary font-semibold">Merah Putih</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      {user && (
        <div className="px-6 py-4 border-b border-gray-200">
          <p className="text-sm font-medium text-gray-900">{user.name}</p>
          <p className="text-xs text-gray-500">{user.role}</p>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems
            .filter((item) => !item.roles || (user && item.roles.includes(user.role)))
            .map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-600 hover:bg-red-50 transition-colors font-medium"
          title="Keluar dari sistem"
        >
          <LogOut size={20} />
          <span className="text-sm">Keluar</span>
        </button>
      </div>
    </aside>
  );
}
