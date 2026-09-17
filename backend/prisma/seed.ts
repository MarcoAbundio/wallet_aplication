import { PrismaClient, PaymentFrequency, PaymentMethod } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { buildAmortizationSchedule } from '../src/loans/utils/amortization.util';

const prisma = new PrismaClient();

async function hash(password: string) {
  return bcrypt.hash(password, 10);
}

function monthsAgo(n: number): Date {
  const date = new Date();
  date.setMonth(date.getMonth() - n);
  return date;
}

async function createLoanWithHistory(params: {
  clientId: string;
  code: string;
  principal: number;
  interestRate: number;
  termInstallments: number;
  frequency: PaymentFrequency;
  startDate: Date;
  createdById: string;
  paidInstallments: number; // how many installments to fully pay from the start
  partialOnNext?: number; // amount to partially pay on the following installment
}) {
  const { schedule, totalToPay } = buildAmortizationSchedule({
    principal: params.principal,
    annualInterestRate: params.interestRate,
    termInstallments: params.termInstallments,
    frequency: params.frequency,
    startDate: params.startDate,
  });

  const loan = await prisma.loan.create({
    data: {
      code: params.code,
      clientId: params.clientId,
      principal: params.principal,
      interestRate: params.interestRate,
      termInstallments: params.termInstallments,
      frequency: params.frequency,
      startDate: params.startDate,
      totalToPay,
      purpose: 'Capital de trabajo',
      createdById: params.createdById,
      status: 'ACTIVE',
      installments: {
        create: schedule.map((installment) => ({
          number: installment.number,
          dueDate: installment.dueDate,
          amountDue: installment.amountDue,
          principalPart: installment.principalPart,
          interestPart: installment.interestPart,
        })),
      },
    },
    include: { installments: { orderBy: { number: 'asc' } } },
  });

  for (let i = 0; i < params.paidInstallments && i < loan.installments.length; i++) {
    const installment = loan.installments[i];
    await prisma.installment.update({
      where: { id: installment.id },
      data: { amountPaid: installment.amountDue, status: 'PAID', paidAt: installment.dueDate },
    });
    await prisma.payment.create({
      data: {
        loanId: loan.id,
        installmentId: installment.id,
        amount: installment.amountDue,
        method: PaymentMethod.CASH,
        paidAt: installment.dueDate,
        registeredById: params.createdById,
        reference: `SEED-${params.code}-${installment.number}`,
      },
    });
  }

  if (params.partialOnNext && loan.installments[params.paidInstallments]) {
    const installment = loan.installments[params.paidInstallments];
    await prisma.installment.update({
      where: { id: installment.id },
      data: { amountPaid: params.partialOnNext, status: 'PARTIAL' },
    });
    await prisma.payment.create({
      data: {
        loanId: loan.id,
        installmentId: installment.id,
        amount: params.partialOnNext,
        method: PaymentMethod.BANK_TRANSFER,
        paidAt: new Date(),
        registeredById: params.createdById,
        reference: `SEED-${params.code}-${installment.number}-partial`,
      },
    });
  }

  if (params.paidInstallments >= params.termInstallments) {
    await prisma.loan.update({ where: { id: loan.id }, data: { status: 'PAID' } });
  }

  return loan;
}

