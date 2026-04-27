# 💰 Sistema de Préstamos y Cobranza v1.3.1

![NodeJS](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)

Una plataforma integral y profesional diseñada para la gestión eficiente de carteras de préstamos, ahorros, empeños y finanzas personales o empresariales.

---

## 🚀 Características Principales

### 🏦 Gestión de Préstamos
- **Creación Dinámica:** Cálculo automático de intereses y cuotas según frecuencia (diario, semanal, mensual).
- **Cronogramas de Pago:** Generación de tablas de amortización detalladas en PDF.
- **Contratos Legales:** Emisión de contratos profesionales con cláusulas editables.

### 💸 Cobranzas y Pagos
- **Registro de Pagos:** Control de abonos con generación de tickets térmicos.
- **Notificaciones:** Envío automático de recibos y recordatorios por correo electrónico.
- **Estados de Cuenta:** Reportes integrales para los clientes en formato PDF.

### 📈 Módulos Financieros Adicionales
- **Cuentas de Ahorro:** Gestión de depósitos y retiros con seguimiento de metas.
- **Cadenas de Ahorro:** Sistema de ahorro grupal (cadenas/natilleras) con gestión de turnos y ciclos.
- **Empeños:** Control de artículos en custodia, tasación y recuperación.
- **Gestión de Gastos:** Clasificación y monitoreo de egresos operativos.

### 🛠 Herramientas de Administración
- **Dashboard en Tiempo Real:** Estadísticas visuales de ingresos, egresos y carteras activas.
- **Control de Caja:** Apertura y cierre de sesiones con balance diario.
- **Plantillas Personalizables:** Editor de plantillas HTML para correos y textos legales para PDFs.
- **Seguridad:** Autenticación por roles (Admin/Empleado) y cifrado de contraseñas con Bcrypt.

---

## 💻 Tech Stack

- **Backend:** Node.js, Express.js
- **Frontend:** EJS (Embedded JavaScript templates), Bootstrap 5, Vanilla JS
- **Base de Datos:** MySQL 8.0+
- **Documentación:** PDFKit (Contratos/Reportes), ExcelJS (Exportaciones)
- **Notificaciones:** Nodemailer (SMTP)

---

## ⚙️ Instalación y Configuración

### 1. Requisitos Previos
- Node.js (v18 o superior)
- MySQL Server

### 2. Clonar y Configurar
```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd sistema-prestamos-cobranza

# Instalar dependencias
npm install
```

### 3. Configuración del Entorno
Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASS=tu_password
DB_NAME=sistema_prestamos

EMAIL_USER=tu_correo@gmail.com
EMAIL_PASS=tu_password_de_aplicacion
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
```

### 4. Base de Datos
Importa el archivo `bk_basededatos.sql` en tu servidor MySQL para inicializar la estructura y los datos base.

### 5. Ejecutar
```bash
# Modo desarrollo
npm run dev

# Modo producción
npm start
```

---

## 📂 Estructura del Proyecto

```text
├── config/             # Configuración de BD y variables
├── controllers/        # Lógica de negocio por módulo
├── middleware/         # Verificación de sesiones y roles
├── models/             # Modelos de datos (Queries SQL)
├── public/             # Archivos estáticos (CSS, JS, Imágenes)
├── routes/             # Definición de endpoints
├── utils/              # Servicios (PDF, Email, Formateo)
├── views/              # Vistas EJS (Frontend)
└── app.js              # Punto de entrada de la aplicación
```

---

## 🎨 Diseño y Experiencia de Usuario
El sistema utiliza una interfaz **Premium Dark Mode & Glassmorphism** en el dashboard, con un enfoque en la legibilidad y facilidad de uso. Todos los montos están formateados según el estándar de moneda local (COP/Punto de miles) para una mejor comprensión financiera.

---

## ⚖️ Licencia
Este proyecto es propiedad privada. Consulta los términos de uso en el sistema.

---
*Desarrollado con ❤️ para la gestión financiera inteligente.*
