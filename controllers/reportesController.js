const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const PrestamoModel = require('../models/PrestamoModel');
const PagoModel = require('../models/PagoModel');
const ConfigModel = require('../models/ConfigModel');
const ClienteModel = require('../models/ClienteModel');
const AhorroModel = require('../models/AhorroModel');
const EmpenoModel = require('../models/EmpenoModel');
const ReporteAvanzadoModel = require('../models/ReporteAvanzadoModel');
const finance = require('../utils/finance');
const { formatCurrency } = require('../utils/formatters');
const pdfService = require('../utils/pdfService');

const reportesController = {

    // 1. CONTRATO DE PRÉSTAMO
    generarContrato: async (req, res) => {
        const { id } = req.params;
        try {
            const buffer = await pdfService.generarContratoBuffer(id);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=Contrato_Prestamo_${id}.pdf`);
            res.send(buffer);
        } catch (error) {
            console.error("Error PDF Contrato:", error);
            res.redirect('/prestamos');
        }
    },

    // 2. TICKET DE PAGO (CUOTA)
    generarTicket: async (req, res) => {
        const { id } = req.params;
        try {
            const pago = await PagoModel.obtenerDetalle(id);
            let config = await ConfigModel.obtener();
            const moneda = (config && config.moneda) ? config.moneda : '$';

            if (!pago) return res.redirect('/prestamos');

            const doc = new PDFDocument({ size: [226, 400], margin: 10 });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=Ticket_${id}.pdf`);
            doc.pipe(res);

            if (config.logo) try { doc.image(`public/uploads/${config.logo}`, 90, 10, { width: 40 }); doc.moveDown(4); } catch (e) { }
            doc.fontSize(10).font('Helvetica-Bold').text((config.nombre_empresa || 'SISTEMA').toUpperCase(), { align: 'center' });
            doc.text('--------------------------------', { align: 'center' });
            doc.fontSize(12).text(`TOTAL: ${moneda} ${formatCurrency(pago.monto_pagado, 2)}`, { align: 'center' });
            doc.end();
        } catch (error) { res.redirect('/prestamos'); }
    },

    // 3. CRONOGRAMA PDF
    generarCronogramaPDF: async (req, res) => {
        const { id } = req.params;
        try {
            const buffer = await pdfService.generarCronogramaBuffer(id);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=Cronograma_${id}.pdf`);
            res.send(buffer);
        } catch (error) {
            console.error("Error Cronograma PDF:", error);
            res.redirect('/prestamos');
        }
    },

    // 4. ESTADO DE CUENTA INTEGRAL
    generarEstadoCuenta: async (req, res) => {
        const { id } = req.params;
        try {
            const buffer = await pdfService.generarEstadoCuentaBuffer(id);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=Estado_Cuenta_Cliente_${id}.pdf`);
            res.send(buffer);
        } catch (error) {
            console.error("Error Estado Cuenta PDF:", error);
            res.redirect('/clientes');
        }
    },

    // 5. EXPORTAR EXCEL SIMPLE (BOTÓN VERDE)
    exportarExcelPrestamos: async (req, res) => {
        try {
            const prestamos = await PrestamoModel.obtenerTodos();
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Reporte de Préstamos');

            worksheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Cliente', key: 'cliente', width: 30 },
                { header: 'DNI', key: 'dni', width: 15 },
                { header: 'Monto Prestado', key: 'monto', width: 15 },
                { header: 'Interés (%)', key: 'interes', width: 15 },
                { header: 'Total a Pagar', key: 'total', width: 15 },
                { header: 'Fecha Inicio', key: 'fecha', width: 15 },
                { header: 'Cuotas', key: 'cuotas', width: 10 },
                { header: 'Frecuencia', key: 'frecuencia', width: 15 },
                { header: 'Estado', key: 'estado', width: 15 }
            ];

            worksheet.getRow(1).font = { bold: true };

            prestamos.forEach(p => {
                worksheet.addRow({
                    id: p.id,
                    cliente: `${p.nombre} ${p.apellido}`,
                    dni: p.dni,
                    monto: parseFloat(p.monto_prestado),
                    interes: p.tasa_interes + '%',
                    total: parseFloat(p.monto_total),
                    fecha: new Date(p.fecha_inicio).toLocaleDateString(),
                    cuotas: p.cuotas,
                    frecuencia: p.frecuencia.toUpperCase(),
                    estado: p.estado.toUpperCase()
                });
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=Reporte_Prestamos_Completo.xlsx');

            await workbook.xlsx.write(res);
            res.end();

        } catch (error) {
            console.error("Error Excel Simple:", error);
            res.redirect('/prestamos');
        }
    },

    // 6. MOSTRAR PANEL REPORTES
    mostrarPanel: (req, res) => {
        res.render('reportes/panel', { title: 'Centro de Reportes' });
    },

    // 7. DESCARGAR REPORTE EXCEL (AVANZADO)
    descargarReporteExcel: async (req, res) => {
        const { tipo_reporte, fecha_inicio, fecha_fin } = req.body;

        console.log(`Generando Excel: ${tipo_reporte} de ${fecha_inicio} a ${fecha_fin}`);

        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Datos Exportados');

            worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
            worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };

            let datos = [];

            if (tipo_reporte === 'prestamos') {
                datos = await ReporteAvanzadoModel.prestamosPorFecha(fecha_inicio, fecha_fin);
                worksheet.columns = [
                    { header: 'ID', key: 'id', width: 10 },
                    { header: 'Cliente', key: 'cliente', width: 30 },
                    { header: 'DNI', key: 'dni', width: 15 },
                    { header: 'Monto Prestado', key: 'monto', width: 15 },
                    { header: 'Fecha', key: 'fecha', width: 15 },
                    { header: 'Estado', key: 'estado', width: 15 }
                ];
                datos.forEach(d => {
                    worksheet.addRow({
                        id: d.id,
                        cliente: `${d.nombre} ${d.apellido}`,
                        dni: d.dni,
                        monto: d.monto_prestado,
                        fecha: new Date(d.fecha_inicio).toLocaleDateString(),
                        estado: d.estado.toUpperCase()
                    });
                });

            } else if (tipo_reporte === 'pagos') {
                datos = await ReporteAvanzadoModel.pagosPorFecha(fecha_inicio, fecha_fin);
                worksheet.columns = [
                    { header: 'ID Pago', key: 'id', width: 10 },
                    { header: 'Fecha', key: 'fecha', width: 20 },
                    { header: 'Cliente', key: 'cliente', width: 30 },
                    { header: 'Monto', key: 'monto', width: 15 }
                ];
                datos.forEach(d => {
                    worksheet.addRow({
                        id: d.id,
                        fecha: new Date(d.fecha_pago).toLocaleString(),
                        cliente: `${d.nombre} ${d.apellido}`,
                        monto: d.monto_pagado
                    });
                });

            } else if (tipo_reporte === 'gastos') {
                datos = await ReporteAvanzadoModel.gastosPorFecha(fecha_inicio, fecha_fin);
                worksheet.columns = [
                    { header: 'Fecha', key: 'fecha', width: 15 },
                    { header: 'Descripción', key: 'desc', width: 30 },
                    { header: 'Categoría', key: 'cat', width: 15 },
                    { header: 'Monto', key: 'monto', width: 15 }
                ];
                datos.forEach(d => {
                    worksheet.addRow({
                        fecha: new Date(d.fecha_gasto).toLocaleDateString(),
                        desc: d.descripcion,
                        cat: d.categoria,
                        monto: d.monto
                    });
                });
            }

            const fileName = `Reporte_${tipo_reporte}_${Date.now()}.xlsx`;
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

            await workbook.xlsx.write(res);
            res.end();

        } catch (error) {
            console.error("Error generando Excel:", error);
            req.flash('mensajeError', 'Ocurrió un error al generar el reporte');
            res.redirect('/reportes/panel');
        }
    },

    // 8. TICKET AHORRO
    generarTicketAhorro: async (req, res) => {
        const { id } = req.params;
        try {
            const mov = await AhorroModel.obtenerMovimientoPorId(id);
            let config = await ConfigModel.obtener();

            const moneda = (config && config.moneda) ? config.moneda : '$';
            if (!config) config = { nombre_empresa: 'Sistema Financiero', ruc: '000000' };

            if (!mov) return res.redirect('/ahorros');

            const doc = new PDFDocument({ size: [226, 400], margin: 10 });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=Voucher_${id}.pdf`);
            doc.pipe(res);

            if (config.logo) {
                try { doc.image(`public/uploads/${config.logo}`, 90, 10, { width: 40 }); doc.moveDown(4); }
                catch (e) { doc.moveDown(2); }
            } else { doc.moveDown(2); }

            doc.fontSize(10).font('Helvetica-Bold').text(config.nombre_empresa.toUpperCase(), { align: 'center' });
            doc.fontSize(8).font('Helvetica').text(`RUC: ${config.ruc || '---'}`, { align: 'center' });
            doc.text('--------------------------------', { align: 'center' });

            doc.moveDown(0.5);
            doc.font('Helvetica-Bold').text('COMPROBANTE AHORRO', { align: 'center' });
            doc.text(`OP: ${mov.mov_id}`, { align: 'center' });
            doc.font('Helvetica').text(new Date(mov.fecha_movimiento).toLocaleString(), { align: 'center' });

            doc.moveDown(0.5);
            doc.text('--------------------------------', { align: 'center' });
            doc.font('Helvetica').text(`Cliente: ${mov.nombre} ${mov.apellido}`);
            doc.text(`CC: ${mov.dni}`);
            doc.text(`Cuenta: #${mov.cuenta_id}`);

            doc.moveDown(1);
            doc.font('Helvetica-Bold').fontSize(14).text(mov.tipo_movimiento.toUpperCase(), { align: 'center' });
            doc.fontSize(16).text(`${moneda} ${formatCurrency(mov.monto, 2)}`, { align: 'center' });

            doc.fontSize(8).font('Helvetica');
            if (mov.observacion) {
                doc.moveDown(0.5);
                doc.text(`Obs: ${mov.observacion}`, { align: 'center' });
            }

            doc.moveDown(2);
            doc.text('Verifique su dinero antes de retirarse.', { align: 'center' });

            doc.end();

        } catch (error) {
            console.error("Error en Ticket Ahorro:", error);
            res.redirect('/ahorros');
        }
    },

    // 9. TICKET DE DESEMBOLSO (ENTREGA DE DINERO) - ¡NUEVO!
    generarTicketDesembolso: async (req, res) => {
        const { id } = req.params;
        try {
            const buffer = await pdfService.generarTicketDesembolsoBuffer(id);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=Desembolso_${id}.pdf`);
            res.send(buffer);
        } catch (error) {
            console.error("Error Ticket Desembolso:", error);
            res.redirect('/prestamos');
        }
    }
};

module.exports = reportesController;
