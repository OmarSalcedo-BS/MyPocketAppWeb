import { Notificacion } from '../../components/ui/Notificacion';
import { IconName } from '../../components/ui/IconName';
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
  User,
  Info,
  CreditCard,
  CalendarHeart
} from 'lucide-react';
import { getInitial } from '../../utils/ExtractorIniciales';
import Swal from 'sweetalert2';
import { frasesRandom } from '../../utils/FrasesRandom';
import { generateNotifications } from '../../services/analisisService';
import { api } from '../../api/servicios';
import { formatearMoneda } from '../../utils/FormateoValores';
import { useState, useEffect } from 'react';


const DashboardLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);

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

  // Verificar si hay tarjetas de crédito
  const hasCreditCards = accounts.some(acc => acc.type === 'Crédito');

  const navItems = [
    { icon: LayoutDashboard, label: 'Resumen', path: '/dashboard' },
    { icon: ArrowRightLeft, label: 'Transacciones', path: '/dashboard/transactions' },
    { icon: Wallet, label: 'Cuentas', path: '/dashboard/accounts' },
    { icon: PieChart, label: 'Análisis', path: '/dashboard/analytics' },
    ...(hasCreditCards ? [{ icon: CreditCard, label: 'Créditos', path: '/dashboard/credits' }] : []),
    { icon: CalendarHeart, label: 'Suscripciones', path: '/dashboard/subscriptions' },
    { icon: Info, label: 'Acerca de', path: '/dashboard/about' }
  ];

  const [frase, setFrase] = useState({});
  const [notifications, setNotifications] = useState(() => {
    // Cargar notificaciones del localStorage
    const saved = localStorage.getItem('notifications');
    const today = new Date().toDateString();

    if (saved) {
      const { date, data } = JSON.parse(saved);
      // Si es del mismo día, cargar las notificaciones guardadas
      if (date === today) {
        return data;
      }
    }
    return [];
  });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });

  // Guardar notificaciones en localStorage
  useEffect(() => {
    const today = new Date().toDateString();
    localStorage.setItem('notifications', JSON.stringify({
      date: today,
      data: notifications
    }));
  }, [notifications]);

  useEffect(() => {
    const randomFrase = frasesRandom();
    setFrase(randomFrase);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );

    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 5000);
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, isRead: true }))
    );

    // Auto-eliminar todas después de 5 segundos
    setTimeout(() => {
      setNotifications([]);
    }, 5000);
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newValue = !prev;
      localStorage.setItem('darkMode', newValue.toString());
      return newValue;
    });
  };

  const loadDataAndGenerateNotifications = async () => {
    try {
      const accountsData = await api.getAllAccounts();
      const transactionsData = await api.getAllTransactions();
      const subscriptionsData = await api.getAllSubscriptions();

      setAccounts(accountsData);
      setTransactions(transactionsData);

      // Verificar si ya se generaron notificaciones hoy
      const today = new Date().toDateString();
      const lastGenerated = localStorage.getItem('lastNotificationDate');

      // Solo generar notificaciones si es un nuevo día
      if (lastGenerated !== today) {
        const autoNotifications = generateNotifications(transactionsData, accountsData);

        // Generar notificaciones de suscripciones
        const subscriptionNotifications = [];
        const suscripcionesActivas = subscriptionsData.filter(sub => sub.status === 'active');

        suscripcionesActivas.forEach(sub => {
          if (sub.nextPayment) {
            const fechaPago = new Date(sub.nextPayment);
            const ahora = new Date();
            const diferenciaDias = Math.ceil((fechaPago - ahora) / (1000 * 60 * 60 * 24));

            // Notificación para pagos vencidos
            if (fechaPago < ahora) {
              subscriptionNotifications.push({
                id: `sub-overdue-${sub.id}`,
                title: '⚠️ Pago de suscripción vencido',
                message: `El pago de ${sub.name} está vencido. Se procesará automáticamente cuando haya fondos.`,
                type: 'warning',
                isRead: false,
                timestamp: new Date().toISOString()
              });
            }
            // Notificación para pagos próximos (2 días o menos)
            else if (diferenciaDias <= 2 && diferenciaDias >= 0) {
              subscriptionNotifications.push({
                id: `sub-upcoming-${sub.id}`,
                title: `📅 Pago de ${sub.name} próximo`,
                message: `Se cobrará $${sub.cost.toLocaleString('es-CO')} en ${diferenciaDias} día${diferenciaDias !== 1 ? 's' : ''}`,
                type: 'info',
                isRead: false,
                timestamp: new Date().toISOString()
              });
            }
          }
        });

        // Combinar notificaciones de análisis y suscripciones
        const allNotifications = [...autoNotifications, ...subscriptionNotifications];

        // Reemplazar notificaciones con las nuevas del día
        setNotifications(allNotifications);
        localStorage.setItem('lastNotificationDate', today);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };

  useEffect(() => {
    loadDataAndGenerateNotifications();

    // Listener para nuevas notificaciones dinámicas (ej: pagos procesados)
    const handleNewNotification = (event) => {
      setNotifications(prev => [event.detail, ...prev]);
    };

    window.addEventListener('newNotification', handleNewNotification);

    // Verificar cada hora si cambió el día
    const interval = setInterval(() => {
      const today = new Date().toDateString();
      const lastGenerated = localStorage.getItem('lastNotificationDate');

      if (lastGenerated !== today) {
        loadDataAndGenerateNotifications();
      }
    }, 60 * 60 * 1000); // Cada hora

    return () => {
      clearInterval(interval);
      window.removeEventListener('newNotification', handleNewNotification);
    };
  }, []);

  return (
    <div className="min-h-screen flex font-sans transition-colors duration-300" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>

      {/* Sidebar Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0 shadow-xl ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`} style={{ backgroundColor: 'var(--sidebar-bg)', color: 'var(--sidebar-text)' }}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b flex items-center gap-3 flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <span className="text-xl font-bold tracking-tight">MyPocket</span>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'hover:bg-[var(--sidebar-hover)]'
                    }`}
                  style={!isActive ? { color: 'var(--sidebar-text)' } : {}}
                >
                  <item.icon size={20} className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-[var(--sidebar-hover)] hover:text-rose-500 transition-all duration-200"
              style={{ color: 'var(--sidebar-text)' }}
            >
              <LogOut size={20} />
              <span className="font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">

        {/* Header */}
        <header className="h-20 border-b flex items-center justify-between px-6 sticky top-0 z-40 bg-opacity-90 backdrop-blur-sm transition-colors duration-300"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-4 md:hidden">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600">
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
            <span className="font-bold text-slate-800">MyPocket</span>
          </div>

          <div className="hidden md:block">
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Hola, {localStorage.getItem('name')}👋</h2>
            <p style={{ color: 'var(--text-secondary)' }}>{frase.frase} <span className="text-indigo-600">"{frase.autor}"</span></p>
          </div>

          <div className="flex items-center gap-4">
            <Notificacion alerts={notifications} markAsRead={markAsRead} deleteNotification={deleteNotification} markAllAsRead={markAllAsRead} />
            <IconName toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
          </div>
        </header>

        <div className="p-6 max-w-7xl mx-auto w-full">
          <div
            key={location.pathname}
            className="page-transition"
          >
            <Outlet />
          </div>
        </div>

      </div>

      {/* MOBILE MENU OVERLAY */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>

          {/* Menu Content */}
          <div className="absolute left-0 top-0 bottom-0 w-3/4 max-w-xs bg-white shadow-2xl p-6 flex flex-col animate-in slide-in-from-left duration-300" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="bg-indigo-600 text-white p-2 rounded-lg">
                  <DollarSign size={20} />
                </div>
                <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>MyPocket</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X size={24} />
              </button>
            </div>

            <nav className="flex-1 space-y-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'hover:bg-slate-50'
                      }`}
                    style={isActive ? {} : { color: 'var(--text-secondary)' }}
                  >
                    <item.icon size={20} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="pt-6 border-t border-slate-100 mt-auto">
              <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                  {getInitial(localStorage.getItem('name'))}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                    {localStorage.getItem('name')}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                    Usuario
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-all"
              >
                <LogOut size={20} />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardLayout;