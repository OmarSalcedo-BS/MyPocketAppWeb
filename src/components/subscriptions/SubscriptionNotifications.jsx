import { useEffect, useState } from 'react';
import { Bell, X, Calendar, AlertCircle } from 'lucide-react';
import { api } from '../../api/servicios';
import { estaProximaAlVencimiento, estaVencida } from '../../services/subscriptionService';
import { formatearMoneda } from '../../utils/FormateoValores';

export const SubscriptionNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        cargarNotificaciones();

        // Actualizar cada 5 minutos
        const intervalo = setInterval(() => {
            cargarNotificaciones();
        }, 5 * 60 * 1000);

        return () => clearInterval(intervalo);
    }, []);

    const cargarNotificaciones = async () => {
        try {
            const suscripciones = await api.getAllSubscriptions();
            const suscripcionesActivas = suscripciones.filter(sub => sub.status === 'active');

            const notificacionesNuevas = [];

            for (const sub of suscripcionesActivas) {
                if (sub.nextPayment) {
                    if (estaVencida(sub.nextPayment)) {
                        notificacionesNuevas.push({
                            id: `overdue-${sub.id}`,
                            type: 'overdue',
                            subscription: sub,
                            message: `Pago vencido de ${sub.name}`,
                            amount: sub.cost,
                            date: sub.nextPayment
                        });
                    } else if (estaProximaAlVencimiento(sub.nextPayment)) {
                        const diasRestantes = Math.ceil((new Date(sub.nextPayment) - new Date()) / (1000 * 60 * 60 * 24));
                        notificacionesNuevas.push({
                            id: `upcoming-${sub.id}`,
                            type: 'upcoming',
                            subscription: sub,
                            message: `Pago de ${sub.name} en ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}`,
                            amount: sub.cost,
                            date: sub.nextPayment
                        });
                    }
                }
            }

            setNotifications(notificacionesNuevas);
        } catch (error) {
            console.error('Error al cargar notificaciones:', error);
        }
    };

    const dismissNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    if (notifications.length === 0) {
        return null;
    }

    return (
        <div className="relative">
            {/* Botón de notificaciones */}
            <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
                <Bell size={24} style={{ color: 'var(--text-primary)' }} />
                {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {notifications.length}
                    </span>
                )}
            </button>

            {/* Panel de notificaciones */}
            {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50">
                    <div className="p-4 border-b">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>
                                Notificaciones de Suscripciones
                            </h3>
                            <button
                                onClick={() => setShowNotifications(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.map((notif) => (
                            <div
                                key={notif.id}
                                className={`p-4 border-b hover:bg-gray-50 transition-colors ${notif.type === 'overdue' ? 'bg-red-50' : 'bg-orange-50'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-full ${notif.type === 'overdue' ? 'bg-red-100' : 'bg-orange-100'
                                        }`}>
                                        {notif.type === 'overdue' ? (
                                            <AlertCircle size={20} className="text-red-600" />
                                        ) : (
                                            <Calendar size={20} className="text-orange-600" />
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <p className={`font-medium text-sm ${notif.type === 'overdue' ? 'text-red-800' : 'text-orange-800'
                                            }`}>
                                            {notif.message}
                                        </p>
                                        <p className="text-xs text-gray-600 mt-1">
                                            {formatearMoneda(notif.amount)} • {new Date(notif.date).toLocaleDateString('es-CO')}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => dismissNotification(notif.id)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-3 bg-gray-50 text-center">
                        <button
                            onClick={() => {
                                setShowNotifications(false);
                                window.location.href = '#/dashboard/subscriptions';
                            }}
                            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                        >
                            Ver todas las suscripciones
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
