-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Versión del servidor:         8.4.3 - MySQL Community Server - GPL
-- SO del servidor:              Win64
-- HeidiSQL Versión:             12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Volcando estructura de base de datos para sistema_prestamos
CREATE DATABASE IF NOT EXISTS `sistema_prestamos` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `sistema_prestamos`;

-- Volcando estructura para tabla sistema_prestamos.bitacora
CREATE TABLE IF NOT EXISTS `bitacora` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario` varchar(100) DEFAULT 'Sistema',
  `accion` varchar(50) DEFAULT NULL,
  `detalle` text,
  `fecha` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla sistema_prestamos.bitacora: ~4 rows (aproximadamente)
DELETE FROM `bitacora`;
INSERT INTO `bitacora` (`id`, `usuario`, `accion`, `detalle`, `fecha`) VALUES
	(1, 'Administrador', 'NUEVO_EMPENO', 'Item: LAPTOP', '2026-01-29 03:54:49'),
	(2, 'Administrador', 'REGISTRAR_GASTO', 'Se registró gasto: pago de delivery 1 por un monto de 10 (Otros)', '2026-01-29 04:34:46'),
	(3, 'Administrador', 'NUEVO_PRESTAMO', 'Se otorgó préstamo de 1000 al cliente ID: 1 (mensual)', '2026-01-29 05:33:30'),
	(4, 'Administrador', 'REGISTRAR_PAGO', 'Pago recibido de 100 para el préstamo #1', '2026-01-29 05:34:45'),
	(5, 'Administrador', 'REGISTRAR_PAGO', 'Pago recibido de 100 para el préstamo #1', '2026-01-29 05:36:35'),
	(6, 'Administrador', 'NUEVO_PRESTAMO', 'Monto: 1000 - Cliente ID: 1', '2026-02-17 15:05:43');

-- Volcando estructura para tabla sistema_prestamos.caja
CREATE TABLE IF NOT EXISTS `caja` (
  `id` int NOT NULL AUTO_INCREMENT,
  `concepto` varchar(255) NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `tipo` enum('ingreso','egreso') NOT NULL,
  `fecha` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `usuario` varchar(100) DEFAULT 'Sistema',
  `categoria` varchar(50) DEFAULT 'Varios',
  `usuario_id` int DEFAULT NULL,
  `referencia_id` int DEFAULT NULL COMMENT 'ID Préstamo o Empeño',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla sistema_prestamos.caja: ~3 rows (aproximadamente)
DELETE FROM `caja`;
INSERT INTO `caja` (`id`, `concepto`, `monto`, `tipo`, `fecha`, `usuario`, `categoria`, `usuario_id`, `referencia_id`) VALUES
	(1, 'Desembolso Empeño: NOTEBOOK', 300.00, 'egreso', '2026-01-24 06:00:37', 'Administrador', 'Varios', NULL, NULL),
	(2, 'Recuperación Empeño: NOTEBOOK', 300.00, 'ingreso', '2026-01-24 06:01:26', 'Administrador', 'Varios', NULL, NULL),
	(3, 'Desembolso Empeño: LAPTOP', 800.00, 'egreso', '2026-01-29 03:54:49', 'Administrador', 'Varios',  NULL, NULL);

-- Volcando estructura para tabla sistema_prestamos.caja_sesiones
CREATE TABLE IF NOT EXISTS `caja_sesiones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `monto_inicial` decimal(10,2) DEFAULT '0.00',
  `monto_final` decimal(10,2) DEFAULT '0.00',
  `fecha_apertura` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_cierre` datetime DEFAULT NULL,
  `estado` enum('abierta','cerrada') DEFAULT 'abierta',
  `usuario` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla sistema_prestamos.caja_sesiones: ~1 rows (aproximadamente)
DELETE FROM `caja_sesiones`;
INSERT INTO `caja_sesiones` (`id`, `monto_inicial`, `monto_final`, `fecha_apertura`, `fecha_cierre`, `estado`, `usuario`) VALUES
	(1, 100.00, 100.00, '2026-01-24 01:00:03', '2026-01-24 01:01:40', 'cerrada', 'Administrador'),
	(2, 0.00, 0.00, '2026-01-28 22:51:08', NULL, 'abierta', 'Administrador');

-- Volcando estructura para tabla sistema_prestamos.clientes
CREATE TABLE IF NOT EXISTS `clientes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dni` varchar(20) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `apellido` varchar(50) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `foto` varchar(255) DEFAULT NULL,
  `estado` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `dni` (`dni`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla sistema_prestamos.clientes: ~11 rows (aproximadamente)
DELETE FROM `clientes`;
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `apellido`, `telefono`, `direccion`, `email`, `created_at`, `foto`, `estado`) VALUES
	(1, '44444444', 'VICTOR', 'RAMOS', '90909090', 'direccion 1', 'cliente1@correo.com', '2026-01-29 03:53:11', NULL, 1),
	(2, '99000001', 'ClientePrueba1', 'Apellido1', '999888771', 'Av. Falsa 121', 'cliente1@prueba.com', '2026-03-26 17:31:47', NULL, 1),
	(3, '99000002', 'ClientePrueba2', 'Apellido2', '999888772', 'Av. Falsa 122', 'cliente2@prueba.com', '2026-03-26 17:31:47', NULL, 1),
	(4, '99000003', 'ClientePrueba3', 'Apellido3', '999888773', 'Av. Falsa 123', 'cliente3@prueba.com', '2026-03-26 17:31:47', NULL, 1),
	(5, '99000004', 'ClientePrueba4', 'Apellido4', '999888774', 'Av. Falsa 124', 'cliente4@prueba.com', '2026-03-26 17:31:47', NULL, 1),
	(6, '99000005', 'ClientePrueba5', 'Apellido5', '999888775', 'Av. Falsa 125', 'cliente5@prueba.com', '2026-03-26 17:31:47', NULL, 1),
	(7, '99000006', 'ClientePrueba6', 'Apellido6', '999888776', 'Av. Falsa 126', 'cliente6@prueba.com', '2026-03-26 17:31:47', NULL, 1),
	(8, '99000007', 'ClientePrueba7', 'Apellido7', '999888777', 'Av. Falsa 127', 'cliente7@prueba.com', '2026-03-26 17:31:47', NULL, 1),
	(9, '99000008', 'ClientePrueba8', 'Apellido8', '999888778', 'Av. Falsa 128', 'cliente8@prueba.com', '2026-03-26 17:31:47', NULL, 1),
	(10, '99000009', 'ClientePrueba9', 'Apellido9', '999888779', 'Av. Falsa 129', 'cliente9@prueba.com', '2026-03-26 17:31:47', NULL, 1),
	(11, '99000010', 'ClientePrueba10', 'Apellido10', '999888770', 'Av. Falsa 1210', 'cliente10@prueba.com', '2026-03-26 17:31:47', NULL, 1);

-- Volcando estructura para tabla sistema_prestamos.configuracion
CREATE TABLE IF NOT EXISTS `configuracion` (
  `id` int NOT NULL,
  `nombre_empresa` varchar(100) DEFAULT 'Mi Financiera',
  `ruc` varchar(20) DEFAULT '00000000000',
  `direccion` varchar(255) DEFAULT 'Dirección Principal',
  `telefono` varchar(50) DEFAULT '555-0000',
  `email_contacto` varchar(100) DEFAULT 'contacto@empresa.com',
  `logo` varchar(255) DEFAULT NULL,
  `moneda` varchar(5) DEFAULT '$',
  `interes_global` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla sistema_prestamos.configuracion: ~1 rows (aproximadamente)
DELETE FROM `configuracion`;
INSERT INTO `configuracion` (`id`, `nombre_empresa`, `ruc`, `direccion`, `telefono`, `email_contacto`, `logo`, `moneda`, `interes_global`) VALUES
	(1, 'Préstamos Pro', '00000000000', 'Calle Principal 123', '555-0000', 'contacto@empresa.com', 'logo-1775114231208-217650330.png', 'S/', 0.00);

-- Volcando estructura para tabla sistema_prestamos.cuentas_ahorro
CREATE TABLE IF NOT EXISTS `cuentas_ahorro` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int NOT NULL,
  `saldo_actual` decimal(12,2) DEFAULT '0.00',
  `meta_monto` decimal(12,2) DEFAULT NULL,
  `meta_nombre` varchar(100) DEFAULT NULL,
  `fecha_apertura` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cliente_id` (`cliente_id`),
  CONSTRAINT `cuentas_ahorro_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla sistema_prestamos.cuentas_ahorro: ~11 rows (aproximadamente)
DELETE FROM `cuentas_ahorro`;
INSERT INTO `cuentas_ahorro` (`id`, `cliente_id`, `saldo_actual`, `fecha_apertura`) VALUES
	(1, 1, 100.00, '2026-02-17 15:06:10'),
	(2, 2, 300.00, '2026-03-26 17:31:47'),
	(3, 3, 600.00, '2026-03-26 17:31:47'),
	(4, 4, 900.00, '2026-03-26 17:31:47'),
	(5, 5, 1200.00, '2026-03-26 17:31:47'),
	(6, 6, 1500.00, '2026-03-26 17:31:47'),
	(7, 7, 1800.00, '2026-03-26 17:31:47'),
	(8, 8, 2100.00, '2026-03-26 17:31:47'),
	(9, 9, 2400.00, '2026-03-26 17:31:47'),
	(10, 10, 2700.00, '2026-03-26 17:31:47'),
	(11, 11, 3000.00, '2026-03-26 17:31:47');

-- Volcando estructura para tabla sistema_prestamos.empenos
CREATE TABLE IF NOT EXISTS `empenos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int NOT NULL,
  `nombre_articulo` varchar(100) NOT NULL,
  `descripcion` text,
  `valor_tasacion` decimal(10,2) NOT NULL,
  `monto_prestado` decimal(10,2) NOT NULL,
  `fecha_limite` date NOT NULL,
  `estado` enum('en_custodia','devuelto','vendido') DEFAULT 'en_custodia',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `imagen` varchar(255) DEFAULT NULL,
  `fecha_retiro` datetime DEFAULT NULL,
  `monto_recuperado` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `cliente_id` (`cliente_id`),
  CONSTRAINT `empenos_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla sistema_prestamos.empenos: ~11 rows (aproximadamente)
DELETE FROM `empenos`;
INSERT INTO `empenos` (`id`, `cliente_id`, `nombre_articulo`, `descripcion`, `valor_tasacion`, `monto_prestado`, `fecha_limite`, `estado`, `created_at`, `imagen`, `fecha_retiro`, `monto_recuperado`) VALUES
	(1, 1, 'LAPTOP', 'x', 1000.00, 800.00, '2026-03-01', 'en_custodia', '2026-01-29 03:54:50', '1769658889892-978214396.png', NULL, 0.00),
	(2, 2, 'Artículo Prueba 1', 'Artículo de prueba', 1000.00, 500.00, '2026-05-26', 'en_custodia', '2026-03-26 17:31:47', NULL, NULL, 0.00),
	(3, 3, 'Artículo Prueba 2', 'Artículo de prueba', 1000.00, 500.00, '2026-05-26', 'devuelto', '2026-03-26 17:31:47', NULL, NULL, 0.00),
	(4, 4, 'Artículo Prueba 3', 'Artículo de prueba', 1000.00, 500.00, '2026-05-26', 'vendido', '2026-03-26 17:31:47', NULL, NULL, 0.00),
	(5, 5, 'Artículo Prueba 4', 'Artículo de prueba', 1000.00, 500.00, '2026-05-26', 'en_custodia', '2026-03-26 17:31:47', NULL, NULL, 0.00),
	(6, 6, 'Artículo Prueba 5', 'Artículo de prueba', 1000.00, 500.00, '2026-05-26', 'devuelto', '2026-03-26 17:31:47', NULL, NULL, 0.00),
	(7, 7, 'Artículo Prueba 6', 'Artículo de prueba', 1000.00, 500.00, '2026-05-26', 'vendido', '2026-03-26 17:31:47', NULL, NULL, 0.00),
	(8, 8, 'Artículo Prueba 7', 'Artículo de prueba', 1000.00, 500.00, '2026-05-26', 'en_custodia', '2026-03-26 17:31:47', NULL, NULL, 0.00),
	(9, 9, 'Artículo Prueba 8', 'Artículo de prueba', 1000.00, 500.00, '2026-05-26', 'devuelto', '2026-03-26 17:31:47', NULL, NULL, 0.00),
	(10, 10, 'Artículo Prueba 9', 'Artículo de prueba', 1000.00, 500.00, '2026-05-26', 'vendido', '2026-03-26 17:31:47', NULL, NULL, 0.00),
	(11, 11, 'Artículo Prueba 10', 'Artículo de prueba', 1000.00, 500.00, '2026-05-26', 'en_custodia', '2026-03-26 17:31:47', NULL, NULL, 0.00);

-- Volcando estructura para tabla sistema_prestamos.gastos
CREATE TABLE IF NOT EXISTS `gastos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(255) NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `categoria` varchar(50) NOT NULL,
  `fecha_gasto` date NOT NULL,
  `usuario_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `registrado_por` varchar(100) DEFAULT 'Sistema',
  `observacion` text,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `gastos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla sistema_prestamos.gastos: ~11 rows (aproximadamente)
