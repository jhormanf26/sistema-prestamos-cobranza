const assert = require('assert');
const db = require('../config/db');
const ClienteModel = require('../models/ClienteModel');
const SolicitudCreditoModel = require('../models/SolicitudCreditoModel');

/**
 * Suite de pruebas TDD para el Flujo de Solicitud de Crédito desde el Portal.
 */
async function ejecutarPruebasPortalSolicitudesFlujo() {
    console.log('🧪 Iniciando Suite de Pruebas TDD para Solicitud de Crédito...');

    const dniConCupo = '9999999991';
    const dniSinCupo = '9999999992';
    
    let idClienteConCupo = null;
    let idClienteSinCupo = null;
    let solicitudesLimpiar = [];
    let adminUsuarioId = null;
    let adminTemporalCreado = false;

    try {
        // 1. Limpieza preventiva
        await db.query('DELETE FROM solicitudes_credito WHERE cliente_id IN (SELECT id FROM clientes WHERE dni IN (?, ?))', [dniConCupo, dniSinCupo]);
        await db.query('DELETE FROM clientes WHERE dni IN (?, ?)', [dniConCupo, dniSinCupo]);

        // 2. Crear clientes de prueba
        // Cliente con cupo de $1.500.000
        await ClienteModel.crear({
            dni: dniConCupo,
            nombre: 'Ana',
            apellido: 'Con Cupo',
            telefono: '3121111111',
            direccion: 'Calle Norte 123',
            email: 'ana.cupo@ejemplo.com',
            monto_preaprobado: 1500000
        });
        const clienteConCupo = await ClienteModel.buscarPorDNI(dniConCupo);
        idClienteConCupo = clienteConCupo.id;

        // Cliente ordinario sin cupo pre-aprobado ($0)
        await ClienteModel.crear({
            dni: dniSinCupo,
            nombre: 'Pedro',
            apellido: 'Sin Cupo',
            telefono: '3122222222',
            direccion: 'Calle Sur 456',
            email: 'pedro.sincupo@ejemplo.com',
            monto_preaprobado: 0
        });
        const clienteSinCupo = await ClienteModel.buscarPorDNI(dniSinCupo);
        idClienteSinCupo = clienteSinCupo.id;

        // Obtener o crear un usuario administrador para la prueba (evitando fallo de llave foránea)
        const [usuariosExistentes] = await db.query('SELECT id FROM usuarios LIMIT 1');

        if (usuariosExistentes.length > 0) {
            adminUsuarioId = usuariosExistentes[0].id;
        } else {
            console.log('🔑 Creando usuario administrador temporal para la resolución de prueba...');
            const [resAdmin] = await db.query(
                "INSERT INTO usuarios (username, password, nombre, rol) VALUES (?, ?, ?, ?)",
                ['admin_temp_sol', '123456', 'Admin Temporal', 'admin']
            );
            adminUsuarioId = resAdmin.insertId;
            adminTemporalCreado = true;
        }

        // ==================================================
        // CASO 1: Solicitud con cupo pre-aprobado (dentro del límite)
        // ==================================================
        console.log('🧪 Caso 1: Creando solicitud con cupo pre-aprobado de $1.000.000...');
        const res1 = await SolicitudCreditoModel.crear({
            cliente_id: idClienteConCupo,
            monto_solicitado: 1000000,
            cuotas: 6,
            frecuencia: 'quincenal'
        });
        assert.ok(res1.insertId, 'La solicitud con cupo debería registrarse y retornar un ID.');
        solicitudesLimpiar.push(res1.insertId);

        // ==================================================
        // CASO 2: Solicitud ordinaria (cliente sin cupo pre-aprobado, monto permitido)
        // ==================================================
        console.log('🧪 Caso 2: Creando solicitud ordinaria de $1.500.000 (límite general $3.000.000)...');
        const res2 = await SolicitudCreditoModel.crear({
            cliente_id: idClienteSinCupo,
            monto_solicitado: 1500000,
            cuotas: 12,
            frecuencia: 'mensual'
        });
        assert.ok(res2.insertId, 'La solicitud ordinaria permitida debería registrarse y retornar un ID.');
        solicitudesLimpiar.push(res2.insertId);

        // ==================================================
        // CASO 3: Listar solicitudes de un cliente
        // ==================================================
        console.log('🧪 Caso 3: Listando solicitudes de clientes creadas...');
        const solicitudesAna = await SolicitudCreditoModel.obtenerPorCliente(idClienteConCupo);
        assert.strictEqual(solicitudesAna.length, 1, 'Ana debería tener exactamente 1 solicitud.');
        assert.strictEqual(parseFloat(solicitudesAna[0].monto_solicitado), 1000000, 'El monto de la solicitud debe ser de $1.000.000.');
        assert.strictEqual(solicitudesAna[0].estado, 'pendiente', 'La solicitud inicial debe crearse en estado "pendiente".');

        const solicitudesPedro = await SolicitudCreditoModel.obtenerPorCliente(idClienteSinCupo);
        assert.strictEqual(solicitudesPedro.length, 1, 'Pedro debería tener exactamente 1 solicitud.');
        assert.strictEqual(parseFloat(solicitudesPedro[0].monto_solicitado), 1500000, 'El monto de la solicitud ordinaria debe coincidir.');

        // ==================================================
        // CASO 4: Resolver y verificar resolución
        // ==================================================
        console.log('🧪 Caso 4: Resolviendo (aprobando) solicitud de Ana...');
        await SolicitudCreditoModel.resolverSolicitud(
            res1.insertId,
            'aprobado',
            'Aprobación autorizada por TDD',
            adminUsuarioId,
            1000000, // monto aprobado
            6,       // cuotas aprobadas
            'quincenal' // frecuencia aprobada
        );

        const solicitudResuelta = await SolicitudCreditoModel.obtenerPorId(res1.insertId);
        assert.strictEqual(solicitudResuelta.estado, 'aprobado', 'La solicitud de Ana debería figurar como "aprobado".');
        assert.strictEqual(solicitudResuelta.comentarios, 'Aprobación autorizada por TDD', 'Los comentarios deben coincidir.');

        console.log('✅ Todas las pruebas del modelo de solicitudes pasaron con éxito.');
        
    } catch (error) {
        console.error('❌ Error en suite de pruebas de solicitudes:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        console.log('🧹 Limpiando base de datos (eliminando clientes y solicitudes de prueba)...');
        if (solicitudesLimpiar.length > 0) {
            await db.query('DELETE FROM solicitudes_credito WHERE id IN (?)', [solicitudesLimpiar]);
        }
        await db.query('DELETE FROM clientes WHERE id IN (?, ?)', [idClienteConCupo, idClienteSinCupo]);
        
        if (adminTemporalCreado && adminUsuarioId) {
            await db.query('DELETE FROM usuarios WHERE id = ?', [adminUsuarioId]);
        }
        db.end();
    }
}

ejecutarPruebasPortalSolicitudesFlujo();
