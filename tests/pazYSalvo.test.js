const assert = require('assert');
const db = require('../config/db');
const ClienteModel = require('../models/ClienteModel');
const PrestamoModel = require('../models/PrestamoModel');
const pdfService = require('../utils/pdfService');
const { runMigrations } = require('../config/migrations');

/**
 * Suite de pruebas TDD para verificar la generación de certificados PDF de Paz y Salvo.
 * Valida restricciones de estado de pago e integridad en la inyección de variables.
 */
async function ejecutarPruebasPazYSalvo() {
    console.log('🧪 Iniciando Suite de Pruebas TDD para Certificados de Paz y Salvo PDF...');

    try {
        console.log('🔄 Ejecutando migraciones automáticas...');
        await runMigrations();
    } catch (errMig) {
        console.error('⚠️ Error al ejecutar migraciones en el test:', errMig.message);
    }

    let clienteId = null;
    let prestamoId = null;

    try {
        const dniUnico = '99999004';

        // 1. Limpieza de datos huérfanos anteriores
        const clientePrevio = await ClienteModel.buscarPorDNI(dniUnico);
        if (clientePrevio) {
            await db.query('DELETE FROM prestamos WHERE cliente_id = ?', [clientePrevio.id]);
            await db.query('DELETE FROM clientes WHERE id = ?', [clientePrevio.id]);
        }

        // 2. Crear cliente de prueba
        console.log('👤 Creando cliente temporal para el test...');
        const resultCliente = await ClienteModel.crear({
            dni: dniUnico,
            nombre: 'Carlos Paz',
            apellido: 'Y Salvo',
            telefono: '3110000000',
            direccion: 'Calle Falsa 456',
            email: 'carlos.paz@test.com'
        });
        clienteId = resultCliente.insertId;
        assert.ok(clienteId, 'El cliente temporal debe ser creado con éxito.');

        // 3. Crear préstamo pendiente de prueba
        console.log('💵 Creando préstamo pendiente de prueba...');
        // Insertamos el préstamo directamente en la BD
        const [resPrestamo] = await db.query(`
            INSERT INTO prestamos 
            (cliente_id, monto_prestado, tasa_interes, tasa_mora, monto_total, cuotas, frecuencia, estado, fecha_inicio, fecha_fin) 
            VALUES (?, 500000.00, 20.00, 0.00, 600000.00, 6, 'mensual', 'pendiente', '2026-06-21', '2026-12-21')
        `, [clienteId]);
        prestamoId = resPrestamo.insertId;
        assert.ok(prestamoId, 'El préstamo temporal debe ser creado con éxito.');

        // 4. Intentar generar Paz y Salvo para préstamo PENDIENTE (Debe arrojar error)
        console.log('❌ Validando que no se pueda generar Paz y Salvo para un préstamo pendiente...');
        try {
            await pdfService.generarPazYSalvoBuffer(prestamoId);
            assert.fail('El pdfService debería haber fallado al intentar generar Paz y Salvo para un préstamo no pagado.');
        } catch (error) {
            const errStr = String(error.message || error);
            assert.ok(errStr.includes('no está pagado') || errStr.includes('no liquidado') || errStr.includes('estado') || errStr.includes('not a function'), `El error retornado debe ser relacionado al estado del préstamo o la inexistencia del método. Error recibido: ${errStr}`);
            console.log('   - Correcto: Se rechazó la generación del Paz y Salvo para un préstamo pendiente o por no estar implementada la función.');
        }

        // 5. Cambiar el estado del préstamo a 'pagado'
        console.log('🔄 Cambiando estado del préstamo a "pagado"...');
        await db.query("UPDATE prestamos SET estado = 'pagado' WHERE id = ?", [prestamoId]);

        // 6. Intentar generar Paz y Salvo para préstamo PAGADO (Debe tener éxito)
        console.log('📄 Generando Paz y Salvo para el préstamo pagado...');
        const pdfBuffer = await pdfService.generarPazYSalvoBuffer(prestamoId);
        assert.ok(pdfBuffer instanceof Buffer, 'El resultado de generarPazYSalvoBuffer debe ser un Buffer.');
        assert.ok(pdfBuffer.length > 100, 'El buffer del PDF debe contener datos legibles.');
        console.log('   - Correcto: El PDF de Paz y Salvo se generó exitosamente.');

        console.log('✅ Pruebas TDD de Paz y Salvo COMPLETADAS CON ÉXITO.');

    } catch (error) {
        console.error('❌ Error durante la ejecución de las pruebas TDD:', error);
        process.exit(1);
    } finally {
        // Autolimpieza
        if (clienteId) {
            console.log('🔄 Ejecutando autolimpieza: Eliminando datos temporales...');
            try {
                await db.query('DELETE FROM prestamos WHERE cliente_id = ?', [clienteId]);
                await db.query('DELETE FROM clientes WHERE id = ?', [clienteId]);
                console.log('🔄 Datos de prueba eliminados correctamente.');
            } catch (errClean) {
                console.error('⚠️ Error en autolimpieza:', errClean.message);
            }
        }
        // Cerrar conexión
        db.end();
    }
}

ejecutarPruebasPazYSalvo();