DELETE FROM `gastos`;
INSERT INTO `gastos` (`id`, `descripcion`, `monto`, `categoria`, `fecha_gasto`, `usuario_id`, `created_at`, `registrado_por`, `observacion`) VALUES
	(1, 'pago de delivery 1', 10.00, 'Otros', '2026-01-28', NULL, '2026-01-29 04:34:46', 'Administrador', 'x'),
	(2, 'Gasto Prueba 1', 20.00, 'Servicios', '2026-03-26', NULL, '2026-03-26 17:31:47', 'Sistema', 'Gasto generado automáticamente'),
	(3, 'Gasto Prueba 2', 40.00, 'Suministros', '2026-03-26', NULL, '2026-03-26 17:31:47', 'Sistema', 'Gasto generado automáticamente'),
	(4, 'Gasto Prueba 3', 60.00, 'Otros', '2026-03-26', NULL, '2026-03-26 17:31:47', 'Sistema', 'Gasto generado automáticamente'),
	(5, 'Gasto Prueba 4', 80.00, 'Servicios', '2026-03-26', NULL, '2026-03-26 17:31:47', 'Sistema', 'Gasto generado automáticamente'),
	(6, 'Gasto Prueba 5', 100.00, 'Suministros', '2026-03-26', NULL, '2026-03-26 17:31:47', 'Sistema', 'Gasto generado automáticamente'),
	(7, 'Gasto Prueba 6', 120.00, 'Otros', '2026-03-26', NULL, '2026-03-26 17:31:47', 'Sistema', 'Gasto generado automáticamente'),
	(8, 'Gasto Prueba 7', 140.00, 'Servicios', '2026-03-26', NULL, '2026-03-26 17:31:47', 'Sistema', 'Gasto generado automáticamente'),
	(9, 'Gasto Prueba 8', 160.00, 'Suministros', '2026-03-26', NULL, '2026-03-26 17:31:47', 'Sistema', 'Gasto generado automáticamente'),
	(10, 'Gasto Prueba 9', 180.00, 'Otros', '2026-03-26', NULL, '2026-03-26 17:31:47', 'Sistema', 'Gasto generado automáticamente'),
	(11, 'Gasto Prueba 10', 200.00, 'Servicios', '2026-03-26', NULL, '2026-03-26 17:31:47', 'Sistema', 'Gasto generado automáticamente');

