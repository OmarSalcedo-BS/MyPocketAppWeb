import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ArrowRightLeft, Wallet, Plus, CreditCard } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../api/servicios';
import { formatearMoneda } from '../../utils/FormateoValores';
import Swal from 'sweetalert2';
import { getCategoryTotals, getMonthlyNetBalance, getCreditPayments, filterOutCreditPayments } from '../../services/analisisService';
import { calculateInterest, calculateAvailableCredit, validateCreditPurchase } from '../../services/creditService';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export const DashboardHome = () => {
  const [accounts, setAccounts] = useState([]);

  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [creditPayments, setCreditPayments] = useState(0);
  const [totalCreditDebt, setTotalCreditDebt] = useState(0);
  const [totalAvailableCredit, setTotalAvailableCredit] = useState(0);
  const [periodFilter, setPeriodFilter] = useState('month'); // 'day', 'month', 'year'
  const [showModal, setShowModal] = useState(false);
  const [customCategories, setCustomCategories] = useState([]);
  const [newTransaction, setNewTransaction] = useState({
    title: '',
    category: '',
    amount: 0,
    type: 'expense',
    date: new Date(),
    accountId: '',
    installments: 1,
    interestAmount: 0
  });

  useEffect(() => {
    loadAccounts();
    loadTransactions();
    loadCustomCategories();
  }, []);

  // Recargar transacciones cuando cambie el período
  useEffect(() => {
    if (accounts.length > 0) {
      loadTransactions();
    }
  }, [periodFilter]);

  const loadCustomCategories = async () => {
    try {
      const response = await fetch('http://localhost:3001/categories');
      if (response.ok) {
        const data = await response.json();
        setCustomCategories(data);
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await api.getAllAccounts();
      setAccounts(data);

      // Calcular balance total excluyendo cuentas de crédito
      const total = data
        .filter(account => account.type !== 'Crédito')
        .reduce((sum, account) => sum + account.balance, 0);
      setTotalBalance(total);

      // Calcular deuda total de crédito (valores absolutos de balances negativos)
      const creditAccounts = data.filter(account => account.type === 'Crédito');
      const creditDebt = creditAccounts.reduce((sum, account) => sum + Math.abs(account.balance), 0);
      setTotalCreditDebt(creditDebt);

      // Calcular cupo disponible total
      const availableCredit = creditAccounts.reduce((sum, account) => {
        const available = calculateAvailableCredit(account.creditLimit || 0, account.balance);
        return sum + available;
      }, 0);
      setTotalAvailableCredit(availableCredit);

    } catch (error) {
      console.error('Error al cargar cuentas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await api.getAllTransactions();

      const sortedTransactions = data.sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      });

      setTransactions(sortedTransactions);

      const now = new Date();
      const currentDay = now.getDate();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Función para verificar si una transacción está en el período seleccionado
      const isInPeriod = (transactionDate) => {
        const tDate = new Date(transactionDate);

        if (periodFilter === 'day') {
          return tDate.getDate() === currentDay &&
            tDate.getMonth() === currentMonth &&
            tDate.getFullYear() === currentYear;
        } else if (periodFilter === 'month') {
          return tDate.getMonth() === currentMonth &&
            tDate.getFullYear() === currentYear;
        } else if (periodFilter === 'year') {
          return tDate.getFullYear() === currentYear;
        }
        return false;
      };

      // Filtrar transacciones excluyendo pagos de crédito
      const filteredTransactions = filterOutCreditPayments(sortedTransactions, accounts);

      // Calcular pagos de crédito del período
      const creditPaymentsData = getCreditPayments(sortedTransactions, accounts);
      const periodCredit = creditPaymentsData
        .filter(t => isInPeriod(t.date))
        .reduce((sum, t) => sum + t.amount, 0);

      setCreditPayments(periodCredit);

      let income = 0;
      let expenses = 0;

      filteredTransactions.forEach(transaction => {
        if (isInPeriod(transaction.date)) {
          if (transaction.type === 'income') {
            income += parseFloat(transaction.amount);
          } else if (transaction.type === 'expense') {
            expenses += parseFloat(transaction.amount);
          }
        }
      });

      setMonthlyIncome(income);
      setMonthlyExpenses(expenses);

    } catch (error) {
      console.error('Error al cargar transacciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const crearTransaction = async (e) => {
    e.preventDefault();


    if (!newTransaction.accountId) {
      Swal.fire({
        icon: 'warning',
        title: 'Cuenta requerida',
        text: 'Por favor selecciona una cuenta para la transacción',
      });
      return;
    }

    if (!newTransaction.title || !newTransaction.category || !newTransaction.amount) {
      Swal.fire({
        icon: 'warning',
        title: 'Datos incompletos',
        text: 'Por favor completa todos los campos',
      });
      return;
    }

    if (newTransaction.amount <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Monto inválido',
        text: 'El monto debe ser mayor a cero',
      });
      return;
    }

    const account = accounts.find(acc => acc.id === newTransaction.accountId);

    if (!account) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se encontró la cuenta seleccionada',
      });
      return;
    }

    // Validaciones específicas para tarjetas de crédito
    if (newTransaction.type === 'expense' && account.type === 'Crédito') {
      // Verificar que la tarjeta tenga cupo configurado
      if (!account.creditLimit || account.creditLimit <= 0) {
        Swal.fire({
          icon: 'error',
          title: 'Configuración incompleta',
          text: 'Esta tarjeta de crédito no tiene un cupo máximo configurado.',
        });
        return;
      }

      const validation = validateCreditPurchase(parseFloat(newTransaction.amount), account);

      if (!validation.valid) {
        const available = calculateAvailableCredit(account.creditLimit, account.balance);
        Swal.fire({
          icon: 'warning',
          title: 'Cupo insuficiente',
          html: `
            <p>${validation.message}</p>
            <div style="margin-top: 15px; padding: 10px; background: #f3f4f6; border-radius: 8px;">
              <p style="margin: 5px 0;"><strong>Cupo total:</strong> ${formatearMoneda(account.creditLimit)}</p>
              <p style="margin: 5px 0;"><strong>Deuda actual:</strong> ${formatearMoneda(Math.abs(account.balance))}</p>
              <p style="margin: 5px 0;"><strong>Cupo disponible:</strong> ${formatearMoneda(available)}</p>
              <p style="margin: 5px 0;"><strong>Monto solicitado:</strong> ${formatearMoneda(parseFloat(newTransaction.amount))}</p>
            </div>
          `,
        });
        return;
      }

      // Calcular interés
      const interest = calculateInterest(
        parseFloat(newTransaction.amount),
        parseInt(newTransaction.installments),
        account.interestRate || 0
      );
      newTransaction.interestAmount = interest;
    }

    // Validación para cuentas normales
    if (newTransaction.type === 'expense' && account.type !== 'Crédito') {
      const newBalance = account.balance - parseFloat(newTransaction.amount);
      if (newBalance < 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Saldo insuficiente',
          text: `No tienes suficiente saldo en ${account.name}. Saldo actual: ${formatearMoneda(account.balance)}`,
        });
        return;
      }
    }

    try {
      const transactionData = {
        ...newTransaction,
        amount: parseFloat(newTransaction.amount),
        date: newTransaction.date.toISOString(),
        installments: parseInt(newTransaction.installments) || 1,
        interestAmount: newTransaction.interestAmount || 0
      };

      await api.createTransaction(transactionData);

      const newBalance = newTransaction.type === 'income'
        ? account.balance + parseFloat(newTransaction.amount)
        : account.balance - parseFloat(newTransaction.amount);

      await api.updateAccount(account.id, {
        ...account,
        balance: newBalance
      });

      Swal.fire({
        icon: 'success',
        title: 'Transacción creada',
        text: 'La transacción se ha creado y el balance se actualizó correctamente',
      });

      // Primero cargar cuentas, luego transacciones para asegurar cálculo correcto
      await loadAccounts();
      await loadTransactions();
      setShowModal(false);
      setNewTransaction({
        title: '',
        category: '',
        amount: 0,
        type: 'expense',
        date: new Date(),
        accountId: '',
        installments: 1,
        interestAmount: 0
      });

    } catch (error) {
      console.error('Error al crear transacción:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo crear la transacción',
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTransaction((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const expenseTotals = useMemo(() => getCategoryTotals(transactions, 'expense', accounts, periodFilter), [transactions, accounts, periodFilter]);
  const chartDataCategory = {
    labels: Object.keys(expenseTotals),
    datasets: [{
      data: Object.values(expenseTotals),
      backgroundColor: ['#EF4444', '#F97316', '#FACC15', '#10B981', '#6366F1', '#EC4899'],
      hoverBackgroundColor: ['#DC2626', '#EA580C', '#EAB308', '#059669', '#4F46E5', '#DB2777'],
    }],
  };

  // Calcular deuda por tarjeta de crédito
  const creditCardDebts = useMemo(() => {
    const creditCards = accounts.filter(acc => acc.type === 'Crédito');
    return creditCards.reduce((acc, card) => {
      const debt = Math.abs(card.balance);
      if (debt > 0) {
        acc[card.name] = debt;
      }
      return acc;
    }, {});
  }, [accounts]);

  const chartDataCreditDebt = {
    labels: Object.keys(creditCardDebts),
    datasets: [{
      data: Object.values(creditCardDebts),
      backgroundColor: ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'],
      hoverBackgroundColor: ['#7C3AED', '#DB2777', '#D97706', '#059669', '#2563EB', '#DC2626'],
    }],
  };

  const monthlyBalanceData = useMemo(() => getMonthlyNetBalance(transactions, accounts), [transactions, accounts]);
  const chartDataBalance = {
    labels: monthlyBalanceData.map(([key]) => key),
    datasets: [{
      label: 'Saldo Neto Mensual',
      data: monthlyBalanceData.map(([, value]) => value),
      backgroundColor: monthlyBalanceData.map(([, value]) => value >= 0 ? '#10B981' : '#EF4444'),
    }],
  };


  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Selector de Período */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Resumen Financiero
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Período:</span>
          <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <button
              onClick={() => setPeriodFilter('day')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${periodFilter === 'day'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'hover:bg-indigo-50'
                }`}
              style={periodFilter !== 'day' ? { color: 'var(--text-secondary)' } : {}}
            >
              Día
            </button>
            <button
              onClick={() => setPeriodFilter('month')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${periodFilter === 'month'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'hover:bg-indigo-50'
                }`}
              style={periodFilter !== 'month' ? { color: 'var(--text-secondary)' } : {}}
            >
              Mes
            </button>
            <button
              onClick={() => setPeriodFilter('year')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${periodFilter === 'year'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'hover:bg-indigo-50'
                }`}
              style={periodFilter !== 'year' ? { color: 'var(--text-secondary)' } : {}}
            >
              Año
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden border-indigo-100">
          <div className="absolute right-0 top-0 p-4 opacity-5 text-indigo-600">
            <DollarSign size={100} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Balance Total</p>
          <h3 className="text-3xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
            {loading ? (
              <span className="animate-pulse">Cargando...</span>
            ) : (
              formatearMoneda(totalBalance)
            )}
          </h3>
          <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>Excluye cuentas de crédito</p>
        </Card>

        {/* Solo mostrar tarjetas de crédito si existen cuentas de crédito */}
        {accounts.some(acc => acc.type === 'Crédito') && (
          <>
            <Card className="relative overflow-hidden border-purple-100">
              <div className="absolute right-0 top-0 p-4 opacity-5 text-purple-600">
                <CreditCard size={100} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Deuda de Crédito</p>
              <h3 className="text-3xl font-bold mt-1 text-rose-600">
                {loading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  formatearMoneda(totalCreditDebt)
                )}
              </h3>
              <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>Total adeudado</p>
            </Card>

            <Card className="relative overflow-hidden border-green-100">
              <div className="absolute right-0 top-0 p-4 opacity-5 text-green-600">
                <CreditCard size={100} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Cupo Disponible</p>
              <h3 className="text-3xl font-bold mt-1 text-green-600">
                {loading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  formatearMoneda(totalAvailableCredit)
                )}
              </h3>
              <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>Crédito disponible</p>
            </Card>
          </>
        )}

        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
              <TrendingUp size={20} />
            </div>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {periodFilter === 'day' ? 'Hoy' : periodFilter === 'month' ? 'Este mes' : 'Este año'}
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Ingresos</p>
          <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {loading ? (
              <span className="animate-pulse">...</span>
            ) : (
              formatearMoneda(monthlyIncome)
            )}
          </h3>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
              <TrendingDown size={20} />
            </div>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {periodFilter === 'day' ? 'Hoy' : periodFilter === 'month' ? 'Este mes' : 'Este año'}
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Gastos</p>
          <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {loading ? (
              <span className="animate-pulse">...</span>
            ) : (
              formatearMoneda(monthlyExpenses)
            )}
          </h3>
        </Card>

        {/* Solo mostrar Pagos de Crédito si existen cuentas de crédito */}
        {accounts.some(acc => acc.type === 'Crédito') && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                <CreditCard size={20} />
              </div>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {periodFilter === 'day' ? 'Hoy' : periodFilter === 'month' ? 'Este mes' : 'Este año'}
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Pagos de Crédito</p>
            <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {loading ? (
                <span className="animate-pulse">...</span>
              ) : (
                formatearMoneda(creditPayments)
              )}
            </h3>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="h-80 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-bold" style={{ color: 'var(--text-primary)' }}>📊 Análisis de Gastos por Categoría</h4>
              <a
                href="/dashboard/analytics"
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              >
                Ver análisis completo →
              </a>
            </div>


            <div className="flex-1 flex items-center justify-center">
              {Object.keys(expenseTotals).length > 0 ? (
                <div className="w-full h-full max-w-md">
                  <Doughnut
                    data={chartDataCategory}
                    options={{
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            padding: 15,
                            font: {
                              size: 12
                            }
                          }
                        },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              const label = context.label || '';
                              const value = context.parsed || 0;
                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                              const percentage = ((value / total) * 100).toFixed(1);
                              return `${label}: ${formatearMoneda(value)} (${percentage}%)`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="text-center" style={{ color: 'var(--text-secondary)' }}>
                  <p className="text-4xl mb-2">📊</p>
                  <p className="font-medium">No hay datos de gastos disponibles</p>
                  <p className="text-sm mt-1">Crea tu primera transacción para ver el análisis</p>
                </div>
              )}
            </div>
          </Card>

          {/* Gráfico de Deuda por Tarjeta */}
          <Card className="h-80 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-bold" style={{ color: 'var(--text-primary)' }}>💳 Deuda por Tarjeta de Crédito</h4>
              <a
                href="/dashboard/credits"
                className="text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors"
              >
                Ver créditos →
              </a>
            </div>

            <div className="flex-1 flex items-center justify-center">
              {Object.keys(creditCardDebts).length > 0 ? (
                <div className="w-full h-full max-w-md">
                  <Doughnut
                    data={chartDataCreditDebt}
                    options={{
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            padding: 15,
                            font: {
                              size: 12
                            }
                          }
                        },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              const label = context.label || '';
                              const value = context.parsed || 0;
                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                              const percentage = ((value / total) * 100).toFixed(1);
                              return `${label}: ${formatearMoneda(value)} (${percentage}%)`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="text-center" style={{ color: 'var(--text-secondary)' }}>
                  <p className="text-4xl mb-2">💳</p>
                  <p className="font-medium">No hay deuda de crédito</p>
                  <p className="text-sm mt-1">Todas tus tarjetas están al día</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="text-white !border-none" style={{ backgroundColor: '#1e293b' }}>
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-sm opacity-80">Disponible en Cuentas</p>
                <h3 className="text-3xl font-bold mt-1 text-green-500">
                  {loading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    formatearMoneda(totalBalance)
                  )}
                </h3>
              </div>
              <div className="p-2 bg-white/10 rounded-lg">
                <Wallet size={20} />
              </div>
            </div>
            <Button onClick={() => setShowModal(true)} className="w-full">
              <Plus size={16} />
              Nueva Transacción
            </Button>
          </Card>

          <div>
            <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Últimos Movimientos</h3>
            <div className="space-y-3">
              {transactions.slice(0, 5).map((transaction) => (
                <Card key={transaction.id} className="p-4 rounded-xl border flex items-center justify-between hover:shadow-sm transition-shadow" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${transaction.type === 'expense' ? 'bg-rose-50 text-rose-600' :
                      transaction.type === 'income' ? 'bg-emerald-50 text-emerald-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                      {transaction.type === 'expense' ? <TrendingDown size={16} /> :
                        transaction.type === 'income' ? <TrendingUp size={16} /> :
                          <ArrowRightLeft size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{transaction.title}</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{transaction.category}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${transaction.type === 'expense' ? 'text-rose-600' :
                    transaction.type === 'income' ? 'text-emerald-600' :
                      'text-slate-600'
                    }`}>
                    {transaction.type === 'expense' ? '-' : '+'}${Math.abs(transaction.amount).toLocaleString()}
                  </span>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Nueva Transacción</h2>
              <button
                onClick={() => setShowModal(false)}
                className="transition-colors text-2xl hover:opacity-70"
                style={{ color: 'var(--text-secondary)' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={crearTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Tipo de Transacción
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewTransaction({ ...newTransaction, type: 'expense', category: '' })}
                    className={`px-4 py-3 rounded-xl font-medium transition-all ${newTransaction.type === 'expense'
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                      : 'border hover:opacity-80'
                      }`}
                    style={newTransaction.type !== 'expense' ? { borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' } : {}}
                  >
                    💸 Gasto
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTransaction({ ...newTransaction, type: 'income', category: '' })}
                    className={`px-4 py-3 rounded-xl font-medium transition-all ${newTransaction.type === 'income'
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                      : 'border hover:opacity-80'
                      }`}
                    style={newTransaction.type !== 'income' ? { borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' } : {}}
                  >
                    💰 Ingreso
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Cuenta
                </label>
                <select
                  name="accountId"
                  value={newTransaction.accountId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  required
                >
                  <option value="">Selecciona una cuenta</option>
                  {accounts.map((account) => {
                    const displayValue = account.type === 'Crédito'
                      ? `Cupo disponible: ${formatearMoneda(calculateAvailableCredit(account.creditLimit || 0, account.balance))}`
                      : formatearMoneda(account.balance);
                    return (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.type}) - {displayValue}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Categoría
                </label>
                <select
                  name="category"
                  value={newTransaction.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  required
                >
                  <option value="">Selecciona una categoría</option>
                  {newTransaction.type === 'expense' ? (
                    <>
                      {/* Categorías predeterminadas de gastos */}
                      <option value="Casa">🏠 Casa</option>
                      <option value="Transporte">🚗 Transporte</option>
                      <option value="Alimentación">🍔 Alimentación</option>
                      <option value="Capricho">🎁 Capricho</option>
                      <option value="Otros">📦 Otros</option>

                      {/* Categorías personalizadas de gastos */}
                      {customCategories
                        .filter(cat => cat.type === 'expense')
                        .map(cat => (
                          <option key={cat.id} value={cat.name}>
                            {cat.icon} {cat.name}
                          </option>
                        ))
                      }
                    </>
                  ) : (
                    <>
                      {/* Categorías predeterminadas de ingresos */}
                      <option value="Salario">💼 Salario</option>
                      <option value="Pagos Varios">💳 Pagos Varios</option>
                      <option value="Préstamos">💰 Préstamos</option>

                      {/* Categorías personalizadas de ingresos */}
                      {customCategories
                        .filter(cat => cat.type === 'income')
                        .map(cat => (
                          <option key={cat.id} value={cat.name}>
                            {cat.icon} {cat.name}
                          </option>
                        ))
                      }
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Descripción
                </label>
                <input
                  type="text"
                  name="title"
                  value={newTransaction.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  placeholder="Ej: Compra del supermercado"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Monto
                </label>
                <input
                  type="number"
                  name="amount"
                  value={newTransaction.amount}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 rounded-xl border focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Campo de cuotas - solo para gastos con tarjeta de crédito */}
              {newTransaction.type === 'expense' && newTransaction.accountId && (() => {
                const selectedAccount = accounts.find(acc => acc.id === newTransaction.accountId);
                return selectedAccount && selectedAccount.type === 'Crédito';
              })() && (
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Número de Cuotas *
                    </label>
                    <input
                      type="number"
                      name="installments"
                      value={newTransaction.installments}
                      onChange={(e) => {
                        const installments = parseInt(e.target.value) || 1;
                        const account = accounts.find(acc => acc.id === newTransaction.accountId);
                        const interest = calculateInterest(
                          parseFloat(newTransaction.amount) || 0,
                          installments,
                          account?.interestRate || 0
                        );
                        setNewTransaction({
                          ...newTransaction,
                          installments,
                          interestAmount: interest
                        });
                      }}
                      min="1"
                      max={accounts.find(acc => acc.id === newTransaction.accountId)?.maxInstallments || 12}
                      className="w-full px-4 py-3 rounded-xl border focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                      style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                      placeholder="1"
                      required
                    />
                    {newTransaction.installments > 1 && newTransaction.amount > 0 && (
                      <div className="mt-2 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                          Resumen de Financiación:
                        </p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span style={{ color: 'var(--text-secondary)' }}>Monto:</span>
                            <span style={{ color: 'var(--text-primary)' }} className="font-semibold">
                              {formatearMoneda(parseFloat(newTransaction.amount) || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: 'var(--text-secondary)' }}>Interés ({accounts.find(acc => acc.id === newTransaction.accountId)?.interestRate || 0}% mensual):</span>
                            <span className="font-semibold text-orange-600">
                              {formatearMoneda(newTransaction.interestAmount || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between pt-1 border-t" style={{ borderColor: 'var(--border-color)' }}>
                            <span style={{ color: 'var(--text-primary)' }} className="font-bold">Total a pagar:</span>
                            <span style={{ color: 'var(--text-primary)' }} className="font-bold">
                              {formatearMoneda((parseFloat(newTransaction.amount) || 0) + (newTransaction.interestAmount || 0))}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: 'var(--text-secondary)' }}>Cuota mensual:</span>
                            <span className="font-semibold text-indigo-600">
                              {formatearMoneda(((parseFloat(newTransaction.amount) || 0) + (newTransaction.interestAmount || 0)) / newTransaction.installments)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Fecha
                </label>
                <input
                  type="date"
                  name="date"
                  value={newTransaction.date instanceof Date ? newTransaction.date.toISOString().split('T')[0] : ''}
                  onChange={(e) => setNewTransaction({ ...newTransaction, date: new Date(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border font-medium transition-all"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                >
                  Cancelar
                </button>
                <Button type="submit" className="flex-1">
                  Crear Transacción
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};