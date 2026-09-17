import { api } from './client';
import type {
  DashboardSummary,
  LoansByStatusPoint,
  MonthlyPoint,
  OverdueClientPoint,
} from '@/types';

export const dashboardApi = {
  summary: () => api.get<DashboardSummary>('/dashboard/summary').then((r) => r.data),
  collectionsByMonth: (months = 6) =>
    api
      .get<MonthlyPoint[]>('/dashboard/collections-by-month', { params: { months } })
      .then((r) => r.data),
  disbursementsByMonth: (months = 6) =>
    api
      .get<MonthlyPoint[]>('/dashboard/disbursements-by-month', { params: { months } })
      .then((r) => r.data),
  loansByStatus: () => api.get<LoansByStatusPoint[]>('/dashboard/loans-by-status').then((r) => r.data),
  topOverdueClients: (limit = 5) =>
    api
      .get<OverdueClientPoint[]>('/dashboard/top-overdue-clients', { params: { limit } })
      .then((r) => r.data),
};
