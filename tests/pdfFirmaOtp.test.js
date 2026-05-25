const assert = require('assert');
const db = require('../config/db');
const PrestamoModel = require('../models/PrestamoModel');
const ClienteModel = require('../models/ClienteModel');
const pdfService = require('../utils/pdfService');

/**
 * Suite de pruebas TDD para verificar la persistencia y renderizado del OTP de firma en el contrato.
 */
async function ejecutarPruebasPdfFirmaOtp() {
    console.log('🧪 Iniciando Suite de Pruebas TDD para OTP en Contrato PDF...');

    const dniCliente = '9999999998';
    let idCliente = null;
    let idPrestamo = null;

    try {
        // 1. Limpieza preventiva
        await db.query('DELETE FROM prestamos WHERE cliente_id IN (SELECT id FROM clientes WHERE dni = ?)', [dniCliente]);
        await db.query('DELETE FROM clientes WHERE dni = ?', [dniCliente]);

        // 2. Crear cliente de prueba
        await ClienteModel.crear({
            dni: dniCliente,
            nombre: 'Juan',
            apellido: 'Prueba PDF OTP',
            telefono: '3151234567',
            direccion: 'Calle Falsa 789',
            email: 'juan.pdf.otp@ejemplo.com',
            monto_preaprobado: 500000
        });

        const cliente = await ClienteModel.buscarPorDNI(dniCliente);
        idCliente = cliente.id;

        // 3. Crear préstamo de prueba
        const resPrestamo = await PrestamoModel.crear({
            cliente_id: idCliente,
            monto_prestado: 100000,
            tasa_interes: 10,
            tasa_mora: 5,
            monto_total: 110000,
            cuotas: 5,
            frecuencia: 'quincenal',
            fecha_inicio: '2026-05-25',
            fecha_fin: '2026-08-08',
            observaciones: 'Préstamo de prueba para firma con OTP'
        });
        idPrestamo = resPrestamo.insertId;

        // 4. Guardar firma con OTP
        const firmaBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        const ip = '192.168.1.50';
        const otp = '987654';

        console.log(`🧪 Guardando firma del contrato con OTP: ${otp}...`);
        await PrestamoModel.guardarFirma(idPrestamo, firmaBase64, ip, otp);

        // 5. Validar que la columna firma_otp se guardó correctamente
        const prestamoActualizado = await PrestamoModel.obtenerPorId(idPrestamo);
        assert.ok(prestamoActualizado, 'El préstamo debería existir.');
        assert.strictEqual(prestamoActualizado.firma_otp, otp, 'La columna firma_otp debería registrar el valor "987654".');
        assert.strictEqual(prestamoActualizado.ip_firma, ip, 'La columna ip_firma debería registrar el valor de la IP.');

        // 6. Generar el PDF y validar que compila correctamente con la nueva firma
        console.log('🧪 Generando PDF del contrato para validar funcionamiento de pdfService...');
        const pdfBuffer = await pdfService.generarContratoBuffer(idPrestamo);
        assert.ok(pdfBuffer instanceof Buffer, 'El resultado de generarContratoBuffer debe ser un Buffer.');
        assert.ok(pdfBuffer.length > 0, 'El Buffer del PDF no debe estar vacío.');

        // 7. Generar el Ticket y validar que compila correctamente
        console.log('🧪 Generando Ticket de desembolso para validar funcionamiento de pdfService...');
        const ticketBuffer = await pdfService.generarTicketDesembolsoBuffer(idPrestamo);
        assert.ok(ticketBuffer instanceof Buffer, 'El resultado de generarTicketDesembolsoBuffer debe ser un Buffer.');
        assert.ok(ticketBuffer.length > 0, 'El Buffer del Ticket no debe estar vacío.');

        console.log('✅ Prueba TDD completada con éxito. Se guardó y leyó el OTP del contrato, y el generador PDF compiló de forma íntegra.');

    } catch (error) {
        console.error('❌ Error en prueba TDD de OTP en Contrato PDF:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        // Limpieza final
        console.log('🧹 Limpiando registros temporales de prueba...');
        if (idPrestamo) {
            await db.query('DELETE FROM prestamos WHERE id = ?', [idPrestamo]);
        }
        if (idCliente) {
            await db.query('DELETE FROM clientes WHERE id = ?', [idCliente]);
        }
        db.end();
    }
}

ejecutarPruebasPdfFirmaOtp();
