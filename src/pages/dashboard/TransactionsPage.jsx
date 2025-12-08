import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Search, Filter, Edit, Trash2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../api/servicios';
import { formatearMoneda } from '../../utils/FormateoValores';
import Swal from 'sweetalert2';
import { calculateInterest, validateCreditPurchase, calculateAvailableCredit } from '../../services/creditService';

export const TransactionsPage = () => {


    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedAccount, setSelectedAccount] = useState('all');
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
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
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;


    useEffect(() => {
        loadAccounts();
        loadTransactions();
    }, []);


    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleFilterChange = (event) => {
        setSelectedCategory(event.target.value);
    };

    const handleAccountChange = (event) => {
        setSelectedAccount(event.target.value);
    };

    const handleTypeChange = (event) => {
        setSelectedType(event.target.value);
    };

    const allCategories = useMemo(() => {
        const categories = transactions.map(t => t.category);
        return [...new Set(categories)];
    }, [transactions]);


    const allTransactionTypes = useMemo(() => {
        const types = transactions.map(t => t.type);
        return [...new Set(types)];
    }, [transactions]);

    const allAccountIds = useMemo(() => {
        const accountIds = transactions.map(t => t.accountId);
        return [...new Set(accountIds)];
    }, [transactions]);


    const filteredTransactions = useMemo(() => {
        return transactions.filter((transaction) => {
            const matchesSearch = transaction.title?.toLowerCase().includes(searchTerm.toLowerCase()) ?? true;
            const matchesType = selectedType === 'all' || transaction.type === selectedType;
            const matchesCategory = selectedCategory === 'all' || transaction.category === selectedCategory;
            const matchesAccount = selectedAccount === 'all' || transaction.accountId === selectedAccount;
            return matchesSearch && matchesType && matchesCategory && matchesAccount;
        });
    }, [transactions, searchTerm, selectedType, selectedCategory, selectedAccount]);

    // Paginación
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

    // Reset a página 1 cuando cambian los filtros
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedType, selectedCategory, selectedAccount]);


    const deleteTransaction = async (id) => {
        try {
            const transaction = transactions.find(t => t.id === id);
            if (!transaction) return;

            const result = await Swal.fire({
                title: '¿Estás seguro?',
                text: 'No podrás revertir esto!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, eliminarlo',
                cancelButtonText: 'Cancelar'
            });

            if (result.isConfirmed) {
                const account = accounts.find(acc => acc.id === transaction.accountId);
                if (account) {
                    const revertedBalance = transaction.type === 'income'
                        ? account.balance - transaction.amount
                        : account.balance + transaction.amount;

                    await api.updateAccount(account.id, { ...account, balance: revertedBalance });
                }

                await api.deleteTransaction(id);

                await loadTransactions();
                await loadAccounts();

                Swal.fire('Eliminado!', 'La transacción ha sido eliminada.', 'success');
            }
        } catch (error) {
            console.error('Error al eliminar la transacción:', error);
            Swal.fire('Error', 'No se pudo eliminar la transacción', 'error');
        }
    };


    const updateTransaction = async (transaction) => {
        setEditingTransaction({
            ...transaction,
            date: new Date(transaction.date)
        });
        setShowEditModal(true);
    };

    const handleUpdateTransaction = async (e) => {
        e.preventDefault();

        if (!editingTransaction.accountId || !editingTransaction.title || !editingTransaction.category || editingTransaction.amount <= 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Datos inválidos',
                text: 'Por favor, completa todos los campos correctamente.',
            });
            return;
        }

        try {
            const originalTransaction = transactions.find(t => t.id === editingTransaction.id);
            const account = accounts.find(acc => acc.id === editingTransaction.accountId);

            if (!account || !originalTransaction) {
                Swal.fire({ icon: 'error', title: 'Error', text: 'No se encontró la cuenta o transacción' });
                return;
            }

            let newBalance = account.balance;

            if (originalTransaction.accountId === editingTransaction.accountId) {
                if (originalTransaction.type === 'income') {
                    newBalance -= originalTransaction.amount;
                } else {
                    newBalance += originalTransaction.amount;
                }

                if (editingTransaction.type === 'income') {
                    newBalance += parseFloat(editingTransaction.amount);
                } else {
                    newBalance -= parseFloat(editingTransaction.amount);
                }
            } else {
                const oldAccount = accounts.find(acc => acc.id === originalTransaction.accountId);
                if (oldAccount) {
                    const oldAccountBalance = originalTransaction.type === 'income'
                        ? oldAccount.balance - originalTransaction.amount
                        : oldAccount.balance + originalTransaction.amount;
                    await api.updateAccount(oldAccount.id, { ...oldAccount, balance: oldAccountBalance });
                }

                newBalance = editingTransaction.type === 'income'
                    ? account.balance + parseFloat(editingTransaction.amount)
                    : account.balance - parseFloat(editingTransaction.amount);
            }

            if (editingTransaction.type === 'expense' && account.type !== 'Crédito' && newBalance < 0) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Saldo insuficiente',
                    text: `No hay suficiente saldo en ${account.name}. Saldo disponible: ${formatearMoneda(account.balance)}`,
                });
                return;
            }

            const transactionData = {
                ...editingTransaction,
                amount: parseFloat(editingTransaction.amount),
                date: editingTransaction.date.toISOString(),
            };

            await api.updateTransaction(editingTransaction.id, transactionData);
            await api.updateAccount(account.id, { ...account, balance: newBalance });

            Swal.fire({ icon: 'success', title: 'Actualizado', text: 'La transacción se actualizó correctamente' });

            await loadTransactions();
            await loadAccounts();
            setShowEditModal(false);
            setEditingTransaction(null);

        } catch (error) {
            console.error('Error al actualizar transacción:', error);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo actualizar la transacción' });
        }
    };


    const loadAccounts = async () => {
        try {
            setLoading(true);
            const data = await api.getAllAccounts();
            setAccounts(data);
            const total = data.reduce((sum, account) => sum + account.balance, 0);

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
            const sortedTransactions = data.sort((a, b) => new Date(b.date) - new Date(a.date));
            setTransactions(sortedTransactions);

        } catch (error) {
            console.error('Error al cargar transacciones:', error);
        } finally {
            setLoading(false);
        }
    };

    const crearTransaction = async (e) => {
        e.preventDefault();

        if (!newTransaction.accountId || !newTransaction.title || !newTransaction.category || newTransaction.amount <= 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Datos inválidos',
                text: 'Por favor, asegúrate de seleccionar una cuenta, completar todos los campos y que el monto sea mayor a cero.',
            });
            return;
        }

        const account = accounts.find(acc => acc.id === newTransaction.accountId);

        if (!account) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se encontró la cuenta seleccionada' });
            return;
        }

        // Validaciones específicas para tarjetas de crédito
        if (newTransaction.type === 'expense' && account.type === 'Crédito') {
            // Verificar que la tarjeta tenga cupo configurado
            if (!account.creditLimit || account.creditLimit <= 0) {
                Swal.fire({
                    icon: 'error',
                    title: 'Configuración incompleta',
                    text: 'Esta tarjeta de crédito no tiene un cupo máximo configurado. Por favor, edita la cuenta y establece el cupo máximo.',
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

            await api.updateAccount(account.id, { ...account, balance: newBalance });

            Swal.fire({ icon: 'success', title: 'Transacción creada', text: 'La transacción se ha creado y el balance se actualizó correctamente' });

            loadTransactions();
            loadAccounts();
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
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo crear la transacción' });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewTransaction((prev) => ({
            ...prev,
            [name]: value,
        }));
    };


    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Título y Botón */}
            <div className='flex justify-between items-center'>
                <h1 className="text-2xl font-bold">Historial Completo de Transacciones</h1>
                <Button onClick={() => setShowModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva transacción
                </Button>
            </div>

            {/* === FILTROS Y BÚSQUEDA === */}
            <div className="flex flex-col md:flex-row gap-4">
                {/* Campo de Búsqueda - Reducido */}
                <div className="relative md:w-1/4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    />
                </div>

                {/* Filtro por Tipo de Transacción (Ingreso/Gasto) */}
                <select
                    value={selectedType}
                    onChange={handleTypeChange}
                    className="md:w-1/4 px-4 py-2 rounded-xl border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                    <option value="all">Todos los Tipos</option>
                    {allTransactionTypes.map((type) => (
                        <option key={type} value={type}>
                            {type === 'income' ? '💰 Ingreso' : '💸 Gasto'}
                        </option>
                    ))}
                </select>

                {/* Filtro por Cuenta */}
                <select
                    value={selectedAccount}
                    onChange={handleAccountChange}
                    className="md:w-1/4 px-4 py-2 rounded-xl border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                    <option value="all">Todas las Cuentas</option>
                    {allAccountIds.map((accountId) => {
                        const account = accounts.find(acc => acc.id === accountId);
                        return account ? (
                            <option key={accountId} value={accountId}>
                                {account.name}
                            </option>
                        ) : null;
                    })}
                </select>

                {/* Filtro por Categoría */}
                <select
                    value={selectedCategory}
                    onChange={handleFilterChange}
                    className="md:w-1/4 px-4 py-2 rounded-xl border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                    <option value="all">Todas las Categorías</option>
                    {allCategories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                    ))}
                </select>
            </div>

            {/* === TABLA CONSOLIDADA (USA: filteredTransactions) === */}
            <div className="rounded-xl shadow-lg overflow-x-auto" style={{ backgroundColor: 'var(--card-bg)' }}>
                <table className="min-w-full" style={{ borderColor: 'var(--border-color)' }}>

                    {/* Encabezado */}
                    <thead style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Descripción</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Categoría</th>
                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Tipo</th>
                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Monto</th>
                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Cuenta</th>
                            <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Acciones</th>
                        </tr>
                    </thead>

                    {/* Cuerpo de la Tabla */}
                    <tbody>
                        {currentTransactions.map((transaction) => ( // MAPEA LA LISTA PAGINADA
                            <tr key={transaction.id} className="hover:opacity-80 transition-colors" style={{ borderBottom: '1px solid var(--border-color)' }}>

                                {/* Descripción */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{transaction.title}</td>

                                {/* Fecha */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-secondary)' }}>{new Date(transaction.date).toLocaleDateString()}</td>

                                {/* Categoría */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-secondary)' }}>{transaction.category}</td>

                                {/* Tipo (Badge) */}
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    {transaction.type === 'income' ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            <TrendingUp className="h-3 w-3 mr-1" /> Ingreso
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            <TrendingDown className="h-3 w-3 mr-1" /> Gasto
                                        </span>
                                    )}
                                </td>

                                {/* Monto */}
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold" style={{ color: transaction.type === 'income' ? '#10B981' : '#EF4444' }}>
                                    {formatearMoneda(transaction.amount)}
                                </td>

                                {/* Cuenta */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    {accounts.find(acc => acc.id === transaction.accountId)?.name}
                                </td>

                                {/* Acciones */}
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                    <button className="text-indigo-600 hover:text-indigo-900" onClick={() => updateTransaction(transaction)}>
                                        <Edit className="h-4 w-4" />
                                    </button>
                                    <button className="text-red-600 hover:text-red-900" onClick={() => deleteTransaction(transaction.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </td>

                            </tr>
                        ))}

                        {filteredTransactions.length === 0 && (
                            <tr>
                                <td colSpan="7" className="px-6 py-8 text-center" style={{ color: 'var(--text-secondary)' }}>
                                    No se encontraron transacciones que coincidan con los criterios de búsqueda.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Controles de Paginación */}
            {filteredTransactions.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 rounded-xl" style={{ backgroundColor: 'var(--card-bg)', borderTop: '1px solid var(--border-color)' }}>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Mostrando <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{startIndex + 1}</span> a <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{Math.min(endIndex, filteredTransactions.length)}</span> de <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{filteredTransactions.length}</span> transacciones
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-2 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-50"
                            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-2 rounded-lg border transition-all ${currentPage === page
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'hover:bg-indigo-50'
                                        }`}
                                    style={currentPage !== page ? { borderColor: 'var(--border-color)', color: 'var(--text-primary)' } : {}}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-50"
                            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            )}

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
                                    {accounts.map((account) => (
                                        <option key={account.id} value={account.id}>
                                            {account.name} ({account.type}) - {formatearMoneda(account.balance)}
                                        </option>
                                    ))}
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
                                            <option value="Casa">🏠 Casa</option>
                                            <option value="Transporte">🚗 Transporte</option>
                                            <option value="Alimentación">🍔 Alimentación</option>
                                            <option value="Capricho">🎁 Capricho</option>
                                            <option value="Otros">📦 Otros</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="Salario">💼 Salario</option>
                                            <option value="Pagos Varios">💳 Pagos Varios</option>
                                            <option value="Préstamos">🏦 Préstamos</option>
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

                            {/* Campo de cuotas - SIEMPRE visible para gastos con tarjeta de crédito */}
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
                                    className="flex-1 px-4 py-3 rounded-xl border font-medium transition-all cursor-pointer"
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

            {showEditModal && editingTransaction && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Editar Transacción</h2>
                            <button
                                onClick={() => { setShowEditModal(false); setEditingTransaction(null); }}
                                className="transition-colors text-2xl hover:opacity-70"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleUpdateTransaction} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    Tipo de Transacción
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setEditingTransaction({ ...editingTransaction, type: 'expense', category: '' })}
                                        className={`px-4 py-3 rounded-xl font-medium transition-all ${editingTransaction.type === 'expense'
                                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                                            : 'border hover:opacity-80'
                                            }`}
                                        style={editingTransaction.type !== 'expense' ? { borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' } : {}}
                                    >
                                        💸 Gasto
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditingTransaction({ ...editingTransaction, type: 'income', category: '' })}
                                        className={`px-4 py-3 rounded-xl font-medium transition-all ${editingTransaction.type === 'income'
                                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                            : 'border hover:opacity-80'
                                            }`}
                                        style={editingTransaction.type !== 'income' ? { borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' } : {}}
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
                                    value={editingTransaction.accountId}
                                    onChange={(e) => setEditingTransaction({ ...editingTransaction, accountId: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                    required
                                >
                                    <option value="">Selecciona una cuenta</option>
                                    {accounts.map((account) => (
                                        <option key={account.id} value={account.id}>
                                            {account.name} ({account.type}) - {formatearMoneda(account.balance)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    Categoría
                                </label>
                                <select
                                    name="category"
                                    value={editingTransaction.category}
                                    onChange={(e) => setEditingTransaction({ ...editingTransaction, category: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                    required
                                >
                                    <option value="">Selecciona una categoría</option>
                                    {editingTransaction.type === 'expense' ? (
                                        <>
                                            <option value="Casa">🏠 Casa</option>
                                            <option value="Transporte">🚗 Transporte</option>
                                            <option value="Alimentación">🍔 Alimentación</option>
                                            <option value="Capricho">🎁 Capricho</option>
                                            <option value="Otros">📦 Otros</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="Salario">💼 Salario</option>
                                            <option value="Pagos Varios">💳 Pagos Varios</option>
                                            <option value="Préstamos">🏦 Préstamos</option>
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
                                    value={editingTransaction.title}
                                    onChange={(e) => setEditingTransaction({ ...editingTransaction, title: e.target.value })}
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
                                    value={editingTransaction.amount}
                                    onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: e.target.value })}
                                    step="0.01"
                                    min="0"
                                    className="w-full px-4 py-3 rounded-xl border focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                    placeholder="0.00"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    Fecha
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    value={editingTransaction.date instanceof Date ? editingTransaction.date.toISOString().split('T')[0] : ''}
                                    onChange={(e) => setEditingTransaction({ ...editingTransaction, date: new Date(e.target.value) })}
                                    className="w-full px-4 py-3 rounded-xl border focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowEditModal(false); setEditingTransaction(null); }}
                                    className="flex-1 px-4 py-3 rounded-xl border font-medium transition-all cursor-pointer"
                                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                                >
                                    Cancelar
                                </button>
                                <Button type="submit" className="flex-1">
                                    Actualizar Transacción
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};