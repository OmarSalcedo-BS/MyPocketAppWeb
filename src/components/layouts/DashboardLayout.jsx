import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  ArrowRightLeft,
  PieChart,
  Settings,
  LogOut,
  DollarSign,
  Bell,
  Menu,
  X,
  User
} from 'lucide-react';
import { getInitial } from '../../utils/ExtractorIniciales';
import Swal from 'sweetalert2';

const DashboardLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('name');
    Swal.fire({
      icon: 'success',
      title: 'Cerrando sesión, hasta pronto! 👋',
      text: 'Hasta pronto',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#4F46E5'
    });
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Resumen', path: '/dashboard' },
    { icon: ArrowRightLeft, label: 'Transacciones', path: '/dashboard/transactions' },
    { icon: Wallet, label: 'Cuentas', path: '/dashboard/accounts' },
    { icon: PieChart, label: 'Análisis', path: '/dashboard/analytics' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">

      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col fixed h-full z-20">
        <div className="p-6 flex items-center gap-2">
          <div className="bg-indigo-600 text-white p-2 rounded-lg">
            <DollarSign size={20} />
          </div>
          <span className="text-xl font-bold text-slate-800">MyPocket</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium hover:text-rose-600 hover:bg-rose-100 transition-all hover:cursor-pointer"
          >
            <LogOut size={25} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 min-h-screen flex flex-col">

        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 md:hidden">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600">
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
            <span className="font-bold text-slate-800">MyPocket</span>
          </div>

          <div className="hidden md:block">
            <h2 className="text-xl font-semibold text-slate-800">Hola, {localStorage.getItem('name')}👋</h2>
            <p className="text-sm text-slate-500">Aquí tienes el resumen financiero de hoy.</p>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm">
              {getInitial(localStorage.getItem('name'))}
            </div>
          </div>
        </header>

        <div className="p-6 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>

      </main>
    </div>
  );
};

export default DashboardLayout;