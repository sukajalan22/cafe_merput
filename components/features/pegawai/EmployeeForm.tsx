'use client';

import React, { useState, useMemo } from 'react';
import { User, UserRole, UserStatus } from '@/lib/types';
import { Role } from '@/lib/services/employees';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface EmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<User, 'id' | 'createdAt'>) => void;
  employee?: User | null;
  roles?: Role[];
}

const defaultRoles: UserRole[] = ['Kasir', 'Barista', 'Manager'];
const statuses: UserStatus[] = ['Aktif', 'Nonaktif'];

export function EmployeeForm({ isOpen, onClose, onSubmit, employee, roles = [] }: EmployeeFormProps) {
  const isEditing = !!employee;
  
  // Use roles from props if available, otherwise use default
  // Filter out 'Admin' role - it should not be assignable via form
  const availableRoles = roles.length > 0 
    ? roles.filter(r => r.nama_role !== 'Admin').map(r => r.nama_role) 
    : defaultRoles;
  
  // Use key to reset form state when employee changes
  const formKey = useMemo(() => employee?.id || 'new', [employee?.id]);
  
  const [name, setName] = useState(employee?.name || '');
  const [email, setEmail] = useState(employee?.email || '');
  const [phone, setPhone] = useState(employee?.phone || '');
  const [role, setRole] = useState<string>(employee?.role || availableRoles[0] || 'Kasir');
  const [status, setStatus] = useState<UserStatus>(employee?.status || 'Aktif');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when employee changes
  const resetForm = () => {
    setName(employee?.name || '');
    setEmail(employee?.email || '');
    setPhone(employee?.phone || '');
    setRole(employee?.role || availableRoles[0] || 'Kasir');
    setStatus(employee?.status || 'Aktif');
    setPassword('');
    setErrors({});
  };

  // Reset when modal opens with different employee
  useMemo(() => {
    if (isOpen) {
      resetForm();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, formKey]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[0-9]{10,13}$/;
    return phoneRegex.test(phone.replace(/[-\s]/g, ''));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Nama pegawai wajib diisi';
    }

    if (!email.trim()) {
      newErrors.email = 'Email wajib diisi';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Format email tidak valid';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Nomor telepon wajib diisi';
    } else if (!validatePhone(phone)) {
      newErrors.phone = 'Format nomor telepon tidak valid';
    }

    // Password required only for new employees
    if (!isEditing && !password.trim()) {
      newErrors.password = 'Password wajib diisi';
    } else if (!isEditing && password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const data: Omit<User, 'id' | 'createdAt'> = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role: role as UserRole,
      status,
    };

    // Include password only if provided
    if (password.trim()) {
      data.password = password;
    } else if (isEditing && employee?.password) {
      data.password = employee.password;
    }

    onSubmit(data);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Pegawai' : 'Tambah Pegawai'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nama Lengkap"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Masukkan nama lengkap"
          error={errors.name}
        />

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Masukkan email"
          error={errors.email}
        />

        <Input
          label="Nomor Telepon"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Masukkan nomor telepon"
          error={errors.phone}
        />

        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            {availableRoles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as UserStatus)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <Input
          label={isEditing ? 'Password (kosongkan jika tidak diubah)' : 'Password'}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={isEditing ? 'Masukkan password baru' : 'Masukkan password'}
          error={errors.password}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit">
            {isEditing ? 'Simpan' : 'Tambah'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default EmployeeForm;
