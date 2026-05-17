# 💰 Sistema de Préstamos y Cobranza Pro v1.6.8

![NodeJS](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Ready-orange?style=for-the-badge&logo=pwa&logoColor=white)
![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)

**Sistema de Préstamos y Cobranza Pro** es una solución de grado empresarial para la gestión integral de carteras financieras, ahorros, empeños y análisis de marketing. Diseñado para ser escalable, seguro y fácil de usar desde cualquier dispositivo.

---

## 📸 Interfaz Visual

<div align="center">
  <div style="flex: 1;">
      <h3>Login</h3>
      <img width="1917" height="956" alt="image" src="https://github.com/user-attachments/assets/eeecba52-72b2-40ee-b40e-1aa5557ba396" />
    </div>
  <h3>Panel de Control Principal</h3>
  <img width="1919" height="958" alt="image" src="https://github.com/user-attachments/assets/8141d8c4-f73c-49b5-87f1-6d82b0625b83" />
  <p><i>Dashboard interactivo con métricas financieras y estados de cartera en tiempo real.</i></p>

  <br>

  <div style="display: flex; gap: 10px; justify-content: center;">
    <div style="flex: 1;">
      <h3>Analítica de Marketing</h3>
      <img width="1527" height="885" alt="image" src="https://github.com/user-attachments/assets/92cbd4d6-c051-4d4d-9e12-ca1394e76486" />
    </div>
    <div style="flex: 1;">
      <h3>Landing Page Optimizada</h3>
      <img width="1918" height="945" alt="image" src="https://github.com/user-attachments/assets/a767628b-803f-4c80-857e-2ac2f6265873" />
    </div>
  </div>
  <p><i>Seguimiento del embudo de conversión y experiencia de usuario optimizada para ventas. url: https://prestamos.desarollo.site/promocion/ </i></p>
</div>

---

## 🚀 Módulos y Funcionalidades

### 1. 🏦 Gestión de Préstamos y Cobros
*   **Creación Flexibles**: Préstamos con frecuencias diarias, semanales, quincenales y mensuales.
*   **Cálculo de Mora**: Sistema automatizado de intereses por mora configurables por el administrador.
*   **Cronogramas**: Generación de tablas de amortización interactivas y descargables en PDF.
*   **Recibos Térmicos**: Generación de tickets de pago compatibles con impresoras POS (58mm/80mm).
*   **Contratos**: Emisión de contratos legales con firma del cliente y cláusulas personalizables.

### 2. 💎 Empeños y Custodia
*   **Control de Garantías**: Registro de artículos en prenda con fotografías y avalúos.
*   **Liquidación**: Gestión de intereses sobre empeños y procesos de recuperación de artículos.

### 3. 🤝 Ahorros y Cadenas (Natilleras)
*   **Ahorro Individual**: Seguimiento de depósitos y metas de ahorro.
*   **Cadenas Grupales**: Gestión de grupos de ahorro con asignación de turnos y ciclos automáticos.

### 4. 📊 Inteligencia de Negocio (BI) y Analytics
*   **Dashboard Avanzado**: Estadísticas en tiempo real con filtros dinámicos de 7, 15 y 30 días.
*   **Marketing Funnel**: Seguimiento del embudo de ventas (Visitas → Clics → Leads).
*   **Scroll Depth Tracking**: Análisis de engagement en la landing page.
*   **Flujo de Caja**: Gráficos comparativos de ingresos vs egresos por mes.

### 5. 🛠️ Herramientas Administrativas
*   **Caja y Auditoría**: Apertura y cierre de caja con balances detallados.
*   **Control de Gastos**: Registro de egresos operativos por categoría y usuario.
*   **Bitácora**: Registro de actividad del sistema para auditoría de acciones de usuarios.
*   **Plantillas**: Editor visual para plantillas de correo electrónico y reportes PDF.

---

## 📱 Capacidades PWA (Progressive Web App)
El sistema está optimizado para funcionar como una aplicación nativa:
*   **Instalación**: Botón de "Instalar" disponible en Chrome (PC) y "Añadir a pantalla de inicio" en móviles.
*   **Actualizaciones**: Service Worker con estrategia *Network First* para garantizar datos frescos y recuperación rápida.
*   **Offline Mode**: Acceso básico a la interfaz incluso sin conexión a internet.

---

## 🛡️ Seguridad y Resiliencia
*   **Rate Limiting**: Protección integrada contra ataques de fuerza bruta y spam en la analítica (Error 429 personalizado).
*   **Auth**: Cifrado de contraseñas con `bcryptjs` y gestión de sesiones segura.
*   **Licenciamiento**: Validación de licencia con soporte para modo offline, garantizando que el sistema nunca deje de operar.
*   **Backups**: Módulo de generación de respaldos de base de datos.

---

## 💻 Stack Tecnológico
*   **Backend**: Node.js + Express.js.
*   **Frontend**: EJS, Bootstrap 5, Chart.js 4.
*   **Base de Datos**: MySQL 8.0.
*   **Servicios**:
    *   `Nodemailer`: Gestión de correos electrónicos.
    *   `PDFKit`: Generación dinámica de contratos y reportes.
    *   `ExcelJS`: Exportación de datos masivos.

---

## ⚙️ Instalación

1.  **Clonar repositorio**:
    ```bash
    git clone https://github.com/jhormanf26/sistema-prestamos-cobranza.git
    cd sistema-prestamos-cobranza
    ```
2.  **Instalar dependencias**:
    ```bash
    npm install
    ```
3.  **Configurar `.env`**:
    ```env
    PORT=3000
    DB_HOST=localhost
    DB_USER=root
    DB_PASS=tu_clave
    DB_NAME=sistema_prestamos
    
    EMAIL_USER=tu_correo@gmail.com
    EMAIL_PASS=tu_password_de_aplicacion
    EMAIL_HOST=smtp.gmail.com
    EMAIL_PORT=465
    ```
4.  **Base de Datos**:
    Importar `bk_basededatos.sql` en MySQL.

5.  **Iniciar**:
    ```bash
    npm run dev
    ```

---

## 📂 Estructura del Código
*   `/controllers`: Lógica de negocio y manejo de peticiones.
*   `/models`: Consultas SQL optimizadas y lógica de persistencia.
*   `/routes`: Definición de endpoints y seguridad.
*   `/views`: Plantillas EJS modulares.
*   `/public`: Archivos estáticos, Service Workers y Manifest PWA.
*   `/utils`: Servicios de Email, PDF y formateo de datos.

---

## ⚖️ Licencia y Propiedad
Este software es propiedad de **Jhorman Fuentes**. Queda prohibida su reproducción o distribución sin autorización expresa.

---
*Desarrollado con pasión para el control financiero absoluto.*
