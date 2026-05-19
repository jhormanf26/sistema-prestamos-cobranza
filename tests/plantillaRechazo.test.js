/**
 * @file plantillaRechazo.test.js
 * @description Suite de pruebas TDD de integración para validar la correcta persistencia,
 * recuperación y renderizado dinámico de la plantilla de correo de rechazo de pago (pago_rechazado)
 * desde la base de datos de manera editable.
 * @author Antigravity
 * @version 1.0.0
 */

const assert = require('assert');
const db = require('../config/db');
const PlantillaModel = require('../models/PlantillaModel');
const emailService = require('../utils/emailService');

/**
 * Ejecuta la suite de pruebas para validar la plantilla de correo.
 * 
 * @async
 * @function ejecutarPruebasPlantillaRechazo
 * @returns {Promise<void>} Promesa que finaliza cuando se completan todas las aserciones.
 * @throws {Error} Excepción si alguna aserción de prueba falla.
 */
async function ejecutarPruebasPlantillaRechazo() {
    console.log('🧪 Iniciando Suite de Pruebas TDD para Plantilla de Correo Editable [pago_rechazado]...');

    try {
        // 1. Obtener la plantilla por slug directamente de la Base de Datos
        console.log('🔍 Recuperando la plantilla pago_rechazado de la base de datos...');
        const plantilla = await PlantillaModel.obtenerPorSlug('pago_rechazado');

        assert.ok(plantilla, 'Debería existir un registro para la plantilla [pago_rechazado] en la tabla plantillas_correo.');
        assert.strictEqual(plantilla.slug, 'pago_rechazado', 'El slug recuperado debe ser "pago_rechazado".');
        assert.strictEqual(plantilla.nombre, 'Reporte de Pago Rechazado', 'El nombre debe coincidir con el registrado en la migración.');
        assert.strictEqual(plantilla.asunto, 'Comprobante de Pago Rechazado', 'El asunto configurado por defecto debe ser "Comprobante de Pago Rechazado".');
        
        console.log('✅ Registro de plantilla en BD verificado exitosamente.');

        // 2. Probar la inyección dinámica de variables y el formateo a través de emailService
        console.log('📨 Probando el renderizado de la plantilla a través de emailService.plantillaRechazoPago...');
        
        const datosPrueba = {
            cliente: 'Carlos Mario Restrepo',
            monto: 75000,
            fecha: '2026-05-19T12:00:00.000Z',
            motivo: 'El número de transacción no coincide con el banco',
            moneda: 'COP$'
        };

        // Invocar el método del servicio
        const resultado = await emailService.plantillaRechazoPago(
            datosPrueba.cliente,
            datosPrueba.monto,
            datosPrueba.fecha,
            datosPrueba.motivo,
            datosPrueba.moneda
        );

        // Aserciones sobre el resultado renderizado
        assert.ok(resultado, 'El método plantillaRechazoPago debería devolver un objeto de resultado.');
        assert.strictEqual(resultado.asunto, 'Comprobante de Pago Rechazado', 'El asunto devuelto debe ser el configurado en la base de datos.');
        
        // Verificar que las variables dinámicas se hayan inyectado correctamente en el HTML devuelto
        const html = resultado.html;
        assert.ok(html.includes(datosPrueba.cliente), `El HTML renderizado debe contener el nombre del cliente: "${datosPrueba.cliente}".`);
        assert.ok(html.includes('75.000,00'), 'El HTML renderizado debe contener el monto formateado con separadores colombianos: "75.000,00".');
        assert.ok(html.includes(datosPrueba.moneda), `El HTML renderizado debe contener el símbolo de la moneda: "${datosPrueba.moneda}".`);
        assert.ok(html.includes(datosPrueba.motivo), `El HTML renderizado debe contener el motivo detallado: "${datosPrueba.motivo}".`);
        assert.ok(html.includes('Comprobante Rechazado'), 'El HTML renderizado debe incluir la cabecera principal de la plantilla.');
        
        console.log('✅ Renderizado dinámico e inyección de variables verificados exitosamente.');
        console.log('🎉 Suite de Pruebas TDD COMPLETADA CON ÉXITO ROTUNDO.');

    } catch (error) {
        console.error('❌ La suite de pruebas TDD de la plantilla de correo ha fallado:', error);
        process.exit(1);
    } finally {
        // Cerrar la conexión pool para que finalice el script limpiamente
        await db.end();
    }
}

// Iniciar pruebas
ejecutarPruebasPlantillaRechazo();
