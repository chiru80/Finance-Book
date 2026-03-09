import { addDays, differenceInDays, format, startOfDay } from 'date-fns';

/**
 * Calculates current status based on next due date
 */
export const calculateStatus = (nextDueDate) => {
    if (!nextDueDate) return 'active';

    const today = startOfDay(new Date());
    const dueDate = startOfDay(new Date(nextDueDate));
    const diff = differenceInDays(dueDate, today);

    if (diff < 0) return 'overdue';
    if (diff <= 2) return 'due-soon';
    return 'paid';
};

/**
 * Derives financial details for a customer
 */
export const deriveCustomerStats = (customer, payments = []) => {
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remainingBalance = Math.max(0, Number(customer.loanAmount) - totalPaid);

    // Calculate next due date logic
    const startDate = new Date(customer.startDate);
    const cycleDays = customer.paymentCycle === 'weekly' ? 7 : 30;

    // Based on total paid installments
    const installmentsPaid = Math.floor(totalPaid / Number(customer.installmentAmount));
    const nextDueDate = addDays(startDate, (installmentsPaid + 1) * cycleDays);

    return {
        totalPaid,
        remainingBalance,
        nextDueDate: format(nextDueDate, 'yyyy-MM-dd'),
        status: calculateStatus(nextDueDate),
        installmentNumber: installmentsPaid + 1
    };
};

export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};
