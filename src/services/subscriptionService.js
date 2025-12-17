import { api } from '../api/servicios';
import Swal from 'sweetalert2';
import { agregarNotificacionPagoProcesado, agregarNotificacionSuspension } from '../utils/notificationUtils';

/**
 * Servicio de automatización de suscripciones
 * Maneja el procesamiento automático de pagos y notificaciones
 */

// Calcular la próxima fecha de pago (siguiente mes, mismo día)
export const calcularProximaFechaPago = (fechaActual = new Date()) => {
    const proximaFecha = new Date(fechaActual);
    proximaFecha.setMonth(proximaFecha.getMonth() + 1);
    return proximaFecha.toISOString();
};

// Verificar si una fecha está próxima (dentro de 2 días)
export const estaProximaAlVencimiento = (fechaPago) => {
    const ahora = new Date();
    const fechaLimite = new Date(fechaPago);
    const diferenciaDias = Math.ceil((fechaLimite - ahora) / (1000 * 60 * 60 * 24));
    return diferenciaDias <= 2 && diferenciaDias >= 0;
};

// Verificar si una fecha ya venció
export const estaVencida = (fechaPago) => {
    const ahora = new Date();
    const fechaLimite = new Date(fechaPago);
    return fechaLimite < ahora;
};

// Sistema de bloqueo para evitar procesamiento simultáneo
const processingLocks = new Map();

// Timestamps de último procesamiento por suscripción
const lastProcessingTime = new Map();

// Verificar si ya se procesó un pago hoy
const yaSeProcesoHoy = (suscripcion) => {
    if (!suscripcion.lastPaymentDate) {
        return false;
    }

    const ultimoPago = new Date(suscripcion.lastPaymentDate);
    const hoy = new Date();

    // Verificar si el último pago fue hoy (mismo día)
    return ultimoPago.toDateString() === hoy.toDateString();
};

// Verificar si se procesó recientemente (últimos 30 segundos)
const seProcesoRecientemente = (suscripcionId) => {
    const ultimoTimestamp = lastProcessingTime.get(suscripcionId);
    if (!ultimoTimestamp) {
        return false;
    }

    const ahora = Date.now();
    const diferencia = ahora - ultimoTimestamp;

    // Si se procesó hace menos de 30 segundos, considerarlo duplicado
    return diferencia < 30000; // 30 segundos
};

// Verificar si hay transacciones duplicadas recientes (últimos 10 minutos)
const verificarTransaccionesDuplicadas = async (suscripcionId) => {
    try {
        const transacciones = await api.getAllTransactions();
        const ahora = new Date();
        const hace10Minutos = new Date(ahora.getTime() - 10 * 60 * 1000); // Aumentado de 5 a 10 minutos

        // Buscar transacciones de esta suscripción en los últimos 5 minutos
        const transaccionesRecientes = transacciones.filter(t =>
            t.subscriptionId === suscripcionId &&
            t.isAutomatic === true &&
            new Date(t.date) >= hace5Minutos
        );

        return transaccionesRecientes.length > 0;
    } catch (error) {
        console.error('Error al verificar transacciones duplicadas:', error);
        return false;
    }
};

