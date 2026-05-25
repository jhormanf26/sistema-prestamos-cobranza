const assert = require('assert');
const db = require('../config/db');
const ClienteModel = require('../models/ClienteModel');
const PrestamoModel = require('../models/PrestamoModel');
const AhorroModel = require('../models/AhorroModel');
const middlewarePredictivo = require('../middleware/cargarDatosPredictivosCliente');

/**
 * Suite de pruebas TDD para verificar la carga de datos predictivos del Asistente de IA.
 */
async function ejecutarPruebasAsistenteDinamico() {
    console.log('🧪 Iniciando Suite de Pruebas TDD para el Asistente de IA Proactivo y Predictivo...');

    const dniPruebaMora = '9999999991';
    const dniPruebaContrato = '9999999992';
    const dniPruebaCuota = '9999999993';
    const dniPruebaAhorro = '9999999994';

    let idClienteMora = null;
    let idClienteContrato = null;
    let idClienteCuota = null;
    let idClienteAhorro = null;

    let idPrestamoMora = null;
    let idPrestamoContrato = null;
    let idPrestamoCuota = null;
    let idCuentaAhorro = null;

    try {
        // 1. Limpieza preventiva de datos de prueba
        console.log('🧹 Limpieza preventiva de base de datos...');
        await db.query('DELETE FROM pagos WHERE prestamo_id IN (SELECT id FROM prestamos WHERE cliente_id IN (SELECT id FROM clientes WHERE dni IN (?, ?, ?, ?)))', [dniPruebaMora, dniPruebaContrato, dniPruebaCuota, dniPruebaAhorro]);
        await db.query('DELETE FROM prestamos WHERE cliente_id IN (SELECT id FROM clientes WHERE dni IN (?, ?, ?, ?))', [dniPruebaMora, dniPruebaContrato, dniPruebaCuota, dniPruebaAhorro]);
        await db.query('DELETE FROM cuentas_ahorro WHERE cliente_id IN (SELECT id FROM clientes WHERE dni IN (?, ?, ?, ?))', [dniPruebaMora, dniPruebaContrato, dniPruebaCuota, dniPruebaAhorro]);
        await db.query('DELETE FROM clientes WHERE dni IN (?, ?, ?, ?)', [dniPruebaMora, dniPruebaContrato, dniPruebaCuota, dniPruebaAhorro]);

        // 2. Crear escenarios de prueba

        // Escenario A: Cliente en Mora
        console.log('👤 Creando Cliente A (Mora)...');
        await ClienteModel.crear({
            dni: dniPruebaMora,
            nombre: 'Cliente',
            apellido: 'Mora',
            telefono: '3150000001',
            direccion: 'Calle Mora 1',
            email: 'mora@ejemplo.com',
            monto_preaprobado: 0
        });
        const cMora = await ClienteModel.buscarPorDNI(dniPruebaMora);
        idClienteMora = cMora.id;

        // Insertar préstamo vencido para el Cliente A
        // Usamos fecha de fin en el pasado para forzar cuotas vencidas (mora dinámica)
        const [resMora] = await db.query(
            `INSERT INTO prestamos (cliente_id, monto_prestado, tasa_interes, tasa_mora, monto_total, cuotas, frecuencia, estado, fecha_inicio, fecha_fin, firma_digital) 
             VALUES (?, 1000.00, 20.00, 0.00, 1200.00, 1, 'mensual', 'pendiente', '2026-01-01', '2026-02-01', 'firma_base64_valida')`,
            [idClienteMora]
        );
        idPrestamoMora = resMora.insertId;

        // Escenario B: Cliente con Contrato Pendiente de Firma
        console.log('👤 Creando Cliente B (Contrato Pendiente)...');
        await ClienteModel.crear({
            dni: dniPruebaContrato,
            nombre: 'Cliente',
            apellido: 'Contrato',
            telefono: '3150000002',
            direccion: 'Calle Contrato 2',
            email: 'contrato@ejemplo.com',
            monto_preaprobado: 0
        });
        const cContrato = await ClienteModel.buscarPorDNI(dniPruebaContrato);
        idClienteContrato = cContrato.id;

        // Préstamo activo sin firma digital
        const [resContrato] = await db.query(
            `INSERT INTO prestamos (cliente_id, monto_prestado, tasa_interes, tasa_mora, monto_total, cuotas, frecuencia, estado, fecha_inicio, fecha_fin, firma_digital) 
             VALUES (?, 1000.00, 20.00, 0.00, 1200.00, 1, 'mensual', 'pendiente', '2026-05-20', '2026-06-20', NULL)`,
            [idClienteContrato]
        );
        idPrestamoContrato = resContrato.insertId;

        // Escenario C: Cliente con Cuota Cercana (a vencer en 3 días)
        console.log('👤 Creando Cliente C (Cuota Cercana)...');
        await ClienteModel.crear({
            dni: dniPruebaCuota,
            nombre: 'Cliente',
            apellido: 'Cuota',
            telefono: '3150000003',
            direccion: 'Calle Cuota 3',
            email: 'cuota@ejemplo.com',
            monto_preaprobado: 0
        });
        const cCuota = await ClienteModel.buscarPorDNI(dniPruebaCuota);
        idClienteCuota = cCuota.id;

        // Establecer fecha de inicio de tal forma que la primera cuota venza en 3 días.
        // Frecuencia diaria, la cuota vence 1 día después del inicio.
        // Haremos frecuencia mensual. Para que venza en 3 días hoy + 3 días - 1 mes = fecha de inicio.
        const fechaCuotaVence = new Date();
        fechaCuotaVence.setDate(fechaCuotaVence.getDate() + 3);
        const fechaInicioCuota = new Date(fechaCuotaVence);
        fechaInicioCuota.setMonth(fechaInicioCuota.getMonth() - 1);
        const fechaInicioStr = fechaInicioCuota.toISOString().slice(0, 10);
        const fechaFinStr = fechaCuotaVence.toISOString().slice(0, 10);

        const [resCuota] = await db.query(
            `INSERT INTO prestamos (cliente_id, monto_prestado, tasa_interes, tasa_mora, monto_total, cuotas, frecuencia, estado, fecha_inicio, fecha_fin, firma_digital) 
             VALUES (?, 1000.00, 20.00, 0.00, 1200.00, 1, 'mensual', 'pendiente', ?, ?, 'firma_base64_valida')`,
            [idClienteCuota, fechaInicioStr, fechaFinStr]
        );
        idPrestamoCuota = resCuota.insertId;

        // Escenario D: Cliente con Cuenta de Ahorro y Meta Establecida
        console.log('👤 Creando Cliente D (Meta Ahorro)...');
        await ClienteModel.crear({
            dni: dniPruebaAhorro,
            nombre: 'Cliente',
            apellido: 'Ahorro',
            telefono: '3150000004',
            direccion: 'Calle Ahorro 4',
            email: 'ahorro@ejemplo.com',
            monto_preaprobado: 1000000 // Para verificar también preaprobados si no hay deudas
        });
        const cAhorro = await ClienteModel.buscarPorDNI(dniPruebaAhorro);
        idClienteAhorro = cAhorro.id;

        // Crear cuenta de ahorro con meta
        const [resAhorro] = await db.query(
            `INSERT INTO cuentas_ahorro (cliente_id, saldo_actual, meta_nombre, meta_monto) VALUES (?, 250000.00, 'Vacaciones', 500000.00)`,
            [idClienteAhorro]
        );
        idCuentaAhorro = resAhorro.insertId;

        // 3. Probar el Middleware

        console.log('🧪 Probando middleware en Escenario A (Cliente en Mora)...');
        const reqA = { session: { cliente: { id: idClienteMora } } };
        const resA = { locals: {} };
        await middlewarePredictivo(reqA, resA, () => {});

        assert.strictEqual(resA.locals.datosPredictivos.tieneMora, true, 'Debería detectar que tiene mora.');
        assert.ok(resA.locals.datosPredictivos.moraDetalle.length > 0, 'Debería tener detalles del préstamo en mora.');
        assert.strictEqual(resA.locals.datosPredictivos.moraDetalle[0].id, idPrestamoMora, 'El ID del préstamo en mora debe coincidir.');

        console.log('🧪 Probando middleware en Escenario B (Contrato Pendiente)...');
        const reqB = { session: { cliente: { id: idClienteContrato } } };
        const resB = { locals: {} };
        await middlewarePredictivo(reqB, resB, () => {});

        assert.ok(resB.locals.datosPredictivos.contratoPendiente, 'Debería detectar contrato pendiente.');
        assert.strictEqual(resB.locals.datosPredictivos.contratoPendiente.id, idPrestamoContrato, 'El ID del contrato pendiente debe coincidir.');

        console.log('🧪 Probando middleware en Escenario C (Cuota Cercana)...');
        const reqC = { session: { cliente: { id: idClienteCuota } } };
        const resC = { locals: {} };
        await middlewarePredictivo(reqC, resC, () => {});

        assert.ok(resC.locals.datosPredictivos.cuotaCercana, 'Debería detectar cuota cercana.');
        assert.strictEqual(resC.locals.datosPredictivos.cuotaCercana.prestamoId, idPrestamoCuota, 'El ID del préstamo con cuota cercana debe coincidir.');
        assert.strictEqual(resC.locals.datosPredictivos.cuotaCercana.diasRestantes, 3, 'Los días restantes calculados deberían ser 3.');

        console.log('🧪 Probando middleware en Escenario D (Meta de Ahorros y Cupo Preaprobado)...');
        const reqD = { session: { cliente: { id: idClienteAhorro } } };
        const resD = { locals: {} };
        await middlewarePredictivo(reqD, resD, () => {});

        // Al no tener préstamos activos, debería detectar el cupo pre-aprobado y la meta de ahorros
        assert.strictEqual(resD.locals.datosPredictivos.cupoPreaprobado, 1000000, 'Debería detectar el cupo preaprobado de 1M.');
        assert.ok(resD.locals.datosPredictivos.ahorroMeta, 'Debería detectar la meta de ahorro.');
        assert.strictEqual(resD.locals.datosPredictivos.ahorroMeta.metaNombre, 'Vacaciones', 'El nombre de la meta debe coincidir.');
        assert.strictEqual(resD.locals.datosPredictivos.ahorroMeta.porcentaje, 50, 'El porcentaje calculado de meta debe ser 50%.');

        console.log('✅ Todas las validaciones lógicas del middleware pasaron con éxito.');
        console.log('🎉 Pruebas TDD del Asistente Predictivo COMPLETADAS CON ÉXITO.');

    } catch (error) {
        console.error('❌ Error durante la ejecución de las pruebas TDD del Asistente Predictivo:', error);
        process.exit(1);
    } finally {
        // 4. Limpieza final de la base de datos
        console.log('🧹 Limpieza final de base de datos...');
        if (idClienteMora || idClienteContrato || idClienteCuota || idClienteAhorro) {
            await db.query('DELETE FROM pagos WHERE prestamo_id IN (?, ?, ?)', [idPrestamoMora, idPrestamoContrato, idPrestamoCuota]);
            await db.query('DELETE FROM prestamos WHERE id IN (?, ?, ?)', [idPrestamoMora, idPrestamoContrato, idPrestamoCuota]);
            await db.query('DELETE FROM cuentas_ahorro WHERE cliente_id IN (?, ?, ?, ?)', [idClienteMora, idClienteContrato, idClienteCuota, idClienteAhorro]);
            await db.query('DELETE FROM clientes WHERE id IN (?, ?, ?, ?)', [idClienteMora, idClienteContrato, idClienteCuota, idClienteAhorro]);
        }
        db.end();
    }
}

ejecutarPruebasAsistenteDinamico();
