import { addDays, differenceInDays, format, startOfDay } from 'date-fns';

export const ABSENT = -1;

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
    // Standardize source: use weeks array if it exists, otherwise fallback to payments legacy
    const weeks = customer.weeks || [];
    
    const paidWeeks = weeks.filter(w => w && typeof w === 'object');
    const absentWeeks = weeks.filter(w => w === ABSENT);
    
    // Traditional total paid from payments collection (for verification/legacy)
    const totalPaidLegacy = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    // Calculated total paid from weeks array
    const totalPaidWeeks = paidWeeks.reduce((sum, w) => sum + Number(w.amount), 0);
    
    // Use the higher value or standardise to weeks
    const totalPaid = Math.max(totalPaidLegacy, totalPaidWeeks);
    const remainingBalance = Math.max(0, Number(customer.loanAmount) - totalPaid);

    // Calculate next due date logic with ABSENT tracking
    const startDate = new Date(customer.startDate);
    const cycleDays = customer.paymentCycle === 'weekly' ? 7 : 30;

    // effectiveIndex is the total weeks passed (including absents)
    const effectiveIndex = weeks.length;
    const nextDueDate = addDays(startDate, (effectiveIndex) * cycleDays);

    // Financial breakdown
    const cashCollected = paidWeeks.filter(w => w.mode === 'cash' || !w.mode).reduce((sum, w) => sum + w.amount, 0);
    const onlineCollected = paidWeeks.filter(w => w.mode && w.mode !== 'cash').reduce((sum, w) => sum + w.amount, 0);

    return {
        totalPaid,
        remainingBalance,
        nextDueDate: format(nextDueDate, 'yyyy-MM-dd'),
        status: calculateStatus(nextDueDate),
        installmentNumber: paidWeeks.length + 1,
        absentCount: absentWeeks.length,
        cashCollected,
        onlineCollected
    };
};

export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};
