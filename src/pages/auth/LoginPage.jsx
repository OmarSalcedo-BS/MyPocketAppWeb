import React, { useState } from "react";
import { Button } from "../../components/ui/Button";
import { Link, useNavigate } from "react-router-dom";
import { Loader } from 'lucide-react';
import { authService } from "../../services/authService";
import Swal from 'sweetalert2';


export const LoginPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name === 'password' ? 'password' : 'email']: e.target.value
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await authService.login(formData.email, formData.password);

    if (result.success) {
      localStorage.setItem('token', 'true');
      localStorage.setItem('user', JSON.stringify(result.user));
      localStorage.setItem('name', result.user.name);

      // Toast de éxito
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer)
          toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
      });

      Toast.fire({
        icon: 'success',
        title: '¡Bienvenido de nuevo! 👋',
        text: `Inicio de sesión exitoso`
      });

      navigate("/dashboard");
    } else {
      // Modal de error
      Swal.fire({
        icon: 'error',
        title: 'Error al Iniciar Sesión',
        text: result.message,
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#4F46E5'
      });
    }
    setLoading(false);
  };


  return (
    <div className="min-h-screen flex bg-slate-50">

      {/*Background a la izquierda con imagen (CÓDIGO ORIGINAL DEL USUARIO MANTENIDO)*/}
      <div className="hidden lg:flex w-1/1 relative overflow-hidden items-center justify-center p-10">
        <img
          src="public/Background.png"
          alt="Background"
          className="absolute inset-0 w-full h-full object-fit"
          // Fallback para entornos donde la imagen no carga
          onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentElement.style.backgroundColor = '#1e3a8a'; }}
        />
        <div className="absolute inset-0 bg-indigo-900/60 mix-blend-multiply"></div>

        <div className="relative z-10 text-white max-w-lg">
          {/* Contenido de Branding agregado para llenar el espacio, respetando el contenedor original */}

        </div>
      </div>

      {/* DERECHA: Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-xl border border-slate-100">
          <h2 className="text-3xl font-bold text-slate-900">Bienvenido</h2>

          <form onSubmit={handleLogin} className="space-y-6 mt-8">
            {/* Input Correo */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Correo Electrónico</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                placeholder="ejemplo@correo.com"
                required
              />
            </div>
            {/* Input Contraseña */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Contraseña</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                placeholder="Contraseña"
                required
              />
            </div>

            <Button className="w-full" disabled={loading}>
              {loading ? <Loader /> : "Iniciar Sesión"}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              ¿No tienes cuenta?
              {/* Usamos Link en lugar de <a> para no recargar la página */}
              <Link to="/register" className="font-bold text-indigo-600 ml-1 hover:underline">
                Crear cuenta gratis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};