// Procesar pago automático de suscripción
export const procesarPagoSuscripcion = async (suscripcion, cuenta) => {
    // 1. VERIFICAR BLOQUEO DE PROCESAMIENTO
    if (processingLocks.has(suscripcion.id)) {
        console.warn(`⚠️ Pago de ${suscripcion.name} ya está siendo procesado. Ignorando solicitud duplicada.`);
        return { success: false, reason: 'already_processing' };
    }

    // 2. VERIFICAR SI SE PROCESÓ RECIENTEMENTE (30 segundos)
    if (seProcesoRecientemente(suscripcion.id)) {
        console.warn(`⚠️ ${suscripcion.name} se procesó hace menos de 30 segundos. Ignorando pago duplicado.`);
        return { success: false, reason: 'processed_recently' };
    }

    // 3. VERIFICAR SI YA SE PROCESÓ HOY
    if (yaSeProcesoHoy(suscripcion)) {
        console.warn(`⚠️ ${suscripcion.name} ya fue procesada hoy. Ignorando pago duplicado.`);
        return { success: false, reason: 'already_paid_today' };
    }

    // 4. VERIFICAR TRANSACCIONES DUPLICADAS RECIENTES
    const hayDuplicados = await verificarTransaccionesDuplicadas(suscripcion.id);
    if (hayDuplicados) {
        console.warn(`⚠️ Se detectó una transacción reciente para ${suscripcion.name}. Ignorando pago duplicado.`);
        return { success: false, reason: 'duplicate_transaction_detected' };
    }

    // 5. ESTABLECER BLOQUEO Y TIMESTAMP
    processingLocks.set(suscripcion.id, true);
    lastProcessingTime.set(suscripcion.id, Date.now());

    try {
        console.log(`🔄 Procesando pago de ${suscripcion.name}...`);

        // Verificar que la cuenta tenga saldo suficiente
        if (cuenta.balance < suscripcion.cost) {
            // Suspender suscripción por falta de fondos
            await api.updateSubscription(suscripcion.id, {
                ...suscripcion,
                status: 'suspended',
                lastPaymentAttempt: new Date().toISOString(),
                suspensionReason: 'Fondos insuficientes'
            });

            // Agregar notificación a la campanita
            agregarNotificacionSuspension(suscripcion, 'Fondos insuficientes');

            return { success: false, reason: 'insufficient_funds' };
        }

        // Crear transacción automática
        const transaccion = {
            title: `Pago automático - ${suscripcion.name}`,
            category: 'Suscripciones',
            amount: suscripcion.cost,
            type: 'expense',
            date: new Date().toISOString(),
            accountId: suscripcion.accountId,
            subscriptionId: suscripcion.id,
            isAutomatic: true
        };

        const nuevaTransaccion = await api.createTransaction(transaccion);
        console.log(`✅ Transacción creada para ${suscripcion.name}`);

        // Actualizar balance de la cuenta
        const nuevoBalance = cuenta.balance - suscripcion.cost;
        await api.updateAccount(cuenta.id, {
            ...cuenta,
            balance: nuevoBalance
        });
        console.log(`✅ Balance actualizado: ${cuenta.balance} → ${nuevoBalance}`);

        // Actualizar suscripción con nueva fecha de pago
        const proximaFecha = calcularProximaFechaPago();
        await api.updateSubscription(suscripcion.id, {
            ...suscripcion,
            nextPayment: proximaFecha,
            lastPaymentDate: new Date().toISOString(),
            lastPaymentAmount: suscripcion.cost
        });
        console.log(`✅ Próximo pago de ${suscripcion.name}: ${new Date(proximaFecha).toLocaleDateString('es-CO')}`);

        // Agregar notificación a la campanita
        agregarNotificacionPagoProcesado(suscripcion);

        return { success: true, transaction: nuevaTransaccion };

    } catch (error) {
        console.error('❌ Error al procesar pago de suscripción:', error);

        Swal.fire({
            icon: 'error',
            title: 'Error al procesar pago',
            text: `Hubo un error al procesar el pago de ${suscripcion.name}. Por favor, revisa tu cuenta.`,
            confirmButtonColor: '#ef4444'
        });

        return { success: false, reason: 'processing_error', error };
    } finally {
        // 5. LIBERAR BLOQUEO (siempre, incluso si hay error)
        processingLocks.delete(suscripcion.id);
        console.log(`🔓 Bloqueo liberado para ${suscripcion.name}`);
    }
};

