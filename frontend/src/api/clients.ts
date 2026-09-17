import { api } from './client';
import type { Client, ClientSummary, PaginatedResult } from '@/types';

export interface CreateClientPayload {
  firstName: string;
  lastName: string;
  documentId: string;
  phone: string;
  email?: string;
  address?: string;
  occupation?: string;
  monthlyIncome?: number;
  notes?: string;
}

export type UpdateClientPayload = Partial<CreateClientPayload> & { status?: 'ACTIVE' | 'INACTIVE' };

export const clientsApi = {
  list: (params: { search?: string; page?: number; limit?: number }) =>
    api.get<PaginatedResult<Client>>('/clients', { params }).then((r) => r.data),
  get: (id: string) => api.get<Client>(`/clients/${id}`).then((r) => r.data),
  summary: (id: string) => api.get<ClientSummary>(`/clients/${id}/summary`).then((r) => r.data),
  create: (payload: CreateClientPayload) => api.post<Client>('/clients', payload).then((r) => r.data),
  update: (id: string, payload: UpdateClientPayload) =>
    api.patch<Client>(`/clients/${id}`, payload).then((r) => r.data),
  remove: (id: string) => api.delete(`/clients/${id}`).then((r) => r.data),
};
