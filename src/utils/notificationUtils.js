/**
 * Utilidad para agregar notificaciones de suscripciones al sistema de notificaciones
 */

// Agregar notificación de pago procesado
export const agregarNotificacionPagoProcesado = (suscripcion) => {
    const notificacion = {
        id: `sub-paid-${suscripcion.id}-${Date.now()}`,
        title: '✅ Pago de suscripción procesado',
        message: `Se ha cobrado $${suscripcion.cost.toLocaleString('es-CO')} por ${suscripcion.name}`,
        type: 'success',
        isRead: false,
        timestamp: new Date().toISOString()
    };

    // Obtener notificaciones actuales
    const saved = localStorage.getItem('notifications');
    if (saved) {
        const { date, data } = JSON.parse(saved);
        const today = new Date().toDateString();

        if (date === today) {
            // Agregar nueva notificación
            const updated = [notificacion, ...data];
            localStorage.setItem('notifications', JSON.stringify({
                date: today,
                data: updated
            }));

            // Disparar evento personalizado para actualizar el componente
            window.dispatchEvent(new CustomEvent('newNotification', { detail: notificacion }));
        }
    }
};

// Agregar notificación de suscripción suspendida
export const agregarNotificacionSuspension = (suscripcion, razon) => {
    const notificacion = {
        id: `sub-suspended-${suscripcion.id}-${Date.now()}`,
        title: '⚠️ Suscripción suspendida',
        message: `${suscripcion.name} ha sido suspendida: ${razon}`,
        type: 'warning',
        isRead: false,
        timestamp: new Date().toISOString()
    };

    // Obtener notificaciones actuales
    const saved = localStorage.getItem('notifications');
    if (saved) {
        const { date, data } = JSON.parse(saved);
        const today = new Date().toDateString();

        if (date === today) {
            // Agregar nueva notificación
            const updated = [notificacion, ...data];
            localStorage.setItem('notifications', JSON.stringify({
                date: today,
                data: updated
            }));

            // Disparar evento personalizado
            window.dispatchEvent(new CustomEvent('newNotification', { detail: notificacion }));
        }
    }
};
