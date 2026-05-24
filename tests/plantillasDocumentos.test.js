/**
 * @file plantillasDocumentos.test.js
 * @description Suite de pruebas TDD de integración para validar la correcta persistencia,
 * recuperación y renderizado dinámico de las plantillas de correo del módulo de documentos
 * (documento_cargado, documento_aprobado, documento_rechazado) desde la base de datos.
 * @author Antigravity
 * @version 1.0.0
 */

const assert = require('assert');
const db = require('../config/db');
const PlantillaModel = require('../models/PlantillaModel');
const emailService = require('../utils/emailService');

/**
 * Ejecuta la suite de pruebas para validar las plantillas de documentos.
 * 
 * @async
 * @function ejecutarPruebasPlantillasDocumentos
 * @returns {Promise<void>} Promesa que finaliza cuando se completan todas las aserciones.
 * @throws {Error} Excepción si alguna aserción de prueba falla.
 */
async function ejecutarPruebasPlantillasDocumentos() {
    console.log('🧪 Iniciando Suite de Pruebas TDD para Plantillas de Correo de Documentos...');

    try {
        // ==========================================
        // 1. VALIDACIÓN EN BASE DE DATOS
        // ==========================================
        
        // 1.1 Plantilla: documento_cargado
        console.log('🔍 Recuperando la plantilla documento_cargado...');
        const pCargado = await PlantillaModel.obtenerPorSlug('documento_cargado');
        assert.ok(pCargado, 'Debería existir la plantilla [documento_cargado].');
        assert.strictEqual(pCargado.nombre, 'Notificación de Documento Cargado');
        assert.strictEqual(pCargado.asunto, '[Sistema] Nuevo documento subido por {{cliente}}');

        // 1.2 Plantilla: documento_aprobado
        console.log('🔍 Recuperando la plantilla documento_aprobado...');
        const pAprobado = await PlantillaModel.obtenerPorSlug('documento_aprobado');
        assert.ok(pAprobado, 'Debería existir la plantilla [documento_aprobado].');
        assert.strictEqual(pAprobado.nombre, 'Documento Aprobado');
        assert.strictEqual(pAprobado.asunto, '¡Excelente! Tu documento ha sido aprobado');

        // 1.3 Plantilla: documento_rechazado
        console.log('🔍 Recuperando la plantilla documento_rechazado...');
        const pRechazado = await PlantillaModel.obtenerPorSlug('documento_rechazado');
        assert.ok(pRechazado, 'Debería existir la plantilla [documento_rechazado].');
        assert.strictEqual(pRechazado.nombre, 'Documento Rechazado');
        assert.strictEqual(pRechazado.asunto, 'Atención: Tu documento ha sido rechazado');

        console.log('✅ Registro de las 3 plantillas en BD verificado con éxito.');

        // ==========================================
        // 2. PRUEBA DE RENDERING E INYECCIÓN DE VARIABLES
        // ==========================================
        
        // 2.1 Renderizado: documento_cargado
        console.log('📨 Probando el renderizado de plantillaDocumentoCargado...');
        const resCargado = await emailService.plantillaDocumentoCargado(
            'Juan Pérez',
            '10203040',
            'Cedula_Ciudadania.pdf',
            '24/05/2026, 16:30:00'
        );
        assert.ok(resCargado && resCargado.html, 'Debería retornar un objeto con el HTML renderizado.');
        assert.ok(resCargado.html.includes('Juan Pérez'), 'El HTML debe contener el nombre del cliente.');
        assert.ok(resCargado.html.includes('10203040'), 'El HTML debe contener el DNI/CC del cliente.');
        assert.ok(resCargado.html.includes('Cedula_Ciudadania.pdf'), 'El HTML debe contener el nombre del documento.');
        assert.ok(resCargado.html.includes('24/05/2026'), 'El HTML debe contener la fecha de carga.');

        // 2.2 Renderizado: documento_aprobado
        console.log('📨 Probando el renderizado de plantillaDocumentoAprobado...');
        const resAprobado = await emailService.plantillaDocumentoAprobado(
            'Juan Pérez',
            'Cedula_Ciudadania.pdf'
        );
        assert.ok(resAprobado && resAprobado.html, 'Debería retornar un objeto con el HTML renderizado.');
        assert.ok(resAprobado.html.includes('Juan Pérez'), 'El HTML debe contener el nombre del cliente.');
        assert.ok(resAprobado.html.includes('Cedula_Ciudadania.pdf'), 'El HTML debe contener el nombre del documento.');
        assert.ok(resAprobado.html.includes('APROBADO'), 'El HTML debe contener la etiqueta de aprobado.');

        // 2.3 Renderizado: documento_rechazado
        console.log('📨 Probando el renderizado de plantillaDocumentoRechazado...');
        const resRechazado = await emailService.plantillaDocumentoRechazado(
            'Juan Pérez',
            'Cedula_Ciudadania.pdf',
            'La firma no coincide con el registro oficial'
        );
        assert.ok(resRechazado && resRechazado.html, 'Debería retornar un objeto con el HTML renderizado.');
        assert.ok(resRechazado.html.includes('Juan Pérez'), 'El HTML debe contener el nombre del cliente.');
        assert.ok(resRechazado.html.includes('Cedula_Ciudadania.pdf'), 'El HTML debe contener el nombre del documento.');
        assert.ok(resRechazado.html.includes('RECHAZADO'), 'El HTML debe contener la etiqueta de rechazado.');
        assert.ok(resRechazado.html.includes('La firma no coincide con el registro oficial'), 'El HTML debe contener el motivo de rechazo.');

        console.log('✅ Renderizado dinámico e inyección de variables para todas las plantillas verificado con éxito.');
        console.log('🎉 Suite de pruebas de plantillas de documentos completada con éxito absoluto.');
        
    } catch (error) {
        console.error('❌ La suite de pruebas de plantillas de documentos ha fallado:', error);
        process.exit(1);
    } finally {
        await db.end();
    }
}

// Ejecutar suite de pruebas
ejecutarPruebasPlantillasDocumentos();
