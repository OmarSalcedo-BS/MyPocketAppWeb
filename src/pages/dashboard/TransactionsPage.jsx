import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Search, Filter, Edit, Trash2, Plus } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../api/servicios';
import { formatearMoneda } from '../../utils/FormateoValores';
import Swal from 'sweetalert2';

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
    });


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
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                    />
                </div>

                {/* Filtro por Tipo de Transacción (Ingreso/Gasto) */}
                <select
                    value={selectedType}
                    onChange={handleTypeChange}
                    className="md:w-1/4 px-4 py-2 rounded-xl bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
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
                    className="md:w-1/4 px-4 py-2 rounded-xl bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
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
                    className="md:w-1/4 px-4 py-2 rounded-xl bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                >
                    <option value="all">Todas las Categorías</option>
                    {allCategories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                    ))}
                </select>
            </div>

            {/* === TABLA CONSOLIDADA (USA: filteredTransactions) === */}
            <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">

                    {/* Encabezado */}
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Descripción</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Categoría</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Tipo</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Monto</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Cuenta</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>

                    {/* Cuerpo de la Tabla */}
                    <tbody className="divide-y divide-slate-100">
                        {filteredTransactions.map((transaction) => ( // MAPEA LA LISTA FILTRADA
                            <tr key={transaction.id} className="hover:bg-indigo-50/50 transition-colors">

                                {/* Descripción */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{transaction.title}</td>

                                {/* Fecha */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(transaction.date).toLocaleDateString()}</td>

                                {/* Categoría */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{transaction.category}</td>

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
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                    {accounts.find(acc => acc.id === transaction.accountId)?.name}
                                </td>

                                {/* Acciones */}
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                    <button className="text-indigo-600 hover:text-indigo-900" onClick={() => updateTransaction(transaction.id)}>
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
                                <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                                    No se encontraron transacciones que coincidan con los criterios de búsqueda.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-900">Nueva Transacción</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors text-2xl"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={crearTransaction} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Tipo de Transacción
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setNewTransaction({ ...newTransaction, type: 'expense', category: '' })}
                                        className={`px-4 py-3 rounded-xl font-medium transition-all ${newTransaction.type === 'expense'
                                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        💸 Gasto
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewTransaction({ ...newTransaction, type: 'income', category: '' })}
                                        className={`px-4 py-3 rounded-xl font-medium transition-all ${newTransaction.type === 'income'
                                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        💰 Ingreso
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Cuenta
                                </label>
                                <select
                                    name="accountId"
                                    value={newTransaction.accountId}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
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
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Categoría
                                </label>
                                <select
                                    name="category"
                                    value={newTransaction.category}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
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
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Descripción
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={newTransaction.title}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                    placeholder="Ej: Compra del supermercado"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Monto
                                </label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={newTransaction.amount}
                                    onChange={handleInputChange}
                                    step="0.01"
                                    min="0"
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                    placeholder="0.00"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Fecha
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    value={newTransaction.date instanceof Date ? newTransaction.date.toISOString().split('T')[0] : ''}
                                    onChange={(e) => setNewTransaction({ ...newTransaction, date: new Date(e.target.value) })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-all cursor-pointer hover:text-slate-600"
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
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-900">Editar Transacción</h2>
                            <button
                                onClick={() => { setShowEditModal(false); setEditingTransaction(null); }}
                                className="text-slate-400 hover:text-slate-600 transition-colors text-2xl"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleUpdateTransaction} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Tipo de Transacción
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setEditingTransaction({ ...editingTransaction, type: 'expense', category: '' })}
                                        className={`px-4 py-3 rounded-xl font-medium transition-all ${editingTransaction.type === 'expense'
                                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        💸 Gasto
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditingTransaction({ ...editingTransaction, type: 'income', category: '' })}
                                        className={`px-4 py-3 rounded-xl font-medium transition-all ${editingTransaction.type === 'income'
                                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        💰 Ingreso
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Cuenta
                                </label>
                                <select
                                    name="accountId"
                                    value={editingTransaction.accountId}
                                    onChange={(e) => setEditingTransaction({ ...editingTransaction, accountId: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
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
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Categoría
                                </label>
                                <select
                                    name="category"
                                    value={editingTransaction.category}
                                    onChange={(e) => setEditingTransaction({ ...editingTransaction, category: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
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
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Descripción
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={editingTransaction.title}
                                    onChange={(e) => setEditingTransaction({ ...editingTransaction, title: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                    placeholder="Ej: Compra del supermercado"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Monto
                                </label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={editingTransaction.amount}
                                    onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: e.target.value })}
                                    step="0.01"
                                    min="0"
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                    placeholder="0.00"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Fecha
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    value={editingTransaction.date instanceof Date ? editingTransaction.date.toISOString().split('T')[0] : ''}
                                    onChange={(e) => setEditingTransaction({ ...editingTransaction, date: new Date(e.target.value) })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowEditModal(false); setEditingTransaction(null); }}
                                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-all cursor-pointer hover:text-slate-600"
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