// Verificar y procesar todas las suscripciones activas
export const verificarSuscripciones = async () => {
    try {
        const suscripciones = await api.getAllSubscriptions();
        const cuentas = await api.getAllAccounts();

        const suscripcionesActivas = suscripciones.filter(sub => sub.status === 'active');

        const resultados = {
            procesadas: [],
            proximas: [],
            vencidas: [],
            errores: []
        };

        for (const suscripcion of suscripcionesActivas) {
            const cuenta = cuentas.find(c => c.id === suscripcion.accountId);

            if (!cuenta) {
                console.warn(`Cuenta no encontrada para suscripción ${suscripcion.name}`);
                continue;
            }

            // Verificar si ya venció (debe procesarse)
            if (estaVencida(suscripcion.nextPayment)) {
                const resultado = await procesarPagoSuscripcion(suscripcion, cuenta);
                if (resultado.success) {
                    resultados.procesadas.push(suscripcion);
                } else {
                    resultados.errores.push({ suscripcion, error: resultado.reason });
                }
            }
            // Verificar si está próxima (notificar)
            else if (estaProximaAlVencimiento(suscripcion.nextPayment)) {
                resultados.proximas.push(suscripcion);
            }
        }

        // Las notificaciones se manejan en el componente SubscriptionNotifications (campanita)
        // No mostramos modal aquí para evitar interrupciones

        return resultados;

    } catch (error) {
        console.error('Error al verificar suscripciones:', error);
        return { error };
    }
};



// Crear nueva suscripción
export const crearSuscripcion = async (datosSuscripcion) => {
    try {
        // Calcular la primera fecha de pago (próximo mes)
        const proximaFecha = calcularProximaFechaPago();

        const nuevaSuscripcion = {
            ...datosSuscripcion,
            nextPayment: proximaFecha,
            status: 'active',
            createdAt: new Date().toISOString()
        };

        const resultado = await api.createSubscription(nuevaSuscripcion);

        Swal.fire({
            icon: 'success',
            title: 'Suscripción creada',
            text: `${datosSuscripcion.name} ha sido agregada. El primer pago será el ${new Date(proximaFecha).toLocaleDateString('es-CO')}`,
            confirmButtonColor: '#8b5cf6'
        });

        return { success: true, subscription: resultado };

    } catch (error) {
        console.error('Error al crear suscripción:', error);

        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo crear la suscripción. Intenta de nuevo.',
            confirmButtonColor: '#ef4444'
        });

        return { success: false, error };
    }
};

// Cancelar suscripción
export const cancelarSuscripcion = async (suscripcion) => {
    try {
        const confirmacion = await Swal.fire({
            icon: 'warning',
            title: '¿Cancelar suscripción?',
            html: `
                <p>¿Estás seguro de que deseas cancelar <strong>${suscripcion.name}</strong>?</p>
                <p style="font-size: 14px; color: #6b7280; margin-top: 10px;">
                    La suscripción quedará cancelada pero podrás reactivarla cuando quieras.
                </p>
            `,
            showCancelButton: true,
            confirmButtonText: 'Sí, cancelar',
            cancelButtonText: 'No, mantener',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280'
        });

        if (!confirmacion.isConfirmed) {
            return { success: false, cancelled: true };
        }

        await api.updateSubscription(suscripcion.id, {
            ...suscripcion,
            status: 'cancelled',
            cancelledAt: new Date().toISOString()
        });

        Swal.fire({
            icon: 'success',
            title: 'Suscripción cancelada',
            text: `${suscripcion.name} ha sido cancelada exitosamente.`,
            timer: 2000,
            showConfirmButton: false
        });

        return { success: true };

    } catch (error) {
        console.error('Error al cancelar suscripción:', error);

        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cancelar la suscripción. Intenta de nuevo.',
            confirmButtonColor: '#ef4444'
        });

        return { success: false, error };
    }
};

