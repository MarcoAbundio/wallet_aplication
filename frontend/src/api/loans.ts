import { api } from './client';
import type { Loan, LoanStatus, PaginatedResult, PaymentFrequency } from '@/types';

export interface CreateLoanPayload {
  clientId: string;
  principal: number;
  interestRate: number;
  termInstallments: number;
  frequency: PaymentFrequency;
  startDate: string;
  purpose?: string;
  notes?: string;
}

export const loansApi = {
  list: (params: {
    search?: string;
    page?: number;
    limit?: number;
    status?: LoanStatus;
    clientId?: string;
  }) => api.get<PaginatedResult<Loan>>('/loans', { params }).then((r) => r.data),
  get: (id: string) => api.get<Loan>(`/loans/${id}`).then((r) => r.data),
  create: (payload: CreateLoanPayload) => api.post<Loan>('/loans', payload).then((r) => r.data),
  updateStatus: (id: string, status: LoanStatus) =>
    api.patch<Loan>(`/loans/${id}/status`, { status }).then((r) => r.data),
};
