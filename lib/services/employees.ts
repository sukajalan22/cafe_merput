// Employees service for Cafe Merah Putih Management System
// Handles CRUD operations for employees via API endpoints

import { User, UserRole, UserStatus } from '../types';
import { getAuthToken } from './auth';

// Role type from API
export interface Role {
  role_id: string;
  nama_role: string;
}

// Helper to get auth headers
function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Get all roles from API
export async function getRoles(): Promise<Role[]> {
  try {
    const response = await fetch('/api/roles', {
      method: 'GET',
      headers: getHeaders(),
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      console.error('Failed to fetch roles:', data.error);
      return [];
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching roles:', error);
    return [];
  }
}

// Map API role name to UserRole
function mapRoleName(roleName: string): UserRole {
  const mapping: Record<string, UserRole> = {
    'Kasir': 'Kasir',
    'Barista': 'Barista',
    'Manager': 'Manager',
    'Admin': 'Manager', // Map Admin to Manager for compatibility
  };
  return mapping[roleName] || 'Kasir';
}

// Map API response to User type
function mapApiEmployee(apiEmployee: Record<string, unknown>): User {
  return {
    id: apiEmployee.user_id as string,
    name: apiEmployee.username as string,
    email: apiEmployee.email as string,
    phone: (apiEmployee.phone as string) || '',
    role: mapRoleName(apiEmployee.role_name as string || apiEmployee.nama_role as string || 'Kasir'),
    status: (apiEmployee.status as UserStatus) || 'Aktif',
    createdAt: new Date(apiEmployee.created_at as string),
  };
}

// Get all employees
export async function getEmployees(search?: string): Promise<User[]> {
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    
    const url = `/api/employees${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      console.error('Failed to fetch employees:', data.error);
      return [];
    }

    return data.data.map(mapApiEmployee);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
}

// Get employee by ID
export async function getEmployeeById(id: string): Promise<User | undefined> {
  try {
    const response = await fetch(`/api/employees/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      return undefined;
    }

    return mapApiEmployee(data.data);
  } catch (error) {
    console.error('Error fetching employee:', error);
    return undefined;
  }
}

// Get employee by email (fetch all and filter client-side)
export async function getEmployeeByEmail(email: string): Promise<User | undefined> {
  const employees = await getEmployees();
  return employees.find((e) => e.email.toLowerCase() === email.toLowerCase());
}

// Search employees by name (client-side filtering for already fetched employees)
export function searchEmployees(employees: User[], query: string): User[] {
  if (!query.trim()) return employees;
  const lowerQuery = query.toLowerCase();
  return employees.filter((e) => e.name.toLowerCase().includes(lowerQuery));
}

// Create new employee
export async function createEmployee(
  data: Omit<User, 'id' | 'createdAt'> & { password: string }
): Promise<User | null> {
  try {
    // First, get roles to find the role_id
    const rolesResponse = await fetch('/api/roles', {
      method: 'GET',
      headers: getHeaders(),
    });
    const rolesData = await rolesResponse.json();
    
    let roleId = '';
    if (rolesData.success && rolesData.data) {
      const role = rolesData.data.find((r: Record<string, unknown>) => 
        (r.nama_role as string) === data.role
      );
      if (role) {
        roleId = role.role_id as string;
      }
    }

    const response = await fetch('/api/employees', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        username: data.name,
        email: data.email,
        password: data.password,
        role_id: roleId,
        status: data.status,
        phone: data.phone,
      }),
    });

    const result = await response.json();
    
    if (!response.ok || !result.success) {
      if (result.error?.includes('email') || result.error?.includes('Email')) {
        throw new Error('Email sudah terdaftar');
      }
      console.error('Failed to create employee:', result.error);
      return null;
    }

    return mapApiEmployee(result.data);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    console.error('Error creating employee:', error);
    return null;
  }
}

// Update existing employee
export async function updateEmployee(
  id: string,
  data: Partial<Omit<User, 'id' | 'createdAt'>> & { password?: string }
): Promise<User | null> {
  try {
    const updateData: Record<string, unknown> = {};
    
    if (data.name !== undefined) updateData.username = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.password !== undefined) updateData.password = data.password;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.phone !== undefined) updateData.phone = data.phone;
    
    // If role is being updated, get the role_id
    if (data.role !== undefined) {
      const rolesResponse = await fetch('/api/roles', {
        method: 'GET',
        headers: getHeaders(),
      });
      const rolesData = await rolesResponse.json();
      
      if (rolesData.success && rolesData.data) {
        const role = rolesData.data.find((r: Record<string, unknown>) => 
          (r.nama_role as string) === data.role
        );
        if (role) {
          updateData.role_id = role.role_id as string;
        }
      }
    }

    const response = await fetch(`/api/employees/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updateData),
    });

    const result = await response.json();
    
    if (!response.ok || !result.success) {
      if (result.error?.includes('email') || result.error?.includes('Email')) {
        throw new Error('Email sudah terdaftar');
      }
      console.error('Failed to update employee:', result.error);
      return null;
    }

    return mapApiEmployee(result.data);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    console.error('Error updating employee:', error);
    return null;
  }
}

// Delete employee
export async function deleteEmployee(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/employees/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok || !result.success) {
      console.error('Failed to delete employee:', result.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting employee:', error);
    return false;
  }
}
