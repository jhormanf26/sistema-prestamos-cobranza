const assert = require('assert');
const db = require('../config/db');
const ClienteModel = require('../models/ClienteModel');
const ClienteDocumentoModel = require('../models/ClienteDocumentoModel');
const { runMigrations } = require('../config/migrations');

/**
 * Suite de pruebas TDD para verificar la persistencia, consulta, aprobación,
 * rechazo y eliminación de los documentos del cliente.
 */
async function ejecutarPruebasClientesDocumentos() {
    console.log('🧪 Iniciando Suite de Pruebas TDD para Documentos de Clientes...');
    
    try {
        console.log('🔄 Ejecutando migraciones antes de iniciar los tests...');
        await runMigrations();
    } catch (errMig) {
        console.error('⚠️ Error al ejecutar migraciones en el test:', errMig.message);
    }

    let clientePruebaId = null;
    let documentoPruebaId = null;

    try {
        // 1. Crear un cliente de prueba con DNI único para asociar los documentos
        const dniUnico = '99999999';
        
        // Limpiar si existía previamente por algún test fallido
        const clientePrevio = await ClienteModel.buscarPorDNI(dniUnico);
        if (clientePrevio) {
            await db.query('DELETE FROM clientes WHERE id = ?', [clientePrevio.id]);
        }

        console.log('👤 Creando cliente temporal para el test...');
        clientePruebaId = await ClienteModel.crear({
            dni: dniUnico,
            nombre: 'Juan Test',
            apellido: 'Perez Documentos',
            telefono: '3000000000',
            direccion: 'Calle Falsa 123',
            email: 'juan.perez.test@ejemplo.com'
        });
        assert.ok(clientePruebaId, 'El cliente de prueba debería haberse creado.');

        // 2. Probar la inserción de un documento por el cliente (estado inicial 'pendiente')
        console.log('💾 Probando creación de documento (Cédula)...');
        documentoPruebaId = await ClienteDocumentoModel.crear({
            cliente_id: clientePruebaId,
            nombre_documento: 'Cédula de Ciudadanía',
            archivo_url: '/uploads/documentos/test-cedula.pdf',
            subido_por: 'cliente',
            estado: 'pendiente'
        });
        assert.ok(documentoPruebaId, 'El documento debería haberse registrado.');

        // 3. Probar la recuperación y validación de campos
        console.log('🔍 Probando recuperación del documento...');
        const docRecuperado = await ClienteDocumentoModel.obtenerPorId(documentoPruebaId);
        assert.ok(docRecuperado, 'Se debería poder recuperar el documento.');
        assert.strictEqual(docRecuperado.nombre_documento, 'Cédula de Ciudadanía', 'El nombre del documento debe coincidir.');
        assert.strictEqual(docRecuperado.archivo_url, '/uploads/documentos/test-cedula.pdf', 'La URL del archivo debe coincidir.');
        assert.strictEqual(docRecuperado.estado, 'pendiente', 'El estado por defecto debe ser pendiente.');
        assert.strictEqual(docRecuperado.subido_por, 'cliente', 'El autor de la subida debe ser cliente.');

        // 4. Probar la aprobación del documento por el administrador
        console.log('✅ Probando aprobación del documento...');
        const okAprobar = await ClienteDocumentoModel.actualizarEstado(documentoPruebaId, 'aprobado');
        assert.strictEqual(okAprobar, true, 'La actualización de estado debe indicar éxito.');
        
        const docAprobado = await ClienteDocumentoModel.obtenerPorId(documentoPruebaId);
        assert.strictEqual(docAprobado.estado, 'aprobado', 'El estado debe ser aprobado.');
        assert.strictEqual(docAprobado.motivo_rechazo, null, 'El motivo de rechazo debe ser null.');

        // 5. Probar el rechazo del documento con motivo
        console.log('❌ Probando rechazo del documento con observaciones...');
        const motivoRechazo = 'La imagen de la cédula está borrosa y no es legible.';
        const okRechazar = await ClienteDocumentoModel.actualizarEstado(documentoPruebaId, 'rechazado', motivoRechazo);
        assert.strictEqual(okRechazar, true, 'La actualización a rechazado debe indicar éxito.');

        const docRechazado = await ClienteDocumentoModel.obtenerPorId(documentoPruebaId);
        assert.strictEqual(docRechazado.estado, 'rechazado', 'El estado debe ser rechazado.');
        assert.strictEqual(docRechazado.motivo_rechazo, motivoRechazo, 'El motivo de rechazo debe guardarse correctamente.');

        // 6. Probar la obtención por cliente
        console.log('📂 Probando listado de documentos por cliente...');
        const listaDocs = await ClienteDocumentoModel.obtenerPorCliente(clientePruebaId);
        assert.strictEqual(listaDocs.length, 1, 'El cliente debe tener exactamente 1 documento.');
        assert.strictEqual(listaDocs[0].id, documentoPruebaId, 'El ID del documento listado debe coincidir.');

        // 7. Probar la eliminación del documento
        console.log('🗑️ Probando eliminación de documento...');
        const okEliminar = await ClienteDocumentoModel.eliminar(documentoPruebaId);
        assert.strictEqual(okEliminar, true, 'La eliminación debe indicar éxito.');
        
        const docEliminado = await ClienteDocumentoModel.obtenerPorId(documentoPruebaId);
        assert.strictEqual(docEliminado, null, 'El documento ya no debe existir en la base de datos.');

        console.log('✅ Pruebas TDD de Documentos de Clientes COMPLETADAS CON ÉXITO.');

    } catch (error) {
        console.error('❌ Error durante la ejecución de las pruebas TDD:', error);
        process.exit(1);
    } finally {
        // 8. Autolimpieza: eliminar el cliente temporal y sus relaciones
        if (clientePruebaId) {
            console.log('🔄 Ejecutando autolimpieza: Eliminando cliente de prueba...');
            try {
                await db.query('DELETE FROM clientes WHERE id = ?', [clientePruebaId]);
                console.log('🔄 Cliente de prueba eliminado.');
            } catch (errClean) {
                console.error('⚠️ Error al limpiar el cliente de prueba:', errClean.message);
            }
        }

        // Finalizar la conexión a la base de datos de manera limpia
        db.end();
    }
}

ejecutarPruebasClientesDocumentos();
