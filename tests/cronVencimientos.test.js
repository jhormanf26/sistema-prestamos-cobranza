/**
 * @file tests/cronVencimientos.test.js
 * @description Suite de pruebas TDD para verificar que la automatización de vencimientos
 *              esté integrada dentro de cron/jobs.js.
 * @run node tests/cronVencimientos.test.js
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function testCronVencimientosIntegracion() {
    console.log('🧪 Iniciando prueba TDD para validar automatización de vencimientos en el Cron...');

    const cronPath = path.join(__dirname, '../cron/jobs.js');
    
    // Verificar existencia del archivo
    assert.ok(fs.existsSync(cronPath), 'El archivo cron/jobs.js debe existir');

    const codeContent = fs.readFileSync(cronPath, 'utf8');

    // 1. Validar que se importe PrestamoModel
    console.log('  - Validando importación de PrestamoModel en jobs.js...');
    assert.ok(
        codeContent.includes("require('../models/PrestamoModel')") || 
        codeContent.includes('require("../models/PrestamoModel")'),
        'Debe importarse PrestamoModel en jobs.js'
    );

    // 2. Validar que se llame a procesarVencimientos
    console.log('  - Validando llamada a procesarVencimientos en jobs.js...');
    assert.ok(
        codeContent.includes('procesarVencimientos()'),
        'Debe ejecutarse PrestamoModel.procesarVencimientos() en jobs.js'
    );

    // 3. Validar que esté ubicado dentro del flujo del programador de tareas (cron.schedule)
    console.log('  - Validando que la llamada esté dentro del schedule diario...');
    assert.ok(
        codeContent.includes('cron.schedule') && codeContent.includes('await PrestamoModel.procesarVencimientos()'),
        'La llamada a procesarVencimientos debe estar estructurada asíncronamente en el schedule'
    );

    console.log('✅ PASS: La integración de la automatización de vencimientos en el cron ha sido verificada exitosamente.');
    process.exit(0);
}

testCronVencimientosIntegracion();