-- Volcando estructura para tabla sistema_prestamos.movimientos_ahorro
CREATE TABLE IF NOT EXISTS `movimientos_ahorro` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cuenta_id` int NOT NULL,
  `tipo_movimiento` enum('deposito','retiro','interes_ganado') NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `fecha_movimiento` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `observacion` text,
  PRIMARY KEY (`id`),
  KEY `cuenta_id` (`cuenta_id`),
  CONSTRAINT `movimientos_ahorro_ibfk_1` FOREIGN KEY (`cuenta_id`) REFERENCES `cuentas_ahorro` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla sistema_prestamos.movimientos_ahorro: ~11 rows (aproximadamente)
DELETE FROM `movimientos_ahorro`;
INSERT INTO `movimientos_ahorro` (`id`, `cuenta_id`, `tipo_movimiento`, `monto`, `fecha_movimiento`, `observacion`) VALUES
	(1, 1, 'deposito', 100.00, '2026-02-17 15:06:22', ''),
	(2, 2, 'deposito', 300.00, '2026-03-26 17:31:47', 'Depósito inicial de prueba'),
	(3, 3, 'deposito', 600.00, '2026-03-26 17:31:47', 'Depósito inicial de prueba'),
	(4, 4, 'deposito', 900.00, '2026-03-26 17:31:47', 'Depósito inicial de prueba'),
	(5, 5, 'deposito', 1200.00, '2026-03-26 17:31:47', 'Depósito inicial de prueba'),
	(6, 6, 'deposito', 1500.00, '2026-03-26 17:31:47', 'Depósito inicial de prueba'),
	(7, 7, 'deposito', 1800.00, '2026-03-26 17:31:47', 'Depósito inicial de prueba'),
	(8, 8, 'deposito', 2100.00, '2026-03-26 17:31:47', 'Depósito inicial de prueba'),
	(9, 9, 'deposito', 2400.00, '2026-03-26 17:31:47', 'Depósito inicial de prueba'),
	(10, 10, 'deposito', 2700.00, '2026-03-26 17:31:47', 'Depósito inicial de prueba'),
	(11, 11, 'deposito', 3000.00, '2026-03-26 17:31:47', 'Depósito inicial de prueba');

-- Volcando estructura para tabla sistema_prestamos.pagos
CREATE TABLE IF NOT EXISTS `pagos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `prestamo_id` int NOT NULL,
  `monto_pagado` decimal(10,2) NOT NULL,
  `fecha_pago` datetime DEFAULT CURRENT_TIMESTAMP,
  `observaciones` text,
  PRIMARY KEY (`id`),
  KEY `prestamo_id` (`prestamo_id`),
  CONSTRAINT `pagos_ibfk_1` FOREIGN KEY (`prestamo_id`) REFERENCES `prestamos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla sistema_prestamos.pagos: ~16 rows (aproximadamente)
DELETE FROM `pagos`;
INSERT INTO `pagos` (`id`, `prestamo_id`, `monto_pagado`, `fecha_pago`, `observaciones`) VALUES
	(1, 1, 100.00, '2026-01-29 00:34:45', 'primera cuota'),
	(2, 1, 100.00, '2026-01-29 00:36:35', 'cuota 2'),
	(3, 1, 100.00, '2026-01-29 01:38:51', 'x'),
	(4, 1, 100.00, '2026-01-29 02:24:22', 'h'),
	(5, 1, 100.00, '2026-01-29 02:27:16', 'j'),
	(6, 2, 100.00, '2026-02-17 10:06:58', ''),
	(7, 3, 120.00, '2026-03-26 12:31:47', 'Pago de cuota prueba'),
	(8, 4, 120.00, '2026-03-26 12:31:47', 'Pago de cuota prueba'),
	(9, 5, 120.00, '2026-03-26 12:31:47', 'Pago de cuota prueba'),
	(10, 6, 120.00, '2026-03-26 12:31:47', 'Pago de cuota prueba'),
	(11, 7, 120.00, '2026-03-26 12:31:47', 'Pago de cuota prueba'),
	(12, 8, 120.00, '2026-03-26 12:31:47', 'Pago de cuota prueba'),
	(13, 9, 120.00, '2026-03-26 12:31:47', 'Pago de cuota prueba'),
	(14, 10, 120.00, '2026-03-26 12:31:47', 'Pago de cuota prueba'),
	(15, 11, 120.00, '2026-03-26 12:31:47', 'Pago de cuota prueba'),
	(16, 12, 120.00, '2026-03-26 12:31:47', 'Pago de cuota prueba');

-- Volcando estructura para tabla sistema_prestamos.prestamos
CREATE TABLE IF NOT EXISTS `prestamos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int NOT NULL,
  `monto_prestado` decimal(10,2) NOT NULL,
  `tasa_interes` decimal(5,2) NOT NULL,
  `monto_total` decimal(10,2) NOT NULL,
  `cuotas` int NOT NULL,
  `frecuencia` enum('diario','semanal','mensual') NOT NULL,
  `estado` enum('pendiente','pagado','vencido') DEFAULT 'pendiente',
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `observaciones` text,
  PRIMARY KEY (`id`),
  KEY `cliente_id` (`cliente_id`),
  CONSTRAINT `prestamos_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla sistema_prestamos.prestamos: ~12 rows (aproximadamente)
DELETE FROM `prestamos`;
INSERT INTO `prestamos` (`id`, `cliente_id`, `monto_prestado`, `tasa_interes`, `monto_total`, `cuotas`, `frecuencia`, `estado`, `fecha_inicio`, `fecha_fin`) VALUES
	(1, 1, 1000.00, 20.00, 1200.00, 12, 'mensual', 'pendiente', '2026-01-29', '2027-01-29'),
	(2, 1, 1000.00, 20.00, 1200.00, 12, 'mensual', 'pendiente', '2026-02-17', '2027-02-17'),
	(3, 2, 500.00, 20.00, 600.00, 5, 'diario', 'pendiente', '2026-03-26', '2026-04-26'),
	(4, 3, 1000.00, 20.00, 1200.00, 5, 'semanal', 'pagado', '2026-03-26', '2026-04-26'),
	(5, 4, 1500.00, 20.00, 1800.00, 5, 'mensual', 'vencido', '2026-03-26', '2026-04-26'),
	(6, 5, 2000.00, 20.00, 2400.00, 5, 'diario', 'pendiente', '2026-03-26', '2026-04-26'),
	(7, 6, 2500.00, 20.00, 3000.00, 5, 'semanal', 'pagado', '2026-03-26', '2026-04-26'),
	(8, 7, 3000.00, 20.00, 3600.00, 5, 'mensual', 'vencido', '2026-03-26', '2026-04-26'),
	(9, 8, 3500.00, 20.00, 4200.00, 5, 'diario', 'pendiente', '2026-03-26', '2026-04-26'),
	(10, 9, 4000.00, 20.00, 4800.00, 5, 'semanal', 'pagado', '2026-03-26', '2026-04-26'),
	(11, 10, 4500.00, 20.00, 5400.00, 5, 'mensual', 'vencido', '2026-03-26', '2026-04-26'),
	(12, 11, 5000.00, 20.00, 6000.00, 5, 'diario', 'pendiente', '2026-03-26', '2026-04-26');

-- Volcando estructura para tabla sistema_prestamos.usuarios
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre_completo` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('admin','empleado') DEFAULT 'empleado',
  `estado` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla sistema_prestamos.usuarios: ~12 rows (aproximadamente)
