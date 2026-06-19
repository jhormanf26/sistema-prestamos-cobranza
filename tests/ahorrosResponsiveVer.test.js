/**
 * @file tests/ahorrosResponsiveVer.test.js
 * @description Suite de pruebas TDD para validar que la vista de movimientos de ahorros (ver.ejs)
 *              tenga estructurada de forma responsiva la lista de Últimos Movimientos,
 *              mostrando una tabla en escritorio y tarjetas en móvil.
 * @run node tests/ahorrosResponsiveVer.test.js
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function testAhorrosResponsiveVer() {
    console.log('🧪 Iniciando prueba TDD para verificar la responsividad de la vista ver.ejs de Ahorros...');

    const viewPath = path.join(__dirname, '../views/ahorros/ver.ejs');
    
    // Verificar que el archivo de la vista existe
    assert.ok(fs.existsSync(viewPath), 'El archivo ver.ejs de ahorros debe existir');

    const rawContent = fs.readFileSync(viewPath, 'utf8');
    // Normalizar espacios y saltos de línea para que las comprobaciones de texto sean robustas
    const htmlContent = rawContent.replace(/\s+/g, ' ');

    // 1. Validar sección "Últimos Movimientos"
    console.log('  - Validando sección "Últimos Movimientos"...');
    assert.ok(htmlContent.includes('Últimos Movimientos'), 'Debe existir el título Últimos Movimientos');

    // 2. Validar que exista la iteración de movimientos
    console.log('  - Validando ciclo de movimientos...');
    assert.ok(htmlContent.includes('movimientos.forEach'), 'Debe iterar sobre la variable movimientos');

    // 3. Validar clases responsivas de visualización
    console.log('  - Validando clases responsivas de ocultamiento y tarjetas...');
    
    // Tabla oculta en móviles y mostrada en escritorio (d-none d-md-block o similar)
    assert.ok(htmlContent.includes('d-none d-md-block'), 'Debe ocultar la tabla en dispositivos móviles');
    
    // Tarjetas móviles mostradas en móvil y ocultas en escritorio (d-block d-md-none o similar)
    assert.ok(htmlContent.includes('d-block d-md-none'), 'Debe renderizar la lista de tarjetas en dispositivos móviles');

    // 4. Validar que la vista de tarjetas móviles contenga el ticket y los badges correspondientes
    console.log('  - Validando el contenido de las tarjetas móviles (ticket, tipo de movimiento)...');
    assert.ok(htmlContent.includes('ticket-ahorro'), 'Debe poder abrir el ticket desde la vista móvil');
    assert.ok(htmlContent.includes('tipo_movimiento == \'deposito\''), 'Debe diferenciar depósitos y retiros en móvil');

    console.log('✅ PASS: La vista de movimientos de ahorros está correctamente estructurada responsivamente.');
    process.exit(0);
}

testAhorrosResponsiveVer();
