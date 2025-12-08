/**
 * Servicio para cálculos relacionados con tarjetas de crédito
 */

/**
 * Calcula el interés total de una compra a crédito
 * @param {number} amount - Monto de la compra
 * @param {number} installments - Número de cuotas
 * @param {number} interestRate - Tasa de interés mensual (%)
 * @returns {number} - Interés total
 */
export const calculateInterest = (amount, installments, interestRate) => {
    if (installments <= 1) return 0;
    return (amount * (interestRate / 100) * installments);
};

/**
 * Calcula la cuota mensual incluyendo intereses
 * @param {number} amount - Monto de la compra
 * @param {number} installments - Número de cuotas
 * @param {number} interestRate - Tasa de interés mensual (%)
 * @returns {number} - Cuota mensual
 */
export const calculateMonthlyPayment = (amount, installments, interestRate) => {
    if (installments <= 1) return amount;
    const totalWithInterest = amount + calculateInterest(amount, installments, interestRate);
    return totalWithInterest / installments;
};

/**
 * Calcula el monto total a pagar (capital + intereses)
 * @param {number} amount - Monto de la compra
 * @param {number} installments - Número de cuotas
 * @param {number} interestRate - Tasa de interés mensual (%)
 * @returns {number} - Monto total
 */
export const calculateTotalAmount = (amount, installments, interestRate) => {
    return amount + calculateInterest(amount, installments, interestRate);
};

/**
 * Calcula el cupo disponible de una tarjeta de crédito
 * @param {number} creditLimit - Cupo máximo
 * @param {number} currentBalance - Balance actual (negativo = deuda)
 * @returns {number} - Cupo disponible
 */
export const calculateAvailableCredit = (creditLimit, currentBalance) => {
    return creditLimit - Math.abs(currentBalance);
};

/**
 * Obtiene resumen de todas las tarjetas de crédito
 * @param {Array} transactions - Lista de transacciones
 * @param {Array} accounts - Lista de cuentas
 * @returns {Object} - Resumen de crédito
 */
export const getCreditSummary = (transactions, accounts) => {
    const creditAccounts = accounts.filter(acc => acc.type === 'Crédito');

    if (creditAccounts.length === 0) {
        return {
            totalDebt: 0,
            totalInterest: 0,
            totalCreditLimit: 0,
            totalAvailable: 0,
            creditUsage: []
        };
    }

    const creditTransactions = transactions.filter(t =>
        creditAccounts.some(acc => acc.id === t.accountId) && t.type === 'expense'
    );

    const totalDebt = creditAccounts.reduce((sum, acc) => sum + Math.abs(acc.balance), 0);
    const totalInterest = creditTransactions.reduce((sum, t) => sum + (t.interestAmount || 0), 0);
    const totalCreditLimit = creditAccounts.reduce((sum, acc) => sum + (acc.creditLimit || 0), 0);
    const totalAvailable = creditAccounts.reduce((sum, acc) =>
        sum + calculateAvailableCredit(acc.creditLimit || 0, acc.balance), 0
    );

    const creditUsage = creditAccounts.map(acc => ({
        id: acc.id,
        name: acc.name,
        used: Math.abs(acc.balance),
        limit: acc.creditLimit || 0,
        available: calculateAvailableCredit(acc.creditLimit || 0, acc.balance),
        percentage: acc.creditLimit ? (Math.abs(acc.balance) / acc.creditLimit) * 100 : 0,
        color: acc.color
    }));

    return {
        totalDebt,
        totalInterest,
        totalCreditLimit,
        totalAvailable,
        creditUsage
    };
};

/**
 * Obtiene todas las transacciones a crédito con sus detalles
 * @param {Array} transactions - Lista de transacciones
 * @param {Array} accounts - Lista de cuentas
 * @returns {Array} - Transacciones a crédito con detalles
 */
export const getCreditTransactions = (transactions, accounts) => {
    const creditAccounts = accounts.filter(acc => acc.type === 'Crédito');

    return transactions
        .filter(t => creditAccounts.some(acc => acc.id === t.accountId) && t.type === 'expense')
        .map(t => {
            const account = accounts.find(acc => acc.id === t.accountId);
            return {
                ...t,
                accountName: account?.name,
                installments: t.installments || 1,
                interestAmount: t.interestAmount || 0,
                monthlyPayment: t.installments && t.installments > 1
                    ? calculateMonthlyPayment(t.amount, t.installments, account?.interestRate || 0)
                    : t.amount,
                totalAmount: t.amount + (t.interestAmount || 0)
            };
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));
};

/**
 * Valida si una compra a crédito es posible
 * @param {number} amount - Monto de la compra
 * @param {Object} account - Cuenta de crédito
 * @returns {Object} - {valid: boolean, message: string}
 */
export const validateCreditPurchase = (amount, account) => {
    if (!account || account.type !== 'Crédito') {
        return { valid: false, message: 'La cuenta seleccionada no es una tarjeta de crédito' };
    }

    const available = calculateAvailableCredit(account.creditLimit || 0, account.balance);

    if (amount > available) {
        return {
            valid: false,
            message: `Cupo insuficiente. Disponible: $${available.toLocaleString()}`
        };
    }

    return { valid: true, message: '' };
};

