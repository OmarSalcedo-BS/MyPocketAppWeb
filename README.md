# 💰 MyPocket App Web

![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-7.2.4-646CFF?logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1.17-38B2AC?logo=tailwind-css)
![License](https://img.shields.io/badge/License-Open%20Source-green)

**MyPocket** es una aplicación web de gestión financiera personal desarrollada con **React**, **Vite** y **Tailwind CSS**. Este proyecto es de **código abierto** y está diseñado como una herramienta colaborativa para aprender y practicar tecnologías modernas de desarrollo web.

---

## 📋 Descripción del Proyecto

MyPocket permite a los usuarios gestionar sus finanzas personales de manera sencilla y visual. Actualmente cuenta con funcionalidades de autenticación (Login y Registro) y está en desarrollo activo para agregar más características.

### 🎯 Objetivos del Proyecto

- Aprender y practicar **React** y **Vite**
- Implementar diseño moderno con **Tailwind CSS**
- Trabajar con **json-server** como backend simulado
- Fomentar la colaboración en proyectos de código abierto
- Aplicar buenas prácticas de desarrollo frontend

---

## ✨ Funcionalidades Actuales

- ✅ **Sistema de Autenticación**

  - Registro de usuarios con validación
  - Inicio de sesión con credenciales
  - Almacenamiento local de sesión
  - Validación de correos duplicados

- ✅ **Interfaz de Usuario**

  - Diseño moderno y responsivo
  - Componentes reutilizables (Button, Modal, Card, Loader)
  - Animaciones y transiciones suaves
  - Feedback visual con modales de éxito/error

- ✅ **Navegación**
  - Enrutamiento con React Router DOM
  - Protección de rutas (en desarrollo)
  - Redirecciones automáticas

---

## 🛠️ Tecnologías Utilizadas

### Frontend

- **React** 19.2.0 - Biblioteca de UI
- **Vite** 7.2.4 - Build tool y dev server
- **React Router DOM** 6.30.2 - Navegación
- **Tailwind CSS** 4.1.17 - Estilos y diseño
- **Lucide React** 0.554.0 - Iconos
- **Styled Components** 6.1.19 - Estilos en componentes

### Backend (Simulado)

- **json-server** 1.0.0-beta.3 - API REST simulada

### Herramientas de Desarrollo

- **ESLint** - Linter de código
- **SWC** - Compilador rápido para React

---

## 🚀 Instalación y Configuración

### Prerrequisitos

- **Node.js** (versión 16 o superior)
- **npm** o **yarn**
- **Git**

### 1. Clonar el Repositorio

```bash
git clone https://github.com/OmarSalcedo-BS/MyPocketAppWeb.git
cd MyPocketAppWeb
```

### 2. Instalar Dependencias

```bash
npm install
```

Esto instalará todas las dependencias necesarias listadas en `package.json`:

**Dependencias principales:**

- `react` y `react-dom`
- `react-router-dom`
- `tailwindcss` y `@tailwindcss/vite`
- `lucide-react`
- `styled-components`
- `json-server`

**Dependencias de desarrollo:**

- `vite`
- `@vitejs/plugin-react-swc`
- `eslint` y plugins relacionados

### 3. Configurar Variables de Entorno (Opcional)

El proyecto usa `http://localhost:3001` como URL del servidor JSON. Si necesitas cambiar el puerto, edita el archivo `src/services/authService.js`:

```javascript
const API_URL = "http://localhost:3001";
```

---

## 🖥️ Desplegar el Servidor JSON

El proyecto utiliza **json-server** para simular una API REST. El archivo `db.json` contiene la base de datos simulada.

### Opción 1: Ejecutar Solo el Servidor

```bash
npm run server
```

Esto iniciará json-server en `http://localhost:3001` con los siguientes endpoints:

- `GET/POST http://localhost:3001/users` - Usuarios
- `GET/POST http://localhost:3001/accounts` - Cuentas
- `GET/POST http://localhost:3001/transactions` - Transacciones

### Opción 2: Ejecutar Servidor + Aplicación Simultáneamente

```bash
npm start
```

Este comando ejecuta concurrentemente:

- **Vite dev server** en `http://localhost:5173`
- **json-server** en `http://localhost:3001`

### Opción 3: Solo la Aplicación (sin servidor)

```bash
npm run dev
```

---

## 📂 Estructura del Proyecto

```
my-pocketWeb/
├── public/              # Archivos estáticos
│   ├── Background.png
│   ├── Background2.png
│   └── LogoApp.png
├── src/
│   ├── assets/          # Recursos (imágenes, iconos)
│   ├── components/      # Componentes reutilizables
│   │   ├── layouts/     # Layouts (DashboardLayout)
│   │   └── ui/          # Componentes UI (Button, Modal, Card, Loader)
│   ├── pages/           # Páginas de la aplicación
│   │   ├── auth/        # LoginPage, RegisterPage
│   │   └── dashboard/   # Home (Dashboard)
│   ├── services/        # Servicios (authService)
│   ├── App.jsx          # Componente principal
│   ├── main.jsx         # Punto de entrada
│   └── index.css        # Estilos globales
├── db.json              # Base de datos simulada (json-server)
├── package.json         # Dependencias y scripts
├── vite.config.js       # Configuración de Vite
└── README.md            # Este archivo
```

---

## 🎨 Scripts Disponibles

| Comando           | Descripción                              |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Inicia el servidor de desarrollo de Vite |
| `npm run server`  | Inicia json-server en el puerto 3001     |
| `npm start`       | Ejecuta dev + server simultáneamente     |
| `npm run build`   | Genera build de producción               |
| `npm run preview` | Previsualiza el build de producción      |
| `npm run lint`    | Ejecuta ESLint para verificar código     |

---

## 🤝 Contribuir al Proyecto

¡Este es un proyecto de **código abierto** y colaborativo! Cualquier persona puede hacer fork del repositorio y contribuir.

### Cómo Contribuir

1. **Fork** el repositorio
2. **Clona** tu fork localmente
   ```bash
   git clone https://github.com/TU_USUARIO/MyPocketAppWeb.git
   ```
3. **Crea una rama** para tu feature
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```
4. **Realiza tus cambios** y haz commit
   ```bash
   git add .
   git commit -m "Descripción de los cambios"
   ```
5. **Push** a tu fork
   ```bash
   git push origin feature/nueva-funcionalidad
   ```
6. **Abre un Pull Request** en el repositorio original

### Áreas de Contribución

- 🐛 Corrección de bugs
- ✨ Nuevas funcionalidades
- 📝 Documentación
- 🎨 Mejoras de UI/UX
- ♿ Accesibilidad
- 🌐 Internacionalización
- 🧪 Tests

---

## 🗺️ Roadmap

- [ ] Dashboard con resumen financiero
- [ ] Gestión de cuentas bancarias
- [ ] Registro de transacciones (ingresos/gastos)
- [ ] Gráficos y estadísticas
- [ ] Categorización de gastos
- [ ] Exportación de datos (CSV, PDF)
- [ ] Modo oscuro
- [ ] Autenticación con JWT
- [ ] Backend real (Node.js/Express)
- [ ] Base de datos (MongoDB/PostgreSQL)

---

## 📝 Licencia

Este proyecto es creado por mi, Omar Salcedo, es de **código abierto** y está disponible para cualquier persona que desee aprender, modificar o contribuir.

---

## 👥 Autores

- **Omar Salcedo** - [GitHub](https://github.com/OmarSalcedo-BS)

---

## 🙏 Agradecimientos

Este proyecto es una herramienta de aprendizaje colaborativo. Agradecemos a todos los que contribuyan y compartan conocimiento.

---

## 📧 Contacto

Si tienes preguntas, sugerencias o quieres colaborar, no dudes en abrir un **Issue** o contactar a través de GitHub.

---

**¡Feliz codificación! 🚀**
