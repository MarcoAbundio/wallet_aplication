import type { InstallmentStatus, LoanStatus } from '@/types';

export const loanStatusLabels: Record<LoanStatus, string> = {
  PENDING: 'Pendiente de desembolso',
  ACTIVE: 'Activo',
  PAID: 'Pagado',
  OVERDUE: 'Atrasado',
  CANCELLED: 'Cancelado',
};

export const loanStatusTone: Record<LoanStatus, 'neutral' | 'positive' | 'warning' | 'danger'> = {
  PENDING: 'neutral',
  ACTIVE: 'positive',
  PAID: 'positive',
  OVERDUE: 'danger',
  CANCELLED: 'neutral',
};

export const installmentStatusLabels: Record<InstallmentStatus, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagada',
  PARTIAL: 'Pago parcial',
  OVERDUE: 'Atrasada',
};

export const installmentStatusTone: Record<
  InstallmentStatus,
  'neutral' | 'positive' | 'warning' | 'danger'
> = {
  PENDING: 'neutral',
  PAID: 'positive',
  PARTIAL: 'warning',
  OVERDUE: 'danger',
};

export const frequencyLabels: Record<string, string> = {
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quincenal',
  MONTHLY: 'Mensual',
};

export const paymentMethodLabels: Record<string, string> = {
  CASH: 'Efectivo',
  BANK_TRANSFER: 'Transferencia',
  CARD: 'Tarjeta',
  MOBILE_WALLET: 'Billetera móvil',
};

export const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  CASHIER: 'Cajero',
};
