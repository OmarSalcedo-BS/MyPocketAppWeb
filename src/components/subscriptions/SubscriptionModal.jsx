import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { api } from '../../api/servicios';

export const SubscriptionModal = ({ isOpen, onClose, onSuccess, subscription = null }) => {
    const [cuentas, setCuentas] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        cost: '',
        frecuency: 'mensual',
        accountId: '',
        description: ''
    });

    useEffect(() => {
        if (isOpen) {
            cargarCuentas();
            if (subscription) {
                setFormData({
                    name: subscription.name || '',
                    cost: subscription.cost || '',
                    frecuency: subscription.frecuency || 'mensual',
                    accountId: subscription.accountId || '',
                    description: subscription.description || ''
                });
            } else {
                setFormData({
                    name: '',
                    cost: '',
                    frecuency: 'mensual',
                    accountId: '',
                    description: ''
                });
            }
        }
    }, [isOpen, subscription]);

    const cargarCuentas = async () => {
        try {
            const cuentasData = await api.getAllAccounts();
            // Filtrar solo cuentas que no sean de crédito
            const cuentasDisponibles = cuentasData.filter(c => c.type !== 'Crédito');
            setCuentas(cuentasDisponibles);

            // Si no hay cuenta seleccionada, seleccionar la primera
            if (!formData.accountId && cuentasDisponibles.length > 0) {
                setFormData(prev => ({ ...prev, accountId: cuentasDisponibles[0].id }));
            }
        } catch (error) {
            console.error('Error al cargar cuentas:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'cost' ? parseFloat(value) || '' : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.cost || !formData.accountId) {
            alert('Por favor completa todos los campos obligatorios');
            return;
        }

        const datos = {
            ...formData,
            cost: parseFloat(formData.cost)
        };

        onSuccess(datos);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        {subscription ? 'Editar Suscripción' : 'Nueva Suscripción'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Nombre */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                            Nombre de la suscripción *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Ej: Netflix, Spotify, Amazon Prime..."
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            required
                        />
                    </div>

                    {/* Costo */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                            Costo mensual *
                        </label>
                        <input
                            type="number"
                            name="cost"
                            value={formData.cost}
                            onChange={handleChange}
                            placeholder="0"
                            min="0"
                            step="100"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            required
                        />
                    </div>

                    {/* Frecuencia */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                            Frecuencia de pago
                        </label>
                        <select
                            name="frecuency"
                            value={formData.frecuency}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                        >
                            <option value="mensual">Mensual</option>
                            <option value="anual">Anual</option>
                        </select>
                    </div>

                    {/* Cuenta */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                            Cuenta de pago *
                        </label>
                        <select
                            name="accountId"
                            value={formData.accountId}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                            required
                        >
                            <option value="">Selecciona una cuenta</option>
                            {cuentas.map(cuenta => (
                                <option key={cuenta.id} value={cuenta.id}>
                                    {cuenta.name} - ${cuenta.balance.toLocaleString('es-CO')}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                            Descripción (opcional)
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Agrega notas sobre esta suscripción..."
                            rows="3"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        />
                    </div>

                    {/* Información */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <p className="text-sm text-purple-800">
                            💡 <strong>Nota:</strong> El primer pago se procesará automáticamente el próximo mes.
                            Recibirás una notificación 2 días antes del cobro.
                        </p>
                    </div>

                    {/* Botones */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            {subscription ? 'Guardar Cambios' : 'Crear Suscripción'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
