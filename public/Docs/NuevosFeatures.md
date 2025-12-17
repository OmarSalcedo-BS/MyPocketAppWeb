💡 3. Ideas de Implementación (New Features)

Plantilla Rápida de Idea (COPIAR Y PEGAR)

IDEA-000 [ESTADO: PENDIENTE 📅]

Fecha: [YYYY-MM-DD]
Categoría: [Ej: UX / Integración / Core / Ventas]
Idea: Título corto de la nueva funcionalidad.
Necesidad: ¿Qué nuevo problema resuelve o qué valor crea?
MVP Mínimo: ¿Cuál es la versión más simple que podemos construir para probar la idea?

Reportes Existentes

IDEA-001 [ESTADO: COMPLETADO 🏆] FEATURE ASIGNADO 🟥: Omar Salcedo

Fecha: 2025-11-23
Categoría: Inicio de sesión y registro
Idea: Tener un inicio y registro que funcione, que tome a cuenta no repetir correos y confirmar contraseñas. Se
integrara con la base de datos para que funcione. Se integra SweetAlert para los mensajes de error y exito.
Necesidad: Tener un inicio y registro que funcione.
MVP Mínimo: Permitir la creación de cuentas y el inicio de sesión. todo guardado en un server-Json (Temporal).

IDEA-002 [ESTADO: COMPLETADO 🏆] FEATURE ASIGNADO 🟥: Omar Salcedo

Fecha: 2025-11-18
Fecha Completado: 2025-12-07
Categoría: Cuentas y Transacciones
Idea: Crear módulos para la administración de cuentas y transacciones.
Necesidad: Crear módulos para la administración de cuentas y transacciones.
MVP Mínimo: Permitir la creación de cuentas y transacciones.
Implementación:

- ✅ Página de Cuentas (AccountsPage.jsx) con CRUD completo
- ✅ Página de Transacciones (TransactionsPage.jsx) con historial completo
- ✅ Dashboard Home con resumen de balance total, ingresos y gastos mensuales
- ✅ Modales para crear nuevas transacciones desde Home y TransactionsPage
- ✅ Modales para crear nuevas cuentas
- ✅ Actualización automática de balance al crear transacciones
- ✅ Validación de saldo insuficiente en cuentas (excepto crédito)
- ✅ Categorías dinámicas según tipo de transacción (ingreso/gasto)
- ✅ Sistema de filtrado y búsqueda en historial de transacciones
- ✅ Tabla completa con todas las transacciones ordenadas por fecha
- ✅ Visualización de últimos 5 movimientos en Home
- ✅ Integración con SweetAlert2 para notificaciones

IDEA-003 [ESTADO: COMPLETADO 🏆] FEATURE ASIGNADO 🟥: Omar Salcedo

Fecha: 2025-11-18
Fecha Completado: 2025-12-17
Categoría: Configuración de la app
Idea: Crear módulos para la administración de la cuenta del usuario.
Necesidad: Tener un módulo para la administración de la cuenta del usuario.
MVP Mínimo: Permitir la modificacion de los datos, personalización de la app y la eliminación de la cuenta.
Implementación:

- ✅ Sistema de pestañas (Mi Cuenta, Personalización, Seguridad)
- ✅ Información personal editable
- ✅ Categorías personalizadas con emojis
- ✅ Cambio de contraseña
- ✅ Eliminación de cuenta
- ✅ Modo oscuro persistente

IDEA-004 [ESTADO: COMPLETADO 🏆] FEATURE ASIGNADO 🟥: Omar Salcedo

Fecha: 2025-12-17
Fecha Completado: 2025-12-17
Categoría: Suscripciones / Automatización
Idea: Sistema completo de gestión de suscripciones con automatización de pagos.
Necesidad: Gestionar suscripciones recurrentes (Netflix, Spotify, etc.) con pagos automáticos y notificaciones.
MVP Mínimo: Crear, editar, cancelar y reactivar suscripciones con procesamiento automático de pagos.
Implementación:

- ✅ Página completa de suscripciones (SubscriptionsPage.jsx)
- ✅ Modal de creación/edición de suscripciones
- ✅ Servicio de automatización (subscriptionService.js)
- ✅ Procesamiento automático de pagos mensuales
- ✅ Verificación cada hora de pagos vencidos
- ✅ Sistema de notificaciones no intrusivas (campanita)
- ✅ Estados: active, suspended, cancelled
- ✅ Reactivación con pago inmediato
- ✅ Protección anti-duplicados (4 capas)
- ✅ Alertas de pagos próximos (2 días antes)
- ✅ Suspensión automática por fondos insuficientes
- ✅ Estadísticas de gasto mensual proyectado
- ✅ Botón "Actualizar" con resumen inteligente
- ✅ Integración con sistema de transacciones
- ✅ Actualización automática de balances
