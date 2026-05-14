# Requerimientos: Sistema de Préstamos Pre-aprobados

## Descripción
El usuario desea que en el perfil del cliente se muestre información sobre préstamos pre-aprobados. Además, debe ser posible enviar un correo electrónico al cliente informándole sobre este monto pre-aprobado.

## Requerimientos Funcionales
1. **Gestión de Monto Pre-aprobado**:
   - Permitir asignar un monto pre-aprobado a cada cliente desde el formulario de creación/edición.
   - Mostrar el monto pre-aprobado de forma destacada en el perfil del cliente.
2. **Notificación por Correo**:
   - Botón en el perfil del cliente para enviar un correo de notificación.
   - Plantilla de correo editable desde el sistema (como las existentes).
   - El correo debe incluir el nombre del cliente y el monto pre-aprobado.

## Requerimientos Técnicos
- **Base de Datos**: Nueva columna `monto_preaprobado` en la tabla `clientes`.
- **Plantillas**: Nueva entrada en `plantillas_correo` con slug `prestamo_preaprobado`.
- **UI**: Uso de componentes existentes y estética premium.
