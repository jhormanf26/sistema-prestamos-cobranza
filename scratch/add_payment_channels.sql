-- 1. Agregar columnas de canales de pago a la tabla configuracion en producción
ALTER TABLE `configuracion` 
ADD COLUMN `nequi_numero` VARCHAR(50) DEFAULT '3123456789' AFTER `push_texto_0d`,
ADD COLUMN `breve_numero` VARCHAR(50) DEFAULT '3123456789' AFTER `nequi_numero`;
