import React, { useMemo } from 'react';
import { CreditCard, TrendingUp, AlertCircle, DollarSign, PieChart, BarChart3 } from 'lucide-react';
import { formatearMoneda } from '../../utils/FormateoValores';
import { getCreditSummary, getCreditTransactions, getDeepCreditAnalysis } from '../../services/creditService';
import { Doughnut, Bar } from 'react-chartjs-2';

export const CreditAnalysis = ({ transactions, accounts }) => {
    const creditSummary = useMemo(() => getCreditSummary(transactions, accounts), [transactions, accounts]);
    const creditTransactions = useMemo(() => getCreditTransactions(transactions, accounts), [transactions, accounts]);
    const deepAnalysis = useMemo(() => getDeepCreditAnalysis(transactions, accounts), [transactions, accounts]);

    if (creditSummary.creditUsage.length === 0) {
        return (
            <div className="text-center py-12 rounded-xl" style={{ backgroundColor: 'var(--card-bg)' }}>
                <CreditCard size={48} className="mx-auto mb-4 opacity-30" style={{ color: 'var(--text-secondary)' }} />
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    No tienes tarjetas de crédito
                </h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Crea una cuenta de tipo "Crédito" para ver el análisis de tus tarjetas
                </p>
            </div>
        );
    }

    // Datos para el gráfico de uso de cupo
    const usageChartData = {
        labels: creditSummary.creditUsage.map(c => c.name),
        datasets: [{
            data: creditSummary.creditUsage.map(c => c.used),
            backgroundColor: ['#EF4444', '#F97316', '#FACC15', '#10B981', '#6366F1', '#EC4899'],
            hoverBackgroundColor: ['#DC2626', '#EA580C', '#EAB308', '#059669', '#4F46E5', '#DB2777'],
        }],
    };

    return (
        <div className="space-y-6">
            {/* Resumen General */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-6 rounded-xl" style={{ backgroundColor: 'var(--card-bg)', borderLeft: '4px solid #EF4444' }}>
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle size={20} className="text-red-600" />
                        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Deuda Total</p>
                    </div>
                    <p className="text-2xl font-bold text-red-600">
                        {formatearMoneda(creditSummary.totalDebt)}
                    </p>
                </div>

                <div className="p-6 rounded-xl" style={{ backgroundColor: 'var(--card-bg)', borderLeft: '4px solid #F97316' }}>
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={20} className="text-orange-600" />
                        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Intereses Generados</p>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">
                        {formatearMoneda(creditSummary.totalInterest)}
                    </p>
                </div>

                <div className="p-6 rounded-xl" style={{ backgroundColor: 'var(--card-bg)', borderLeft: '4px solid #6366F1' }}>
                    <div className="flex items-center gap-2 mb-2">
                        <CreditCard size={20} className="text-indigo-600" />
                        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Cupo Total</p>
                    </div>
                    <p className="text-2xl font-bold text-indigo-600">
                        {formatearMoneda(creditSummary.totalCreditLimit)}
                    </p>
                </div>

                <div className="p-6 rounded-xl" style={{ backgroundColor: 'var(--card-bg)', borderLeft: '4px solid #10B981' }}>
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign size={20} className="text-green-600" />
                        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Cupo Disponible</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                        {formatearMoneda(creditSummary.totalAvailable)}
                    </p>
                </div>
            </div>

            {/* Uso de Cupo por Tarjeta */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico */}
                <div className="p-6 rounded-xl" style={{ backgroundColor: 'var(--card-bg)' }}>
                    <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                        Distribución de Deuda por Tarjeta
                    </h3>
                    <div className="h-64 flex items-center justify-center">
                        <Doughnut
                            data={usageChartData}
                            options={{
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: {
                                            color: 'var(--text-primary)'
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Detalle por Tarjeta */}
                <div className="p-6 rounded-xl" style={{ backgroundColor: 'var(--card-bg)' }}>
                    <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                        Uso de Cupo por Tarjeta
                    </h3>
                    <div className="space-y-4">
                        {creditSummary.creditUsage.map(card => (
                            <div key={card.id} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                        {card.name}
                                    </span>
                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        {card.percentage.toFixed(1)}% usado
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                    <div
                                        className={`h-3 rounded-full transition-all ${card.percentage > 80 ? 'bg-red-600' :
                                            card.percentage > 50 ? 'bg-orange-500' :
                                                'bg-green-500'
                                            }`}
                                        style={{ width: `${Math.min(card.percentage, 100)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                                    <span>Usado: {formatearMoneda(card.used)}</span>
                                    <span>Disponible: {formatearMoneda(card.available)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tabla de Transacciones a Crédito */}
            <div className="p-6 rounded-xl" style={{ backgroundColor: 'var(--card-bg)' }}>
                <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                    Compras a Crédito Recientes
                </h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>
                                    Descripción
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>
                                    Tarjeta
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>
                                    Monto
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>
                                    Cuotas
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>
                                    Interés
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>
                                    Total
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>
                                    Cuota Mensual
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {creditTransactions.slice(0, 10).map((transaction) => (
                                <tr key={transaction.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                                        {transaction.title}
                                    </td>
                                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        {transaction.accountName}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-semibold" style={{ color: 'var(--text-primary)' }}>
                                        {formatearMoneda(transaction.amount)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--text-secondary)' }}>
                                        {transaction.installments}x
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-semibold text-orange-600">
                                        {formatearMoneda(transaction.interestAmount)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-bold" style={{ color: 'var(--text-primary)' }}>
                                        {formatearMoneda(transaction.totalAmount)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-semibold text-indigo-600">
                                        {formatearMoneda(transaction.monthlyPayment)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {creditTransactions.length === 0 && (
                        <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                            No hay compras a crédito registradas
                        </div>
                    )}
                </div>
            </div>

            {/* Análisis Profundo */}
            <div className="p-6 rounded-xl" style={{ backgroundColor: 'var(--card-bg)' }}>
                <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
                    📊 Análisis Profundo de Crédito
                </h3>

                {/* Métricas Clave */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign size={18} className="text-blue-600" />
                            <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Total Gastado</p>
                        </div>
                        <p className="text-xl font-bold text-blue-600">
                            {formatearMoneda(deepAnalysis.totalSpent)}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                            {deepAnalysis.totalPurchases} compras
                        </p>
                    </div>

                    <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp size={18} className="text-orange-600" />
                            <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Intereses Pagados</p>
                        </div>
                        <p className="text-xl font-bold text-orange-600">
                            {formatearMoneda(deepAnalysis.totalInterestGenerated)}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                            Tasa promedio: {deepAnalysis.weightedInterestRate}%
                        </p>
                    </div>

                    <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        <div className="flex items-center gap-2 mb-2">
                            <CreditCard size={18} className="text-green-600" />
                            <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Total Pagado</p>
                        </div>
                        <p className="text-xl font-bold text-green-600">
                            {formatearMoneda(deepAnalysis.totalPaid)}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                            {deepAnalysis.totalPayments} pagos realizados
                        </p>
                    </div>
                </div>

                {/* Gráficos de Tendencias */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Compras por Mes */}
                    {deepAnalysis.purchasesByMonth.length > 0 && (
                        <div>
                            <h4 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                                Compras a Crédito por Mes
                            </h4>
                            <div className="h-64">
                                <Bar
                                    data={{
                                        labels: deepAnalysis.purchasesByMonth.map(([month]) => month),
                                        datasets: [{
                                            label: 'Compras',
                                            data: deepAnalysis.purchasesByMonth.map(([, amount]) => amount),
                                            backgroundColor: '#3B82F6',
                                        }]
                                    }}
                                    options={{
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: { display: false }
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                ticks: {
                                                    callback: (value) => `$${(value / 1000).toFixed(0)}k`
                                                }
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Categorías más Usadas */}
                    {deepAnalysis.categorySpending.length > 0 && (
                        <div>
                            <h4 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                                Categorías más Usadas en Crédito
                            </h4>
                            <div className="space-y-3">
                                {deepAnalysis.categorySpending.slice(0, 5).map(([category, amount]) => {
                                    const percentage = (amount / deepAnalysis.totalSpent) * 100;
                                    return (
                                        <div key={category}>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                    {category}
                                                </span>
                                                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                    {formatearMoneda(amount)} ({percentage.toFixed(1)}%)
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="h-2 rounded-full bg-indigo-600"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Estadísticas Adicionales */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border-l-4 border-purple-500" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Promedio de Cuotas
                        </p>
                        <p className="text-2xl font-bold text-purple-600">
                            {deepAnalysis.avgInstallments} cuotas
                        </p>
                    </div>

                    <div className="p-4 rounded-lg border-l-4 border-pink-500" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Costo de Intereses vs Compras
                        </p>
                        <p className="text-2xl font-bold text-pink-600">
                            {deepAnalysis.totalSpent > 0 ? ((deepAnalysis.totalInterestGenerated / deepAnalysis.totalSpent) * 100).toFixed(1) : 0}%
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
