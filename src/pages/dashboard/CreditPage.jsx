import { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Calendar, TrendingDown, Plus } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../api/servicios';
import { formatearMoneda } from '../../utils/FormateoValores';
import { calculateAvailableCredit, getCreditTransactions, isPurchasePaid } from '../../services/creditService';
import { getCreditPayments } from '../../services/analisisService';
import Swal from 'sweetalert2';

export const CreditPage = () => {
    const [accounts, setAccounts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [creditAccounts, setCreditAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedCard, setSelectedCard] = useState(null);
    const [paymentData, setPaymentData] = useState({
        amount: 0,
        installmentsToPay: 1,
        paymentDate: new Date(),
        sourceAccountId: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [accountsData, transactionsData] = await Promise.all([
                api.getAllAccounts(),
                api.getAllTransactions()
            ]);

            setAccounts(accountsData);
            setTransactions(transactionsData);

            const credits = accountsData.filter(acc => acc.type === 'Crédito');
            setCreditAccounts(credits);
        } catch (error) {
            console.error('Error al cargar datos:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los datos de crédito'
            });
        } finally {
            setLoading(false);
        }
    };

    // Obtener transacciones de crédito (necesario para calculateMonthlyPayment)
    const creditTransactions = getCreditTransactions(transactions, accounts);

    const openPaymentModal = (card) => {
        setSelectedCard(card);
        setShowPaymentModal(true);

        // Calcular cuota mensual estimada
        const monthlyPayment = calculateMonthlyPayment(card);

        setPaymentData({
            amount: Math.round(monthlyPayment),
            installmentsToPay: 1,
            paymentDate: new Date(),
            sourceAccountId: '',
            monthlyPayment: Math.round(monthlyPayment)
        });
    };

    // Calcular cuota mensual promedio de la tarjeta
    const calculateMonthlyPayment = (card) => {
        const cardPurchases = creditTransactions.filter(t => t.accountId === card.id && t.type === 'expense');

        if (cardPurchases.length === 0) return 0;

        const totalMonthlyPayment = cardPurchases.reduce((sum, purchase) => {
            return sum + (purchase.monthlyPayment || 0);
        }, 0);

        return Math.round(totalMonthlyPayment);
    };

    // Manejar cambio en número de cuotas
    const handleInstallmentsChange = (e) => {
        const installments = parseInt(e.target.value) || 1;
        const monthlyPayment = paymentData.monthlyPayment || 0;
        const totalAmount = Math.round(monthlyPayment * installments);

        setPaymentData({
            ...paymentData,
            installmentsToPay: installments,
            amount: totalAmount
        });
    };

    const handlePayment = async (e) => {
        e.preventDefault();

        if (!paymentData.sourceAccountId) {
            Swal.fire({
                icon: 'warning',
                title: 'Cuenta requerida',
                text: 'Selecciona la cuenta desde donde pagarás'
            });
            return;
        }

        if (paymentData.amount <= 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Monto inválido',
                text: 'El monto debe ser mayor a cero'
            });
            return;
        }

        const sourceAccount = accounts.find(acc => acc.id === paymentData.sourceAccountId);

        if (!sourceAccount) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se encontró la cuenta seleccionada'
            });
            return;
        }

        // Validar que la cuenta de origen tenga saldo suficiente
        if (sourceAccount.type !== 'Crédito' && sourceAccount.balance < parseFloat(paymentData.amount)) {
            Swal.fire({
                icon: 'warning',
                title: 'Saldo insuficiente',
                text: `No tienes suficiente saldo en ${sourceAccount.name}. Saldo disponible: ${formatearMoneda(sourceAccount.balance)}`
            });
            return;
        }

        try {
            // Crear transacción de pago (ingreso a la tarjeta de crédito)
            const paymentTransaction = {
                title: `Pago ${paymentData.installmentsToPay} cuota(s) - ${selectedCard.name}`,
                category: 'Pagos Varios',
                amount: parseFloat(paymentData.amount),
                type: 'income',
                date: paymentData.paymentDate.toISOString(),
                accountId: selectedCard.id,
                installments: 1,
                interestAmount: 0
            };

            await api.createTransaction(paymentTransaction);

            // Actualizar balance de la tarjeta de crédito (reducir deuda)
            const newCreditBalance = selectedCard.balance + parseFloat(paymentData.amount);
            await api.updateAccount(selectedCard.id, {
                ...selectedCard,
                balance: newCreditBalance
            });

            // Si se paga desde otra cuenta, actualizar su balance
            if (sourceAccount.id !== selectedCard.id) {
                const newSourceBalance = sourceAccount.balance - parseFloat(paymentData.amount);
                await api.updateAccount(sourceAccount.id, {
                    ...sourceAccount,
                    balance: newSourceBalance
                });
            }

            Swal.fire({
                icon: 'success',
                title: '¡Pago realizado!',
                html: `
          <p>Se ha registrado el pago exitosamente</p>
          <div style="margin-top: 15px; padding: 10px; background: #f3f4f6; border-radius: 8px;">
            <p style="margin: 5px 0;"><strong>Monto pagado:</strong> ${formatearMoneda(parseFloat(paymentData.amount))}</p>
            <p style="margin: 5px 0;"><strong>Nueva deuda:</strong> ${formatearMoneda(Math.abs(newCreditBalance))}</p>
            <p style="margin: 5px 0;"><strong>Cupo disponible:</strong> ${formatearMoneda(calculateAvailableCredit(selectedCard.creditLimit, newCreditBalance))}</p>
          </div>
        `
            });

            await loadData();
            setShowPaymentModal(false);
            setSelectedCard(null);

        } catch (error) {
            console.error('Error al procesar pago:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo procesar el pago'
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg" style={{ color: 'var(--text-secondary)' }}>Cargando...</div>
            </div>
        );
    }

    if (creditAccounts.length === 0) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Gestión de Créditos</h1>
                <Card>
                    <div className="text-center py-12">
                        <CreditCard className="mx-auto h-16 w-16 mb-4" style={{ color: 'var(--text-secondary)' }} />
                        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                            No tienes tarjetas de crédito
                        </h3>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Crea una cuenta de tipo "Crédito" para comenzar a gestionar tus tarjetas
                        </p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Gestión de Créditos
                </h1>
            </div>

            {/* Tarjetas de Crédito */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {creditAccounts.map((card) => {
                    const debt = Math.abs(card.balance);
                    const available = calculateAvailableCredit(card.creditLimit, card.balance);
                    const usagePercent = card.creditLimit ? (debt / card.creditLimit) * 100 : 0;

                    return (
                        <Card key={card.id}>
                            <div className="space-y-4">
                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-3 rounded-xl ${card.color}`}>
                                            <CreditCard className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                {card.name}
                                            </h3>
                                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                {card.interestRate}% mensual
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Badge de Estado */}
                                <div className="flex justify-end">
                                    {debt === 0 ? (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                            Pagado Completamente
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                            En Deuda
                                        </span>
                                    )}
                                </div>

                                {/* Deuda */}
                                <div>
                                    <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                                        Deuda actual
                                    </p>
                                    <p className="text-2xl font-bold text-red-600">
                                        {formatearMoneda(debt)}
                                    </p>
                                </div>

                                {/* Cupo */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span style={{ color: 'var(--text-secondary)' }}>Cupo disponible</span>
                                        <span className="font-semibold text-green-600">
                                            {formatearMoneda(available)}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                        <div
                                            className={`h-2 rounded-full transition-all ${usagePercent > 80 ? 'bg-red-600' :
                                                usagePercent > 50 ? 'bg-orange-500' :
                                                    'bg-green-500'
                                                }`}
                                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                                        <span>{formatearMoneda(debt)} usado</span>
                                        <span>{formatearMoneda(card.creditLimit)} total</span>
                                    </div>
                                </div>

                                {/* Botón de pago */}
                                <Button
                                    onClick={() => openPaymentModal(card)}
                                    className="w-full"
                                    variant="outline"
                                >
                                    <DollarSign className="mr-2 h-4 w-4" />
                                    Pagar Cuotas
                                </Button>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Historial de Compras a Crédito */}
            <Card>
                <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                    Compras a Crédito Recientes
                </h2>

                {creditTransactions.length === 0 ? (
                    <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                        No hay compras a crédito registradas
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>
                                        Descripción
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>
                                        Tarjeta
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>
                                        Monto
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>
                                        Cuotas
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>
                                        Interés
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>
                                        Total
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>
                                        Cuota Mensual
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>
                                        Estado
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {creditTransactions.slice(0, 10).map((transaction) => (
                                    <tr key={transaction.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                                            {transaction.title}
                                        </td>
                                        <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            {transaction.accountName}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-semibold" style={{ color: 'var(--text-primary)' }}>
                                            {formatearMoneda(transaction.amount)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
                                            {transaction.installments}x
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-orange-600">
                                            {formatearMoneda(transaction.interestAmount)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-semibold" style={{ color: 'var(--text-primary)' }}>
                                            {formatearMoneda(transaction.totalAmount)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-indigo-600 font-semibold">
                                            {formatearMoneda(transaction.monthlyPayment)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {(() => {
                                                const account = accounts.find(acc => acc.id === transaction.accountId);
                                                if (!account) return null;

                                                // Obtener todas las compras y pagos de esta tarjeta
                                                const cardPurchases = creditTransactions.filter(t => t.accountId === transaction.accountId);
                                                const cardPayments = getCreditPayments(transactions, accounts).filter(p => p.accountId === transaction.accountId);

                                                // Verificar si esta compra está pagada usando FIFO
                                                const paid = isPurchasePaid(transaction, cardPurchases, cardPayments, account);

                                                return paid ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                                        Pagado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                                                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                                                        Pendiente
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Modal de Pago */}
            {showPaymentModal && selectedCard && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="rounded-2xl p-6 w-full max-w-md" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                Pagar Cuotas - {selectedCard.name}
                            </h2>
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="transition-colors text-2xl hover:opacity-70"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Info de la tarjeta */}
                        <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span style={{ color: 'var(--text-secondary)' }}>Deuda actual:</span>
                                    <span className="font-semibold text-red-600">
                                        {formatearMoneda(Math.abs(selectedCard.balance))}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span style={{ color: 'var(--text-secondary)' }}>Cupo disponible:</span>
                                    <span className="font-semibold text-green-600">
                                        {formatearMoneda(calculateAvailableCredit(selectedCard.creditLimit, selectedCard.balance))}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handlePayment} className="space-y-4">
                            {/* Cuenta de origen */}
                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    Pagar desde
                                </label>
                                <select
                                    value={paymentData.sourceAccountId}
                                    onChange={(e) => setPaymentData({ ...paymentData, sourceAccountId: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                    required
                                >
                                    <option value="">Selecciona una cuenta</option>
                                    {accounts.filter(acc => acc.type !== 'Crédito').map((account) => (
                                        <option key={account.id} value={account.id}>
                                            {account.name} - {formatearMoneda(account.balance)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Monto a pagar */}
                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    Monto a pagar
                                </label>
                                <input
                                    type="number"
                                    value={paymentData.amount}
                                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                                    step="0.01"
                                    min="0"
                                    max={Math.abs(selectedCard.balance)}
                                    className="w-full px-4 py-3 rounded-xl border focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                    placeholder="0.00"
                                    required
                                />
                                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                    Máximo: {formatearMoneda(Math.abs(selectedCard.balance))}
                                </p>
                            </div>

                            {/* Número de cuotas a pagar */}
                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    Número de cuotas a pagar
                                </label>
                                <input
                                    type="number"
                                    value={paymentData.installmentsToPay}
                                    onChange={handleInstallmentsChange}
                                    min="1"
                                    className="w-full px-4 py-3 rounded-xl border focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                    placeholder="1"
                                />
                                {paymentData.monthlyPayment > 0 && (
                                    <div className="mt-2 p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                            <strong>Cuota mensual:</strong> {formatearMoneda(paymentData.monthlyPayment)}
                                        </p>
                                        <p className="text-xs font-semibold text-indigo-600">
                                            <strong>Total calculado:</strong> {formatearMoneda(paymentData.amount)}
                                        </p>
                                    </div>
                                )}
                                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                    El monto se calcula automáticamente. Puedes ajustarlo abajo.
                                </p>
                            </div>

                            {/* Fecha de pago */}
                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    Fecha de pago
                                </label>
                                <input
                                    type="date"
                                    value={paymentData.paymentDate instanceof Date ? paymentData.paymentDate.toISOString().split('T')[0] : ''}
                                    onChange={(e) => setPaymentData({ ...paymentData, paymentDate: new Date(e.target.value) })}
                                    className="w-full px-4 py-3 rounded-xl border focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                    required
                                />
                            </div>

                            {/* Botones */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentModal(false)}
                                    className="flex-1 px-4 py-3 rounded-xl border font-medium transition-all"
                                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-all"
                                >
                                    Pagar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
