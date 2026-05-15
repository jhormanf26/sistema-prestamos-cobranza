# Plan de Implementación - Mejora de Rate Limit y UI de Seguridad

El usuario está experimentando un bloqueo por Rate Limit (error 429) con un mensaje de texto plano muy básico. El objetivo es transformar esta experiencia en una interfaz premium "Security Verification" con contador en tiempo real y ajustar la configuración para no afectar la experiencia administrativa.

## Pasos

1. **Modificar `app.js`**:
    - Actualizar `analyticsLimiter` para usar un `handler` que devuelva un HTML estilizado (Premium UI).
    - Ajustar los límites o la aplicación del middleware para que no bloquee agresivamente las vistas administrativas de `/promocion/detalle`.

2. **Refinar la Lógica de Bloqueo**:
    - Asegurar que el contador de tiempo en el frontend sea preciso.
    - Usar los estilos del sistema (Glassmorphism/Dark Mode) para que la página de error se sienta parte de la aplicación.

3. **Verificación**:
    - Simular el exceso de peticiones para validar la nueva UI.
