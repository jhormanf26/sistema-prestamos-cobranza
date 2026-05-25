const assert = require('assert');
const db = require('../config/db');
const ClienteModel = require('../models/ClienteModel');
const emailService = require('../utils/emailService');

// Declaramos que cargaremos el servicio que aún no existe
let OtpService;

/**
 * Suite de pruebas TDD para validar el Servicio OTP de seguridad.
 */
async function ejecutarPruebasOtpSeguridad() {
    console.log('🧪 Iniciando Suite de Pruebas TDD para el Sistema OTP de Seguridad...');

    // Cargar dinámicamente el servicio que vamos a implementar
    try {
        OtpService = require('../utils/otpService');
    } catch (e) {
        console.error('❌ Error cargando OtpService (aún no implementado):', e.message);
        process.exit(1);
    }

    const dniPrueba = '9999999995';
    let idCliente = null;
    let originalEnviarCorreo = emailService.enviarCorreo;

    try {
        // 1. Limpieza preventiva
        await db.query('DELETE FROM codigos_otp WHERE cliente_id IN (SELECT id FROM clientes WHERE dni = ?)', [dniPrueba]);
        await db.query('DELETE FROM clientes WHERE dni = ?', [dniPrueba]);

        // 2. Crear cliente de prueba
        await ClienteModel.crear({
            dni: dniPrueba,
            nombre: 'Carlos',
            apellido: 'OTP Test',
            telefono: '3150000005',
            direccion: 'Calle Falsa 125',
            email: 'carlos.otp@ejemplo.com',
            monto_preaprobado: 0
        });
        const cliente = await ClienteModel.buscarPorDNI(dniPrueba);
        idCliente = cliente.id;

        // Mockear el envío de correos
        let correoEnviado = null;
        emailService.enviarCorreo = async (destinatario, asunto, html) => {
            correoEnviado = { destinatario, asunto, html };
            return true;
        };

        // ==================================================
        // CASO 1: Generación y persistencia de OTP
        // ==================================================
        console.log('🧪 Caso 1: Generando y enviando código OTP...');
        const prestamoId = 99999;
        const resGen = await OtpService.generarYEnviar(idCliente, 'carlos.otp@ejemplo.com', 'firma_contrato', prestamoId);
        
        assert.strictEqual(resGen, true, 'Debería generar y enviar el OTP exitosamente.');
        assert.ok(correoEnviado, 'El correo debería haber sido disparado.');
        assert.strictEqual(correoEnviado.destinatario, 'carlos.otp@ejemplo.com', 'El correo de destino debe coincidir.');
        assert.ok(correoEnviado.html.includes('Código de Verificación'), 'El correo debe usar la plantilla OTP.');

        // Extraer el código OTP real del correo mockeado para las pruebas
        const regexOtp = />(\d{6})</;
        const match = correoEnviado.html.match(regexOtp);
        assert.ok(match, 'El código OTP de 6 dígitos debería figurar en el HTML del correo.');
        const otpReal = match[1];
        console.log(`🔑 Código OTP extraído del correo simulado: ${otpReal}`);

        // Verificar que se guardó en la base de datos como pendiente
        const [registros] = await db.query(
            "SELECT * FROM codigos_otp WHERE cliente_id = ? AND accion = ? AND estado = 'pendiente'",
            [idCliente, 'firma_contrato']
        );
        assert.strictEqual(registros.length, 1, 'Debería existir un registro pendiente en la base de datos.');

        // ==================================================
        // CASO 2: Verificación exitosa del OTP
        // ==================================================
        console.log('🧪 Caso 2: Verificando código OTP correcto...');
        const resVerificacion = await OtpService.verificar(idCliente, 'firma_contrato', prestamoId, otpReal);
        assert.strictEqual(resVerificacion.success, true, 'El código correcto debería ser validado con éxito.');

        // Verificar que el estado cambió a 'usado' en base de datos
        const [registrosUsado] = await db.query("SELECT estado FROM codigos_otp WHERE id = ?", [registros[0].id]);
        assert.strictEqual(registrosUsado[0].estado, 'usado', 'El estado del OTP en BD debería actualizarse a "usado".');

        // ==================================================
        // CASO 3: Control de Fuerza Bruta (Intentos fallidos)
        // ==================================================
        console.log('🧪 Caso 3: Validando control de intentos fallidos (bloqueo al 3er intento)...');
        // Generamos un nuevo OTP
        await OtpService.generarYEnviar(idCliente, 'carlos.otp@ejemplo.com', 'retiro_ahorro', 111);
        
        // 1er intento fallido
        let ver1 = await OtpService.verificar(idCliente, 'retiro_ahorro', 111, '000000');
        assert.strictEqual(ver1.success, false, 'Debería fallar.');
        assert.ok(ver1.message.includes('Te quedan 2 intentos'), 'Debería avisar que quedan 2 intentos.');

        // 2do intento fallido
        let ver2 = await OtpService.verificar(idCliente, 'retiro_ahorro', 111, '111111');
        assert.strictEqual(ver2.success, false, 'Debería fallar.');
        assert.ok(ver2.message.includes('Te quedan 1 intentos') || ver2.message.includes('Te queda 1 intento'), 'Debería avisar que queda 1 intento.');

        // 3er intento fallido (Bloqueo automático)
        let ver3 = await OtpService.verificar(idCliente, 'retiro_ahorro', 111, '222222');
        assert.strictEqual(ver3.success, false, 'Debería fallar.');
        assert.ok(ver3.message.includes('bloqueado'), 'Debería notificar el bloqueo de seguridad.');

        // Verificar que el estado del OTP en la BD cambió a 'bloqueado'
        const [registrosBloqueado] = await db.query(
            "SELECT estado FROM codigos_otp WHERE cliente_id = ? AND accion = ? ORDER BY id DESC LIMIT 1",
            [idCliente, 'retiro_ahorro']
        );
        assert.strictEqual(registrosBloqueado[0].estado, 'bloqueado', 'El estado del OTP debería ser "bloqueado".');

        console.log('✅ Todas las validaciones de seguridad OTP pasaron correctamente.');
        console.log('🎉 Pruebas TDD del Sistema OTP COMPLETADAS CON ÉXITO.');

    } catch (error) {
        console.error('❌ Error durante la ejecución de las pruebas TDD de OTP:', error);
        process.exit(1);
    } finally {
        // Restaurar correo
        emailService.enviarCorreo = originalEnviarCorreo;

        // Limpiar cliente de prueba
        if (idCliente) {
            console.log('🧹 Limpiando base de datos (eliminando cliente de prueba)...');
            await db.query('DELETE FROM codigos_otp WHERE cliente_id = ?', [idCliente]);
            await db.query('DELETE FROM clientes WHERE id = ?', [idCliente]);
        }
        db.end();
    }
}

ejecutarPruebasOtpSeguridad();
