import {
    collection,
    addDoc,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    increment,
    limit,
    onSnapshot
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { sanitizeObject } from '../utils/sanitization';

/**
 * Utility to get the user-specific collection path.
 * This ensures data isolation in the client and matches our Firestore rules.
 */
const getUserCollection = (subCollection) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Authentication required');
    return collection(db, 'users', user.uid, subCollection);
};

const getUserDoc = (subCollection, docId) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Authentication required');
    return doc(db, 'users', user.uid, subCollection, docId);
};

const CUSTOMERS = 'customers';
const PAYMENTS = 'payments';
const ONLINE_PAYMENTS = 'onlinePayments';
const SETTINGS = 'settings';

export const customerService = {
    // Add a new customer
    async addCustomer(customerData) {
        const sanitizedData = sanitizeObject(customerData);
        const docRef = await addDoc(getUserCollection(CUSTOMERS), {
            ...sanitizedData,
            totalPaid: 0,
            remainingBalance: Number(sanitizedData.loanAmount),
            status: 'paid',
            weeks: [], // Initialize empty weeks array
            createdAt: serverTimestamp()
        });
        return docRef.id;
    },

    // Get all customers
    async getCustomers() {
        const q = query(getUserCollection(CUSTOMERS), orderBy('name'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    subscribeToCustomers(callback) {
        const q = query(getUserCollection(CUSTOMERS), orderBy('name'));
        return onSnapshot(q, (snapshot) => {
            const customers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(customers);
        });
    },

    // Get general settings (for initial/total capital)
    subscribeToSettings(callback) {
        const docRef = getUserDoc(SETTINGS, 'general');
        return onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                callback(docSnap.data());
            } else {
                callback({ initialCapital: 500000 }); // Default fallback
            }
        });
    },

    // Get single customer and their payments
    async getCustomerWithPayments(customerId) {
        const customerRef = getUserDoc(CUSTOMERS, customerId);
        const paymentsQuery = query(
            getUserCollection(PAYMENTS),
            where('customerId', '==', customerId),
            orderBy('paymentDate', 'desc')
        );

        // Fetch both in parallel
        const [customerDoc, paymentsSnapshot] = await Promise.all([
            getDoc(customerRef),
            getDocs(paymentsQuery)
        ]);

        if (!customerDoc.exists()) throw new Error('Customer not found');

        return {
            customer: { id: customerDoc.id, ...customerDoc.data() },
            payments: paymentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        };
    },

    // Record a payment (Legacy support + Single entry)
    async addPayment(customerId, paymentData) {
        const sanitizedPayment = sanitizeObject(paymentData);
        const paymentBatch = await addDoc(getUserCollection(PAYMENTS), {
            customerId,
            ...sanitizedPayment,
            createdAt: serverTimestamp()
        });

        const customerRef = getUserDoc(CUSTOMERS, customerId);
        const customerDoc = await getDoc(customerRef);
        const customer = customerDoc.data();
        
        // Update weeks array if possible (find first null week)
        const weeks = [...(customer.weeks || [])];
        const nextNullIndex = weeks.findIndex(w => w === null);
        const weekIndex = nextNullIndex === -1 ? weeks.length : nextNullIndex;
        
        weeks[weekIndex] = {
            amount: paymentData.amount,
            mode: paymentData.paymentMethod.toLowerCase(),
            date: paymentData.paymentDate
        };

        await updateDoc(customerRef, {
            totalPaid: increment(paymentData.amount),
            remainingBalance: increment(-paymentData.amount),
            weeks: weeks
        });

        return paymentBatch.id;
    },

    // New: Update a specific week (Paid or Absent)
    async updateWeek(customerId, weekIndex, weekValue) {
        const customerRef = getUserDoc(CUSTOMERS, customerId);
        const customerDoc = await getDoc(customerRef);
        if (!customerDoc.exists()) throw new Error('Customer not found');
        
        const customer = customerDoc.data();
        const weeks = [...(customer.weeks || [])];
        
        // Ensure array is large enough
        while (weeks.length <= weekIndex) {
            weeks.push(null);
        }

        const oldValue = weeks[weekIndex];
        const sanitizedValue = typeof weekValue === 'object' ? sanitizeObject(weekValue) : weekValue;
        weeks[weekIndex] = sanitizedValue;

        // Calculate updates for totals
        let totalPaidChange = 0;
        if (oldValue && typeof oldValue === 'object') totalPaidChange -= oldValue.amount;
        if (weekValue && typeof weekValue === 'object') totalPaidChange += weekValue.amount;

        await updateDoc(customerRef, {
            weeks: weeks,
            totalPaid: increment(totalPaidChange),
            remainingBalance: increment(-totalPaidChange)
        });

        // If it was a payment, record it in history
        if (weekValue && typeof weekValue === 'object') {
            const paymentObj = {
                customerId,
                customerName: customer.name,
                village: customer.village || '',
                week: `W${weekIndex + 1}`,
                amount: weekValue.amount,
                paymentMethod: weekValue.mode || 'cash',
                paymentDate: weekValue.date || new Date().toISOString().split('T')[0],
                installmentNumber: weekIndex + 1,
                createdAt: serverTimestamp()
            };
            
            await addDoc(getUserCollection(PAYMENTS), paymentObj);

            // Also record in onlinePayments if online
            if (weekValue.mode && weekValue.mode !== 'cash') {
                await addDoc(getUserCollection(ONLINE_PAYMENTS), paymentObj);
            }
        }
    },

    // Get online payments directly
    async getOnlinePayments() {
        const q = query(getUserCollection(ONLINE_PAYMENTS), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
};
