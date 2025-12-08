import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Bell, Shield, Save, Trash2, Calendar } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { api } from '../../api/servicios';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

export const ConfigPage = () => {
    const [notifications, setNotifications] = useState(true);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = () => {
        try {
            setLoading(true);
            const userString = localStorage.getItem('user');

            if (!userString) {
                console.warn('No se encontró user en localStorage');
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
                text: 'Se guardarán los cambios en tu cuenta y se recargará la página.',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#4F46E5',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'Sí, actualizar',
                cancelButtonText: 'Cancelar'
            });

            if (!result.isConfirmed) {
                return;
            }

            const updatedUser = await api.updateUser(user.id, user); // Asegúrate de que tu API soporte PUT correctamente

            localStorage.setItem('user', JSON.stringify(updatedUser));
            localStorage.setItem('name', updatedUser.name);

            await Swal.fire({
                title: '¡Actualizado!',
                text: 'Tu información ha sido actualizada correctamente',
                icon: 'success',
                confirmButtonColor: '#4F46E5',
                timer: 1500,
                showConfirmButton: false
            });

            // Recargar la página para reflejar cambios en el Header
            window.location.reload();

        } catch (error) {
            console.error('Error al actualizar el usuario:', error);
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
                inputAttributes: {
                    autocomplete: 'current-password'
                },
                showCancelButton: true,
                confirmButtonColor: '#4F46E5',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'Verificar',
                cancelButtonText: 'Cancelar',
                inputValidator: (value) => {
                    if (!value) {
                        return 'Debes ingresar tu contraseña actual';
                    }
                }
            });

            if (!currentPassword) {
                return;
            }

            if (currentPassword !== user.password) {
                Swal.fire({
                    title: 'Error',
                    text: 'La contraseña actual es incorrecta',
                    icon: 'error',
                    confirmButtonColor: '#EF4444'
                });
                return;
            }

            const { value: newPassword } = await Swal.fire({
                title: 'Nueva contraseña',
                text: 'Ingresa tu nueva contraseña',
                input: 'password',
                inputPlaceholder: 'Nueva contraseña (mínimo 6 caracteres)',
                inputAttributes: {
                    minlength: 6,
                    maxlength: 20,
                    autocomplete: 'new-password'
                },
                showCancelButton: true,
                confirmButtonColor: '#4F46E5',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'Continuar',
                cancelButtonText: 'Cancelar',
                inputValidator: (value) => {
                    if (!value) {
                        return 'Debes escribir una contraseña';
                    }
                    if (value.length < 6) {
                        return 'La contraseña debe tener al menos 6 caracteres';
                    }
                    if (value.length > 20) {
                        return 'La contraseña debe tener menos de 20 caracteres';
                    }
                    if (value === currentPassword) {
                        return 'La nueva contraseña debe ser diferente a la actual';
                    }
                }
            });

            if (!newPassword) {
                return;
            }

            const { value: confirmPassword } = await Swal.fire({
                title: 'Confirmar contraseña',
                text: 'Vuelve a escribir tu nueva contraseña',
                input: 'password',
                inputPlaceholder: 'Confirmar nueva contraseña',
                inputAttributes: {
                    autocomplete: 'new-password'
                },
                showCancelButton: true,
                confirmButtonColor: '#4F46E5',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'Cambiar contraseña',
                cancelButtonText: 'Cancelar',
                inputValidator: (value) => {
                    if (!value) {
                        return 'Debes confirmar la contraseña';
                    }
                    if (value !== newPassword) {
                        return 'Las contraseñas no coinciden';
                    }
                }
            });

            if (!confirmPassword) {
                return;
            }

            // Crear objeto de usuario actualizado SOLO con la nueva contraseña
            // Manteniendo los demás datos intactos
            const updatedUserData = {
                ...user,
                password: newPassword
            };

            const resultUser = await api.updateUser(user.id, updatedUserData);

            setUser(resultUser);
            localStorage.setItem('user', JSON.stringify(resultUser));

            await Swal.fire({
                title: '¡Contraseña actualizada!',
                text: 'Tu contraseña ha sido cambiada correctamente',
                icon: 'success',
                confirmButtonColor: '#4F46E5'
            });

        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
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
                text: 'Esta acción no se puede deshacer. Se eliminarán todos tus datos.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#EF4444',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar',
                input: 'text',
                inputPlaceholder: 'Escribe "ELIMINAR" para confirmar',
                inputValidator: (value) => {
                    if (value !== 'ELIMINAR') {
                        return 'Debes escribir "ELIMINAR" para confirmar';
                    }
                }
            });

            if (result.isConfirmed) {
                // Asumiendo que existe este método en tu API
                if (api.deleteUser) {
                    await api.deleteUser(user.id);
                }

                localStorage.clear();

                await Swal.fire({
                    title: 'Cuenta eliminada',
                    text: 'Tu cuenta ha sido eliminada correctamente',
                    icon: 'success',
                    confirmButtonColor: '#4F46E5'
                });

                navigate('/login');
            }
        } catch (error) {
            console.error('Error al eliminar cuenta:', error);
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

    // Estilos dinámicos para inputs que soporten modo oscuro
    const inputStyle = {
        backgroundColor: 'var(--bg-tertiary)',
        color: 'var(--text-primary)',
        borderColor: 'var(--border-color)'
    };

    // Estilos para textos secundarios
    const labelStyle = {
        color: 'var(--text-secondary)'
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>⚙️ Configuraciones</h1>
                <button
                    onClick={handleUpdateUser}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                    <Save className="h-4 w-4" />
                    Guardar Cambios
                </button>
            </div>

            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Información de la Cuenta
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2" style={labelStyle}>
                            Nombre de Usuario
                        </label>
                        <input
                            type="text"
                            value={user?.name || ''}
                            onChange={(e) => setUser({ ...user, name: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors"
                            placeholder="Tu nombre"
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
                            className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors"
                            placeholder="tu@email.com"
                            style={inputStyle}
                        />
                    </div>

                    {user?.createdAt && (
                        <div>
                            <label className="block text-sm font-medium mb-2 flex items-center gap-2" style={labelStyle}>
                                <Calendar className="h-4 w-4" />
                                Fecha de Creación
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

            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Preferencias
                </h2>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Notificaciones</p>
                            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Recibir alertas de saldo bajo y gastos altos</p>
                        </div>
                        <button
                            onClick={() => setNotifications(!notifications)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${notifications ? 'bg-indigo-600' : 'bg-gray-300'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>
            </Card>

            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Seguridad
                </h2>

                <div className="space-y-3">
                    <button
                        onClick={handleChangePassword}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
                    >
                        <Lock className="h-4 w-4" />
                        Cambiar Contraseña
                    </button>
                </div>
            </Card>

            <Card className="p-6 border-red-200 bg-red-50" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}>
                {/* Nota: Para la zona de peligro, mantenemos el texto rojo explícito como alerta, pero adaptamos el fondo */}
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-rose-600">
                    <Trash2 className="h-5 w-5" />
                    Zona Peligrosa
                </h2>

                <p className="text-sm text-rose-500 mb-4">
                    Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor, está seguro.
                </p>

                <button
                    onClick={handleDeleteAccount}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors cursor-pointer"
                >
                    <Trash2 className="h-4 w-4" />
                    Eliminar Cuenta Permanentemente
                </button>
            </Card>
        </div>
    );
};