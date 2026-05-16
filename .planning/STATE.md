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

## Fase actual: Fase 2 - Potenciación de Ventas y Analítica Avanzada 🚀

### ¿Qué se ha implementado?
- [x] **Prueba Social Real**: El sistema ahora muestra notificaciones dinámicas de actividades reales (simulaciones y leads) capturadas de la base de datos.
- [x] **Botón de Llamada Directa**: Implementado botón flotante con animación de pulso para contacto inmediato.
- [x] **Tasa de Conversión (CR)**: El dashboard ahora calcula y grafica la efectividad de la landing page (Visitas vs Leads).
- [x] **Mapa de Calor (Scroll Depth)**: Se añadieron rastreadores al 25%, 50%, 75% y 90% para entender el comportamiento del usuario.
- [x] **Lista de Leads Marketing**: Tabla de acceso rápido a prospectos con botón directo a WhatsApp.
- [x] **Funcionalidad PWA (App Móvil)**: El sistema ahora es instalable en celulares y PCs como una aplicación nativa, con iconos personalizados y apertura a pantalla completa.

### Decisiones técnicas:
- Se implementó un Service Worker básico para cumplir con los requisitos de instalación de Chrome/Safari.
- Se generaron iconos de 192px y 512px con IA para una apariencia premium en el inicio del celular.
- La Tasa de Conversión se basa en *Visitantes Únicos* vs *Leads* para mayor precisión real.
- El botón de llamada se configuró en el lado izquierdo para no interferir con el botón de WhatsApp (derecha).

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
