# Estado del Proyecto - Sistema de Préstamos

## Contexto Actual
Se ha implementado con éxito el formateo de moneda estilo Colombia (separadores de miles con punto) en todo el sistema. Además, se han añadido máscaras de entrada en tiempo real en todos los formularios para que los usuarios vean los puntos de miles mientras escriben.

## Tareas Completadas
1. **[HECHO]** Implementar formateo de moneda estilo Colombia ($ 100.000) en tablas y reportes.
2. **[HECHO]** Implementar máscaras de miles dinámicas en inputs de formularios (Préstamos, Simulador, Caja, Ahorros, Gastos, Empeños).
3. **[HECHO]** Centralizar la lógica de formateo en `utils/formatters.js` y `footer.ejs`.
4. **[HECHO]** Asegurar la compatibilidad con el servidor limpiando los valores no numéricos antes de cada envío de formulario (POST).
5. **[HECHO]** Automatizar la versión del sistema en el login vinculándola a `package.json`.
6. **[HECHO]** Añadir campo de observaciones a los préstamos (Base de datos, Modelo, Controlador y Vistas).
7. **[HECHO]** Añadir plantillas de correo para ahorros (depósito y retiro) en BD y UI.
8. **[HECHO]** Implementar configuración de adjuntos PDF dinámicos para la plantilla de Préstamo Aprobado.
9. **[HECHO]** Crear sistema de gestión de Plantillas PDF (Cláusulas y Textos legales) editables desde la UI.
10. **[HECHO]** Vincular la fecha de inicio a la simulación de préstamos y mostrar la fecha final estimada en tiempo real.
11. **[HECHO]** Corregir desfase de zona horaria en el cálculo de fechas de préstamos tanto en frontend como en backend.
12. **[HECHO]** Implementar gestión de Monto Pre-aprobado en clientes (Base de Datos, Modelo y Vistas).
13. **[HECHO]** Desarrollar sistema de notificación por correo para créditos pre-aprobados con plantilla premium editable.
14. **[HECHO]** Integrar indicadores visuales y botones de acción en el perfil del cliente para la gestión de pre-aprobados.
15. **[HECHO]** Corregir error de truncado de datos al usar frecuencia "Quincenal" en préstamos (Actualización de ENUM en BD).
16. **[HECHO]** Agregar variables `{{fecha_primer_pago}}` y `{{fecha_fin}}` a las plantillas de contrato PDF y corregir formato de fechas locales.
17. **[HECHO]** Implementar nuevos gráficos de análisis de rentabilidad en el Dashboard (Capital vs Ganancias Reales).
18. **[HECHO]** Crear Landing Page promocional independiente en la carpeta `/landing` con diseño premium y simulador interactivo.
19. **[HECHO]** Implementar formateo dinámico con separadores de miles en el simulador de la landing page.
20. **[HECHO]** Implementar página de error 429 (Rate Limit) premium con diseño Glassmorphism y contador de tiempo real.
21. **[HECHO]** Refactorizar la aplicación de `analyticsLimiter` para excluir rutas administrativas (`/promocion/detalle`) y evitar bloqueos al usuario.
22. **[HECHO]** Aumentar el límite de peticiones de 50 a 100 en la ventana de 15 minutos para mayor estabilidad.
23. **[HECHO]** Implementar selectores de periodo (7, 15, 30 días) en el gráfico de "Evolución de Gastos" y mejorar la persistencia de filtros en el dashboard.
24. **[HECHO]** Implementar "Empty States" visuales (iconos y mensajes) en todos los gráficos del dashboard para evitar espacios en blanco cuando no hay datos.
25. **[HECHO]** Implementar selectores de periodo (7, 15, 30 días) en el gráfico de "Tendencia de Actividad" (Marketing).
26. **[HECHO]** Implementar nuevas frecuencias "Bimensual" y "Trimensual" para los préstamos (Actualización de ENUM en BD, lógica financiera y Vistas UI).
27. **[HECHO]** Implementar configuración de visibilidad dinámica para ocultar/mostrar módulos en el menú lateral desde el panel de administración.
28. **[HECHO]** Implementar visualización de la fecha de la próxima cuota y su monto restante en la vista del cliente (Portal del Cliente) con diseño premium e indicador de cuotas vencidas.
29. **[HECHO]** Escribir pruebas unitarias TDD completas para validar el cálculo preciso de la próxima cuota pendiente.
30. **[HECHO]** Implementar funcionalidad de edición y configuración de metas de ahorro (Nombre y Monto Objetivo) en Cuentas de Ahorro, con máscara de entrada en tiempo real y persistencia en BD.
31. **[HECHO]** Escribir pruebas de integración en BD real para la actualización de metas de ahorro.
32. **[HECHO]** Implementar Portal del Cliente - Módulo de Gestión de Pagos con comprobantes, input editable administrativo para corregir montos y su impacto en caja.
33. **[HECHO]** Implementar Portal del Cliente - Módulo Loyalty con banner interactivo de Cupo Pre-aprobado y edición de parámetros de solicitud.
34. **[HECHO]** Implementar Portal del Cliente - Chat Interno bidireccional tipo Messenger con polling reactivo silencioso por DOMParser y burbujas personalizadas.
35. **[HECHO]** Desarrollar suite de pruebas TDD de integración de mejoras del portal de clientes validando flujos de solicitudes, abonos corregidos e integridad del chat de soporte.
36. **[HECHO]** Implementar configuración de canales de pago Nequi y Bre-B/Transfiya desde el panel de administración, permitiendo su parametrización dinámica y sincronización en tiempo real con el Portal de Clientes.
37. **[HECHO]** Crear una nueva suite de pruebas TDD (`tests/canalesPago.test.js`) para garantizar que la persistencia y recuperación de los nuevos parámetros de pago se realice de forma íntegra.
38. **[HECHO]** Integrar local e independientemente el formateador global `formatCurrency` y la máscara de moneda interactiva `applyCurrencyMask` en el Portal del Cliente, permitiendo la visualización con puntos de miles en tiempo real (ej. `20.000`) en el modal de reportes de abono.
39. **[HECHO]** Reemplazar las alertas (`alert()`) y diálogos de confirmación (`confirm()`) nativos por diálogos SweetAlert2 interactivos, animados y con estilos premium adaptados a la interfaz en el panel de Auditoría de Comprobantes.
40. **[HECHO]** Diseñar e implementar el envío automatizado de correo electrónico de notificación de rechazo de comprobante de pago con plantilla HTML premium (`plantillaRechazoPago` en `emailService.js`) que describe los motivos definidos por el administrador.
41. **[HECHO]** Desarrollar la sección visual premium de "Mis Reportes de Pago" en el Portal del Cliente (`dashboard.ejs`), listando en tiempo real todos los comprobantes enviados, sus estados (Pendiente, Aprobado, Rechazado) y un botón interactivo SweetAlert2 para consultar el motivo de rechazo en caso de denegación.
42. **[HECHO]** Integrar sección interactiva colapsable premium "Ver Historial de Pagos" dentro de cada tarjeta de Préstamo Activo en el Portal del Cliente, listando en tiempo real el historial de abonos reales aplicados.
43. **[HECHO]** Añadir opción premium de acceso rápido "Mis Reportes" en el menú de la barra lateral izquierda del Portal de Clientes con scroll suave reactivo en JavaScript y redirección anclada.
44. **[HECHO]** Registrar formalmente la plantilla de correo `pago_rechazado` en la base de datos MySQL (tabla `plantillas_correo`) y en el archivo de volcado `bk_basededatos.sql`, haciéndola 100% editable por el administrador desde el panel de control y completamente dinámica (TDD verificado al 100%).
45. **[HECHO]** Diseñar e implementar indicadores visuales (badges animados) de mensajes sin leer en la barra lateral del administrador y en el Portal del Cliente, y corregir bug de la bandeja de soporte (c.no_leidos a c.sin_leer) para un feedback en tiempo real 100% verificado por TDD.
46. **[HECHO]** Implementar indicadores de soporte premium condicionales en cabeceras móviles (menú hamburguesa flotante) y un banner destacado estilo Glassmorphism en el Dashboard del Portal del Cliente, 100% cubierto por pruebas de integración TDD (`tests/portalClientesAlertas.test.js`).
47. **[HECHO]** Corregir error de enrutamiento `Cannot GET /admin/soporte` en producción agregando los middlewares de carga de archivos (`uploadAudio.js` y `uploadImage.js`) que habían quedado fuera del commit anterior.
48. **[HECHO]** Añadir soporte para el Banco de Bogotá en la sección de canales de desembolso de la Landing Page (`landing/index.html`), utilizando su respectivo logo `bogota.png` (TDD verificado al 100%).
49. **[HECHO]** Integrar Asistente de IA (Chatbot) flotante con diseño premium Glassmorphic en el Portal de Clientes, comunicándose de manera asíncrona mediante el SDK de Groq y el modelo `llama-3.1-8b-instant` con inyección segura de contexto financiero en tiempo real (créditos activos, cuotas, próximas fechas de pago y cuentas de ahorro) y verificado al 100% por pruebas TDD (`tests/asistenteIa.test.js`).
50. **[HECHO]** Implementar módulo genérico de expediente digital y subida de documentos (cédula en PDF/imagen) desde el Portal del Cliente, con auditoría administrativa (aprobar/rechazar con motivos) en el panel admin, carga directa por parte del administrador y notificaciones asíncronas automáticas por correo electrónico para ambas partes.

