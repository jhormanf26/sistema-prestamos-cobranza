/**
 * @file tests/prestamosCrearColorLimite.test.js
 * @description Test TDD para validar que los textos del límite de crédito permitido en crear.ejs
 *              no usen colores de bajo contraste (como blanco sobre fondo gris claro).
 * @run node tests/prestamosCrearColorLimite.test.js
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function testPrestamosCrearColorLimite() {
    console.log('🧪 Iniciando prueba TDD para verificar legibilidad de colores en el límite de crédito...');

    const viewPath = path.join(__dirname, '../views/prestamos/crear.ejs');
    assert.ok(fs.existsSync(viewPath), 'El archivo crear.ejs de préstamos debe existir');

    const htmlContent = fs.readFileSync(viewPath, 'utf8');

    // 1. Validar que no se usen clases de bajo contraste en el badge de límite
    console.log('  - Validando que limiteBadgeTitle no use text-white para evitar bajo contraste...');
    const matchTitleWhite = /id="limiteBadgeTitle"[^>]*class="[^"]*text-white[^"]*"/i.test(htmlContent) ||
                            /class="[^"]*text-white[^"]*"[^>]*id="limiteBadgeTitle"/i.test(htmlContent);
    assert.ok(!matchTitleWhite, 'El título del límite no debe usar text-white porque el fondo alert-secondary es gris claro.');

    console.log('  - Validando que limiteBadgeDesc no use text-white-50 para evitar bajo contraste...');
    const matchDescWhite = /id="limiteBadgeDesc"[^>]*class="[^"]*text-white-50[^"]*"/i.test(htmlContent) ||
                           /class="[^"]*text-white-50[^"]*"[^>]*id="limiteBadgeDesc"/i.test(htmlContent);
    assert.ok(!matchDescWhite, 'El detalle del límite no debe usar text-white-50 porque el fondo alert-secondary es gris claro.');

    // 2. Validar que se usen clases de alto contraste como text-dark y text-muted o similares
    console.log('  - Validando que limiteBadgeTitle use una clase de texto oscuro (text-dark)...');
    assert.ok(htmlContent.includes('text-dark') && htmlContent.includes('limiteBadgeTitle'), 'El título del límite debe usar una clase legible como text-dark.');

    console.log('  - Validando que limiteBadgeDesc use una clase legible como text-muted o text-secondary...');
    assert.ok(htmlContent.includes('text-muted') || htmlContent.includes('text-secondary'), 'El detalle del límite debe usar una clase legible.');

    console.log('✅ PASS: Los colores del badge de límite en crear.ejs han sido validados con éxito.');
}

testPrestamosCrearColorLimite();
