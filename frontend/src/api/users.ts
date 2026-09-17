import { api } from './client';
import type { PaginatedResult, Role, StaffUser } from '@/types';

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: Role;
  isActive?: boolean;
}

export const usersApi = {
  list: (params: { search?: string; page?: number; limit?: number }) =>
    api.get<PaginatedResult<StaffUser>>('/users', { params }).then((r) => r.data),
  get: (id: string) => api.get<StaffUser>(`/users/${id}`).then((r) => r.data),
  create: (payload: CreateUserPayload) => api.post<StaffUser>('/users', payload).then((r) => r.data),
  update: (id: string, payload: UpdateUserPayload) =>
    api.patch<StaffUser>(`/users/${id}`, payload).then((r) => r.data),
  changePassword: (id: string, newPassword: string) =>
    api.patch(`/users/${id}/password`, { newPassword }).then((r) => r.data),
  remove: (id: string) => api.delete(`/users/${id}`).then((r) => r.data),
};
