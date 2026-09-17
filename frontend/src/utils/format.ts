const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('es-MX');

const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
});

export function formatCurrency(value: string | number): string {
  const numeric = typeof value === 'string' ? Number(value) : value;
  return currencyFormatter.format(Number.isFinite(numeric) ? numeric : 0);
}

export function getLoanRemainingBalance(loan: {
  installments?: { amountDue: string | number; amountPaid: string | number }[];
  remainingBalance?: string | number | null;
  totalToPay: string | number;
}): number {
  if (loan.installments && loan.installments.length > 0) {
    return loan.installments.reduce(
      (sum, i) => sum + Number(i.amountDue) - Number(i.amountPaid),
      0,
    );
  }
  if (loan.remainingBalance !== undefined && loan.remainingBalance !== null) {
    const numeric = Number(loan.remainingBalance);
    if (Number.isFinite(numeric)) return numeric;
  }
  const total = Number(loan.totalToPay);
  return Number.isFinite(total) ? total : 0;
}

export function formatNumber(value: string | number): string {
  const numeric = typeof value === 'string' ? Number(value) : value;
  return numberFormatter.format(Number.isFinite(numeric) ? numeric : 0);
}

export function formatDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return dateFormatter.format(date);
}

export function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
