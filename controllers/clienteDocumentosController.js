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
                const fecha = new Date().toLocaleString('es-CO');
                const nombreDoc = nombre_documento || 'Documento Adjunto';
                const result = await emailService.plantillaDocumentoCargado(
                    `${cliente.nombre} ${cliente.apellido}`,
                    cliente.dni,
                    nombreDoc,
                    fecha
                );

                if (destinatario && result && result.html) {
                    const asuntoEnvio = result.asunto || `[Sistema] Nuevo documento subido por ${cliente.nombre} ${cliente.apellido}`;
                    await emailService.enviarCorreo(destinatario, asuntoEnvio, result.html);
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
                    let result;
                    if (estado === 'aprobado') {
                        result = await emailService.plantillaDocumentoAprobado(
                            `${documento.cliente_nombre} ${documento.cliente_apellido}`,
                            documento.nombre_documento
                        );
                    } else {
                        result = await emailService.plantillaDocumentoRechazado(
                            `${documento.cliente_nombre} ${documento.cliente_apellido}`,
                            documento.nombre_documento,
                            motivo
                        );
                    }

                    if (result && result.html) {
                        const asuntoEnvio = result.asunto || (estado === 'aprobado' 
                            ? `¡Excelente! Tu documento ha sido aprobado` 
                            : `Atención: Tu documento ha sido rechazado`);
                        await emailService.enviarCorreo(documento.cliente_email, asuntoEnvio, result.html);
                    }
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
