/**
 * @file tests/adminAlertasSidebar.test.js
 * @description Suite de pruebas TDD para verificar la lógica de notificaciones en el sidebar administrativo.
 * @run node tests/adminAlertasSidebar.test.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function ejecutarPruebasAdminAlertasSidebar() {
    console.log('🧪 Iniciando Suite de Pruebas TDD para Alertas y Notificaciones del Sidebar Administrativo...');

    const viewPath = path.join(__dirname, '../views/partials/sidebar.ejs');
    assert.ok(fs.existsSync(viewPath), 'El archivo sidebar.ejs debe existir');

    const htmlContent = fs.readFileSync(viewPath, 'utf8');

    // 1. Validar que la vista sidebar.ejs contenga las directivas de renderizado de badges para las variables
    console.log('  - Validando estructura de notificaciones en el Sidebar (HTML)...');
    assert.ok(htmlContent.includes('comprobantesSinLeer'), 'Debe usar comprobantesSinLeer en el sidebar');
    assert.ok(htmlContent.includes('solicitudesSinLeer'), 'Debe usar solicitudesSinLeer en el sidebar');
    assert.ok(htmlContent.includes('ahorrosSinLeer'), 'Debe usar ahorrosSinLeer en el sidebar');
    console.log('  ✅ Sidebar HTML estructurado correctamente.');

    // 2. Probar consultas de BD
    try {
        console.log('  - Realizando consultas simuladas de conteo de pendientes...');
        
        // Comprobantes
        const [comprobantesRows] = await db.query(`
            SELECT COUNT(*) as total FROM reportes_pago WHERE estado = 'pendiente'
        `);
        const comprobantesSinLeer = comprobantesRows[0]?.total || 0;
        console.log(`    * Comprobantes pendientes en BD: ${comprobantesSinLeer}`);

        // Solicitudes de cupo
        const [solicitudesRows] = await db.query(`
            SELECT COUNT(*) as total FROM solicitudes_credito WHERE estado = 'pendiente'
        `);
        const solicitudesSinLeer = solicitudesRows[0]?.total || 0;
        console.log(`    * Solicitudes de Cupo pendientes en BD: ${solicitudesSinLeer}`);

        // Solicitudes de Ahorro (aportes + retiros)
        const [aportesRows] = await db.query(`
            SELECT COUNT(*) as total FROM reportes_aporte_ahorro WHERE estado = 'pendiente'
        `);
        const [retirosRows] = await db.query(`
            SELECT COUNT(*) as total FROM solicitudes_retiro_ahorro WHERE estado = 'pendiente'
        `);
        const ahorrosSinLeer = (aportesRows[0]?.total || 0) + (retirosRows[0]?.total || 0);
        console.log(`    * Solicitudes de Ahorro pendientes (aportes + retiros) en BD: ${ahorrosSinLeer}`);

        console.log('  ✅ Consultas SQL válidas y funcionales en base de datos.');
        console.log('🎉 Suite de Pruebas TDD de Alertas de Sidebar Administrativo COMPLETADA CON ÉXITO.');
        process.exit(0);
    } catch (error) {
        console.error('❌ La suite de pruebas TDD ha fallado:', error.message);
        process.exit(1);
    }
}

ejecutarPruebasAdminAlertasSidebar();
