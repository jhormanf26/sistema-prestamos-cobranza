-- --------------------------------------------------------
-- SCRIPT DE LIMPIEZA TOTAL - SISTEMA DE PRÉSTAMOS
-- --------------------------------------------------------

SET FOREIGN_KEY_CHECKS = 0;

-- Vaciar Tablas Transaccionales
TRUNCATE TABLE pagos;
TRUNCATE TABLE prestamos;
TRUNCATE TABLE movimientos_ahorro;
TRUNCATE TABLE cuentas_ahorro;
TRUNCATE TABLE empenos;
TRUNCATE TABLE gastos;
TRUNCATE TABLE caja;
TRUNCATE TABLE caja_sesiones;
TRUNCATE TABLE bitacora;
TRUNCATE TABLE clientes;

-- Reiniciar Usuarios y Configuración
TRUNCATE TABLE usuarios;
TRUNCATE TABLE configuracion;

-- Crear Usuario Administrador por Defecto (Clave: admin123)
-- El hash corresponde a 'admin123' usando bcrypt
INSERT INTO usuarios (id, nombre_completo, email, password, rol, estado) VALUES
(1, 'Administrador Global', 'admin@sistema.com', '$2b$10$Kjz3C2gtC9YvM/ZTh8qX6O3IkP3Ffvr6FiJhKV.qPcEVn7gvNzkVK', 'admin', 1);

-- Crear Configuración Base
INSERT INTO configuracion (id, nombre_empresa, ruc, moneda, interes_global) VALUES
(1, 'Mi Nueva Financiera', '00000000000', '$', 0);

SET FOREIGN_KEY_CHECKS = 1;

-- --------------------------------------------------------
-- SISTEMA LISTO PARA USAR DE CERO
-- --------------------------------------------------------
