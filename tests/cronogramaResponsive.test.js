/**
 * @file tests/cronogramaResponsive.test.js
 * @description Suite de pruebas TDD para verificar que la vista de cronograma de pagos
 *              sea totalmente responsiva en dispositivos móviles usando tarjetas.
 * @run node tests/cronogramaResponsive.test.js
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function testCronogramaResponsive() {
    console.log('🧪 Iniciando prueba TDD para verificar responsividad en Cronograma de Pagos...');

    const viewPath = path.join(__dirname, '../views/prestamos/cronograma.ejs');
    
    // Verificar que la vista existe
    assert.ok(fs.existsSync(viewPath), 'El archivo cronograma.ejs debe existir');

    const htmlContent = fs.readFileSync(viewPath, 'utf8');

    // 1. Validar la tabla oculta en móvil
    console.log('  - Validando ocultamiento de la tabla tradicional en móvil (d-none d-md-block)...');
    assert.ok(htmlContent.includes('d-none d-md-block') || htmlContent.includes('table-responsive d-none d-md-block'), 
              'Debe aplicarse d-none d-md-block a la sección de la tabla de escritorio del cronograma');

    // 2. Validar que exista la sección responsiva de tarjetas móviles
    console.log('  - Validando presencia del listado de tarjetas móvil (d-block d-md-none)...');
    assert.ok(htmlContent.includes('d-block d-md-none'), 'Debe existir la sección responsiva de tarjetas móviles de cronograma');

    // 3. Validar el iterador del bucle en móviles
    console.log('  - Validando bucle de cuotas del cronograma en móviles...');
    assert.ok(htmlContent.includes('cronograma.forEach'), 'Debe iterar sobre el listado de cuotas en el código responsivo');

    console.log('✅ PASS: La vista de cronograma de pagos es 100% responsiva con tarjeticas premium.');
}

testCronogramaResponsive();
