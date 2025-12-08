
/**
 * Función para calcular el gasto total (o ingreso) por categoría en un rango de fechas.
 * @param {Array<Object>} transactions - La lista completa de transacciones.
 * @param {string} type - 'expense' o 'income'.
 * @returns {Object} Un objeto donde la clave es la categoría y el valor es el monto total.
 * * EJEMPLO DE USO:
 * { 'Alimentación': 890000, 'Transporte': 150000, ... }
 */

import { formatearMoneda } from '../utils/FormateoValores';


const generateId = () => {
    return Math.random().toString(36).substr(2, 9);
};

/**
 * Verifica si una transacción es un pago de cuotas de crédito
 * @param {Object} transaction - La transacción a verificar
 * @param {Array} accounts - Lista de cuentas
 * @returns {boolean} - true si es un pago de crédito
 */
export const isCreditPayment = (transaction, accounts) => {
    if (transaction.type !== 'income') return false;
    const account = accounts.find(acc => acc.id === transaction.accountId);
    return account && account.type === 'Crédito' && transaction.category === 'Pagos Varios';
};

/**
 * Obtiene solo los pagos de crédito
 * @param {Array} transactions - Lista de transacciones
 * @param {Array} accounts - Lista de cuentas
 * @returns {Array} - Transacciones que son pagos de crédito
 */
export const getCreditPayments = (transactions, accounts) => {
    return transactions.filter(t => isCreditPayment(t, accounts));
};

/**
 * Filtra transacciones excluyendo pagos de crédito
 * @param {Array} transactions - Lista de transacciones
 * @param {Array} accounts - Lista de cuentas
 * @returns {Array} - Transacciones sin pagos de crédito
 */
export const filterOutCreditPayments = (transactions, accounts) => {
    return transactions.filter(t => !isCreditPayment(t, accounts));
};

export const getCategoryTotals = (transactions, type = 'expense', accounts = []) => {
    // Filtrar pagos de crédito si se proporcionan cuentas
    const filteredByPayments = accounts.length > 0
        ? filterOutCreditPayments(transactions, accounts)
        : transactions;

    const filteredTransactions = filteredByPayments.filter(transaction => transaction.type === type);

    const totals = filteredTransactions.reduce((acc, transaction) => {
        const category = transaction.category;
        const amount = parseFloat(transaction.amount);
        acc[category] = (acc[category] || 0) + amount;

        return acc;
    }, {});

    return totals;
};

/**
 * Función para obtener el saldo mensual (total de ingresos - gastos) a lo largo del tiempo.
 * @param {Array<Object>} transactions - La lista completa de transacciones.
 * @param {Array<Object>} accounts - La lista de cuentas (opcional, para filtrar pagos de crédito).
 * @returns {Object} Un objeto con el saldo neto por cada mes.
 * * EJEMPLO DE USO:
 * { '2025-10': 350000, '2025-11': 1500000, ... }
 */

export const getMonthlyNetBalance = (transactions, accounts = []) => {
    // Filtrar pagos de crédito si se proporcionan cuentas
    const filteredTransactions = accounts.length > 0
        ? filterOutCreditPayments(transactions, accounts)
        : transactions;

    const monthlyData = filteredTransactions.reduce((acc, transaction) => {
        const date = new Date(transaction.date);
        // Formato YYYY-MM para agrupar por mes
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const amount = parseFloat(transaction.amount);
        const factor = transaction.type === 'income' ? 1 : -1;

        acc[monthKey] = (acc[monthKey] || 0) + (amount * factor);

        return acc;
    }, {});

    return Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b));
};

export const getCreditBalance = (transactions) => {
    const creditTransactions = transactions.filter(transaction => transaction.type === 'income' && transaction.account.type === 'Crédito');
    const totalCredit = creditTransactions.reduce((acc, transaction) => acc + parseFloat(transaction.amount), 0);
    return totalCredit;
};

















export const generateNotifications = (transactions, accounts) => {
    const notifications = [];

    accounts.forEach(account => {
        if (account.balance < 100000 && account.type !== 'Crédito') {
            notifications.push({
                id: `low-balance-${account.id}`,
                message: `⚠️ Saldo bajo en ${account.name}: ${formatearMoneda(account.balance)}`,
                type: 'warning',
                date: new Date().toISOString(),
                isRead: false
            });
        }

        if (account.balance > 500000 && account.type !== 'Crédito') {
            notifications.push({
                id: `good-balance-${account.id}`,
                message: `🎉 ¡Excelente! ${account.name} tiene un buen saldo: ${formatearMoneda(account.balance)}`,
                type: 'success',
                date: new Date().toISOString(),
                isRead: false
            });
        }
    });

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyExpenses = transactions
        .filter(t => {
            const tDate = new Date(t.date);
            return t.type === 'expense' &&
                tDate.getMonth() === currentMonth &&
                tDate.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + t.amount, 0);

    if (monthlyExpenses > 1000000) {
        notifications.push({
            id: `high-expenses-${currentMonth}`,
            message: `💸 Tus gastos este mes son altos: ${formatearMoneda(monthlyExpenses)}`,
            type: 'error',
            date: new Date().toISOString(),
            isRead: false
        });
    }

    if (monthlyExpenses < 500000 && monthlyExpenses > 0) {
        notifications.push({
            id: `low-expenses-${currentMonth}`,
            message: `✨ ¡Felicidades! Tus gastos este mes son bajos: ${formatearMoneda(monthlyExpenses)}`,
            type: 'success',
            date: new Date().toISOString(),
            isRead: false
        });
    }

    const categoryTotals = getCategoryTotals(transactions, 'expense');
    Object.entries(categoryTotals).forEach(([category, amount]) => {
        if (amount > 500000) {
            notifications.push({
                id: `high-category-${category}`,
                message: `📊 Gastos altos en ${category}: ${formatearMoneda(amount)}`,
                type: 'info',
                date: new Date().toISOString(),
                isRead: false
            });
        }
    });

    accounts.forEach(account => {
        if (account.type === 'Crédito' && account.balance < 0) {
            notifications.push({
                id: `credit-debt-${account.id}`,
                message: `💳 Deuda en ${account.name}: ${formatearMoneda(Math.abs(account.balance))}`,
                type: 'warning',
                date: new Date().toISOString(),
                isRead: false
            });
        }

        if (account.type === 'Crédito' && account.balance >= 0) {
            notifications.push({
                id: `credit-positive-${account.id}`,
                message: `🎊 ¡Genial! Tu ${account.name} está al día sin deudas`,
                type: 'success',
                date: new Date().toISOString(),
                isRead: false
            });
        }
    });

    const monthlyIncome = transactions
        .filter(t => {
            const tDate = new Date(t.date);
            return t.type === 'income' &&
                tDate.getMonth() === currentMonth &&
                tDate.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + t.amount, 0);

    if (monthlyIncome > 2000000) {
        notifications.push({
            id: `high-income-${currentMonth}`,
            message: `💰 ¡Excelente mes! Tus ingresos son: ${formatearMoneda(monthlyIncome)}`,
            type: 'success',
            date: new Date().toISOString(),
            isRead: false
        });
    }

    return notifications;
};

