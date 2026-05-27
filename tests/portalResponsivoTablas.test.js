/**
 * @file tests/portalResponsivoTablas.test.js
 * @description Suite de pruebas TDD para validar que la vista del dashboard del cliente
 *              tenga estructuradas de forma responsiva las tablas de Retiros, Créditos e Historial
 *              para evitar desplazamientos horizontales en dispositivos móviles.
 * @run node tests/portalResponsivoTablas.test.js
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function testPortalResponsivoTablas() {
    console.log('🧪 Iniciando prueba TDD para verificar la responsividad del Portal del Cliente...');

    const viewPath = path.join(__dirname, '../views/portal-cliente/dashboard.ejs');
    
    // Verificar que el archivo de la vista existe
    assert.ok(fs.existsSync(viewPath), 'El archivo dashboard.ejs debe existir');

    const htmlContent = fs.readFileSync(viewPath, 'utf8');

    // 1. Validar la sección de "Mis Solicitudes de Retiro"
    console.log('  - Validando sección "Mis Solicitudes de Retiro"...');
    assert.ok(htmlContent.includes('Mis Solicitudes de Retiro'), 'Debe existir la sección "Mis Solicitudes de Retiro"');
    assert.ok(htmlContent.includes('solicitudesRetiro.forEach'), 'Debe existir la variable solicitudesRetiro en la vista');
    
    // 2. Validar la sección de "Mis Solicitudes de Crédito"
    console.log('  - Validando sección "Mis Solicitudes de Crédito"...');
    assert.ok(htmlContent.includes('Mis Solicitudes de Crédito'), 'Debe existir la sección "Mis Solicitudes de Crédito"');
    assert.ok(htmlContent.includes('solicitudesCredito.forEach'), 'Debe existir la variable solicitudesCredito en la vista');

    // 3. Validar la sección de "Historial (Pagados)"
    console.log('  - Validando sección "Historial (Pagados)"...');
    assert.ok(htmlContent.includes('Historial (Pagados)'), 'Debe existir la sección "Historial (Pagados)"');
    assert.ok(htmlContent.includes('prestamosPagados.forEach'), 'Debe existir la variable prestamosPagados en la vista');

    // 4. Validar que existan suficientes elementos ocultables/mostrables responsivamente
    // Deben haber al menos 5 instancias de d-none d-md-block (para pagos, aportes, retiros, créditos, historial, etc.)
    const countDesktop = (htmlContent.match(/d-none d-md-block/g) || []).length;
    console.log(`  - Se encontraron ${countDesktop} secciones de vista de escritorio (d-none d-md-block).`);
    assert.ok(countDesktop >= 5, 'Deberían haber al menos 5 tablas/secciones optimizadas para escritorio');

    const countMobile = (htmlContent.match(/d-block d-md-none/g) || []).length;
    console.log(`  - Se encontraron ${countMobile} secciones de vista móvil (d-block d-md-none).`);
    assert.ok(countMobile >= 5, 'Deberían haber al menos 5 listados de tarjetas optimizados para móvil');

    console.log('✅ PASS: Todas las tablas del portal del cliente están estructuradas responsivamente con tarjetas móviles premium.');
    process.exit(0);
}

testPortalResponsivoTablas();
