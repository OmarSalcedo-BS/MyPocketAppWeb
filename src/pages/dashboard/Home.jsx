import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ArrowRightLeft, Wallet } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../api/servicios';
import { formatearMoneda } from '../../utils/FormateoValores';

const mockTransactions = [
  { id: 1, title: 'Supermercado Éxito', category: 'Alimentación', amount: -150000, type: 'expense', date: 'Hoy, 10:30 AM' },
  { id: 2, title: 'Pago Nómina', category: 'Salario', amount: 2500000, type: 'income', date: 'Ayer' },
  { id: 3, title: 'Transferencia Nequi', category: 'Transferencia', amount: -50000, type: 'transfer', date: 'Ayer' },
];

export const DashboardHome = () => {
  const [accounts, setAccounts] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await api.getAllAccounts();
      setAccounts(data);

      const total = data.reduce((sum, account) => sum + account.balance, 0);
      setTotalBalance(total);
    } catch (error) {
      console.error('Error al cargar cuentas:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden border-indigo-100">
          <div className="absolute right-0 top-0 p-4 opacity-5 text-indigo-600">
            <DollarSign size={100} />
          </div>
          <p className="text-slate-500 text-sm font-medium">Balance Total</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-1">
            {loading ? (
              <span className="animate-pulse">Cargando...</span>
            ) : (
              formatearMoneda(totalBalance)
            )}
          </h3>
          <div className="flex items-center gap-2 mt-4">
            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
              <TrendingUp size={12} /> +12%
            </span>
            <span className="text-slate-400 text-xs">vs mes anterior</span>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
              <TrendingUp size={20} />
            </div>
            <span className="text-slate-400 text-xs">Este mes</span>
          </div>
          <p className="text-slate-500 text-sm">Ingresos</p>
          <h3 className="text-2xl font-bold text-slate-800">$2,500,000</h3>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
              <TrendingDown size={20} />
            </div>
            <span className="text-slate-400 text-xs">Este mes</span>
          </div>
          <p className="text-slate-500 text-sm">Gastos</p>
          <h3 className="text-2xl font-bold text-slate-800">$680,000</h3>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-6">
          <Card className="h-80 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-bold text-slate-800">Análisis de Gastos</h4>
              <select className="bg-slate-50 border-none text-sm text-slate-500 rounded-lg p-2 outline-none">
                <option>Este año</option>
              </select>
            </div>
            <div className="flex-1 flex items-end gap-4 px-4 pb-4 border-b border-slate-100">
              {[40, 70, 45, 90, 65, 80, 55, 85].map((h, i) => (
                <div key={i} className="w-full bg-indigo-50 rounded-t-xl relative group hover:bg-indigo-100 transition-all cursor-pointer">
                  <div
                    style={{ height: `${h}%` }}
                    className="absolute bottom-0 w-full bg-indigo-500 rounded-t-xl opacity-80 group-hover:opacity-100 transition-all shadow-lg shadow-indigo-500/20"
                  ></div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-900 text-white !border-none">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-slate-400 text-sm">Disponible en Cuentas</p>
                <h3 className="text-3xl font-bold mt-1">
                  {loading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    formatearMoneda(totalBalance)
                  )}
                </h3>
              </div>
              <div className="p-2 bg-white/10 rounded-lg">
                <Wallet size={20} />
              </div>
            </div>
            <Button className="w-full">
              Nueva Transacción
            </Button>
          </Card>

          <div>
            <h3 className="font-bold text-slate-800 mb-4">Últimos Movimientos</h3>
            <div className="space-y-3">
              {mockTransactions.map((tx) => (
                <div key={tx.id} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${tx.type === 'expense' ? 'bg-rose-50 text-rose-600' :
                      tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                      {tx.type === 'expense' ? <TrendingDown size={16} /> :
                        tx.type === 'income' ? <TrendingUp size={16} /> :
                          <ArrowRightLeft size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">{tx.title}</p>
                      <p className="text-xs text-slate-400">{tx.date}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${tx.type === 'expense' ? 'text-rose-600' :
                    tx.type === 'income' ? 'text-emerald-600' :
                      'text-slate-600'
                    }`}>
                    {tx.type === 'expense' ? '-' : '+'}${Math.abs(tx.amount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};