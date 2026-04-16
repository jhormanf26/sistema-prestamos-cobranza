const PDFDocument = require('pdfkit');
const EmpenoModel = require('../models/EmpenoModel');
const ConfigModel = require('../models/ConfigModel');
const { formatCurrency } = require('../utils/formatters');

const empenosReportesController = {

    // 1. CONTRATO DE PRENDA (A4)
    generarContrato: async (req, res) => {
        const { id } = req.params;
        try {
            const empeno = await EmpenoModel.obtenerPorId(id);
            // Intentamos obtener config, si falla usamos valores por defecto
            let config = {};
            try { config = await ConfigModel.obtener() || {}; } catch(e) {}

            const empresa = {
                nombre: config.nombre_empresa || 'LA EMPRESA',
                ruc: config.ruc || '000000000',
                direccion: config.direccion || 'Oficina Principal',
                moneda: config.moneda || '$'
            };

            if (!empeno) return res.redirect('/empenos');

            const doc = new PDFDocument({ margin: 50 });
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=Contrato_Empeno_${id}.pdf`);
            doc.pipe(res);

            // --- CABECERA ---
            doc.fontSize(16).font('Helvetica-Bold').text('CONTRATO DE MUTUO CON GARANTÍA PRENDARIA', { align: 'center' });
            doc.moveDown();
            
            doc.fontSize(10).font('Helvetica').text(`N° OPERACIÓN: ${String(empeno.id).padStart(6, '0')}`, { align: 'right' });
            doc.text(`FECHA: ${new Date(empeno.created_at).toLocaleDateString()}`, { align: 'right' });
            doc.moveDown(2);

            // --- CUERPO ---
            doc.font('Helvetica').text(`En la ciudad, a los ${new Date().getDate()} días del mes actual, intervienen:`);
            doc.moveDown(0.5);

            doc.font('Helvetica-Bold').text('EL ACREEDOR (CASA DE EMPEÑO):');
            doc.font('Helvetica').text(`${empresa.nombre}, RUC: ${empresa.ruc}, Dirección: ${empresa.direccion}.`);
            doc.moveDown();

            doc.font('Helvetica-Bold').text('EL DEUDOR (CLIENTE):');
            doc.font('Helvetica').text(`Sr(a). ${empeno.nombre} ${empeno.apellido}, DNI: ${empeno.dni}.`);
            doc.moveDown(2);

            doc.font('Helvetica-Bold').text('CLÁUSULA 1: DEL PRÉSTAMO');
            doc.font('Helvetica').text(`La EMPRESA entrega la suma de ${empresa.moneda} ${formatCurrency(empeno.monto_prestado, 2)}, monto recibido a entera satisfacción.`);
            doc.moveDown();

            doc.font('Helvetica-Bold').text('CLÁUSULA 2: DE LA GARANTÍA');
            doc.font('Helvetica').text(`En respaldo, se deja en custodia:`);
            doc.text(`   • ARTÍCULO: ${empeno.nombre_articulo}`);
            doc.text(`   • DESCRIPCIÓN: ${empeno.descripcion}`);
            doc.text(`   • TASACIÓN: ${empresa.moneda} ${formatCurrency(empeno.valor_tasacion, 2)}`);
            doc.moveDown();

            doc.font('Helvetica-Bold').text('CLÁUSULA 3: VENCIMIENTO');
            doc.font('Helvetica').text(`Fecha límite de pago: ${new Date(empeno.fecha_limite).toLocaleDateString()}. Pasada la fecha, se dispondrá del bien.`);
            doc.moveDown(4);

            // --- FIRMAS ---
            doc.text('_____________________________             _____________________________', { align: 'center' });
            doc.text('      POR LA EMPRESA                                     FIRMA EL CLIENTE      ', { align: 'center' });
            doc.text(`                                                               DNI: ${empeno.dni}`, { align: 'center' });

            doc.end();

        } catch (error) {
            console.error("Error PDF Contrato Empeno:", error);
            res.redirect('/empenos');
        }
    },

    // 2. TICKET TÉRMICO (80mm)
    generarTicket: async (req, res) => {
        const { id } = req.params;
        try {
            const empeno = await EmpenoModel.obtenerPorId(id);
            let config = {};
            try { config = await ConfigModel.obtener() || {}; } catch(e) {}
            
            const empresa = {
                nombre: config.nombre_empresa || 'SISTEMA FINANCIERO',
                direccion: config.direccion || '',
                moneda: config.moneda || '$'
            };

            if (!empeno) return res.redirect('/empenos');

            // 80mm aprox 226 puntos
            const doc = new PDFDocument({ size: [226, 600], margin: 10 });
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=Ticket_Empeno_${id}.pdf`);
            doc.pipe(res);

            // --- TICKET ---
            doc.font('Helvetica-Bold').fontSize(10).text(empresa.nombre.toUpperCase(), { align: 'center' });
            doc.fontSize(7).font('Helvetica').text(empresa.direccion, { align: 'center' });
            doc.text('--------------------------------', { align: 'center' });
            
            doc.moveDown(0.5);
            doc.fontSize(9).font('Helvetica-Bold').text('COMPROBANTE DE EMPEÑO', { align: 'center' });
            doc.fontSize(8).text(`OP: ${String(empeno.id).padStart(6, '0')}`, { align: 'center' });
            doc.text(`FECHA: ${new Date().toLocaleString()}`, { align: 'center' });
            doc.moveDown(0.5);
            
            doc.text('CLIENTE:', { align: 'left' });
            doc.font('Helvetica').text(`${empeno.nombre} ${empeno.apellido}`);
            doc.moveDown(0.5);

            doc.font('Helvetica-Bold').text('MONTO PRESTADO:', { align: 'center' });
            doc.fontSize(14).text(`${empresa.moneda} ${formatCurrency(empeno.monto_prestado, 2)}`, { align: 'center' });
            
            doc.fontSize(8).font('Helvetica').text(`Artículo: ${empeno.nombre_articulo}`, { align: 'left' });
            doc.text(`Vence: ${new Date(empeno.fecha_limite).toLocaleDateString()}`);
            
            doc.moveDown(1);
            doc.text('--------------------------------', { align: 'center' });
            doc.fontSize(7).text('Conserve este ticket para retirar su artículo.', { align: 'center' });
            
            doc.end();

        } catch (error) {
            console.error("Error PDF Ticket Empeno:", error);
            res.redirect('/empenos');
        }
    }
};

module.exports = empenosReportesController;