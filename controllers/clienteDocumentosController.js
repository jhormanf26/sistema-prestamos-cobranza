const ClienteDocumentoModel = require('../models/ClienteDocumentoModel');
const ClienteModel = require('../models/ClienteModel');
const ConfigModel = require('../models/ConfigModel');
const emailService = require('../utils/emailService');
const fs = require('fs');
const path = require('path');

/**
 * Controlador para la gestión de documentos de clientes.
 */
const clienteDocumentosController = {

    // ==========================================
    // PORTAL DE CLIENTES
    // ==========================================

    /**
     * Muestra la sección de documentos en el portal del cliente.
     * 
     * @param {Object} req - Petición Express.
     * @param {Object} res - Respuesta Express.
     */
    mostrarDocumentos: async (req, res) => {
        try {
            const cliente = req.session.cliente;
            const documentos = await ClienteDocumentoModel.obtenerPorCliente(cliente.id);
            const config = await ConfigModel.obtener() || { moneda: '$' };

            res.render('portal-cliente/documentos', {
                title: 'Mis Documentos',
                cliente: cliente,
                documentos: documentos,
                empresa: config
            });
        } catch (error) {
            console.error('Error al mostrar documentos del cliente:', error);
            req.flash('mensajeError', 'Error al cargar los documentos.');
            res.redirect('/portal-cliente');
        }
    },

    /**
     * Procesa la subida de un documento desde el portal de clientes.
     * Envía una notificación por correo al administrador.
     * 
     * @param {Object} req - Petición Express.
     * @param {Object} res - Respuesta Express.
     */
    subirDocumento: async (req, res) => {
        try {
            const cliente = req.session.cliente;
            const { nombre_documento } = req.body;

            if (!req.file) {
                req.flash('mensajeError', 'Por favor, selecciona un archivo válido.');
                return res.redirect('/portal-cliente/documentos');
            }

            const archivoUrl = '/uploads/documentos/' + req.file.filename;

            // Registrar en base de datos
            await ClienteDocumentoModel.crear({
                cliente_id: cliente.id,
                nombre_documento: nombre_documento || 'Documento Adjunto',
                archivo_url: archivoUrl,
                subido_por: 'cliente',
                estado: 'pendiente'
            });

            // Enviar notificación al administrador por correo
            try {
                const config = await ConfigModel.obtener();
                const destinatario = config ? config.email_contacto : 'admin@sistema.com';
                const asunto = `[Sistema] Nuevo documento subido por ${cliente.nombre} ${cliente.apellido}`;
                
                const html = `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
                        <h2 style="color: #1e3c72; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-top: 0;">Nuevo Documento Recibido</h2>
                        <p>El cliente <strong>${cliente.nombre} ${cliente.apellido}</strong> (CC/DNI: <strong>${cliente.dni}</strong>) ha subido un nuevo documento a la plataforma.</p>
                        
                        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                            <ul style="margin: 0; padding-left: 20px; color: #334155;">
                                <li><strong>Nombre del Documento:</strong> ${nombre_documento || 'Documento sin nombre'}</li>
                                <li><strong>Fecha de Carga:</strong> ${new Date().toLocaleString('es-CO')}</li>
                                <li><strong>Canal de Carga:</strong> Portal de Clientes</li>
                            </ul>
                        </div>
                        
                        <p style="margin-top: 25px;">Por favor, ingresa al panel de administración para auditar y validar el archivo.</p>
                        <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
                        <p style="font-size: 12px; color: #94a3b8; text-align: center;">Este es un mensaje automático del Sistema de Préstamos.</p>
                    </div>
                `;

                if (destinatario) {
                    await emailService.enviarCorreo(destinatario, asunto, html);
                }
            } catch (errEmail) {
                console.error('Error al enviar correo de notificación al administrador:', errEmail.message);
            }

            req.flash('mensajeExito', 'Documento subido correctamente. En espera de verificación.');
            res.redirect('/portal-cliente/documentos');
        } catch (error) {
            console.error('Error al subir documento:', error);
            req.flash('mensajeError', 'Error al procesar la subida del documento.');
            res.redirect('/portal-cliente/documentos');
        }
    },


    // ==========================================
    // PANEL ADMINISTRATIVO
    // ==========================================

    /**
     * Procesa la subida de un documento desde el panel administrativo.
     * Este documento queda con estado 'aprobado' por defecto.
     * 
     * @param {Object} req - Petición Express.
     * @param {Object} res - Respuesta Express.
     */
    subirDocumentoAdmin: async (req, res) => {
        const clienteId = req.params.clienteId;
        try {
            const { nombre_documento } = req.body;

            if (!req.file) {
                req.flash('mensajeError', 'No se ha seleccionado ningún archivo.');
                return res.redirect(`/clientes/ver/${clienteId}`);
            }

            const archivoUrl = '/uploads/documentos/' + req.file.filename;

            await ClienteDocumentoModel.crear({
                cliente_id: clienteId,
                nombre_documento: nombre_documento || 'Documento Administrativo',
                archivo_url: archivoUrl,
                subido_por: 'administrador',
                estado: 'aprobado' // Aprobado automáticamente al ser subido por el admin
            });

            req.flash('mensajeExito', 'Documento subido y aprobado correctamente.');
            res.redirect(`/clientes/ver/${clienteId}`);
        } catch (error) {
            console.error('Error al subir documento como administrador:', error);
            req.flash('mensajeError', 'Error al subir el documento.');
            res.redirect(`/clientes/ver/${clienteId}`);
        }
    },

    /**
     * Actualiza el estado de un documento (Aprobar o Rechazar).
     * Notifica al cliente por correo electrónico en caso de cambio de estado.
     * 
     * @param {Object} req - Petición Express.
     * @param {Object} res - Respuesta Express.
     */
    actualizarEstado: async (req, res) => {
        const docId = req.params.id;
        const { estado, motivo_rechazo } = req.body;

        if (!['aprobado', 'rechazado'].includes(estado)) {
            return res.status(400).json({ success: false, error: 'Estado inválido.' });
        }

        try {
            const documento = await ClienteDocumentoModel.obtenerPorId(docId);
            if (!documento) {
                return res.status(404).json({ success: false, error: 'Documento no encontrado.' });
            }

            const motivo = estado === 'rechazado' ? motivo_rechazo : null;
            await ClienteDocumentoModel.actualizarEstado(docId, estado, motivo);

            // Enviar notificación al cliente por correo si tiene correo registrado
            if (documento.cliente_email) {
                try {
                    const asunto = estado === 'aprobado' 
                        ? `¡Excelente! Tu documento ha sido aprobado` 
                        : `Atención: Tu documento ha sido rechazado`;

                    const colorHeader = estado === 'aprobado' ? '#15803d' : '#dc2626';
                    const iconHeader = estado === 'aprobado' ? '✅' : '❌';
                    const bannerTitle = estado === 'aprobado' ? 'Documento Aprobado' : 'Documento Rechazado';

                    let contenidoHtml = `
                        <div style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 30px; color: #1e293b;">
                            <table align="center" width="100%" style="max-width: 600px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-top: 4px solid ${colorHeader};">
                                <tr>
                                    <td align="center" style="background: ${colorHeader}; padding: 30px 20px; color: #ffffff;">
                                        <div style="font-size: 40px; margin-bottom: 10px;">${iconHeader}</div>
                                        <h1 style="margin: 0; font-size: 24px; font-weight: bold;">${bannerTitle}</h1>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 30px 25px;">
                                        <p>Hola <strong>${documento.cliente_nombre} ${documento.cliente_apellido}</strong>,</p>
                                        <p>El documento que reportaste en tu portal de cliente ha sido revisado por nuestro equipo:</p>
                                        
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; border-radius: 8px; padding: 15px; margin: 20px 0;">
                                            <tr>
                                                <td style="padding: 4px 0;"><strong>Documento:</strong></td>
                                                <td>${documento.nombre_documento}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 4px 0;"><strong>Estado:</strong></td>
                                                <td style="text-transform: uppercase; font-weight: bold; color: ${colorHeader};">${estado}</td>
                                            </tr>
                                        </table>
                    `;

                    if (estado === 'rechazado') {
                        contenidoHtml += `
                            <div style="background-color: #fff1f2; border-left: 4px solid #f43f5e; padding: 15px; border-radius: 4px; margin: 20px 0;">
                                <strong style="color: #be123c; display: block; margin-bottom: 5px;">Motivo del Rechazo:</strong>
                                <span style="color: #9f1239; font-style: italic;">"${motivo || 'No especificado por el administrador'}"</span>
                            </div>
                            <p>Te solicitamos ingresar a tu Portal de Clientes, eliminar este archivo y volver a cargar tu documento corregido.</p>
                        `;
                    } else {
                        contenidoHtml += `
                            <p>Tu documento ha sido validado correctamente y ahora forma parte de tu expediente digital. No es necesario realizar acciones adicionales.</p>
                        `;
                    }

                    contenidoHtml += `
                                        <p style="margin-top: 30px; text-align: center;">
                                            <a href="https://prestamos.desarollo.site/portal-cliente/login" style="background: ${colorHeader}; color: #ffffff; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Ingresar al Portal</a>
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="background-color: #f8fafc; padding: 20px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                                        Este es un mensaje automático, por favor no respondas a este correo.
                                    </td>
                                </tr>
                            </table>
                        </div>
                    `;

                    await emailService.enviarCorreo(documento.cliente_email, asunto, contenidoHtml);
                } catch (errEmail) {
                    console.error('Error al notificar al cliente sobre el cambio de estado del documento:', errEmail.message);
                }
            }

            res.json({ success: true });
        } catch (error) {
            console.error('Error al actualizar estado del documento:', error);
            res.status(500).json({ success: false, error: 'Error interno de servidor.' });
        }
    },

    /**
     * Elimina el registro de un documento y borra el archivo del disco.
     * 
     * @param {Object} req - Petición Express.
     * @param {Object} res - Respuesta Express.
     */
    eliminar: async (req, res) => {
        const docId = req.params.id;
        try {
            const documento = await ClienteDocumentoModel.obtenerPorId(docId);
            if (!documento) {
                return res.status(404).json({ success: false, error: 'Documento no encontrado.' });
            }

            // Eliminar registro de BD
            await ClienteDocumentoModel.eliminar(docId);

            // Intentar borrar archivo del disco
            const filePath = path.join(__dirname, '..', 'public', documento.archivo_url);
            fs.unlink(filePath, (err) => {
                if (err) {
                    // Si falla el borrado (por ejemplo si ya no estaba en disco), logueamos pero retornamos éxito de todas formas
                    console.warn(`Aviso: No se pudo borrar el archivo físico en ${filePath}:`, err.message);
                } else {
                    console.log(`Archivo físico eliminado: ${filePath}`);
                }
            });

            res.json({ success: true });
        } catch (error) {
            console.error('Error al eliminar documento:', error);
            res.status(500).json({ success: false, error: 'Error interno de servidor.' });
        }
    }
};

module.exports = clienteDocumentosController;
