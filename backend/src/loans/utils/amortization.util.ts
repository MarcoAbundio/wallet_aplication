import { PaymentFrequency } from '@prisma/client';

export interface ScheduledInstallment {
  number: number;
  dueDate: Date;
  amountDue: number;
  principalPart: number;
  interestPart: number;
}

const PERIODS_PER_YEAR: Record<PaymentFrequency, number> = {
  WEEKLY: 52,
  BIWEEKLY: 26,
  MONTHLY: 12,
};

const DAYS_BETWEEN_PAYMENTS: Record<PaymentFrequency, number> = {
  WEEKLY: 7,
  BIWEEKLY: 15,
  MONTHLY: 30,
};

/**
 * Builds a reducing-balance (French system) amortization schedule: every
 * installment has the same total amount, with the interest portion shrinking
 * and the principal portion growing over time.
 */
export function buildAmortizationSchedule(params: {
  principal: number;
  annualInterestRate: number; // e.g. 24 for 24%
  termInstallments: number;
  frequency: PaymentFrequency;
  startDate: Date;
}): { schedule: ScheduledInstallment[]; totalToPay: number; installmentAmount: number } {
  const { principal, annualInterestRate, termInstallments, frequency, startDate } = params;

  const periodsPerYear = PERIODS_PER_YEAR[frequency];
  const periodicRate = annualInterestRate / 100 / periodsPerYear;

  let installmentAmount: number;
  if (periodicRate === 0) {
    installmentAmount = principal / termInstallments;
  } else {
    installmentAmount =
      (principal * periodicRate) / (1 - Math.pow(1 + periodicRate, -termInstallments));
  }
  installmentAmount = roundCurrency(installmentAmount);

  const schedule: ScheduledInstallment[] = [];
  let balance = principal;

  for (let i = 1; i <= termInstallments; i++) {
    const interestPart = roundCurrency(balance * periodicRate);
    let principalPart = roundCurrency(installmentAmount - interestPart);
    let amountDue = installmentAmount;

    // Adjust the final installment for rounding drift so the balance reaches exactly 0.
    if (i === termInstallments) {
      principalPart = roundCurrency(balance);
      amountDue = roundCurrency(principalPart + interestPart);
    }

    balance = roundCurrency(balance - principalPart);

    schedule.push({
      number: i,
      dueDate: addDays(startDate, DAYS_BETWEEN_PAYMENTS[frequency] * i),
      amountDue,
      principalPart,
      interestPart,
    });
  }

  const totalToPay = roundCurrency(schedule.reduce((sum, s) => sum + s.amountDue, 0));

  return { schedule, totalToPay, installmentAmount };
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}