DELETE FROM `usuarios`;
INSERT INTO `usuarios` (`id`, `nombre_completo`, `email`, `password`, `rol`, `estado`, `created_at`) VALUES
	(2, 'Administrador', 'admin@sistema.com', '$2b$10$Kjz3C2gtC9YvM/ZTh8qX6O3IkP3Ffvr6FiJhKV.qPcEVn7gvNzkVK', 'admin', 1, '2025-12-08 17:55:23'),
	(4, 'usuario', 'usuario@sistema.com', '$2b$10$/CqCh0VmOf4zgTL2g/I.4uZAKNMmw2QgJOueSXxqXgL6PM8.qyCEa', 'empleado', 0, '2026-01-29 04:57:53'),
	(5, 'EmpleadoPrueba1', 'empleado1@sistema.local', '$2b$10$Kjz3C2gtC9YvM/ZTh8qX6O3IkP3Ffvr6FiJhKV.qPcEVn7gvNzkVK', 'empleado', 1, '2026-03-26 17:31:47'),
	(6, 'EmpleadoPrueba2', 'empleado2@sistema.local', '$2b$10$Kjz3C2gtC9YvM/ZTh8qX6O3IkP3Ffvr6FiJhKV.qPcEVn7gvNzkVK', 'empleado', 1, '2026-03-26 17:31:47'),
	(7, 'EmpleadoPrueba3', 'empleado3@sistema.local', '$2b$10$Kjz3C2gtC9YvM/ZTh8qX6O3IkP3Ffvr6FiJhKV.qPcEVn7gvNzkVK', 'empleado', 1, '2026-03-26 17:31:47'),
	(8, 'EmpleadoPrueba4', 'empleado4@sistema.local', '$2b$10$Kjz3C2gtC9YvM/ZTh8qX6O3IkP3Ffvr6FiJhKV.qPcEVn7gvNzkVK', 'empleado', 1, '2026-03-26 17:31:47'),
	(9, 'EmpleadoPrueba5', 'empleado5@sistema.local', '$2b$10$Kjz3C2gtC9YvM/ZTh8qX6O3IkP3Ffvr6FiJhKV.qPcEVn7gvNzkVK', 'empleado', 1, '2026-03-26 17:31:47'),
	(10, 'EmpleadoPrueba6', 'empleado6@sistema.local', '$2b$10$Kjz3C2gtC9YvM/ZTh8qX6O3IkP3Ffvr6FiJhKV.qPcEVn7gvNzkVK', 'empleado', 1, '2026-03-26 17:31:47'),
	(11, 'EmpleadoPrueba7', 'empleado7@sistema.local', '$2b$10$Kjz3C2gtC9YvM/ZTh8qX6O3IkP3Ffvr6FiJhKV.qPcEVn7gvNzkVK', 'empleado', 1, '2026-03-26 17:31:47'),
	(12, 'EmpleadoPrueba8', 'empleado8@sistema.local', '$2b$10$Kjz3C2gtC9YvM/ZTh8qX6O3IkP3Ffvr6FiJhKV.qPcEVn7gvNzkVK', 'empleado', 1, '2026-03-26 17:31:47'),
	(13, 'EmpleadoPrueba9', 'empleado9@sistema.local', '$2b$10$Kjz3C2gtC9YvM/ZTh8qX6O3IkP3Ffvr6FiJhKV.qPcEVn7gvNzkVK', 'empleado', 1, '2026-03-26 17:31:47'),
	(14, 'EmpleadoPrueba10', 'empleado10@sistema.local', '$2b$10$Kjz3C2gtC9YvM/ZTh8qX6O3IkP3Ffvr6FiJhKV.qPcEVn7gvNzkVK', 'empleado', 1, '2026-03-26 17:31:47');


