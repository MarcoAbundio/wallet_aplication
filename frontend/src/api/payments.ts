import { api } from './client';
import type { PaginatedResult, Payment, PaymentMethod } from '@/types';

export interface CreatePaymentPayload {
  loanId: string;
  installmentId?: string;
  amount: number;
  method: PaymentMethod;
  paidAt?: string;
  reference?: string;
  notes?: string;
}

export const paymentsApi = {
  list: (params: { search?: string; page?: number; limit?: number; loanId?: string; clientId?: string }) =>
    api.get<PaginatedResult<Payment>>('/payments', { params }).then((r) => r.data),
  get: (id: string) => api.get<Payment>(`/payments/${id}`).then((r) => r.data),
  create: (payload: CreatePaymentPayload) =>
    api.post<{ payments: Payment[]; message: string }>('/payments', payload).then((r) => r.data),
};
