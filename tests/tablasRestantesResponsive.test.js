/**
 * @file tests/tablasRestantesResponsive.test.js
 * @description Suite de pruebas TDD para verificar que todas las tablas administrativas restantes
 *              hayan sido convertidas en tarjetas responsivas premium en dispositivos móviles.
 * @run node tests/tablasRestantesResponsive.test.js
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function testTablasRestantesResponsive() {
    console.log('🧪 Iniciando prueba TDD para verificar responsividad de tablas administrativas restantes...');

    const vistas = [
        { name: 'Solicitudes de Ahorro', path: '../views/ahorros/solicitudes.ejs' },
        { name: 'Gastos Operativos', path: '../views/gastos/index.ejs' },
        { name: 'Cuentas de Ahorro', path: '../views/ahorros/index.ejs' },
        { name: 'Cartera Vencida', path: '../views/prestamos/vencidos.ejs' },
        { name: 'Flujo de Caja', path: '../views/caja/index.ejs' },
        { name: 'Gestión de Usuarios', path: '../views/usuarios/index.ejs' },
        { name: 'Bitácora de Auditoría', path: '../views/bitacora/index.ejs' },
        { name: 'Perfil de Cliente', path: '../views/clientes/perfil.ejs' },
        { name: 'Cadenas de Ahorro', path: '../views/cadenas/index.ejs' },
        { name: 'Gestionar Cadena', path: '../views/cadenas/ver.ejs' }
    ];

    vistas.forEach(v => {
        const absolutePath = path.join(__dirname, v.path);
        console.log(`  - Verificando vista: ${v.name} (${v.path})...`);
        
        // 1. Validar que la vista existe
        assert.ok(fs.existsSync(absolutePath), `La vista ${v.name} en el path especificado debe existir.`);

        const htmlContent = fs.readFileSync(absolutePath, 'utf8');

        // 2. Validar que oculte la tabla tradicional en móviles
        assert.ok(
            htmlContent.includes('d-none d-md-block') || htmlContent.includes('table-responsive d-none d-md-block'),
            `La vista ${v.name} debe ocultar la tabla tradicional usando clases responsivas d-none d-md-block.`
        );

        // 3. Validar que contenga el wrapper móvil responsivo de tarjetas
        assert.ok(
            htmlContent.includes('d-block d-md-none'),
            `La vista ${v.name} debe implementar el contenedor de tarjetas móviles con la clase d-block d-md-none.`
        );
    });

    console.log('✅ PASS: ¡Todas las vistas administrativas restantes son 100% responsivas y cuentan con un diseño móvil premium de tarjetas!');
    process.exit(0);
}

testTablasRestantesResponsive();