-- 1. Crear tabla
CREATE TABLE IF NOT EXISTS plantillas_correo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    asunto VARCHAR(200) NOT NULL,
    html_content MEDIUMTEXT NOT NULL,
    descripcion VARCHAR(255),
    variables_disponibles VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Insertar plantillas base (con el diseño premium que hicimos)
-- IMPORTANTE: He puesto {{cliente}}, {{monto}}, etc. como etiquetas para que el código las reemplace dinámicamente.
INSERT INTO plantillas_correo (nombre, slug, asunto, descripcion, variables_disponibles, html_content) VALUES 
('Préstamo Aprobado', 'prestamo_aprobado', '¡Préstamo Aprobado! - Documentos Adjuntos', 'Se envía cuando se registra un nuevo préstamo', 'cliente, monto, cuotas, total, moneda', 
'<div style="background-color: #6fbff047; padding: 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        <tr>
            <td align="center" style="background: #1e3c72; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 40px 20px;">
                <div style="margin-bottom: 15px; font-size: 40px;">📩</div>
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">¡Préstamo Aprobado!</h1>
                <p style="margin: 10px 0 0; color: #ffffff; opacity: 0.8; font-size: 16px;">Tu solicitud ha sido procesada con éxito.</p>
            </td>
        </tr>
        <tr>
            <td style="padding: 40px 30px;">
                <p style="margin: 0 0 10px; font-size: 18px; color: #333;">Hola <strong>{{cliente}}</strong>,</p>
                <p style="margin: 0 0 30px; font-size: 15px; color: #666; line-height: 1.5;">Estamos encantados de informarte que tu solicitud de préstamo ha sido aprobada con éxito. A continuación los detalles principales:</p>
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 12px; padding: 25px;">
                    <tr>
                        <td width="55" style="padding-bottom: 20px;">
                            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; width: 44px; height: 44px; text-align: center; line-height: 44px; font-size: 22px;">💰</div>
                        </td>
                        <td style="padding-bottom: 20px;">
                            <div style="color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Monto Desembolsado</div>
                            <div style="color: #0f172a; font-size: 22px; font-weight: bold;">{{moneda}} {{monto}}</div>
                        </td>
                    </tr>
                    <tr>
                        <td width="55" style="padding-bottom: 20px;">
                            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; width: 44px; height: 44px; text-align: center; line-height: 44px; font-size: 22px;">💳</div>
                        </td>
                        <td style="padding-bottom: 20px;">
                            <div style="color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Total a Pagar</div>
                            <div style="color: #0f172a; font-size: 20px; font-weight: bold;">{{moneda}} {{total}}</div>
                        </td>
                    </tr>
                    <tr>
                        <td width="55">
                            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; width: 44px; height: 44px; text-align: center; line-height: 44px; font-size: 22px;">📅</div>
                        </td>
                        <td>
                            <div style="color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Número de Cuotas</div>
                            <div style="color: #0f172a; font-size: 20px; font-weight: bold;">{{cuotas}} fijas</div>
                        </td>
                    </tr>
                </table>
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 30px; background-color: #fffbeb; border-radius: 10px;">
                    <tr>
                        <td style="padding: 15px; border-left: 5px solid #f59e0b;">
                            <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.4;">
                                ℹ️ <strong>Documentos adjuntos en formato PDF</strong> para su revisión, control y firma.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td align="center" style="padding: 25px; background-color: #f9fafb; color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9;">
                Sistema Financiero Profesional. <br>
                Este es un correo informativo, no responda a este mensaje.
            </td>
        </tr>
    </table>
</div>
'),

('Confirmación de Pago', 'pago_recibido', '¡Recibo de Pago Confirmado!', 'Se envía cuando el cliente paga una cuota', 'cliente, monto, fecha, saldoPendiente, moneda',
'<div style="background-color: #f0fdf4; padding: 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <tr>
            <td align="center" style="background: linear-gradient(135deg, #15803d 0%, #166534 100%); padding: 40px 20px;">
                <div style="font-size: 40px; margin-bottom: 10px;">✅</div>
                <h1 style="margin: 0; color: #ffffff; font-size: 26px;">¡Recibo de Pago!</h1>
                <p style="margin: 10px 0 0; color: #ffffff; opacity: 0.8;">Tu abono ha sido procesado exitosamente.</p>
            </td>
        </tr>
        <tr>
            <td style="padding: 40px 30px; text-align: center;">
                <p style="text-align: left; margin: 0 0 20px; color: #333; font-size: 16px;">Hola <strong>{{cliente}}</strong>,</p>
                <div style="margin-bottom: 10px; color: #64748b; font-size: 14px; text-transform: uppercase;">Monto Recibido</div>
                <div style="font-size: 42px; font-weight: bold; color: #15803d; margin-bottom: 30px;">{{moneda}} {{monto}}</div>
                
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 10px; padding: 20px;">
                    <tr>
                        <td align="left" style="color: #64748b; padding: 5px 0;">Fecha del pago:</td>
                        <td align="right" style="font-weight: bold;">{{fecha}}</td>
                    </tr>
                    <tr>
                        <td align="left" style="color: #64748b; padding: 5px 0;">Saldo restante:</td>
                        <td align="right" style="font-weight: bold; color: #dc2626; font-size: 16px;">{{moneda}} {{saldoPendiente}}</td>
                    </tr>
                </table>
                <p style="margin-top: 30px; color: #666; font-size: 14px;">Gracias por mantener tu cuenta al día.</p>
            </td>
        </tr>
        <tr>
            <td align="center" style="padding: 20px; background-color: #f9fafb; color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9;">
                © Sistema de Cobranza.
            </td>
        </tr>
    </table>
</div>
'),

('Depósito en Ahorros', 'ahorro_deposito', '¡Depósito Confirmado! - Cuenta de Ahorros', 'Se envía cuando se registra un nuevo depósito en la cuenta de ahorros', 'cliente, monto, nuevoSaldo, moneda', 
'<div style="background-color: #f0fdf4; padding: 20px; font-family: \'Helvetica Neue\', Helvetica, Arial, sans-serif;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <tr>
            <td align="center" style="background: linear-gradient(135deg, #15803d 0%, #166534 100%); padding: 40px 20px;">
                <div style="font-size: 40px; margin-bottom: 10px;">💰</div>
                <h1 style="margin: 0; color: #ffffff; font-size: 26px;">¡Depósito Confirmado!</h1>
                <p style="margin: 10px 0 0; color: #ffffff; opacity: 0.8;">Tu ahorro está creciendo con nosotros.</p>
            </td>
        </tr>
        <tr>
            <td style="padding: 40px 30px; text-align: center;">
                <p style="text-align: left; margin: 0 0 20px; color: #333; font-size: 16px;">Hola <strong>{{cliente}}</strong>,</p>
                <div style="margin-bottom: 10px; color: #64748b; font-size: 14px; text-transform: uppercase;">Monto Depositado</div>
                <div style="font-size: 42px; font-weight: bold; color: #15803d; margin-bottom: 30px;">{{moneda}} {{monto}}</div>
                
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 10px; padding: 20px;">
                    <tr>
                        <td align="left" style="color: #64748b; padding: 5px 0;">Tipo de Operación:</td>
                        <td align="right" style="font-weight: bold;">Depósito</td>
                    </tr>
                    <tr>
                        <td align="left" style="color: #64748b; padding: 5px 0;">Nuevo Saldo:</td>
                        <td align="right" style="font-weight: bold; color: #0f172a; font-size: 16px;">{{moneda}} {{nuevoSaldo}}</td>
                    </tr>
                </table>
                <p style="margin-top: 30px; color: #666; font-size: 14px;">Gracias por confiar en nuestra gestión de ahorros.</p>
            </td>
        </tr>
        <tr>
            <td align="center" style="padding: 20px; background-color: #f9fafb; color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9;">
                © Sistema de Ahorros y Préstamos.
            </td>
        </tr>
    </table>
</div>'),

('Retiro de Ahorros', 'ahorro_retiro', 'Notificación de Retiro - Cuenta de Ahorros', 'Se envía cuando se registra un retiro de la cuenta de ahorros', 'cliente, monto, nuevoSaldo, moneda', 
'<div style="background-color: #f8fafc; padding: 20px; font-family: \'Helvetica Neue\', Helvetica, Arial, sans-serif;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <tr>
            <td align="center" style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 40px 20px;">
                <div style="font-size: 40px; margin-bottom: 10px;">🏧</div>
                <h1 style="margin: 0; color: #ffffff; font-size: 26px;">Retiro Realizado</h1>
                <p style="margin: 10px 0 0; color: #ffffff; opacity: 0.8;">Se ha procesado un retiro de tu cuenta.</p>
            </td>
        </tr>
        <tr>
            <td style="padding: 40px 30px; text-align: center;">
                <p style="text-align: left; margin: 0 0 20px; color: #333; font-size: 16px;">Hola <strong>{{cliente}}</strong>,</p>
                <div style="margin-bottom: 10px; color: #64748b; font-size: 14px; text-transform: uppercase;">Monto Retirado</div>
                <div style="font-size: 42px; font-weight: bold; color: #1e293b; margin-bottom: 30px;">{{moneda}} {{monto}}</div>
                
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 10px; padding: 20px;">
                    <tr>
                        <td align="left" style="color: #64748b; padding: 5px 0;">Tipo de Operación:</td>
                        <td align="right" style="font-weight: bold;">Retiro de Efectivo</td>
                    </tr>
                    <tr>
                        <td align="left" style="color: #64748b; padding: 5px 0;">Saldo Disponible:</td>
                        <td align="right" style="font-weight: bold; color: #0f172a; font-size: 16px;">{{moneda}} {{nuevoSaldo}}</td>
                    </tr>
                </table>
                <p style="margin-top: 30px; color: #666; font-size: 14px;">Si no reconoces esta operación, por favor contáctanos de inmediato.</p>
            </td>
        </tr>
        <tr>
            <td align="center" style="padding: 20px; background-color: #f9fafb; color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9;">
                © Sistema de Ahorros y Préstamos.
            </td>
        </tr>
    </table>
</div>'),

('Recordatorio de Pago', 'recordatorio_pago', '⚠️ Recordatorio: Tu cuota vence pronto', 'Se envía manualmente para recordar el vencimiento de una cuota', 'cliente, monto, fecha, moneda', 
'<div style="background-color: #fefce8; padding: 20px; font-family: sans-serif;"><table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);"><tr><td align="center" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px;"><div style="font-size: 48px; margin-bottom: 10px;">📅</div><h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Recordatorio de Pago</h1></td></tr><tr><td style="padding: 40px 35px;"><p style="margin: 0 0 20px; font-size: 18px; color: #1e293b;">Hola <strong>{{cliente}}</strong>,</p><p style="margin: 0 0 30px; font-size: 16px; color: #475569; line-height: 1.6;">Te recordamos que tienes una cuota próxima a vencer:</p><table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 12px; padding: 25px; border: 1px solid #e2e8f0;"><tr><td><div style="color: #64748b; font-size: 12px; text-transform: uppercase;">Monto de la Cuota</div><div style="color: #0f172a; font-size: 24px; font-weight: bold;">{{moneda}} {{monto}}</div></td></tr><tr><td style="padding-top: 15px;"><div style="color: #64748b; font-size: 12px; text-transform: uppercase;">Vencimiento</div><div style="color: #dc2626; font-size: 20px; font-weight: bold;">{{fecha}}</div></td></tr></table></td></tr></table></div>'),

('Recordatorio de Cadena', 'recordatorio_cadena', '🔔 Recordatorio: Tu aporte de la Cadena', 'Se envía para recordar el pago de una cuota de cadena', 'cliente, monto, cadena, ciclo, moneda', 
'<div style="background-color: #f0f9ff; padding: 20px; font-family: sans-serif;"><table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);"><tr><td align="center" style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 40px 20px;"><div style="font-size: 48px; margin-bottom: 10px;">🔔</div><h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: bold;">Recordatorio de Ahorro</h1><p style="margin: 10px 0 0; color: #ffffff; opacity: 0.9;">{{cadena}} - Ciclo #{{ciclo}}</p></td></tr><tr><td style="padding: 40px 35px;"><p style="margin: 0 0 20px; font-size: 18px; color: #1e293b;">Hola <strong>{{cliente}}</strong>,</p><p style="margin: 0 0 30px; font-size: 16px; color: #475569; line-height: 1.6;">Te escribimos para recordarte tu aporte para el ciclo actual de la cadena de ahorro.</p><table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 12px; padding: 25px; border: 1px solid #e2e8f0;"><tr><td><div style="color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: bold;">Monto de tu Cuota</div><div style="color: #0369a1; font-size: 28px; font-weight: bold;">{{moneda}} {{monto}}</div></td></tr></table><p style="margin-top: 30px; color: #64748b; font-size: 14px; font-style: italic; text-align: center;">"El ahorro constante es el camino al éxito financiero."</p></td></tr></table></div>');



-- Volcando estructura para tabla sistema_prestamos.plantillas_pdf
CREATE TABLE IF NOT EXISTS `plantillas_pdf` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `contenido` text NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla sistema_prestamos.plantillas_pdf: ~3 rows (aproximadamente)
DELETE FROM `plantillas_pdf`;
INSERT INTO `plantillas_pdf` (`id`, `nombre`, `slug`, `contenido`, `descripcion`, `updated_at`) VALUES
	(1, 'Cláusulas del Contrato', 'contrato_clausulas', 'PRIMERO (OBJETO): El ACREEDOR entrega al DEUDOR la suma de {{moneda}} {{monto}} por concepto de préstamo de libre inversión.\r\n\r\nSEGUNDO (INTERESES Y TOTAL): El DEUDOR se obliga a devolver la suma total de {{moneda}} {{total}}, la cual incluye una tasa de interés del {{tasa}}%.\r\n\r\nTERCERO (FORMA DE PAGO): La obligación será cancelada en {{cuotas}} cuotas con una frecuencia de pago {{frecuencia}}. La primera cuota vence el {{fecha_inicio}}.\r\n\r\nCUARTO (MORA): El incumplimiento en las fechas pactadas generará el reporte en las centrales de riesgo y las acciones legales pertinentes para el cobro del saldo total.', 'Cuerpo principal de las cláusulas legales del préstamo', '2026-04-23 18:46:42'),
	(2, 'Pie de Página - Ticket', 'ticket_pie', 'Este comprobante certifica la recepción del dinero en efectivo o transferencia. Al firmar, el cliente acepta los términos del contrato vinculado a la operación Nro {{op}}.', 'Texto legal que aparece al final del comprobante de desembolso', '2026-04-23 18:23:44'),
	(3, 'Pie de Página - Cronograma', 'cronograma_pie', 'Este cronograma de pagos es un documento informativo sujeto a términos y condiciones establecidos en el contrato de préstamo. Generado automáticamente por el Sistema de Préstamos el {{fecha_hoy}}.', 'Texto informativo al final del calendario de pagos', '2026-04-23 18:23:44');


-- Estructura para Cadenas de Ahorro
CREATE TABLE IF NOT EXISTS `cadenas` (
    `id` int NOT NULL AUTO_INCREMENT,
    `nombre` varchar(100) NOT NULL,
    `monto_cuota` decimal(12,2) NOT NULL,
    `frecuencia` enum('semanal', 'quincenal', 'mensual') NOT NULL,
    `estado` enum('activa', 'finalizada') DEFAULT 'activa',
    `fecha_inicio` date NOT NULL,
    `numero_participantes` int NOT NULL,
    `ciclo_actual` int DEFAULT 1,
    `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `participantes_cadena` (
    `id` int NOT NULL AUTO_INCREMENT,
    `cadena_id` int NOT NULL,
    `nombre` varchar(100) NOT NULL,
    `telefono` varchar(20),
    `email` varchar(100) DEFAULT NULL,
    `turno` int NOT NULL,
    `estado_entrega` boolean DEFAULT FALSE,
    `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_turno_cadena` (`cadena_id`, `turno`),
    CONSTRAINT `participantes_cadena_ibfk_1` FOREIGN KEY (`cadena_id`) REFERENCES `cadenas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `pagos_cadena` (
    `id` int NOT NULL AUTO_INCREMENT,
    `participante_id` int NOT NULL,
    `cadena_id` int NOT NULL,
    `ciclo` int NOT NULL,
    `pagado` boolean DEFAULT FALSE,
    `fecha_pago` timestamp NULL,
    `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `pagos_cadena_ibfk_1` FOREIGN KEY (`participante_id`) REFERENCES `participantes_cadena` (`id`) ON DELETE CASCADE,
    CONSTRAINT `pagos_cadena_ibfk_2` FOREIGN KEY (`cadena_id`) REFERENCES `cadenas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
