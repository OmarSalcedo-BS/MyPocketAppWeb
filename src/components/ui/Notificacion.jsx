import React, { useState } from 'react';
import { Bell, X, AlertTriangle, CheckCircle, Info, Trash2, CheckCheck } from 'lucide-react';

export const Notificacion = ({ alerts = [], markAsRead, deleteNotification, markAllAsRead }) => {
    const [isOpen, setIsOpen] = useState(false);

    const unreadCount = alerts.filter(a => !a.isRead).length;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-slate-400 hover:text-slate-600 relative transition-colors cursor-pointer"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    ></div>

                    <div
                        className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 z-50"
                        style={{ transformOrigin: 'top right' }}
                    >
                        <div className="px-4 py-3 border-b flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-800">
                                Notificaciones {unreadCount > 0 && `(${unreadCount})`}
                            </h3>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                                        title="Marcar todas como leídas"
                                    >
                                        <CheckCheck className="h-4 w-4" />
                                        Marcar todas
                                    </button>
                                )}
                                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {alerts.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 font-medium">No hay notificaciones</p>
                                    <p className="text-sm text-gray-400 mt-1">Te avisaremos cuando haya algo nuevo</p>
                                </div>
                            ) : (
                                alerts.map((alert) => (
                                    <div
                                        key={alert.id}
                                        className={`p-4 border-b last:border-b-0 transition-colors ${alert.isRead
                                            ? 'bg-gray-50 text-gray-600'
                                            : 'bg-white hover:bg-indigo-50 text-gray-800'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {alert.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-500 mt-1 flex-shrink-0" />}
                                            {alert.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />}
                                            {alert.type === 'info' && <Info className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />}
                                            {alert.type === 'error' && <AlertTriangle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />}

                                            <div
                                                className="flex-1 cursor-pointer"
                                                onClick={() => markAsRead(alert.id)}
                                            >
                                                <p className={`text-sm ${alert.isRead ? 'font-normal' : 'font-semibold'}`}>
                                                    {alert.message}
                                                </p>
                                                <p className="text-xs mt-1 text-gray-400">
                                                    {new Date(alert.date).toLocaleDateString('es-ES', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteNotification(alert.id);
                                                }}
                                                className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                                                title="Eliminar notificación"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};