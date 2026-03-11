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
    limit
} from 'firebase/firestore';
import { db } from '../firebase';

const CUSTOMERS_COLLECTION = 'customers';
const PAYMENTS_COLLECTION = 'payments';

export const customerService = {
    // Add a new customer
    async addCustomer(customerData) {
        const docRef = await addDoc(collection(db, CUSTOMERS_COLLECTION), {
            ...customerData,
            totalPaid: 0,
            remainingBalance: Number(customerData.loanAmount),
            status: 'paid',
            createdAt: serverTimestamp()
        });
        return docRef.id;
    },

    // Get all customers
    async getCustomers() {
        const q = query(
            collection(db, CUSTOMERS_COLLECTION),
            orderBy('createdAt', 'desc'),
            limit(20)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // Get single customer and their payments
    async getCustomerWithPayments(customerId) {
        const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
        const paymentsQuery = query(
            collection(db, PAYMENTS_COLLECTION),
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

    // Record a payment
    async addPayment(customerId, paymentData) {
        const paymentBatch = await addDoc(collection(db, PAYMENTS_COLLECTION), {
            customerId,
            ...paymentData,
            createdAt: serverTimestamp()
        });

        const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
        await updateDoc(customerRef, {
            totalPaid: increment(paymentData.amount),
            remainingBalance: increment(-paymentData.amount)
            // Logic for nextDueDate and status would ideally be handled here too 
            // or recalculated on the fly in the UI
        });

        return paymentBatch.id;
    }
};