// Reactivar suscripción
export const reactivarSuscripcion = async (suscripcion) => {
    try {
        // Obtener la cuenta asociada
        const cuenta = await api.getAccountById(suscripcion.accountId);

        if (!cuenta) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se encontró la cuenta asociada a esta suscripción.',
                confirmButtonColor: '#ef4444'
            });
            return { success: false, error: 'account_not_found' };
        }

        const confirmacion = await Swal.fire({
            icon: 'question',
            title: '¿Reactivar suscripción?',
            html: `
                <p>¿Deseas reactivar <strong>${suscripcion.name}</strong>?</p>
                <p style="font-size: 14px; color: #6b7280; margin-top: 10px;">
                    Se cobrará <strong>$${suscripcion.cost.toLocaleString('es-CO')}</strong> inmediatamente de tu cuenta <strong>${cuenta.name}</strong>.
                </p>
                <p style="font-size: 14px; color: #6b7280; margin-top: 5px;">
                    Balance actual: <strong>$${cuenta.balance.toLocaleString('es-CO')}</strong>
                </p>
            `,
            showCancelButton: true,
            confirmButtonText: 'Sí, reactivar y pagar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#8b5cf6',
            cancelButtonColor: '#6b7280'
        });

        if (!confirmacion.isConfirmed) {
            return { success: false, cancelled: true };
        }

        // Verificar fondos suficientes
        if (cuenta.balance < suscripcion.cost) {
            Swal.fire({
                icon: 'error',
                title: 'Fondos insuficientes',
                text: `No hay fondos suficientes en ${cuenta.name} para reactivar ${suscripcion.name}.`,
                confirmButtonColor: '#ef4444'
            });
            return { success: false, error: 'insufficient_funds' };
        }

        // Crear transacción de reactivación
        const transaccion = {
            title: `Reactivación - ${suscripcion.name}`,
            category: 'Suscripciones',
            amount: suscripcion.cost,
            type: 'expense',
            date: new Date().toISOString(),
            accountId: suscripcion.accountId,
            subscriptionId: suscripcion.id,
            isAutomatic: false // No es automático, es manual
        };

        await api.createTransaction(transaccion);

        // Actualizar balance de la cuenta
        const nuevoBalance = cuenta.balance - suscripcion.cost;
        await api.updateAccount(cuenta.id, {
            ...cuenta,
            balance: nuevoBalance
        });

        // Calcular próxima fecha de pago
        const proximaFecha = calcularProximaFechaPago();

        // Actualizar suscripción
        await api.updateSubscription(suscripcion.id, {
            ...suscripcion,
            status: 'active',
            nextPayment: proximaFecha,
            reactivatedAt: new Date().toISOString(),
            lastPaymentDate: new Date().toISOString(),
            lastPaymentAmount: suscripcion.cost
        });

        Swal.fire({
            icon: 'success',
            title: 'Suscripción reactivada',
            html: `
                <p><strong>${suscripcion.name}</strong> ha sido reactivada exitosamente.</p>
                <p style="font-size: 14px; color: #6b7280; margin-top: 10px;">
                    Se ha cobrado <strong>$${suscripcion.cost.toLocaleString('es-CO')}</strong>
                </p>
                <p style="font-size: 14px; color: #6b7280;">
                    Próximo pago: <strong>${new Date(proximaFecha).toLocaleDateString('es-CO')}</strong>
                </p>
            `,
            confirmButtonColor: '#8b5cf6'
        });

        return { success: true };

    } catch (error) {
        console.error('Error al reactivar suscripción:', error);

        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo reactivar la suscripción. Intenta de nuevo.',
            confirmButtonColor: '#ef4444'
        });

        return { success: false, error };
    }
};

// Iniciar verificación automática (ejecutar cada hora)
export const iniciarVerificacionAutomatica = () => {
    // Verificar inmediatamente
    verificarSuscripciones();

    // Verificar cada hora
    const intervalo = setInterval(() => {
        verificarSuscripciones();
    }, 60 * 60 * 1000); // 1 hora

    return intervalo;
};

// Detener verificación automática
export const detenerVerificacionAutomatica = (intervalo) => {
    if (intervalo) {
        clearInterval(intervalo);
    }
};
