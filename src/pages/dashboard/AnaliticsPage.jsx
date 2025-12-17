import React, { useState, useEffect, useMemo } from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { getCategoryTotals, getMonthlyNetBalance } from '../../services/analisisService';
import { api } from '../../api/servicios';
import { CreditAnalysis } from '../../components/credit/CreditAnalysis';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export const AnalyticsPage = () => {
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('general'); // 'general' o 'credit'

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [transactionsData, accountsData] = await Promise.all([
                api.getAllTransactions(),
                api.getAllAccounts()
            ]);
            setTransactions(transactionsData);
            setAccounts(accountsData);
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const expenseTotals = useMemo(() => getCategoryTotals(transactions, 'expense'), [transactions]);
    const chartDataCategory = {
        labels: Object.keys(expenseTotals),
        datasets: [{
            data: Object.values(expenseTotals),
            backgroundColor: ['#EF4444', '#F97316', '#FACC15', '#10B981', '#6366F1', '#EC4899'],
            hoverBackgroundColor: ['#DC2626', '#EA580C', '#EAB308', '#059669', '#4F46E5', '#DB2777'],
        }],
    };

    const monthlyBalanceData = useMemo(() => getMonthlyNetBalance(transactions), [transactions]);
    const chartDataBalance = {
        labels: monthlyBalanceData.map(([key]) => key),
        datasets: [{
            label: 'Saldo Neto Mensual',
            data: monthlyBalanceData.map(([, value]) => value),
            backgroundColor: monthlyBalanceData.map(([, value]) => value >= 0 ? '#10B981' : '#EF4444'),
        }],
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className='space-y-8'>
            <div className="flex items-center justify-between">
                <h1 className='text-3xl font-bold' style={{ color: 'var(--text-primary)' }}>📊 Análisis y Desempeño Financiero</h1>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <button
                    onClick={() => setActiveTab('general')}
                    className={`px-6 py-3 font-semibold transition-all ${activeTab === 'general'
                            ? 'border-b-2 border-indigo-600 text-indigo-600'
                            : 'hover:bg-opacity-10'
                        }`}
                    style={activeTab !== 'general' ? { color: 'var(--text-secondary)' } : {}}
                >
                    Análisis General
                </button>
                <button
                    onClick={() => setActiveTab('credit')}
                    className={`px-6 py-3 font-semibold transition-all ${activeTab === 'credit'
                            ? 'border-b-2 border-indigo-600 text-indigo-600'
                            : 'hover:bg-opacity-10'
                        }`}
                    style={activeTab !== 'credit' ? { color: 'var(--text-secondary)' } : {}}
                >
                    Análisis de Crédito
                </button>
            </div>

            {/* Content */}
            {activeTab === 'general' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className='p-6 rounded-xl shadow-lg' style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}>
                        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Distribución de Gastos (Total Acumulado)</h2>
                        <div className='h-96 flex items-center justify-center'>
                            {Object.keys(expenseTotals).length > 0 ? (
                                <Doughnut data={chartDataCategory} options={{ maintainAspectRatio: false }} />
                            ) : (
                                <p style={{ color: 'var(--text-secondary)' }}>No hay datos de gastos disponibles</p>
                            )}
                        </div>
                    </div>

                    <div className="p-6 rounded-xl shadow-lg" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}>
                        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Evolución del Saldo Neto Mensual</h2>
                        <div className="h-96">
                            {monthlyBalanceData.length > 0 ? (
                                <Bar data={chartDataBalance} options={{ maintainAspectRatio: false }} />
                            ) : (
                                <p style={{ color: 'var(--text-secondary)' }}>No hay datos mensuales disponibles</p>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <CreditAnalysis transactions={transactions} accounts={accounts} />
            )}
        </div>
    );
};