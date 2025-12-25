'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { User } from '@/lib/types';
import {
  getEmployees,
  searchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getRoles,
  Role,
} from '@/lib/services/employees';
import { EmployeeCard } from '@/components/features/pegawai/EmployeeCard';
import { EmployeeForm } from '@/components/features/pegawai/EmployeeForm';
import { SearchInput } from '@/components/ui/SearchInput';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Plus, Users } from 'lucide-react';

export default function PegawaiPage() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [employeesData, rolesData] = await Promise.all([
          getEmployees(),
          getRoles(),
        ]);
        setEmployees(employeesData);
        setRoles(rolesData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setEmployees([]);
        setRoles([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filter employees based on search
  const filteredEmployees = useMemo(() => {
    return searchEmployees(employees, searchQuery);
  }, [employees, searchQuery]);

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setIsFormOpen(true);
  };

  const handleEditEmployee = (employee: User) => {
    setEditingEmployee(employee);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (employeeId: string) => {
    setDeleteConfirm(employeeId);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirm) {
      const success = await deleteEmployee(deleteConfirm);
      if (success) {
        const updatedEmployees = await getEmployees();
        setEmployees(updatedEmployees);
      }
      setDeleteConfirm(null);
    }
  };

  const handleFormSubmit = async (data: Omit<User, 'id' | 'createdAt'>) => {
    setError(null);
    try {
      if (editingEmployee) {
        // Update existing employee
        await updateEmployee(editingEmployee.id, data);
      } else {
        // Create new employee - ensure password is provided
        if (!data.password) {
          setError('Password wajib diisi');
          return;
        }
        await createEmployee(data as Omit<User, 'id' | 'createdAt'> & { password: string });
      }
      const updatedEmployees = await getEmployees();
      setEmployees(updatedEmployees);
      setIsFormOpen(false);
      setEditingEmployee(null);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingEmployee(null);
    setError(null);
  };

  // Get employee to delete for confirmation message
  const employeeToDelete = deleteConfirm
    ? employees.find((e) => e.id === deleteConfirm)
    : null;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola Pegawai</h1>
          <p className="text-gray-600 mt-1">
            Kelola data pegawai cafe
          </p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={handleAddEmployee}>
          Tambah Pegawai
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <SearchInput
          placeholder="Cari pegawai..."
          value={searchQuery}
          onSearch={setSearchQuery}
          className="max-w-md"
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Employee Grid */}
      {filteredEmployees.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              onEdit={handleEditEmployee}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'Tidak ada pegawai ditemukan' : 'Belum ada pegawai'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery
              ? 'Coba ubah kata kunci pencarian'
              : 'Mulai dengan menambahkan pegawai baru'}
          </p>
          {!searchQuery && (
            <Button icon={<Plus className="w-4 h-4" />} onClick={handleAddEmployee}>
              Tambah Pegawai
            </Button>
          )}
        </div>
      )}

      {/* Employee Form Modal */}
      <EmployeeForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
        employee={editingEmployee}
        roles={roles}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Konfirmasi Hapus"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Apakah Anda yakin ingin menghapus pegawai{' '}
            <span className="font-semibold text-gray-900">
              {employeeToDelete?.name}
            </span>
            ?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
