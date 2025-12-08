import React, { useState, useEffect } from 'react';
import { Wallet, Plus, CreditCard, Landmark, DollarSign, X, Edit, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { formatearMoneda } from '../../utils/FormateoValores';
import { api } from '../../api/servicios';
import Swal from 'sweetalert2';


const iconMap = {
    'Landmark': Landmark,
    'CreditCard': CreditCard,
    'DollarSign': DollarSign,
    'Wallet': Wallet
};

export const AccountsPage = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [newAccount, setNewAccount] = useState({
        name: '',
        type: 'Banco',
        balance: 0,
        icon: 'Landmark',
        color: 'bg-blue-500',
        // Campos específicos para crédito
        interestRate: 0,
        maxInstallments: 12,
        creditLimit: 0
    });


    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        try {
            setLoading(true);
            const data = await api.getAllAccounts();
            setAccounts(data);
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar las cuentas',
                confirmButtonColor: '#4F46E5'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAccount = async (e) => {
        e.preventDefault();

        try {
            const accountData = {
                ...newAccount,
                // Para cuentas de crédito, el balance siempre empieza en 0
                balance: newAccount.type === 'Crédito' ? 0 : parseFloat(newAccount.balance)
            };

            await api.createAccount(accountData);

            const successMessage = newAccount.type === 'Crédito'
                ? {
                    icon: 'success',
                    title: '¡Tarjeta de crédito creada!',
                    html: `
                        <p>Tu tarjeta se ha creado exitosamente</p>
                        <div style="margin-top: 15px; padding: 10px; background: #f3f4f6; border-radius: 8px; text-align: left;">
                            <p style="margin: 5px 0;"><strong>💳 Cupo total:</strong> $${accountData.creditLimit.toLocaleString()}</p>
                            <p style="margin: 5px 0;"><strong>✅ Cupo disponible:</strong> $${accountData.creditLimit.toLocaleString()}</p>
                            <p style="margin: 5px 0;"><strong>📊 Deuda actual:</strong> $0</p>
                        </div>
                        <p style="margin-top: 10px; font-size: 0.9em; color: #6b7280;">
                            <em>Nota: El balance empieza en $0 (sin deuda). Al hacer compras, el balance se volverá negativo.</em>
                        </p>
                    `,
                    confirmButtonColor: '#4F46E5'
                }
                : {
                    icon: 'success',
                    title: '¡Cuenta creada!',
                    text: 'La cuenta se ha creado exitosamente',
                    confirmButtonColor: '#4F46E5',
                    timer: 2000
                };

            Swal.fire(successMessage);


            loadAccounts();
            setShowModal(false);


            setNewAccount({
                name: '',
                type: 'Banco',
                balance: 0,
                icon: 'Landmark',
                color: 'bg-blue-500',
                interestRate: 0,
                maxInstallments: 12,
                creditLimit: 0
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo crear la cuenta',
                confirmButtonColor: '#4F46E5'
            });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // Convertir a número los campos numéricos
        let processedValue = value;
        if (['balance', 'interestRate', 'maxInstallments', 'creditLimit'].includes(name)) {
            processedValue = value === '' ? 0 : parseFloat(value);
        }

        setNewAccount(prev => ({
            ...prev,
            [name]: processedValue
        }));
    };

    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

    const handleDeleteAccount = async (id) => {
        try {
            const result = await Swal.fire({
                title: '¿Estás seguro?',
                text: 'Esto eliminará la cuenta y todas sus transacciones asociadas',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            });

            if (result.isConfirmed) {
                await api.deleteAccount(id);
                await loadAccounts();
                Swal.fire('Eliminada!', 'La cuenta ha sido eliminada.', 'success');
            }
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar la cuenta' });
        }
    };

    const handleEditAccount = (account) => {
        setEditingAccount(account);
        setShowEditModal(true);
    };

    const handleUpdateAccount = async (e) => {
        e.preventDefault();

        try {
            const accountData = {
                ...editingAccount,
                balance: parseFloat(editingAccount.balance)
            };

            await api.updateAccount(editingAccount.id, accountData);

            Swal.fire({
                icon: 'success',
                title: '¡Cuenta actualizada!',
                text: 'La cuenta se ha actualizado exitosamente',
                confirmButtonColor: '#4F46E5',
                timer: 2000
            });

            await loadAccounts();
            setShowEditModal(false);
            setEditingAccount(null);

        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo actualizar la cuenta',
                confirmButtonColor: '#4F46E5'
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Mis Cuentas</h1>
                    <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Administra tus cuentas y balances</p>
                </div>
                <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
                    <Plus size={20} />
                    Nueva Cuenta
                </Button>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center gap-3 mb-2">
                    <Wallet size={24} />
                    <span className="text-sm font-medium opacity-90">Balance Total</span>
                </div>
                <p className="text-4xl font-bold">
                    {formatearMoneda(totalBalance)}
                </p>
                <p className="text-sm opacity-75 mt-2">
                    {accounts.length} cuenta{accounts.length !== 1 ? 's' : ''} activa{accounts.length !== 1 ? 's' : ''}
                </p>
            </div>

            {accounts.length === 0 ? (
                <div className="text-center py-12 rounded-xl border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                    <Wallet size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No tienes cuentas aún</h3>
                    <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>Crea tu primera cuenta para comenzar a administrar tus finanzas</p>
                    <Button onClick={() => setShowModal(true)}>
                        <Plus size={20} className="mr-2" />
                        Crear Primera Cuenta
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {accounts.map((account) => {
                        const Icon = iconMap[account.icon] || Wallet;
                        return (
                            <div
                                key={account.id}
                                className="rounded-xl p-6 border hover:shadow-lg transition-all"
                                style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`${account.color} p-3 rounded-lg text-white`}>
                                        <Icon size={24} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                            {account.type}
                                        </span>
                                        <button
                                            onClick={() => handleEditAccount(account)}
                                            className="text-indigo-600 hover:text-indigo-900 p-1"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteAccount(account.id)}
                                            className="text-red-600 hover:text-red-900 p-1"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{account.name}</h3>
                                <p className={`text-2xl font-bold ${account.balance >= 0 ? 'text-green-600' : 'text-rose-600'}`}>
                                    {formatearMoneda(Math.abs(account.balance))}
                                </p>
                                {account.balance < 0 && (
                                    <p className="text-xs text-rose-500 mt-1">Debe</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="rounded-2xl p-6 w-full max-w-md" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Nueva Cuenta</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateAccount} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    Nombre de la Cuenta
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={newAccount.name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-xl border focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                    placeholder="Ej: Cuenta de Ahorros"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    Tipo de Cuenta
                                </label>
                                <select
                                    name="type"
                                    value={newAccount.type}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-xl border focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                >
                                    <option value="Banco">Banco</option>
                                    <option value="Crédito">Tarjeta de Crédito</option>
                                    <option value="Efectivo">Efectivo</option>
                                    <option value="Ahorros">Ahorros</option>
                                </select>
                            </div>

                            {/* Balance Inicial - solo para cuentas que NO son de crédito */}
                            {newAccount.type !== 'Crédito' && (
                                <div>
                                    <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                                        Balance Inicial
                                    </label>
                                    <input
                                        type="number"
                                        name="balance"
                                        value={newAccount.balance}
                                        onChange={handleInputChange}
                                        step="0.01"
                                        className="w-full px-4 py-3 rounded-xl border focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                        style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    Icono
                                </label>
                                <select
                                    name="icon"
                                    value={newAccount.icon}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-xl border focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                >
                                    <option value="Landmark">Banco</option>
                                    <option value="CreditCard">Tarjeta</option>
                                    <option value="DollarSign">Efectivo</option>
                                    <option value="Wallet">Billetera</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    Color
                                </label>
                                <select
                                    name="color"
                                    value={newAccount.color}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-xl border focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                >
                                    <option value="bg-blue-500">Azul</option>
                                    <option value="bg-purple-500">Morado</option>
                                    <option value="bg-green-500">Verde</option>
                                    <option value="bg-rose-500">Rojo</option>
                                    <option value="bg-yellow-500">Amarillo</option>
                                    <option value="bg-indigo-500">Índigo</option>
                                </select>
                            </div>

                            {/* Campos específicos para Crédito */}
                            {newAccount.type === 'Crédito' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                                            Tasa de Interés Mensual (%)
                                        </label>
                                        <input
                                            type="number"
                                            name="interestRate"
                                            value={newAccount.interestRate}
                                            onChange={handleInputChange}
                                            step="0.01"
                                            min="0"
                                            className="w-full px-4 py-3 rounded-xl border focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                            style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                            placeholder="2.5"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                                            Máximo de Cuotas
                                        </label>
                                        <input
                                            type="number"
                                            name="maxInstallments"
                                            value={newAccount.maxInstallments}
                                            onChange={handleInputChange}
                                            min="1"
                                            className="w-full px-4 py-3 rounded-xl border focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                            style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                            placeholder="12"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                                            Cupo Máximo
                                        </label>
                                        <input
                                            type="number"
                                            name="creditLimit"
                                            value={newAccount.creditLimit}
                                            onChange={handleInputChange}
                                            step="0.01"
                                            min="0"
                                            className="w-full px-4 py-3 rounded-xl border focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                            style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                            placeholder="5000000"
                                        />
                                    </div>
                                </>
                            )}

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
                                    Crear Cuenta
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEditModal && editingAccount && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="rounded-2xl p-6 w-full max-w-md" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Editar Cuenta</h2>
                            <button
                                onClick={() => { setShowEditModal(false); setEditingAccount(null); }}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateAccount} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    Nombre de la Cuenta
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={editingAccount.name}
                                    onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    Tipo de Cuenta
                                </label>
                                <select
                                    name="type"
                                    value={editingAccount.type}
                                    onChange={(e) => setEditingAccount({ ...editingAccount, type: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                >
                                    <option value="Banco">Banco</option>
                                    <option value="Crédito">Tarjeta de Crédito</option>
                                    <option value="Efectivo">Efectivo</option>
                                    <option value="Ahorros">Ahorros</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    Balance
                                </label>
                                <input
                                    type="number"
                                    name="balance"
                                    value={editingAccount.balance}
                                    onChange={(e) => setEditingAccount({ ...editingAccount, balance: e.target.value })}
                                    step="0.01"
                                    className="w-full px-4 py-3 rounded-xl border focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    Icono
                                </label>
                                <select
                                    name="icon"
                                    value={editingAccount.icon}
                                    onChange={(e) => setEditingAccount({ ...editingAccount, icon: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                >
                                    <option value="Landmark">Banco</option>
                                    <option value="CreditCard">Tarjeta</option>
                                    <option value="DollarSign">Efectivo</option>
                                    <option value="Wallet">Billetera</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    Color
                                </label>
                                <select
                                    name="color"
                                    value={editingAccount.color}
                                    onChange={(e) => setEditingAccount({ ...editingAccount, color: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                >
                                    <option value="bg-blue-500">Azul</option>
                                    <option value="bg-purple-500">Morado</option>
                                    <option value="bg-green-500">Verde</option>
                                    <option value="bg-rose-500">Rojo</option>
                                    <option value="bg-yellow-500">Amarillo</option>
                                    <option value="bg-indigo-500">Índigo</option>
                                </select>
                            </div>

                            {/* Campos específicos para Crédito */}
                            {editingAccount.type === 'Crédito' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                                            Tasa de Interés Mensual (%)
                                        </label>
                                        <input
                                            type="number"
                                            name="interestRate"
                                            value={editingAccount.interestRate || 0}
                                            onChange={(e) => setEditingAccount({ ...editingAccount, interestRate: parseFloat(e.target.value) })}
                                            step="0.01"
                                            min="0"
                                            className="w-full px-4 py-3 rounded-xl border focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                            style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                            placeholder="2.5"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                                            Máximo de Cuotas
                                        </label>
                                        <input
                                            type="number"
                                            name="maxInstallments"
                                            value={editingAccount.maxInstallments || 12}
                                            onChange={(e) => setEditingAccount({ ...editingAccount, maxInstallments: parseInt(e.target.value) })}
                                            min="1"
                                            className="w-full px-4 py-3 rounded-xl border focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                            style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                            placeholder="12"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                                            Cupo Máximo
                                        </label>
                                        <input
                                            type="number"
                                            name="creditLimit"
                                            value={editingAccount.creditLimit || 0}
                                            onChange={(e) => setEditingAccount({ ...editingAccount, creditLimit: parseFloat(e.target.value) })}
                                            step="0.01"
                                            min="0"
                                            className="w-full px-4 py-3 rounded-xl border focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                            style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                            placeholder="5000000"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowEditModal(false); setEditingAccount(null); }}
                                    className="flex-1 px-4 py-3 rounded-xl border font-medium transition-all"
                                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                                >
                                    Cancelar
                                </button>
                                <Button type="submit" className="flex-1">
                                    Actualizar Cuenta
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
