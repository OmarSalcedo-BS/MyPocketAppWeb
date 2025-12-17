import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Bell, Shield, Save, Trash2, Calendar, Tag, Plus, X, Edit2, Palette } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { api } from '../../api/servicios';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

export const ConfigPage = () => {
    const [activeTab, setActiveTab] = useState('account'); // 'account', 'personalization', 'security'
    const [notifications, setNotifications] = useState(true);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState({ name: '', type: 'expense', icon: '💰', color: '#4F46E5' });
    const [editingCategory, setEditingCategory] = useState(null);
    const navigate = useNavigate();

    // Categorías predeterminadas del sistema
    const defaultCategories = {
        expense: ['Casa', 'Transporte', 'Alimentación', 'Capricho', 'Otros'],
        income: ['Salario', 'Pagos Varios', 'Préstamos']
    };

    useEffect(() => {
        loadUser();
        loadCategories();
    }, []);

    const loadUser = () => {
        try {
            setLoading(true);
            const userString = localStorage.getItem('user');

            if (!userString) {
                setUser({
                    name: localStorage.getItem('name') || 'Usuario',
                    email: '',
                    createdAt: new Date().toISOString()
                });
                return;
            }

            const userData = JSON.parse(userString);
            setUser(userData);
        } catch (error) {
            console.error('Error al cargar el usuario:', error);
            setUser({
                name: localStorage.getItem('name') || 'Usuario',
                email: '',
                createdAt: new Date().toISOString()
            });
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const response = await fetch('http://localhost:3001/categories');
            if (response.ok) {
                const data = await response.json();
                setCategories(data);
            }
        } catch (error) {
            console.error('Error al cargar categorías:', error);
            setCategories([]);
        }
    };

    const handleCreateCategory = async () => {
        if (!newCategory.name.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Campo requerido',
                text: 'Debes ingresar un nombre para la categoría',
                confirmButtonColor: '#4F46E5'
            });
            return;
        }

        try {
            const response = await fetch('http://localhost:3001/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newCategory,
                    id: Math.random().toString(36).substr(2, 9),
                    createdAt: new Date().toISOString()
                })
            });

            if (response.ok) {
                await loadCategories();
                setNewCategory({ name: '', type: 'expense', icon: '💰', color: '#4F46E5' });
                Swal.fire({
                    icon: 'success',
                    title: '¡Categoría creada!',
                    text: 'La categoría se ha agregado correctamente',
                    confirmButtonColor: '#4F46E5',
                    timer: 2000
                });
            }
        } catch (error) {
            console.error('Error al crear categoría:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo crear la categoría',
                confirmButtonColor: '#EF4444'
            });
        }
    };

    const handleDeleteCategory = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar categoría?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await fetch(`http://localhost:3001/categories/${id}`, {
                    method: 'DELETE'
                });
                await loadCategories();
                Swal.fire({
                    icon: 'success',
                    title: 'Eliminada',
                    text: 'La categoría ha sido eliminada',
                    confirmButtonColor: '#4F46E5',
                    timer: 2000
                });
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo eliminar la categoría',
                    confirmButtonColor: '#EF4444'
                });
            }
        }
    };

    const handleUpdateUser = async (e) => {
        if (e) e.preventDefault();

        if (!user.name || !user.email) {
            Swal.fire({
                title: 'Error',
                text: 'Debes completar todos los campos',
                icon: 'error',
                confirmButtonColor: '#EF4444'
            });
            return;
        }

        try {
            const result = await Swal.fire({
                title: '¿Actualizar información?',
                text: 'Se guardarán los cambios en tu cuenta.',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#4F46E5',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'Sí, actualizar',
                cancelButtonText: 'Cancelar'
            });

            if (!result.isConfirmed) return;

            const updatedUser = await api.updateUser(user.id, user);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            localStorage.setItem('name', updatedUser.name);

            await Swal.fire({
                title: '¡Actualizado!',
                text: 'Tu información ha sido actualizada correctamente',
                icon: 'success',
                confirmButtonColor: '#4F46E5',
                timer: 1500
            });

            window.location.reload();
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'No se pudo actualizar la cuenta',
                icon: 'error',
                confirmButtonColor: '#EF4444'
            });
        }
    };

    const handleChangePassword = async () => {
        try {
            const { value: currentPassword } = await Swal.fire({
                title: 'Verificación de seguridad',
                text: 'Ingresa tu contraseña actual',
                input: 'password',
                inputPlaceholder: 'Contraseña actual',
                showCancelButton: true,
                confirmButtonColor: '#4F46E5',
                inputValidator: (value) => !value && 'Debes ingresar tu contraseña actual'
            });

            if (!currentPassword || currentPassword !== user.password) {
                if (currentPassword) {
                    Swal.fire({
                        title: 'Error',
                        text: 'La contraseña actual es incorrecta',
                        icon: 'error',
                        confirmButtonColor: '#EF4444'
                    });
                }
                return;
            }

            const { value: newPassword } = await Swal.fire({
                title: 'Nueva contraseña',
                input: 'password',
                inputPlaceholder: 'Nueva contraseña (mínimo 6 caracteres)',
                showCancelButton: true,
                confirmButtonColor: '#4F46E5',
                inputValidator: (value) => {
                    if (!value) return 'Debes escribir una contraseña';
                    if (value.length < 6) return 'Mínimo 6 caracteres';
                    if (value === currentPassword) return 'Debe ser diferente a la actual';
                }
            });

            if (!newPassword) return;

            const { value: confirmPassword } = await Swal.fire({
                title: 'Confirmar contraseña',
                input: 'password',
                inputPlaceholder: 'Confirmar nueva contraseña',
                showCancelButton: true,
                confirmButtonColor: '#4F46E5',
                inputValidator: (value) => value !== newPassword && 'Las contraseñas no coinciden'
            });

            if (!confirmPassword) return;

            const updatedUserData = { ...user, password: newPassword };
            const resultUser = await api.updateUser(user.id, updatedUserData);

            setUser(resultUser);
            localStorage.setItem('user', JSON.stringify(resultUser));

            await Swal.fire({
                title: '¡Contraseña actualizada!',
                icon: 'success',
                confirmButtonColor: '#4F46E5'
            });
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'No se pudo cambiar la contraseña',
                icon: 'error',
                confirmButtonColor: '#EF4444'
            });
        }
    };

    const handleDeleteAccount = async () => {
        try {
            const result = await Swal.fire({
                title: '⚠️ ¿Eliminar cuenta?',
                text: 'Esta acción no se puede deshacer.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#EF4444',
                input: 'text',
                inputPlaceholder: 'Escribe "ELIMINAR" para confirmar',
                inputValidator: (value) => value !== 'ELIMINAR' && 'Debes escribir "ELIMINAR"'
            });

            if (result.isConfirmed) {
                if (api.deleteUser) {
                    await api.deleteUser(user.id);
                }
                localStorage.clear();
                await Swal.fire({
                    title: 'Cuenta eliminada',
                    icon: 'success',
                    confirmButtonColor: '#4F46E5'
                });
                navigate('/login');
            }
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'No se pudo eliminar la cuenta',
                icon: 'error',
                confirmButtonColor: '#EF4444'
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

    const inputStyle = {
        backgroundColor: 'var(--bg-tertiary)',
        color: 'var(--text-primary)',
        borderColor: 'var(--border-color)'
    };

    const labelStyle = { color: 'var(--text-secondary)' };

    const tabs = [
        { id: 'account', label: 'Mi Cuenta', icon: User },
        { id: 'personalization', label: 'Personalización', icon: Palette },
        { id: 'security', label: 'Seguridad', icon: Shield }
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>⚙️ Configuración</h1>

            {/* Tabs */}
            <div className="flex gap-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 font-medium transition-all ${activeTab === tab.id
                                ? 'border-b-2 border-indigo-600 text-indigo-600'
                                : 'hover:bg-gray-50'
                                }`}
                            style={activeTab !== tab.id ? { color: 'var(--text-secondary)' } : {}}
                        >
                            <Icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Account Tab */}
            {activeTab === 'account' && (
                <div className="space-y-6">
                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Información de la Cuenta
                            </h2>
                            <button
                                onClick={handleUpdateUser}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                <Save className="h-4 w-4" />
                                Guardar
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2" style={labelStyle}>
                                    Nombre de Usuario
                                </label>
                                <input
                                    type="text"
                                    value={user?.name || ''}
                                    onChange={(e) => setUser({ ...user, name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none"
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2" style={labelStyle}>
                                    Correo Electrónico
                                </label>
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    onChange={(e) => setUser({ ...user, email: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none"
                                    style={inputStyle}
                                />
                            </div>

                            {user?.createdAt && (
                                <div>
                                    <label className="block text-sm font-medium mb-2 flex items-center gap-2" style={labelStyle}>
                                        <Calendar className="h-4 w-4" />
                                        Miembro desde
                                    </label>
                                    <input
                                        type="text"
                                        value={new Date(user.createdAt).toLocaleDateString('es-ES', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                        disabled
                                        className="w-full px-4 py-2 rounded-lg border opacity-60 cursor-not-allowed"
                                        style={inputStyle}
                                    />
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            )}

            {/* Personalization Tab */}
            {activeTab === 'personalization' && (
                <div className="space-y-6">
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Tag className="h-5 w-5" />
                            Categorías Personalizadas
                        </h2>

                        {/* Create Category */}
                        <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                            <h3 className="font-medium mb-3">Nueva Categoría</h3>
                            <div className="grid grid-cols-1 gap-3">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <input
                                        type="text"
                                        placeholder="Nombre de la categoría"
                                        value={newCategory.name}
                                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                        className="px-3 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none"
                                        style={inputStyle}
                                    />
                                    <select
                                        value={newCategory.type}
                                        onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value })}
                                        className="px-3 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none"
                                        style={inputStyle}
                                    >
                                        <option value="expense">💸 Gasto</option>
                                        <option value="income">💰 Ingreso</option>
                                    </select>
                                    <button
                                        onClick={handleCreateCategory}
                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Crear
                                    </button>
                                </div>

                                {/* Emoji Selector */}
                                <div>
                                    <label className="block text-sm font-medium mb-2" style={labelStyle}>
                                        Selecciona un emoji:
                                    </label>
                                    <div className="grid grid-cols-8 md:grid-cols-12 gap-2 p-3 rounded-lg border max-h-48 overflow-y-auto" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                                        {[
                                            // Dinero y finanzas
                                            '💰', '💵', '💴', '💶', '💷', '💳', '💸', '🏦',
                                            // Comida
                                            '🍔', '🍕', '🍜', '🍱', '🍝', '🍞', '🥗', '☕',
                                            // Transporte
                                            '🚗', '🚕', '🚙', '🚌', '🚎', '🏍️', '🚲', '✈️',
                                            // Casa y hogar
                                            '🏠', '🏡', '🏢', '🏪', '🏬', '🛋️', '🛏️', '🚿',
                                            // Entretenimiento
                                            '🎮', '🎬', '🎵', '🎸', '🎨', '📺', '🎭', '🎪',
                                            // Salud y deporte
                                            '💊', '🏥', '⚕️', '💪', '🏋️', '⚽', '🏀', '🎾',
                                            // Educación
                                            '📚', '📖', '✏️', '📝', '🎓', '🏫', '📊', '💼',
                                            // Compras
                                            '🛒', '🛍️', '👕', '👗', '👠', '💄', '🎁', '📦',
                                            // Tecnología
                                            '💻', '📱', '⌨️', '🖥️', '🖨️', '📷', '🎧', '🔌',
                                            // Otros
                                            '❤️', '⭐', '🔥', '💡', '🎯', '📌', '🔔', '✅'
                                        ].map((emoji, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => setNewCategory({ ...newCategory, icon: emoji })}
                                                className={`text-2xl p-2 rounded-lg transition-all hover:scale-110 ${newCategory.icon === emoji
                                                        ? 'bg-indigo-100 ring-2 ring-indigo-500'
                                                        : 'hover:bg-gray-100'
                                                    }`}
                                                title={emoji}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="text-sm" style={labelStyle}>Emoji seleccionado:</span>
                                        <span className="text-3xl">{newCategory.icon}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Categories List */}
                        <div className="space-y-3">
                            <h3 className="font-medium">Mis Categorías</h3>
                            {categories.length === 0 ? (
                                <p className="text-sm text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                                    No tienes categorías personalizadas aún
                                </p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {categories.map(cat => (
                                        <div
                                            key={cat.id}
                                            className="flex items-center justify-between p-3 rounded-lg border"
                                            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{cat.icon}</span>
                                                <div>
                                                    <p className="font-medium">{cat.name}</p>
                                                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                        {cat.type === 'expense' ? 'Gasto' : 'Ingreso'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteCategory(cat.id)}
                                                className="text-red-500 hover:text-red-700 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Preferencias
                        </h2>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Notificaciones</p>
                                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                                    Recibir alertas de saldo bajo y gastos altos
                                </p>
                            </div>
                            <button
                                onClick={() => setNotifications(!notifications)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications ? 'bg-indigo-600' : 'bg-gray-300'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
                <div className="space-y-6">
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Seguridad
                        </h2>
                        <button
                            onClick={handleChangePassword}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            <Lock className="h-4 w-4" />
                            Cambiar Contraseña
                        </button>
                    </Card>

                    <Card className="p-6 border-red-200" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: '#FCA5A5' }}>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-rose-600">
                            <Trash2 className="h-5 w-5" />
                            Zona Peligrosa
                        </h2>
                        <p className="text-sm text-rose-500 mb-4">
                            Una vez que elimines tu cuenta, no hay vuelta atrás.
                        </p>
                        <button
                            onClick={handleDeleteAccount}
                            className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                        >
                            <Trash2 className="h-4 w-4" />
                            Eliminar Cuenta Permanentemente
                        </button>
                    </Card>
                </div>
            )}
        </div>
    );
};