async function main() {
  console.log('Seeding database...');

  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!';
  const admin = await prisma.user.upsert({
    where: { email: process.env.SEED_ADMIN_EMAIL ?? 'admin@cartera.com' },
    update: {},
    create: {
      name: 'Administrador Principal',
      email: process.env.SEED_ADMIN_EMAIL ?? 'admin@cartera.com',
      passwordHash: await hash(adminPassword),
      role: 'ADMIN',
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'gerente@cartera.com' },
    update: {},
    create: {
      name: 'Luisa Fernandez',
      email: 'gerente@cartera.com',
      passwordHash: await hash('Gerente123!'),
      role: 'MANAGER',
    },
  });

  const cashier = await prisma.user.upsert({
    where: { email: 'cajero@cartera.com' },
    update: {},
    create: {
      name: 'Carlos Reyes',
      email: 'cajero@cartera.com',
      passwordHash: await hash('Cajero123!'),
      role: 'CASHIER',
    },
  });

  console.log('Users created: admin, gerente, cajero');

  const clientsData = [
    {
      firstName: 'Ana',
      lastName: 'Martinez Lopez',
      documentId: '001-1234567-1',
      phone: '809-555-0101',
      email: 'ana.martinez@example.com',
      address: 'Calle Duarte #45, Santo Domingo',
      occupation: 'Comerciante',
      monthlyIncome: 35000,
    },
    {
      firstName: 'Jose',
      lastName: 'Perez Diaz',
      documentId: '001-1234567-2',
      phone: '809-555-0102',
      email: 'jose.perez@example.com',
      address: 'Av. Independencia #12, Santo Domingo',
      occupation: 'Taxista',
      monthlyIncome: 28000,
    },
    {
      firstName: 'Carmen',
      lastName: 'Rodriguez Feliz',
      documentId: '001-1234567-3',
      phone: '809-555-0103',
      email: 'carmen.rodriguez@example.com',
      address: 'Calle El Sol #8, Santiago',
      occupation: 'Repostera',
      monthlyIncome: 22000,
    },
    {
      firstName: 'Miguel',
      lastName: 'Santana Cruz',
      documentId: '001-1234567-4',
      phone: '809-555-0104',
      email: 'miguel.santana@example.com',
      address: 'Calle Mella #22, La Vega',
      occupation: 'Mecanico',
      monthlyIncome: 30000,
    },
    {
      firstName: 'Rosa',
      lastName: 'Nunez Vargas',
      documentId: '001-1234567-5',
      phone: '809-555-0105',
      email: 'rosa.nunez@example.com',
      address: 'Calle Las Flores #3, San Cristobal',
      occupation: 'Estilista',
      monthlyIncome: 26000,
    },
    {
      firstName: 'Pedro',
      lastName: 'Gomez Alcantara',
      documentId: '001-1234567-6',
      phone: '809-555-0106',
      email: 'pedro.gomez@example.com',
      address: 'Av. 27 de Febrero #101, Santo Domingo',
      occupation: 'Colmadero',
      monthlyIncome: 40000,
    },
  ];

  const clients: any = [];
  for (const data of clientsData) {
    const client = await prisma.client.upsert({
      where: { documentId: data.documentId },
      update: {},
      create: { ...data, createdById: cashier.id },
    });
    clients.push(client);
  }
  console.log(`Clients created: ${clients.length}`);

  // Loan 1: Ana - started 5 months ago, monthly, 6 installments, 3 paid + 1 partial -> overdue mix
  await createLoanWithHistory({
    clientId: clients[0].id,
    code: 'PR-000001',
    principal: 30000,
    interestRate: 24,
    termInstallments: 6,
    frequency: PaymentFrequency.MONTHLY,
    startDate: monthsAgo(5),
    createdById: cashier.id,
    paidInstallments: 3,
    partialOnNext: 2000,
  });

  // Loan 2: Jose - started 2 months ago, monthly, 12 installments, 2 paid -> mostly pending
  await createLoanWithHistory({
    clientId: clients[1].id,
    code: 'PR-000002',
    principal: 60000,
    interestRate: 22,
    termInstallments: 12,
    frequency: PaymentFrequency.MONTHLY,
    startDate: monthsAgo(2),
    createdById: cashier.id,
    paidInstallments: 2,
  });

  // Loan 3: Carmen - started 8 months ago, monthly, 6 installments, all paid -> fully paid loan
  await createLoanWithHistory({
    clientId: clients[2].id,
    code: 'PR-000003',
    principal: 15000,
    interestRate: 20,
    termInstallments: 6,
    frequency: PaymentFrequency.MONTHLY,
    startDate: monthsAgo(8),
    createdById: manager.id,
    paidInstallments: 6,
  });

  // Loan 4: Miguel - started 6 months ago, biweekly, 10 installments, no payments -> heavily overdue
  await createLoanWithHistory({
    clientId: clients[3].id,
    code: 'PR-000004',
    principal: 20000,
    interestRate: 26,
    termInstallments: 10,
    frequency: PaymentFrequency.BIWEEKLY,
    startDate: monthsAgo(6),
    createdById: cashier.id,
    paidInstallments: 0,
  });

  // Loan 5: Rosa - starts today, monthly, 8 installments, no payments -> all pending, none overdue
  await createLoanWithHistory({
    clientId: clients[4].id,
    code: 'PR-000005',
    principal: 25000,
    interestRate: 24,
    termInstallments: 8,
    frequency: PaymentFrequency.MONTHLY,
    startDate: new Date(),
    createdById: manager.id,
    paidInstallments: 0,
  });

  // Loan 6: Pedro - started 3 months ago, weekly, 16 installments, 6 paid -> healthy, current
  await createLoanWithHistory({
    clientId: clients[5].id,
    code: 'PR-000006',
    principal: 18000,
    interestRate: 28,
    termInstallments: 16,
    frequency: PaymentFrequency.WEEKLY,
    startDate: monthsAgo(3),
    createdById: cashier.id,
    paidInstallments: 6,
  });

  console.log('Loans and payment history created');
  console.log('---');
  console.log('Seed complete. Demo accounts:');
  console.log(`  ADMIN   -> ${admin.email} / ${adminPassword}`);
  console.log(`  MANAGER -> ${manager.email} / Gerente123!`);
  console.log(`  CASHIER -> ${cashier.email} / Cajero123!`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
