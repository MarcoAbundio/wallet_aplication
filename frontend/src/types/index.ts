export type Role = 'ADMIN' | 'MANAGER' | 'CASHIER';

export type ClientStatus = 'ACTIVE' | 'INACTIVE';

export type LoanStatus = 'PENDING' | 'ACTIVE' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type PaymentFrequency = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';

export type InstallmentStatus = 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE';

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'MOBILE_WALLET';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  documentId: string;
  email: string | null;
  phone: string;
  address: string | null;
  occupation: string | null;
  monthlyIncome: string | null;
  status: ClientStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { loans: number };
  loans?: Loan[];
}

export interface Installment {
  id: string;
  loanId: string;
  number: number;
  dueDate: string;
  amountDue: string;
  principalPart: string;
  interestPart: string;
  amountPaid: string;
  status: InstallmentStatus;
  paidAt: string | null;
}

export interface Loan {
  id: string;
  code: string;
  clientId: string;
  client?: Pick<Client, 'id' | 'firstName' | 'lastName' | 'documentId'>;
  principal: string;
  interestRate: string;
  termInstallments: number;
  frequency: PaymentFrequency;
  startDate: string;
  status: LoanStatus;
  totalToPay: string;
  remainingBalance?: string | number;
  purpose: string | null;
  notes: string | null;
  createdAt: string;
  installments?: Installment[];
  payments?: Payment[];
  _count?: { payments: number };
}

export interface Payment {
  id: string;
  loanId: string;
  loan?: Loan;
  installmentId: string | null;
  installment?: Installment | null;
  amount: string;
  method: PaymentMethod;
  paidAt: string;
  reference: string | null;
  notes: string | null;
  createdAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ClientSummary {
  activeLoans: number;
  totalPending: number;
  totalOverdue: number;
  pendingInstallments: (Installment & { loan: Loan })[];
  overdueInstallments: (Installment & { loan: Loan })[];
}

export interface DashboardSummary {
  totalClients: number;
  activeClients: number;
  totalLoans: number;
  activeLoans: number;
  overdueLoans: number;
  totalDisbursed: number;
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
}

export interface MonthlyPoint {
  month: string;
  total: number;
}

export interface LoansByStatusPoint {
  status: LoanStatus;
  count: number;
  amount: number;
}

export interface OverdueClientPoint {
  clientId: string;
  name: string;
  overdueAmount: number;
  overdueInstallments: number;
}