## Fase actual: Fase 2 - Potenciación de Ventas y Analítica Avanzada 🚀

### ¿Qué se ha implementado?
- [x] **Prueba Social Real**: El sistema ahora muestra notificaciones dinámicas de actividades reales (simulaciones y leads) capturadas de la base de datos.
- [x] **Botón de Llamada Directa**: Implementado botón flotante con animación de pulso para contacto inmediato.
- [x] **Tasa de Conversión (CR)**: El dashboard ahora calcula y grafica la efectividad de la landing page (Visitas vs Leads).
- [x] **Mapa de Calor (Scroll Depth)**: Se añadieron rastreadores al 25%, 50%, 75% y 90% para entender el comportamiento del usuario.
- [x] **Lista de Leads Marketing**: Tabla de acceso rápido a prospectos con botón directo a WhatsApp.
- [x] **Funcionalidad PWA (App Móvil)**: El sistema ahora es instalable en celulares y PCs como una aplicación nativa, con iconos personalizados y apertura a pantalla completa.
- [x] **Mejoras del Portal del Cliente**: Implementados los módulos de Gestión de Pagos con corrección administrativa, Loyalty con simulador y Chat de Soporte bidireccional neobanco con soporte de imágenes y visor Lightbox.

### Decisiones técnicas:
- Se implementó un Service Worker básico para cumplir con los requisitos de instalación de Chrome/Safari.
- Se generaron iconos de 192px y 512px con IA para una apariencia premium en el inicio del celular.
- La Tasa de Conversión se basa en *Visitantes Únicos* vs *Leads* para mayor precisión real.
- El botón de llamada se configuró en el lado izquierdo para no interferir con el botón de WhatsApp (derecha).
- Para el chat de soporte se optó por un enfoque XHR silencioso ("HTML-over-wire") utilizando `DOMParser()` para procesar la lista de mensajes sin endpoints JSON dedicados duplicados, optimizando la latencia y la coherencia visual.
- El abono corregido por el administrador impacta directamente la caja del sistema y actualiza el saldo del préstamo de forma transaccional precisa.
- La suite de pruebas TDD se diseñó con un enfoque autolimpiable dinámico, autodetectando datos existentes de clientes, préstamos y usuarios administradores en base de datos para no violar restricciones de integridad referencial.
- Se implementó la subida de imágenes (JPEG, PNG, WEBP, GIF) en el chat de soporte bidireccional, permitiendo adjuntar capturas, fotos y recibos de forma interactiva y visualizarlos mediante un Lightbox premium con zoom a pantalla completa.

