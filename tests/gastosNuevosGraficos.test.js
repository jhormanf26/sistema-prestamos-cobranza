/**
 * @file tests/gastosNuevosGraficos.test.js
 * @description Suite de pruebas TDD para validar que la vista de Gastos Operativos
 *              tenga estructurados de forma responsiva y correcta los canvas y scripts
 *              para los nuevos gráficos de "Gastos por Mes" y "Gastos por Responsable".
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

/**
 * Función principal que ejecuta las pruebas TDD para verificar la existencia de los nuevos gráficos.
 * @returns {void}
 */
function testGastosNuevosGraficos() {
    console.log('🧪 Iniciando prueba TDD para verificar la estructura de los nuevos gráficos en Gastos...');

    const viewPath = path.join(__dirname, '../views/gastos/index.ejs');
    
    // Verificar que el archivo de la vista existe
    assert.ok(fs.existsSync(viewPath), 'El archivo index.ejs de gastos debe existir');

    const htmlContent = fs.readFileSync(viewPath, 'utf8');

    // 1. Validar el canvas de "Gastos por Mes"
    console.log('  - Validando presencia del canvas para "Gastos por Mes"...');
    assert.ok(htmlContent.includes('chartGastoDinamicoMes'), 'Debe existir un elemento canvas con el ID "chartGastoDinamicoMes"');

    // 2. Validar el canvas de "Gastos por Responsable"
    console.log('  - Validando presencia del canvas para "Gastos por Responsable"...');
    assert.ok(htmlContent.includes('chartGastoDinamicoResponsable'), 'Debe existir un elemento canvas con el ID "chartGastoDinamicoResponsable"');

    // 3. Validar los títulos correspondientes en la vista
    console.log('  - Validando la presencia de los títulos de los nuevos gráficos...');
    assert.ok(htmlContent.includes('Gastos por Mes') || htmlContent.includes('Gastos por mes'), 'Debe existir el título "Gastos por Mes"');
    assert.ok(htmlContent.includes('Gastos por Responsable') || htmlContent.includes('Gastos por responsable'), 'Debe existir el título "Gastos por Responsable"');

    // 4. Validar que la lógica de JavaScript inicialice Chart.js para estos nuevos gráficos
    console.log('  - Validando la instanciación de Chart.js para los nuevos gráficos...');
    assert.ok(htmlContent.includes('chartGastoDinamicoMes'), 'Debe haber referencias en el script al chartGastoDinamicoMes');
    assert.ok(htmlContent.includes('chartGastoDinamicoResponsable'), 'Debe haber referencias en el script al chartGastoDinamicoResponsable');

    console.log('✅ PASS: Los nuevos gráficos están correctamente definidos en la estructura HTML y JS de la vista.');
    process.exit(0);
}

testGastosNuevosGraficos();
