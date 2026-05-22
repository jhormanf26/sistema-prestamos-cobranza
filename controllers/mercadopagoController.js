const { MercadoPagoConfig, Preference } = require('mercadopago');
const PrestamoModel = require('../models/PrestamoModel');
const PagoModel = require('../models/PagoModel');
const crypto = require('crypto');

// Inicializar cliente de MP
// Usamos el token si existe, de lo contrario un string vacío (para evitar crash en ambientes sin MP)
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || 'test_token' });

/**
 * Calcula cuánto hay que cobrarle al cliente para que a la empresa
 * le llegue exactamente el 'montoNeto' libre de comisiones de MercadoPago.
 */
function calcularMontoBruto(montoNeto) {
    const costoFijo = 800; // COP
    const iva = 0.19; // 19%
    const porcentajeMP = 0.0329; // 3.29%

    const costoFijoConIva = costoFijo * (1 + iva); // 952
    const porcentajeConIva = porcentajeMP * (1 + iva); // 0.039151

    const montoBruto = (montoNeto + costoFijoConIva) / (1 - porcentajeConIva);
    return Math.ceil(montoBruto);
}

const mercadopagoController = {

    /**
     * Calcula el monto bruto que se cobrará al cliente en MP (absorbiendo comisión)
     */
    calcularMontoBruto(montoNeto) {
        return calcularMontoBruto(montoNeto);
    },

    /**
     * POST /pagos/checkout
     * Genera la preferencia de pago en MercadoPago
     */
    async crearPreferencia(req, res) {
        try {
            if (!req.session.cliente) {
                return res.status(401).json({ success: false, message: 'No autenticado' });
            }

            const { prestamo_id, monto_pagar } = req.body;
            const montoNeto = parseFloat(monto_pagar);

            if (!montoNeto || montoNeto <= 0) {
                return res.status(400).json({ success: false, message: 'Monto inválido' });
            }

            // Validar que el préstamo pertenece al cliente
            const prestamo = await PrestamoModel.obtenerPorId(prestamo_id);
            if (!prestamo || prestamo.cliente_id !== req.session.cliente.id) {
                return res.status(403).json({ success: false, message: 'No tienes permiso para pagar este préstamo' });
            }

            // Calcular el monto bruto que se le cobrará al cliente en MP (absorbiendo comisión)
            const montoCobrar = calcularMontoBruto(montoNeto);

            // Construir URL base dinámica (para back_urls y webhooks)
            // Nota: MercadoPago exige HTTPS en producción para los webhooks
            const protocol = req.headers['x-forwarded-proto'] || req.protocol;
            const baseUrl = `${protocol}://${req.get('host')}`;

            // Crear el cuerpo de la preferencia
            const bodyPreferencia = {
                items: [
                    {
                        id: `PRESTAMO_${prestamo_id}`,
                        title: `Pago de Cuota - Préstamo #${prestamo_id}`,
                        description: `Pago neto: $${montoNeto} COP. Incluye comisión de pasarela.`,
                        quantity: 1,
                        currency_id: 'COP',
                        unit_price: montoCobrar
                    }
                ],
                payer: {
                    name: req.session.cliente.nombre,
                    surname: req.session.cliente.apellido,
                    email: req.session.cliente.email || 'correo@ejemplo.com'
                },
                back_urls: {
                    success: `${baseUrl}/portal-cliente?pago=success`,
                    failure: `${baseUrl}/portal-cliente?pago=failure`,
                    pending: `${baseUrl}/portal-cliente?pago=pending`
                },
                // Enviamos la data cruda del préstamo para que el webhook sepa a qué cuenta abonar
                external_reference: JSON.stringify({
                    prestamo_id: prestamo_id,
                    monto_neto: montoNeto
                }),
                notification_url: `${baseUrl}/pagos/webhook`
            };

            // Solo aplicar auto_return si no estamos en localhost/127.0.0.1 (MercadoPago lo rechaza en local)
            if (!baseUrl.includes('localhost') && !baseUrl.includes('127.0.0.1')) {
                bodyPreferencia.auto_return = 'approved';
            }

            // Crear la preferencia usando el nuevo SDK v2
            const preference = new Preference(client);
            const response = await preference.create({ body: bodyPreferencia });

            // Retornamos el init_point para que el frontend redirija al cliente a MercadoPago
            res.json({
                success: true,
                init_point: response.init_point, // Enlace de pago estándar
                monto_neto: montoNeto,
                monto_cobrar: montoCobrar,
                comision: montoCobrar - montoNeto
            });

        } catch (error) {
            console.error('Error creando preferencia MP:', error);
            res.status(500).json({ success: false, message: 'Error al contactar pasarela de pagos.' });
        }
    },

    /**
     * POST /pagos/webhook
     * Escucha las notificaciones automáticas (IPN/Webhooks) de MercadoPago
     */
    async webhook(req, res) {
        try {
            // Verificar firma de MercadoPago (buena práctica de seguridad)
            // https://www.mercadopago.com.co/developers/es/docs/your-integrations/notifications/webhooks
            const signature = req.headers['x-signature'];
            const requestId = req.headers['x-request-id'];
            const dataID = req.query['data.id'];
            const type = req.query.type;

            // Siempre responder a MercadoPago rápidamente con 200 OK
            res.status(200).send('OK');

            // Solo nos interesan los pagos nuevos
            if (type !== 'payment' || !dataID) {
                return;
            }

            console.log(`[MercadoPago] Notificación de pago recibida: ID ${dataID}`);

            // Buscar el estado real del pago en la API de MercadoPago usando el dataID
            // Con SDK v2 usamos "payment.get"
            const { Payment } = require('mercadopago');
            const paymentClient = new Payment(client);
            
            const paymentInfo = await paymentClient.get({ id: dataID });
            
            if (paymentInfo.status === 'approved') {
                // El pago está completamente aprobado
                const externalReference = paymentInfo.external_reference;
                
                if (!externalReference) {
                    console.log(`[MercadoPago] Pago ${dataID} ignorado: Sin external_reference`);
                    return;
                }

                const metadata = JSON.parse(externalReference);
                const prestamoId = metadata.prestamo_id;
                const montoAbonar = metadata.monto_neto;

                // Evitar procesar el pago dos veces (idem-potencia)
                // Usaremos un truco: En las observaciones guardaremos el MP ID para buscarlo.
                const db = require('../config/db');
                const [pagosPrevios] = await db.query('SELECT id FROM pagos WHERE observaciones LIKE ?', [`%MP_ID: ${dataID}%`]);
                
                if (pagosPrevios.length > 0) {
                    console.log(`[MercadoPago] Pago ${dataID} ignorado: Ya fue procesado anteriormente.`);
                    return;
                }

                // Registrar el pago en nuestro sistema
                console.log(`[MercadoPago] Procesando abono de $${montoAbonar} para el préstamo ${prestamoId}`);
                
                await PagoModel.crear({
                    prestamo_id: prestamoId,
                    monto_pagado: montoAbonar, // Se abona solo el neto (la comisión se la quedó MP)
                    observaciones: `Pago en línea automático (MercadoPago). MP_ID: ${dataID}`
                });

                // Registrar en caja como ingreso
                await db.query(`
                    INSERT INTO caja (concepto, monto, tipo, categoria, usuario, referencia_id) 
                    VALUES (?, ?, 'ingreso', 'Cobro Cuota', 'Sistema MP', ?)
                `, [`Pago en línea (MP ${dataID}) - Préstamo #${prestamoId}`, montoAbonar, prestamoId]);

                // Liquidar el préstamo si la deuda quedó saldada
                const prestamo = await PrestamoModel.obtenerPorId(prestamoId);
                if (prestamo) {
                    const totalDeuda = parseFloat(prestamo.monto_total);
                    const totalPagadoActual = parseFloat(await PagoModel.obtenerTotalPagado(prestamoId));
                    if (totalPagadoActual >= (totalDeuda - 0.01)) {
                        await PrestamoModel.actualizarEstado(prestamoId, 'pagado');
                        console.log(`[MercadoPago] Préstamo #${prestamoId} liquidado automáticamente como PAGADO.`);
                    }
                }

                console.log(`[MercadoPago] Pago ${dataID} procesado exitosamente.`);
            }

        } catch (error) {
            console.error('Error en Webhook de MercadoPago:', error);
            // No podemos devolver error a MP (ya respondimos 200), pero lo registramos.
        }
    }
};

module.exports = mercadopagoController;
