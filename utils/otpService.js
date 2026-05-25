const db = require('../config/db');
const emailService = require('./emailService');
const bcrypt = require('bcryptjs');
const ClienteModel = require('../models/ClienteModel');

/**
 * Servicio para la gestión de códigos de verificación de un solo uso (OTP).
 * Proporciona generación de tokens numéricos aleatorios, almacenamiento seguro de hashes,
 * envío de notificaciones mediante plantillas configurables de correo electrónico y validación
 * con mecanismos de expiración y control de ataques por fuerza bruta.
 */
class OtpService {
    
    /**
     * Genera un nuevo código OTP de 6 dígitos, invalida los pendientes anteriores,
     * almacena el hash del nuevo código de seguridad y lo envía por correo electrónico al cliente.
     * 
     * @param {number} clienteId - ID del cliente solicitante.
     * @param {string} email - Dirección de correo electrónico del cliente.
     * @param {string} accion - Acción crítica que se está autorizando ('firma_contrato' o 'retiro_ahorro').
     * @param {number} referenciaId - ID del préstamo o de la cuenta de ahorro asociada.
     * @returns {Promise<boolean>} Retorna true si se generó y envió con éxito.
     */
    static async generarYEnviar(clienteId, email, accion, referenciaId) {
        // Generar código numérico aleatorio de 6 dígitos
        const codigo = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Encriptar el código con bcrypt para evitar que administradores con acceso a BD lo lean
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(codigo, salt);
        
        // Expiración establecida en 5 minutos
        const expiracion = new Date(Date.now() + 5 * 60 * 1000);

        // Bloquear/invalidar de manera proactiva cualquier OTP previo que haya quedado pendiente para el cliente y acción
        await db.query(
            "UPDATE codigos_otp SET estado = 'bloqueado' WHERE cliente_id = ? AND accion = ? AND estado = 'pendiente'",
            [clienteId, accion]
        );

        // Insertar el nuevo registro de código OTP
        await db.query(
            "INSERT INTO codigos_otp (cliente_id, codigo_hash, accion, referencia_id, expiracion) VALUES (?, ?, ?, ?, ?)",
            [clienteId, hash, accion, referenciaId, expiracion]
        );

        // Obtener datos del cliente para la plantilla de correo
        const cliente = await ClienteModel.obtenerPorId(clienteId);
        const nombreCliente = cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Cliente';

        // Mapear acción a texto legible para el cliente
        const accionTexto = accion === 'firma_contrato' ? 'Firma de Contrato Digital' : 'Autorización de Retiro de Ahorros';

        // Renderizar la plantilla configurable desde la base de datos (con fallback local)
        const emailTemplate = await emailService.plantillaOtp(nombreCliente, codigo, accionTexto, 5);

        // Enviar el correo electrónico
        const asuntoEnvio = emailTemplate.asunto || `Código de Verificación OTP - ${accionTexto}`;
        await emailService.enviarCorreo(email, asuntoEnvio, emailTemplate.html);

        return true;
    }

    /**
     * Valida el código OTP ingresado por el cliente.
     * Si el código es incorrecto, incrementa el contador de intentos y lo bloquea
     * si supera el límite de 3 fallos para evitar ataques por fuerza bruta.
     * 
     * @param {number} clienteId - ID del cliente.
     * @param {string} accion - Acción crítica a verificar.
     * @param {number} referenciaId - ID del préstamo o cuenta asociada.
     * @param {string} codigoIngresado - Código OTP digitado por el usuario.
     * @returns {Promise<{success: boolean, message: string}>} Resultado de la validación.
     */
    static async verificar(clienteId, accion, referenciaId, codigoIngresado) {
        // Obtener el último código OTP pendiente
        const [rows] = await db.query(
            "SELECT * FROM codigos_otp WHERE cliente_id = ? AND accion = ? AND referencia_id = ? AND estado = 'pendiente' ORDER BY id DESC LIMIT 1",
            [clienteId, accion, referenciaId]
        );

        if (rows.length === 0) {
            return { success: false, message: 'No existe una solicitud de código pendiente para esta operación.' };
        }

        const otp = rows[0];

        // Validar expiración del token
        if (new Date() > new Date(otp.expiracion)) {
            await db.query("UPDATE codigos_otp SET estado = 'bloqueado' WHERE id = ?", [otp.id]);
            return { success: false, message: 'El código OTP ha expirado. Por favor, solicita uno nuevo.' };
        }

        // Validar límite de intentos (máximo 3)
        if (otp.intentos >= 3) {
            await db.query("UPDATE codigos_otp SET estado = 'bloqueado' WHERE id = ?", [otp.id]);
            return { success: false, message: 'Código bloqueado por exceso de intentos fallidos. Solicita uno nuevo.' };
        }

        // Validar correspondencia del hash
        const esValido = await bcrypt.compare(codigoIngresado, otp.codigo_hash);

        if (!esValido) {
            const nuevosIntentos = otp.intentos + 1;
            
            if (nuevosIntentos >= 3) {
                // Bloquear automáticamente por fuerza bruta
                await db.query("UPDATE codigos_otp SET estado = 'bloqueado', intentos = ? WHERE id = ?", [nuevosIntentos, otp.id]);
                return { success: false, message: 'Código bloqueado por exceso de intentos fallidos. Solicita uno nuevo.' };
            } else {
                // Incrementar contador de fallos
                await db.query("UPDATE codigos_otp SET intentos = ? WHERE id = ?", [nuevosIntentos, otp.id]);
                return { success: false, message: `Código incorrecto. Te quedan ${3 - nuevosIntentos} intentos.` };
            }
        }

        // Marcar como utilizado exitosamente
        await db.query("UPDATE codigos_otp SET estado = 'usado' WHERE id = ?", [otp.id]);
        return { success: true, message: 'Verificación exitosa.' };
    }
}

module.exports = OtpService;
