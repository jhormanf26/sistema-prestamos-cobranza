# 💰 Ecosistema de Préstamos, Cobranza & Autogestión Pro v2.5.6

![NodeJS](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Ready-orange?style=for-the-badge&logo=pwa&logoColor=white)
![Groq AI](https://img.shields.io/badge/Groq_AI-Powered-purple?style=for-the-badge)

Solución de grado empresarial full-stack enfocada en la gestión financiera, cobranza en campo, autogestión de clientes y captación de leads. Este repositorio integra un **ecosistema de 4 aplicaciones/módulos especializados** diseñados para operar de forma articulada.

---

## 🌐 Estructura del Ecosistema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SISTEMA FINANCIERO Y COBRANZA                         │
└──────┬──────────────────────┬──────────────────────┬─────────────────┬──────┘
       │                      │                      │                 │
       ▼                      ▼                      ▼                 ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐    ┌──────────────┐
│  1. ERP Web  │      │  2. App PWA  │      │ 3. Portal    │    │  4. Landing  │
│  Admin & ERP │      │  Cobranza    │      │ Cliente + IA │    │ Promocional  │
└──────────────┘      └──────────────┘      └──────────────┘    └──────────────┘
```

---

## 📱 1. Aplicaciones del Ecosistema

### 🏢 1.1 ERP & Panel Administrativo (Web Admin)
Plataforma central de administración financiera y control operativo del negocio.
* **Gestión de Préstamos**: Creación de créditos (diarios, semanales, quincenales, mensuales), amortización interactiva y cálculo automático de mora configurable.
* **Ahorros y Cadenas (Natilleras)**: Control de ahorros individuales y gestión de grupos de ahorro con asignación de turnos y ciclos automáticos.
* **Empeños y Custodia**: Registro de prendas con fotografía, avalúos, liquidación e historial.
* **Caja y Tesorería**: Apertura/cierre de caja, control de egresos, flujo de caja y bitácora de auditoría.
* **Reportería**: Emisión de contratos legales, paz y salvos y reportes descargables en PDF y Excel (`PDFKit`, `ExcelJS`).

📸 Interfaz Visual

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
  </div>
</div>

### 📱 1.2 App Móvil de Cobranza en Campo (PWA Cobradores)
Aplicación optimizada para trabajo en ruta y recaudo diario por parte de cobradores.
* **Modo PWA & Offline**: Instalable en Android e iOS mediante Service Workers con estrategia *Network First*.
* **Impresión Térmica POS**: Generación y emisión de recibos de pago instantáneos compatibles con impresoras térmicas Bluetooth (58mm/80mm).
* **Notificaciones Push**: Alertas de cobro y recordatorios mediante `web-push`.
* **Registro de Pagos en Ruta**: Interfaz táctil ultrarrápida para registro de cuotas y abonos en tiempo real.

### 🤖 1.3 Portal de Autogestión & Asistente IA para Clientes
Portal privado de cara al cliente final para el seguimiento de sus créditos y ahorros.
* **Asistente de IA (Chatbot)**: Integración con **Groq AI (LLM)** para atención automática y respuesta a consultas 24/7.
* **Firma Digital con OTP**: Validación de identidad y firma electrónica de contratos de préstamo mediante códigos OTP.
* **Reporte de Pagos y Aportes**: Carga de comprobantes de pago/transferencia y solicitud de aumentos de cupo.
* **Chat Multimodal**: Soporte directo en tiempo real con envío de mensajes de texto, imágenes y notas de voz.
* **Paz y Salvo**: Descarga instantánea de certificado de paz y salvo al finalizar un préstamo.

### 📣 1.4 Landing Page Promocional & Analítica de Marketing
Página web pública orientada a la conversión y captación de prospectos.
* **Simulador de Crédito**: Calculadora interactiva de cuotas e intereses para potenciales clientes.
* **Integración WhatsApp API**: Enlace directo para inicio de conversación de venta.
* **Engine de Analítica de Marketing**: Tracking propio de métricas en tiempo real:
  * Registro de visitantes, clics y conversión a leads.
  * *Scroll Depth Tracking* (medición de profundidad de desplazamiento de los usuarios).
 
---

📸 Interfaz Visual
<div align="center">
  <div style="display: flex; gap: 10px; justify-content: center;">
    <div style="flex: 1;">
      <h3>Landing Page Optimizada</h3>
      <img width="1918" height="945" alt="image" src="https://github.com/user-attachments/assets/a767628b-803f-4c80-857e-2ac2f6265873" />
    </div>
  </div>
       <div style="display: flex; gap: 10px; justify-content: center;">
    <div style="flex: 1;">
      <h3>Simulador de crédito</h3>
      <img width="1896" height="952" alt="image" src="https://github.com/user-attachments/assets/56cafa6a-bf22-4cc6-94fa-7f7feeb68f62" />
    </div>
  </div>
  <p><i>Seguimiento del embudo de conversión y experiencia de usuario optimizada para ventas. url: https://prestamos.desaroollo.site/promocion/ </i></p>
</div>

---

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
|---|---|
| **Backend** | Node.js, Express.js |
| **IA & NLP** | Groq SDK (LLM API) |
| **Base de Datos** | MySQL 8.0 (`mysql2`) |
| **Frontend** | EJS Templates, Bootstrap 5, Chart.js 4, JavaScript ES6+ |
| **Mobile / PWA** | Web App Manifest, Service Workers, Web Push API |
| **Servicios & Utilities** | Nodemailer (Emails), PDFKit (Documentos/Recibos POS), ExcelJS (Data Export) |
| **Seguridad** | Bcryptjs, JWT, Express Rate Limit, OTP Auth |

---

## 📂 Rutas Principales por Aplicación

* **Panel Admin / ERP**: `/`
* **Portal Cliente**: `/portal-cliente/login`
* **Landing Page Promocional**: `/promocion/`
* **Analítica de Marketing**: `/analytics/dashboard`

---

## ⚙️ Instalación y Configuración

1. **Clonar repositorio**:
   ```bash
   git clone https://github.com/jhormanf26/sistema-prestamos-cobranza.git
   cd sistema-prestamos-cobranza
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar variables de entorno (`.env`)**:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=tu_password
   DB_NAME=sistema_prestamos
   
   EMAIL_USER=tu_correo@gmail.com
   EMAIL_PASS=tu_password_app
   GROQ_API_KEY=tu_groq_key
   ```

4. **Base de Datos**:
   Importar `bk_basededatos.sql` en tu servidor MySQL.

5. **Iniciar en Desarrollo**:
   ```bash
   npm run dev
   ```

---

## ⚖️ Licencia
Desarrollado por **Jhorman Fuentes**. Todos los derechos reservados.
