/**
 * @file tests/ayudaScoreCupos.test.js
 * @description Test TDD para validar que el modal de ayuda de score crediticio en
 *              todas las vistas (perfil de cliente, index de clientes, y dashboard de portal)
 *              muestre el cupo máximo para cada categoría.
 * @run node tests/ayudaScoreCupos.test.js
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function testAyudaScoreCupos() {
    console.log('🧪 Iniciando prueba TDD para verificar visualización del cupo máximo por score...');

    const vistas = [
        '../views/portal-cliente/dashboard.ejs',
        '../views/clientes/index.ejs',
        '../views/clientes/perfil.ejs'
    ];

    vistas.forEach(relPath => {
        const fullPath = path.join(__dirname, relPath);
        console.log(`  - Verificando vista: ${path.basename(relPath)}...`);
        assert.ok(fs.existsSync(fullPath), `El archivo ${path.basename(relPath)} debe existir`);

        const htmlContent = fs.readFileSync(fullPath, 'utf8');

        // Verificar encabezado de columna
        assert.ok(htmlContent.includes('Cupo M') && htmlContent.includes('Tasa (Int. / Mora)'), 
                  'Debe incluir la columna de Cupo Máximo en la tabla');

        // Verificar montos específicos
        assert.ok(htmlContent.includes('$ 2.000.000'), 'Debe incluir el cupo de $ 2.000.000');
        assert.ok(htmlContent.includes('$ 1.000.000'), 'Debe incluir el cupo de $ 1.000.000');
        assert.ok(htmlContent.includes('$ 500.000'), 'Debe incluir el cupo de $ 500.000');
        assert.ok(htmlContent.includes('$ 300.000'), 'Debe incluir el cupo de $ 300.000');
        assert.ok(htmlContent.includes('$ 200.000'), 'Debe incluir el cupo de $ 200.000');
    });

    console.log('✅ PASS: El modal de ayuda de score muestra correctamente el cupo máximo por categoría.');
}

testAyudaScoreCupos();
