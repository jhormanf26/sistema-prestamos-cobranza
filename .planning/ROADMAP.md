# Roadmap - Funcionalidad de Pre-aprobados

## Milestones
- [ ] Milestone 1: Infraestructura y Datos (Actual)
- [ ] Milestone 2: Backend y Lógica de Notificación
- [ ] Milestone 3: Interfaz de Usuario y Ajustes Finales

## Milestone 1: Infraestructura y Datos
- [ ] **Fase 1: Base de Datos**
  - [ ] Agregar columna `monto_preaprobado` a `clientes`.
  - [ ] Insertar plantilla `prestamo_preaprobado` en `plantillas_correo`.
- [ ] **Fase 2: Modelos**
  - [ ] Actualizar `ClienteModel.js` para persistir `monto_preaprobado`.

## Milestone 2: Backend y Lógica de Notificación
- [ ] **Fase 3: Servicio de Correo**
  - [ ] Implementar `plantillaPreaprobado` en `utils/emailService.js`.
- [ ] **Fase 4: Controlador y Rutas**
  - [ ] Crear endpoint `/clientes/enviar-preaprobado/:id` en `clientesController.js`.
  - [ ] Registrar ruta en `routes/clientes.js`.

## Milestone 3: Interfaz de Usuario
- [ ] **Fase 5: Formularios de Cliente**
  - [ ] Agregar campo `monto_preaprobado` en `crear.ejs` y `editar.ejs`.
- [ ] **Fase 6: Perfil del Cliente**
  - [ ] Mostrar indicador de pre-aprobado en `perfil.ejs`.
  - [ ] Implementar botón de envío de correo con feedback (SweetAlert2).