/**
 * Obtiene análisis profundo de crédito
 * @param {Array} transactions - Lista de transacciones
 * @param {Array} accounts - Lista de cuentas
 * @returns {Object} - Análisis profundo
 */
export const getDeepCreditAnalysis = (transactions, accounts) => {
    const creditAccounts = accounts.filter(acc => acc.type === 'Crédito');
    const creditPurchases = transactions.filter(t =>
        creditAccounts.some(acc => acc.id === t.accountId) && t.type === 'expense'
    );
    const creditPayments = transactions.filter(t =>
        creditAccounts.some(acc => acc.id === t.accountId) &&
        t.type === 'income' &&
        t.category === 'Pagos Varios'
    );

    // Total gastado en compras a crédito
    const totalSpent = creditPurchases.reduce((sum, t) => sum + t.amount, 0);

    // Total de intereses generados
    const totalInterestGenerated = creditPurchases.reduce((sum, t) => sum + (t.interestAmount || 0), 0);

    // Total pagado en cuotas
    const totalPaid = creditPayments.reduce((sum, t) => sum + t.amount, 0);

    // Promedio de cuotas
    const avgInstallments = creditPurchases.length > 0
        ? creditPurchases.reduce((sum, t) => sum + (t.installments || 1), 0) / creditPurchases.length
        : 0;

    // Tasa de interés promedio ponderada
    const weightedInterestRate = creditPurchases.length > 0
        ? creditPurchases.reduce((sum, t) => {
            const account = accounts.find(acc => acc.id === t.accountId);
            return sum + ((account?.interestRate || 0) * t.amount);
        }, 0) / totalSpent
        : 0;

    // Compras por mes
    const purchasesByMonth = creditPurchases.reduce((acc, t) => {
        const date = new Date(t.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        acc[monthKey] = (acc[monthKey] || 0) + t.amount;
        return acc;
    }, {});

    // Intereses por mes
    const interestByMonth = creditPurchases.reduce((acc, t) => {
        const date = new Date(t.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        acc[monthKey] = (acc[monthKey] || 0) + (t.interestAmount || 0);
        return acc;
    }, {});

    // Pagos por mes
    const paymentsByMonth = creditPayments.reduce((acc, t) => {
        const date = new Date(t.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        acc[monthKey] = (acc[monthKey] || 0) + t.amount;
        return acc;
    }, {});

    // Categorías más usadas en crédito
    const categorySpending = creditPurchases.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
    }, {});

    return {
        totalSpent,
        totalInterestGenerated,
        totalPaid,
        avgInstallments: Math.round(avgInstallments * 10) / 10,
        weightedInterestRate: Math.round(weightedInterestRate * 100) / 100,
        purchasesByMonth: Object.entries(purchasesByMonth).sort(([a], [b]) => a.localeCompare(b)),
        interestByMonth: Object.entries(interestByMonth).sort(([a], [b]) => a.localeCompare(b)),
        paymentsByMonth: Object.entries(paymentsByMonth).sort(([a], [b]) => a.localeCompare(b)),
        categorySpending: Object.entries(categorySpending).sort(([, a], [, b]) => b - a),
        totalPurchases: creditPurchases.length,
        totalPayments: creditPayments.length
    };
};

/**
 * Determina si una compra específica está pagada usando método FIFO
 * (Las compras más antiguas se consideran pagadas primero)
 * @param {Object} purchase - La compra a verificar
 * @param {Array} allPurchases - Todas las compras de esa tarjeta
 * @param {Array} allPayments - Todos los pagos de esa tarjeta
 * @param {Object} account - La cuenta de crédito
 * @returns {boolean} - true si la compra está pagada
 */
export const isPurchasePaid = (purchase, allPurchases, allPayments, account) => {
    // Si tiene el campo paidOff, usarlo
    if (purchase.paidOff !== undefined) {
        return purchase.paidOff === true;
    }

    // Si la tarjeta está completamente al día, todas las compras están pagadas
    if (account && account.balance >= 0) {
        return true;
    }

    // Calcular total pagado
    const totalPaid = allPayments.reduce((sum, payment) => sum + payment.amount, 0);

    // Ordenar compras por fecha (más antiguas primero)
    const sortedPurchases = [...allPurchases].sort((a, b) =>
        new Date(a.date) - new Date(b.date)
    );

    // Calcular cuánto se ha "cubierto" con los pagos
    let remainingPayment = totalPaid;

    for (const p of sortedPurchases) {
        const purchaseTotal = p.amount + (p.interestAmount || 0);

        // Si esta es la compra que estamos verificando
        if (p.id === purchase.id) {
            // Si el pago restante cubre esta compra completa, está pagada
            return remainingPayment >= purchaseTotal;
        }

        // Restar el total de esta compra del pago restante
        remainingPayment -= purchaseTotal;

        // Si ya no queda pago, las siguientes compras no están pagadas
        if (remainingPayment <= 0) {
            return false;
        }
    }

    return false;
};


