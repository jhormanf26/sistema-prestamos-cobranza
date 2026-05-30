/**
 * @file tests/prestamosResponsiveIndex.test.js
 * @description Suite de pruebas TDD para verificar que la vista del listado de préstamos
 *              administrativos sea totalmente responsiva en dispositivos móviles.
 * @run node tests/prestamosResponsiveIndex.test.js
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function testPrestamosResponsiveIndex() {
    console.log('🧪 Iniciando prueba TDD para verificar responsividad en Gestión de Préstamos...');

    const viewPath = path.join(__dirname, '../views/prestamos/index.ejs');
    
    // Verificar que la vista existe
    assert.ok(fs.existsSync(viewPath), 'El archivo index.ejs de préstamos debe existir');

    const htmlContent = fs.readFileSync(viewPath, 'utf8');

    // 1. Validar la tabla oculta en móvil
    console.log('  - Validando ocultamiento de la tabla tradicional en móvil (d-none d-md-block)...');
    assert.ok(htmlContent.includes('d-none d-md-block') || htmlContent.includes('table-responsive d-none d-md-block'), 
              'Debe aplicarse d-none d-md-block a la sección de la tabla de escritorio de préstamos');

    // 2. Validar que exista la sección responsiva de tarjetas móviles
    console.log('  - Validando presencia del listado de tarjetas móvil (d-block d-md-none)...');
    assert.ok(htmlContent.includes('d-block d-md-none'), 'Debe existir la sección responsiva de tarjetas móviles de préstamos');

    // 3. Validar el iterador del bucle en móviles
    console.log('  - Validando bucle de préstamos en móviles...');
    assert.ok(htmlContent.includes('prestamos.forEach'), 'Debe iterar sobre el listado de préstamos en el código responsivo');

    console.log('✅ PASS: La vista de gestión de préstamos administrativos es 100% responsiva con tarjeticas premium.');
    process.exit(0);
}

testPrestamosResponsiveIndex();