### Pendiente:
- Monitorear la carga de la base de datos con el aumento de eventos de scroll.
- Considerar un sistema de "Heatmap" visual (Canvas) en futuras fases.

## Decisiones de Diseño
- Se utiliza `Intl.NumberFormat` con el locale `es-CO` para garantizar la consistencia según el estándar colombiano.
- Se mantiene el uso de 2 decimales en la mayoría de los casos financieros para evitar errores de redondeo, pero con separador de miles de punto.
- La versión del sistema se lee dinámicamente de `package.json` mediante `app.locals.version` en `app.js`. Para incrementar la versión, se debe usar `npm run version:patch`.
- Se añadió la columna `observaciones` (TEXT) a la tabla `prestamos`. La información es capturada al crear el crédito y es visible tanto en el cronograma como en la tabla principal (reemplazando la columna de monto prestado).
- Las plantillas de ahorro se diseñarán con una estética premium consistente con las de préstamos, utilizando `ahorro_deposito` y `ahorro_retiro` como slugs.
- Se añadió la columna `adjuntos_config` (JSON) a `plantillas_correo` para permitir que el usuario elija qué PDFs adjuntar (Contrato, Ticket, Cronograma) en la plantilla de Préstamo Aprobado.
- Se implementó un sistema de **Plantillas PDF** donde los textos legales y cláusulas se almacenan en la tabla `plantillas_pdf` y se inyectan dinámicamente en `pdfService.js`, permitiendo su edición sin modificar código.
- Se corrigió el manejo de fechas añadiendo el sufijo `T00:00:00` al crear objetos `Date` desde strings `YYYY-MM-DD`, garantizando que se interpreten en la zona horaria local y no en UTC.
- Se actualizó la columna `frecuencia` de la tabla `prestamos` para incluir el valor `quincenal` en el ENUM, resolviendo el error de truncado de datos al crear préstamos con esta frecuencia.
- Los comprobantes de pago subidos por el cliente al Portal se procesan mediante `multer` con validación de extensión y peso, vinculándose mediante una tabla relacional `comprobantes_pago` con estado `pendiente`, `aprobado` o `rechazado`.
- El chat de soporte utiliza clases CSS con nomenclatura BEM para separar los estados de "mensaje saliente" (cliente) y "mensaje entrante" (admin), asegurando que el diseño responsivo se mantenga en dispositivos móviles sin necesidad de media queries complejas.
- Se implementaron diálogos interactivos de SweetAlert2 con estilos HSL a la medida (`customClass` vinculada a clases Bootstrap) en la sección de Auditoría de Comprobantes para reemplazar la rigidez y asincronía tosca del `confirm()` y `alert()` del navegador por confirmaciones asíncronas fluidas y animadas.
- Para el historial de pagos y reportes de abonos en el Portal de Clientes, se inyecta en el objeto del préstamo los abonos reales aprobados mediante `PagoModel.obtenerHistorial()` y se renderiza un colapsable premium interactivo en cada tarjeta. Para asegurar la encontrabilidad y facilidad de acceso a "Mis Reportes de Pago" (que por defecto se renderiza en la parte inferior del Dashboard), se añadió un enlace anclado `/portal-cliente#seccion-reportes` en la barra lateral con interceptación en JS para realizar un scroll suave (smooth) de manera inmediata y fluida.
- La plantilla de correo de rechazo de pago (`pago_rechazado`) se registró en la tabla `plantillas_correo` de la base de datos y se inyectó en el volcado de la base de datos `bk_basededatos.sql`, haciéndola completamente editable y dinámica a través de `emailService` y el panel administrativo.
- Se implementaron indicadores visuales dinámicos (badges de Bootstrap 5 con la clase de animación `animate-pulse` de Tailwind incorporada como estilo local) en el sidebar del administrador y en el Portal del Cliente. Los contadores se calculan en tiempo real mediante un middleware global asíncrono y ultra-eficiente en `app.js` que consulta la base de datos de soporte sólo si hay una sesión activa, garantizando alta escalabilidad e impacto visual inmediato.
- Se corrigió un bug en la Bandeja de Soporte administrativa donde se intentaba evaluar `c.no_leidos` en lugar de `c.sin_leer` devuelto por la consulta SQL, logrando que los badges de mensajes no leídos se muestren de forma fiable en la lista de chats activos.
- Para alertar de manera inmersiva al cliente sobre respuestas de soporte técnico, se inyectaron estilos de animación global `.animate-pulse` con transiciones de opacidad en `head.ejs` para evitar interferir con layouts CSS de Bootstrap. Se instalaron bolitas rojas animadas flotantes sobre el menú hamburguesa móvil (`#openSidebarBtn`) en el Dashboard, Perfil y Chat del Portal del Cliente. Adicionalmente, se diseñó un banner premium de alerta estilo Glassmorphism en la zona de resúmenes del Dashboard de escritorio y móvil, enlazando directamente al chat interno y 100% verificado por pruebas TDD.
- **Lightbox de Zoom Premium en Chat**: Para la visualización de imágenes interactivas enviadas en soporte, se implementó un Lightbox estilizado con SweetAlert2. Su estructura utiliza delegación de eventos nativos en los contenedores de mensajes, evitando que el polling silencioso periódico rompa la interactividad al actualizar el DOM y garantizando una experiencia ultra fluida e inmersiva.
- **Impuestos MercadoPago (Retefuente e ICA)**: Se ajustó la fórmula en `mercadopagoController.js` para que el cliente absorba también los porcentajes de Retefuente (1.5%) e ICA (0.414%), garantizando que el `montoNeto` que ingresa a la empresa sea exacto tras todas las retenciones realizadas por la pasarela de pagos. Se actualizó la suite de TDD correspondiente.
- **Máscara de Moneda en Pasarela MP**: Se implementó la clase `currency-input` dinámica en el modal de MercadoPago, permitiendo que el cliente vea los separadores de miles (ej. 12.000) al tipear su abono. Se garantizó la sanitización del string antes de recalcular la comisión visual y antes de enviar el payload mediante Fetch API, evitando fallos matemáticos (`NaN`) y cobros erróneos por decimales.
- **Sincronización Canales de Pago Nequi/BreB**: Se inyectó globalmente el objeto `empresa` (desde la tabla de configuración administrativa) en el renderizado del `portalClienteController.js`. Esto soluciona un comportamiento de fallback visual donde la vista del Portal mostraba números telefónicos de marcador de posición (3123456789) en lugar de los canales reales configurados para reportar abonos.
- **Limpieza de Marcadores de Relleno (Fallback)**: Se reemplazó de forma global en controladores, rutas y vistas el número telefónico por defecto (`3123456789`) por un guion doble (`--`). Esto evita confusiones con los clientes que pudieran pensar que ese número quemado en código correspondía a una cuenta bancaria válida a la que debían depositar su dinero en caso de que la administración no hubiera configurado sus propios canales.
- **Asistente de IA con Groq (Llama-3.1)**: La integración utiliza el SDK oficial `groq-sdk` para conectarse al modelo `llama-3.1-8b-instant`. El backend reúne información de múltiples modelos (`ClienteModel`, `PrestamoModel`, `PagoModel`, `AhorroModel`, `ConfigModel`) para construir un System Prompt de contexto detallado con la situación financiera real del cliente en sesión. La interfaz visual flotante con diseño Glassmorphic mantiene memoria del chat enviando el historial de mensajes acumulados, y su comportamiento fue verificado de forma segura simulando las llamadas mediante TDD (`tests/asistenteIa.test.js`) con mocks.
- **Expediente Digital y Carga de Cédulas**: Se implementó una base de datos relacional para soportar múltiples archivos por cliente (`clientes_documentos`). El cliente carga sus archivos en el portal a través de una zona drag-and-drop interactiva y es notificado por correo sobre aprobaciones o rechazos (los cuales muestran observaciones ingresadas por el admin). La subida desde la administración crea registros marcados como aprobados por defecto. Las notificaciones a los administradores se dirigen al correo configurado de la empresa (`email_contacto`).

