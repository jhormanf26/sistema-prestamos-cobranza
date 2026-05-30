/**
 * @file tests/portalMenuFijo.test.js
 * @description Suite de pruebas TDD para verificar que la cabecera móvil (Mobile Header Simple)
 *              esté fijada (sticky-top / fixed) en las vistas principales del portal de clientes
 *              para permitir un acceso fácil y permanente al menú lateral durante el scroll.
 * @run node tests/portalMenuFijo.test.js
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function testPortalMenuFijo() {
    console.log('🧪 Iniciando prueba TDD para verificar menú móvil fijo (sticky-top)...');

    const vistas = [
        'dashboard.ejs',
        'perfil.ejs',
        'documentos.ejs',
        'chat.ejs'
    ];

    vistas.forEach(vista => {
        const vistaPath = path.join(__dirname, '../views/portal-cliente/', vista);
        console.log(`  - Validando vista: ${vista}...`);
        
        assert.ok(fs.existsSync(vistaPath), `El archivo ${vista} debe existir`);
        const content = fs.readFileSync(vistaPath, 'utf8');

        // Buscar el div Mobile Header Simple
        const tieneSticky = content.includes('sticky-top') || content.includes('position: sticky') || content.includes('position: fixed');
        assert.ok(tieneSticky, `La cabecera móvil en ${vista} debe estar configurada como fija (sticky/fixed)`);
    });

    console.log('✅ PASS: Todas las cabeceras móviles están correctamente fijadas.');
    process.exit(0);
}

testPortalMenuFijo();
