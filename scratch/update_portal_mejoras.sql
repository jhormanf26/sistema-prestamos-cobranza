-- =========================================================================
-- SCRIPT DE ACTUALIZACIÓN DE BASE DE DATOS (MIGRACIÓN DELTA)
-- Funcionalidad: Mejoras en el Portal del Cliente, Loyalty y Chat de Soporte
-- Entorno: Producción (Dockploy) y Desarrollo
-- =========================================================================

-- 1. Tabla de Reportes de Pago (Carga de Comprobantes de Clientes)
CREATE TABLE IF NOT EXISTS `reportes_pago` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `prestamo_id` INT NOT NULL,
  `cliente_id` INT NOT NULL,
  `monto` DECIMAL(15,2) NOT NULL,
  `comprobante_url` VARCHAR(255) NOT NULL,
  `fecha_reporte` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `estado` ENUM('pendiente', 'aprobado', 'rechazado') DEFAULT 'pendiente',
  `observaciones` TEXT,
  `fecha_validacion` TIMESTAMP NULL,
  `usuario_validador_id` INT NULL,
  FOREIGN KEY (`prestamo_id`) REFERENCES `prestamos`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`usuario_validador_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. Tabla de Solicitudes de Crédito (Fidelización - Cupo Pre-aprobado)
CREATE TABLE IF NOT EXISTS `solicitudes_credito` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cliente_id` INT NOT NULL,
  `monto_solicitado` DECIMAL(15,2) NOT NULL,
  `cuotas` INT NOT NULL,
  `frecuencia` VARCHAR(50) DEFAULT 'mensual',
  `estado` ENUM('pendiente', 'aprobado', 'rechazado') DEFAULT 'pendiente',
  `fecha_solicitud` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_resolucion` TIMESTAMP NULL,
  `usuario_resolutor_id` INT NULL,
  `comentarios` TEXT,
  FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`usuario_resolutor_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3. Tabla de Soporte y Chat Interno (Bidireccional)
CREATE TABLE IF NOT EXISTS `soporte_mensajes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cliente_id` INT NOT NULL,
  `usuario_id` INT NULL, -- NULL si lo envía el cliente
  `remitente` ENUM('cliente', 'administrador') NOT NULL,
  `mensaje` TEXT NOT NULL,
  `fecha_envio` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `leido` TINYINT(1) DEFAULT 0,
  FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
