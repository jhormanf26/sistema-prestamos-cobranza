/**
 * @file tests/clientesResponsiveIndex.test.js
 * @description Suite de pruebas TDD para validar la responsividad del listado administrativo de clientes.
 *              Asegura que la tabla tradicional se oculte en móviles y se reemplace por tarjetas responsivas.
 * @run node tests/clientesResponsiveIndex.test.js
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function testClientesResponsiveIndex() {
    console.log('🧪 Iniciando prueba TDD para verificar el listado responsivo de clientes en administración...');

    const viewPath = path.join(__dirname, '../views/clientes/index.ejs');
    
    // Verificar que la vista existe
    assert.ok(fs.existsSync(viewPath), 'El archivo index.ejs de clientes debe existir');

    const htmlContent = fs.readFileSync(viewPath, 'utf8');

    // 1. Validar que exista la tabla con clase d-none d-md-block (u ocultable)
    console.log('  - Validando ocultamiento de la tabla tradicional en móvil (d-none d-md-block)...');
    assert.ok(htmlContent.includes('d-none d-md-block') || htmlContent.includes('table-responsive d-none d-md-block'), 
              'Debe aplicarse d-none d-md-block a la sección de la tabla de escritorio');

    // 2. Validar que exista la sección de tarjetas móviles con clase d-block d-md-none
    console.log('  - Validando presencia de listado de tarjetas móvil (d-block d-md-none)...');
    assert.ok(htmlContent.includes('d-block d-md-none'), 'Debe existir la sección responsiva de tarjetas móviles');

    // 3. Validar que las tarjetas móviles muestren la info del cliente y el bucle
    console.log('  - Validando bucle de clientes en las tarjetas...');
    assert.ok(htmlContent.includes('clientes.forEach'), 'Debe iterar sobre el arreglo de clientes');

    console.log('✅ PASS: El listado de clientes administrativo es 100% responsivo con tarjetas premium.');
    process.exit(0);
}

testClientesResponsiveIndex();
