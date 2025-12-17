import { useState, useMemo, useEffect } from 'react'
import { CreditCard, Calendar, TrendingDown, Settings, Plus, Play, Pause, X, RefreshCw, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../api/servicios';
import { formatearMoneda } from '../../utils/FormateoValores';
import { SubscriptionModal } from '../../components/subscriptions/SubscriptionModal';
import {
    verificarSuscripciones,
    crearSuscripcion,
    cancelarSuscripcion,
    reactivarSuscripcion,
    estaProximaAlVencimiento,
    estaVencida,
    iniciarVerificacionAutomatica,
    detenerVerificacionAutomatica
} from '../../services/subscriptionService';
import Swal from 'sweetalert2';

export const SubscriptionsPage = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [subscriptionToEdit, setSubscriptionToEdit] = useState(null);
    const [verificacionInterval, setVerificacionInterval] = useState(null);

    const obtenerSuscripciones = async () => {
        try {
            const response = await api.getAllSubscriptions();
            setSubscriptions(response);
            setLoading(false);
        } catch (error) {
            console.error('Error al obtener suscripciones:', error);
            setLoading(false);
        }
    }

    useEffect(() => {
        obtenerSuscripciones();

        // Iniciar verificación automática
        const intervalo = iniciarVerificacionAutomatica();
        setVerificacionInterval(intervalo);

        // Limpiar al desmontar
        return () => {
            if (intervalo) {
                detenerVerificacionAutomatica(intervalo);
            }
        };
    }, []);

    // Calcular el gasto mensual proyectado (solo suscripciones activas)
    const gastoMensual = useMemo(() => {
        return subscriptions
            .filter(sub => sub.status === 'active')
            .reduce((total, sub) => {
                const montoPorMes = sub.frecuency === 'anual'
                    ? sub.cost / 12
                    : sub.cost;
                return total + montoPorMes;
            }, 0);
    }, [subscriptions]);

    // Contar total de servicios
    const totalServicios = subscriptions.length;
    const serviciosActivos = subscriptions.filter(s => s.status === 'active').length;

    // Función para obtener el color del icono según el nombre
    const getColorClass = (name) => {
        const colors = {
            'Netflix': 'bg-red-500',
            'Spotify': 'bg-green-500',
            'Amazon': 'bg-blue-500',
            'Disney': 'bg-yellow-500',
            'GamePass': 'bg-green-600',
            'Yoga': 'bg-gray-400',
            'Duolingo': 'bg-yellow-500',
            'Prime': 'bg-blue-500',
            'HBO': 'bg-purple-600',
            'Apple': 'bg-gray-700',
        };

        for (const [key, color] of Object.entries(colors)) {
            if (name.toLowerCase().includes(key.toLowerCase())) {
                return color;
            }
        }

        const firstLetter = name[0].toUpperCase();
        const colorIndex = firstLetter.charCodeAt(0) % 6;
        const defaultColors = ['bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500'];
        return defaultColors[colorIndex];
    };

    // Obtener el icono de estado
    const getStatusIcon = (status) => {
        switch (status) {
            case 'active':
                return <Play size={14} className="text-green-500" />;
            case 'suspended':
                return <Pause size={14} className="text-yellow-500" />;
            case 'cancelled':
                return <X size={14} className="text-red-500" />;
            default:
                return null;
        }
    };

    // Obtener el texto de estado
    const getStatusText = (status) => {
        switch (status) {
            case 'active':
                return 'Activa';
            case 'suspended':
                return 'Suspendida';
            case 'cancelled':
                return 'Cancelada';
            default:
                return status;
        }
    };

    // Manejar creación de suscripción
    const handleCrearSuscripcion = async (datos) => {
        const resultado = await crearSuscripcion(datos);
        if (resultado.success) {
            obtenerSuscripciones();
        }
    };

    // Manejar cancelación
    const handleCancelar = async (suscripcion) => {
        const resultado = await cancelarSuscripcion(suscripcion);
        if (resultado.success) {
            obtenerSuscripciones();
        }
    };

    // Manejar reactivación
    const handleReactivar = async (suscripcion) => {
        const resultado = await reactivarSuscripcion(suscripcion);
        if (resultado.success) {
            obtenerSuscripciones();
        }
    };

    // Actualizar datos y mostrar resumen si hay alertas
    const handleActualizar = async () => {
        setLoading(true);

        try {
            // Recargar suscripciones
            await obtenerSuscripciones();

            // Verificar estado de suscripciones
            const suscripcionesData = await api.getAllSubscriptions();
            const suscripcionesActivas = suscripcionesData.filter(sub => sub.status === 'active');

            const proximas = [];
            const vencidas = [];
            const suspendidas = suscripcionesData.filter(sub => sub.status === 'suspended');

            suscripcionesActivas.forEach(sub => {
                if (sub.nextPayment) {
                    const fechaPago = new Date(sub.nextPayment);
                    const ahora = new Date();
                    const diferenciaDias = Math.ceil((fechaPago - ahora) / (1000 * 60 * 60 * 24));

                    if (fechaPago < ahora) {
                        vencidas.push(sub);
                    } else if (diferenciaDias <= 2 && diferenciaDias >= 0) {
                        proximas.push(sub);
                    }
                }
            });

            setLoading(false);

            // Mostrar resumen solo si hay alertas
            if (vencidas.length > 0 || proximas.length > 0 || suspendidas.length > 0) {
                const alertas = [];

                if (vencidas.length > 0) {
                    alertas.push(`🔴 <strong>${vencidas.length}</strong> pago${vencidas.length !== 1 ? 's' : ''} vencido${vencidas.length !== 1 ? 's' : ''}`);
                }
                if (proximas.length > 0) {
                    alertas.push(`🟡 <strong>${proximas.length}</strong> pago${proximas.length !== 1 ? 's' : ''} próximo${proximas.length !== 1 ? 's' : ''} (2 días o menos)`);
                }
                if (suspendidas.length > 0) {
                    alertas.push(`⚠️ <strong>${suspendidas.length}</strong> suscripción${suspendidas.length !== 1 ? 'es' : ''} suspendida${suspendidas.length !== 1 ? 's' : ''}`);
                }

                Swal.fire({
                    icon: 'warning',
                    title: 'Alertas de Suscripciones',
                    html: `
                        <div style="text-align: left; margin: 15px 0;">
                            ${alertas.join('<br>')}
                        </div>
                        <p style="font-size: 14px; color: #6b7280; margin-top: 15px;">
                            Revisa tus suscripciones para más detalles.
                        </p>
                    `,
                    confirmButtonText: 'Entendido',
                    confirmButtonColor: '#8b5cf6'
                });
            } else {
                // Toast discreto si todo está bien
                Swal.fire({
                    icon: 'success',
                    title: '✅ Todo al día',
                    text: 'No hay alertas en tus suscripciones',
                    timer: 2000,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end'
                });
            }
        } catch (error) {
            console.error('Error al actualizar:', error);
            setLoading(false);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo actualizar. Intenta de nuevo.',
                confirmButtonColor: '#ef4444'
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Gestión de Suscripciones
                </h1>
                <Button
                    onClick={handleActualizar}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700"
                >
                    <RefreshCw size={18} className="mr-2" />
                    Actualizar
                </Button>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Gasto Mensual Proyectado */}
                <Card>
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                            <CreditCard className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                Gasto Mensual Proyectado
                            </p>
                            <p className="text-3xl font-bold text-purple-600">
                                {formatearMoneda(gastoMensual)}
                            </p>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                Esto incluye solo los servicios mensuales activos. Los anuales se facturan aparte.
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Total de Servicios */}
                <Card>
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingDown className="text-red-500" size={20} />
                                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                    Total de Servicios
                                </p>
                            </div>
                            <p className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                {serviciosActivos}
                                <span className="text-lg" style={{ color: 'var(--text-secondary)' }}>/{totalServicios}</span>
                            </p>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                {serviciosActivos} activa{serviciosActivos !== 1 ? 's' : ''} de {totalServicios} total{totalServicios !== 1 ? 'es' : ''}
                            </p>
                        </div>
                        <Button
                            onClick={() => {
                                setSubscriptionToEdit(null);
                                setModalOpen(true);
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            <Plus size={20} className="mr-2" />
                            Añadir Nuevo
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Lista de Suscripciones */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Servicios Activos y Pausados
                    </h2>
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <Settings size={16} />
                        <span>Ordenar por:</span>
                        <select className="border rounded px-2 py-1 cursor-pointer">
                            <option>Fecha ↓</option>
                            <option>Costo</option>
                            <option>Estado</option>
                        </select>
                    </div>
                </div>

                {subscriptions.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <p className="text-lg mb-2" style={{ color: 'var(--text-secondary)' }}>
                                No hay suscripciones
                            </p>
                            <Button
                                onClick={() => setModalOpen(true)}
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                                <Plus size={20} className="mr-2" />
                                Añadir tu primera suscripción
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {subscriptions.map((sub) => {
                            const initialIcon = sub.name[0].toUpperCase();
                            const colorClass = getColorClass(sub.name);
                            const isPaused = sub.status === 'paused';
                            const isSuspended = sub.status === 'suspended';
                            const isCancelled = sub.status === 'cancelled';
                            const isActive = sub.status === 'active';

                            const isDueSoon = isActive && sub.nextPayment && estaProximaAlVencimiento(sub.nextPayment);
                            const isOverdue = isActive && sub.nextPayment && estaVencida(sub.nextPayment);

                            return (
                                <Card
                                    key={sub.id}
                                    className={`hover:shadow-lg transition-shadow cursor-pointer ${isSuspended ? 'border-l-4 border-yellow-500' :
                                        isCancelled ? 'border-l-4 border-red-500' :
                                            isDueSoon ? 'border-l-4 border-orange-500' :
                                                isOverdue ? 'border-l-4 border-red-600' : ''
                                        }`}
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                {/* Icono / Logo */}
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl ${colorClass} ${!isActive ? 'opacity-50' : ''}`}>
                                                    {initialIcon}
                                                </div>

                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className={`font-bold ${!isActive ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                                                            {sub.name}
                                                        </p>
                                                        {getStatusIcon(sub.status)}
                                                    </div>
                                                    <p className="text-xs text-slate-400">
                                                        {sub.frecuency} | {getStatusText(sub.status)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <p className={`text-xl font-extrabold ${!isActive ? 'text-slate-400' : 'text-rose-600'}`}>
                                                    {formatearMoneda(sub.cost)}
                                                </p>
                                                <p className={`text-xs font-medium mt-1 flex items-center gap-1 justify-end ${isOverdue ? 'text-red-600 font-bold' :
                                                    isDueSoon ? 'text-orange-500' :
                                                        'text-slate-500'
                                                    }`}>
                                                    <Calendar size={12} />
                                                    {isActive && sub.nextPayment
                                                        ? `${isOverdue ? '¡Vencido!' : 'Cobra:'} ${new Date(sub.nextPayment).toLocaleDateString('es-CO')}`
                                                        : 'Sin cobro pendiente'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Alertas */}
                                        {isSuspended && (
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 flex items-start gap-2">
                                                <AlertCircle size={16} className="text-yellow-600 mt-0.5" />
                                                <div className="text-xs text-yellow-800">
                                                    <strong>Suspendida:</strong> {sub.suspensionReason || 'Fondos insuficientes'}
                                                </div>
                                            </div>
                                        )}

                                        {isOverdue && (
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex items-start gap-2">
                                                <AlertCircle size={16} className="text-red-600 mt-0.5" />
                                                <div className="text-xs text-red-800">
                                                    <strong>Pago vencido:</strong> Se procesará automáticamente cuando haya fondos
                                                </div>
                                            </div>
                                        )}

                                        {/* Acciones */}
                                        <div className="flex gap-2 pt-2 border-t">
                                            {isActive && (
                                                <Button
                                                    onClick={() => handleCancelar(sub)}
                                                    className="flex-1 text-xs bg-red-900 hover:bg-red-800 text-red-600 border border-red-200"
                                                >
                                                    <X size={14} className="mr-1" />
                                                    Cancelar
                                                </Button>
                                            )}

                                            {(isCancelled || isSuspended) && (
                                                <Button
                                                    onClick={() => handleReactivar(sub)}
                                                    className="flex-1 text-xs bg-green-50 hover:bg-green-100 text-green-600 border border-green-200"
                                                >
                                                    <Play size={14} className="mr-1" />
                                                    Reactivar
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Footer */}
                {subscriptions.length > 0 && (
                    <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
                        Tienes {serviciosActivos} servicio{serviciosActivos !== 1 ? 's' : ''} activo{serviciosActivos !== 1 ? 's' : ''} de {totalServicios} total{totalServicios !== 1 ? 'es' : ''}.
                    </p>
                )}
            </div>

            {/* Modal */}
            <SubscriptionModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setSubscriptionToEdit(null);
                }}
                onSuccess={handleCrearSuscripcion}
                subscription={subscriptionToEdit}
            />
        </div>
    );
};
