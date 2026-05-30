/**
 * @file tests/portalSaldoPrestamo.test.js
 * @description Caso de prueba TDD para validar que las tarjetas de préstamos activos
 *              en el portal de clientes incluyan un campo que muestre el saldo pendiente por pagar.
 * @run node tests/portalSaldoPrestamo.test.js
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function testPortalSaldoPrestamo() {
    console.log('🧪 Iniciando prueba TDD para verificar el Saldo por Pagar en tarjetas de Préstamos Activos...');

    const viewPath = path.join(__dirname, '../views/portal-cliente/dashboard.ejs');
    
    // Verificar que la vista existe
    assert.ok(fs.existsSync(viewPath), 'El archivo dashboard.ejs debe existir');

    const htmlContent = fs.readFileSync(viewPath, 'utf8');

    // 1. Validar que exista el texto indicativo del Saldo Restante / por Pagar
    console.log('  - Validando presencia del campo visual del saldo...');
    const contieneCampo = htmlContent.includes('Saldo por Pagar') || htmlContent.includes('Saldo Restante');
    assert.ok(contieneCampo, 'Debe existir un campo en el HTML que describa el "Saldo por Pagar" o "Saldo Restante"');

    // 2. Validar que realice el cálculo matemático en la iteración de préstamos
    console.log('  - Validando cálculo del saldo pendiente en el bucle...');
    const realizaCalculo = htmlContent.includes('p.monto_total - (p.total_pagado || 0)') || 
                           htmlContent.includes('p.monto_total - p.total_pagado');
    assert.ok(realizaCalculo, 'Debe calcular dinámicamente el saldo restando el total pagado del monto total');

    console.log('✅ PASS: La tarjeta del préstamo activo en el Portal del Cliente incluye correctamente el saldo por pagar.');
    process.exit(0);
}

testPortalSaldoPrestamo();
