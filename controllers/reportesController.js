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

const reportesController = {

    // 1. CONTRATO DE PRÉSTAMO
    generarContrato: async (req, res) => {
        const { id } = req.params;
        try {
            const prestamo = await PrestamoModel.obtenerPorId(id);
            let config = await ConfigModel.obtener();
            
            if (!config) config = { nombre_empresa: 'EMPRESA', moneda: '$', ruc: '000000000' };
            const moneda = config.moneda;

            if (!prestamo) return res.redirect('/prestamos');

            const doc = new PDFDocument({ margin: 50 });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=Contrato_Prestamo_${id}.pdf`);
            doc.pipe(res);

            if (config.logo) {
                try { doc.image(`public/uploads/${config.logo}`, 50, 45, { width: 60 }); } catch(e){}
            }

            doc.fontSize(16).font('Helvetica-Bold').text('CONTRATO DE PRÉSTAMO DE DINERO', { align: 'center' });
            doc.fontSize(10).font('Helvetica').text(`NRO OPERACIÓN: ${prestamo.id}`, { align: 'center' });
            doc.moveDown(2);

            doc.fontSize(11).font('Helvetica');
            doc.text(`En la ciudad, a los ${new Date(prestamo.fecha_inicio).toLocaleDateString()}, se celebra el presente contrato entre:`);
            doc.moveDown(1);

            doc.font('Helvetica-Bold').text('EL ACREEDOR:', { underline: true });
            doc.font('Helvetica').text(`Empresa: ${config.nombre_empresa}`);
            doc.text(`RUC: ${config.ruc}`);
            doc.text(`Dirección: ${config.direccion || 'Oficina Principal'}`);
            doc.moveDown(1);

            doc.font('Helvetica-Bold').text('EL DEUDOR (CLIENTE):', { underline: true });
            doc.font('Helvetica').text(`Nombre: ${prestamo.nombre} ${prestamo.apellido}`);
            doc.text(`Documento de Identidad (DNI): ${prestamo.dni}`);
            doc.text(`Teléfono: ${prestamo.telefono || 'No registrado'}`);
            doc.moveDown(2);

            doc.font('Helvetica-Bold').text('CLÁUSULAS DEL CONTRATO:', { align: 'center' });
            doc.moveDown(1);

            doc.font('Helvetica-Bold').text('PRIMERO (DEL MONTO):', { continued: true });
            doc.font('Helvetica').text(` EL ACREEDOR entrega a EL DEUDOR la suma de ${moneda} ${formatCurrency(prestamo.monto_prestado, 2)} en calidad de préstamo.`);
            doc.moveDown(0.5);

            doc.font('Helvetica-Bold').text('SEGUNDO (DE LA DEVOLUCIÓN):', { continued: true });
            doc.font('Helvetica').text(` EL DEUDOR se compromete a devolver la suma total de ${moneda} ${formatCurrency(prestamo.monto_total, 2)}, la cual incluye capital e intereses.`);
            doc.moveDown(0.5);

            doc.font('Helvetica-Bold').text('TERCERO (FORMA DE PAGO):', { continued: true });
            doc.font('Helvetica').text(` El pago se realizará en ${prestamo.cuotas} cuotas con frecuencia ${prestamo.frecuencia.toUpperCase()}.`);
            doc.moveDown(3);

            doc.y = 650;
            doc.text('__________________________', 50, doc.y);
            doc.text('__________________________', 350, doc.y);
            
            doc.font('Helvetica-Bold');
            doc.text('FIRMA DE ACREEDOR', 50, doc.y + 15);
            doc.text('FIRMA DE DEUDOR', 350, doc.y + 15);
            
            doc.font('Helvetica');
            doc.text(config.nombre_empresa, 50, doc.y + 30);
            doc.text(`${prestamo.nombre} ${prestamo.apellido}`, 350, doc.y + 30);
            doc.text(`DNI: ${prestamo.dni}`, 350, doc.y + 45);

            doc.end();

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

            if (config.logo) try { doc.image(`public/uploads/${config.logo}`, 90, 10, { width: 40 }); doc.moveDown(4); } catch(e){}
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
            const prestamo = await PrestamoModel.obtenerPorId(id);
            if (!prestamo) return res.redirect('/prestamos');

            let config = await ConfigModel.obtener();
            const moneda = (config && config.moneda) ? config.moneda : '$';
            
            // 1. Traemos los pagos reales para el cruce
            const pagos = await PagoModel.obtenerHistorial(id);
            let totalPagado = pagos.reduce((acc, p) => acc + parseFloat(p.monto_pagado), 0);

            // 2. Calculamos el cronograma
            let cronograma = finance.calcularCronograma(
                parseFloat(prestamo.monto_total), 
                prestamo.cuotas, 
                prestamo.frecuencia, 
                prestamo.fecha_inicio
            );

            // 3. Cruzar datos
            cronograma = cronograma.map(cuota => {
                const montoCuota = parseFloat(cuota.monto);
                if (totalPagado >= (montoCuota - 0.1)) {
                    cuota.estado = 'PAGADO';
                    totalPagado -= montoCuota;
                } else if (totalPagado > 0) {
                    cuota.estado = 'PARCIAL';
                    totalPagado = 0;
                } else {
                    cuota.estado = 'PENDIENTE';
                }
                return cuota;
            });

            const doc = new PDFDocument({ margin: 50 });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=Cronograma_${id}.pdf`);
            doc.pipe(res);

            // Estética
            if (config.logo) {
                try { doc.image(`public/uploads/${config.logo}`, 50, 40, { width: 60 }); } catch(e){}
            }

            doc.fontSize(20).font('Helvetica-Bold').fillColor('#2c3e50').text('CRONOGRAMA DE PAGOS', { align: 'right' });
            doc.fontSize(10).font('Helvetica').fillColor('#7f8c8d').text(`Generado: ${new Date().toLocaleString()}`, { align: 'right' });
            doc.moveDown(2);

            // Info del Cliente
            doc.fillColor('#000').font('Helvetica-Bold').fontSize(12).text('ESTADO DEL PRÉSTAMO');
            doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#e0e0e0').stroke();
            doc.moveDown(0.5);

            doc.font('Helvetica').fontSize(10);
            doc.text(`Cliente: ${prestamo.nombre} ${prestamo.apellido}`);
            doc.text(`DNI: ${prestamo.dni}`);
            doc.text(`Monto Total: ${moneda} ${formatCurrency(prestamo.monto_total, 2)}`);
            doc.text(`Frecuencia: ${prestamo.frecuencia.toUpperCase()}`);
            doc.moveDown(1.5);

            // Cabecera Tabla
            const tableTop = doc.y;
            doc.font('Helvetica-Bold').fillColor('#ffffff');
            doc.rect(50, tableTop, 500, 20).fill('#34495e');
            doc.text('Cuota', 60, tableTop + 5);
            doc.text('Fecha Venc.', 120, tableTop + 5);
            doc.text('Monto', 280, tableTop + 5);
            doc.text('Estado', 400, tableTop + 5);

            let y = tableTop + 25;
            doc.fillColor('#000').font('Helvetica');

            cronograma.forEach((c, index) => {
                // Filas alternas
                if (index % 2 === 0) {
                    doc.rect(50, y - 5, 500, 20).fill('#f9f9f9');
                }
                
                doc.fillColor('#000').text(c.numero.toString(), 70, y);
                doc.text(c.fecha.toLocaleDateString(), 120, y);
                doc.text(`${moneda} ${formatCurrency(c.monto, 2)}`, 280, y);
                
                // Color por estado
                if (c.estado === 'PAGADO') doc.fillColor('#27ae60');
                else if (c.estado === 'PARCIAL') doc.fillColor('#e67e22');
                else doc.fillColor('#7f8c8d');
                
                doc.font('Helvetica-Bold').text(c.estado, 400, y);
                
                doc.fillColor('#000').font('Helvetica'); // Reset
                y += 20;

                if (y > 700) {
                    doc.addPage();
                    y = 50;
                    doc.rect(50, y, 500, 20).fill('#34495e');
                    doc.fillColor('#fff').text('Cuota', 60, y + 5);
                    doc.text('Fecha Venc.', 120, y + 5);
                    doc.text('Monto', 280, y + 5);
                    doc.text('Estado', 400, y + 5);
                    y += 25;
                }
            });

            doc.end();
        } catch (error) { 
            console.error("Error Cronograma PDF:", error);
            res.redirect('/prestamos'); 
        }
    },

    // 4. ESTADO DE CUENTA INTEGRAL
    generarEstadoCuenta: async (req, res) => {
        const { id } = req.params;
        try {
            const cliente = await ClienteModel.obtenerPorId(id);
            const prestamos = await PrestamoModel.obtenerPorCliente(id);
            const ahorros = await AhorroModel.buscarPorCliente(id);
            const empenos = await EmpenoModel.obtenerPorCliente(id);
            let config = await ConfigModel.obtener();
            
            const moneda = (config && config.moneda) ? config.moneda : '$';
            if (!config) config = { nombre_empresa: 'Sistema', ruc: '' };

            if (!cliente) return res.redirect('/clientes');

            const doc = new PDFDocument({ margin: 50 });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=EstadoCuenta_${id}.pdf`);
            doc.pipe(res);

            if (config.logo) try { doc.image(`public/uploads/${config.logo}`, 50, 45, { width: 60 }); } catch(e){}
            doc.fontSize(18).font('Helvetica-Bold').text('ESTADO DE CUENTA INTEGRAL', { align: 'center' });
            doc.fontSize(10).font('Helvetica').text(config.nombre_empresa, { align: 'center' });
            doc.text(`Fecha: ${new Date().toLocaleDateString()}`, { align: 'center' });

            doc.y = 160;
            
            doc.rect(50, doc.y, 500, 70).fillAndStroke('#f8f9fa', '#dee2e6');
            const startY = doc.y; 
            doc.fill('#000').fontSize(12).font('Helvetica-Bold').text(`CLIENTE: ${cliente.nombre} ${cliente.apellido}`, 60, startY + 15);
            doc.fontSize(10).font('Helvetica').text(`DNI: ${cliente.dni}`, 60, startY + 35);
            
            doc.y = startY + 90;
            doc.font('Helvetica-Bold').fontSize(14).text('RESUMEN FINANCIERO', 50, doc.y);
            doc.moveDown(1);

            let y = doc.y;
            doc.fontSize(12).font('Helvetica-Bold').text('1. CUENTA DE AHORROS', 50, y);
            y += 20;
            doc.font('Helvetica');
            if (ahorros) {
                doc.fontSize(12).text(`Saldo Disponible: ${moneda} ${formatCurrency(ahorros.saldo_actual, 2)}`, 50, y);
            } else {
                doc.fontSize(10).text('No tiene cuenta de ahorros activa.', 50, y);
            }
            y += 40;

            doc.font('Helvetica-Bold').fontSize(12).text('2. PRÉSTAMOS ACTIVOS', 50, y);
            y += 20;
            
            doc.fontSize(10).text('ID', 50, y);
            doc.text('Fecha', 100, y);
            doc.text('Monto Total', 220, y);
            doc.text('Estado', 350, y);
            doc.moveTo(50, y + 15).lineTo(500, y + 15).stroke();
            y += 20;

            let totalDeuda = 0;
            let hayDeuda = false;
            doc.font('Helvetica');
            
            if (prestamos.length > 0) {
                prestamos.forEach(p => {
                    if(p.estado !== 'pagado') {
                        hayDeuda = true;
                        doc.text(`#${p.id}`, 50, y);
                        doc.text(new Date(p.fecha_inicio).toLocaleDateString(), 100, y);
                        doc.text(`${moneda} ${formatCurrency(p.monto_total, 2)}`, 220, y);
                        doc.text(p.estado.toUpperCase(), 350, y);
                        y += 15;
                        totalDeuda += parseFloat(p.monto_total);
                    }
                });
            }
            if(!hayDeuda) {
                doc.text('Sin deudas pendientes.', 50, y);
                y += 20;
            } else {
                y += 10;
                doc.font('Helvetica-Bold').text(`Total Deuda: ${moneda} ${formatCurrency(totalDeuda, 2)}`, 50, y);
                y += 20;
            }
            y += 20;

            if (y > 650) { doc.addPage(); y = 50; }
            doc.font('Helvetica-Bold').fontSize(12).text('3. ARTÍCULOS EN GARANTÍA', 50, y);
            y += 20;
            
            if (empenos.length > 0) {
                let hay = false;
                doc.font('Helvetica').fontSize(10);
                empenos.forEach(e => {
                    if(e.estado === 'en_custodia') {
                        hay = true;
                        doc.text(`- ${e.nombre_articulo} (${moneda} ${formatCurrency(e.valor_tasacion, 2)})`, 50, y);
                        y += 15;
                    }
                });
                if(!hay) doc.text('No hay artículos en custodia.', 50, y);
            } else {
                doc.font('Helvetica').fontSize(10).text('No hay historial.', 50, y);
            }
            doc.end();
        } catch (error) { res.redirect('/clientes'); }
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
                catch(e) { doc.moveDown(2); }
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
            doc.text(`DNI: ${mov.dni}`);
            doc.text(`Cuenta: #${mov.cuenta_id}`);
            
            doc.moveDown(1);
            doc.font('Helvetica-Bold').fontSize(14).text(mov.tipo_movimiento.toUpperCase(), { align: 'center' });
            doc.fontSize(16).text(`${moneda} ${formatCurrency(mov.monto, 2)}`, { align: 'center' });
            
            doc.fontSize(8).font('Helvetica');
            if(mov.observacion) {
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
            const prestamo = await PrestamoModel.obtenerPorId(id);
            let config = await ConfigModel.obtener();
            
            const moneda = (config && config.moneda) ? config.moneda : '$';
            if (!config) config = { nombre_empresa: 'Sistema Financiero', ruc: '000000', direccion: 'Oficina Principal' };

            if (!prestamo) return res.redirect('/prestamos');

            const doc = new PDFDocument({ size: [226, 500], margin: 10 }); // Formato Ticket 80mm
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=Desembolso_${id}.pdf`);
            doc.pipe(res);

            // Cabecera
            if (config.logo) {
                try { doc.image(`public/uploads/${config.logo}`, 90, 10, { width: 40 }); doc.moveDown(4); } 
                catch(e) { doc.moveDown(2); }
            } else { doc.moveDown(2); }
            
            doc.fontSize(10).font('Helvetica-Bold').text(config.nombre_empresa.toUpperCase(), { align: 'center' });
            doc.fontSize(8).font('Helvetica').text(`RUC: ${config.ruc || '---'}`, { align: 'center' });
            doc.text(config.direccion || '', { align: 'center' });
            doc.text('--------------------------------', { align: 'center' });
            
            doc.moveDown(0.5);
            doc.fontSize(11).font('Helvetica-Bold').text('COMPROBANTE DE ENTREGA', { align: 'center' });
            doc.fontSize(9).text('DE PRÉSTAMO', { align: 'center' });
            doc.fontSize(8).font('Helvetica').text(`NRO OP: ${prestamo.id}`, { align: 'center' });
            doc.text(`Fecha: ${new Date(prestamo.fecha_inicio).toLocaleDateString()}`, { align: 'center' });
            
            doc.moveDown(0.5);
            doc.text('--------------------------------', { align: 'center' });
            
            // Datos del Cliente
            doc.font('Helvetica-Bold').text('CLIENTE (DEUDOR):', { align: 'left' });
            doc.font('Helvetica').text(`${prestamo.nombre} ${prestamo.apellido}`);
            doc.text(`DNI: ${prestamo.dni}`);
            
            doc.moveDown(1);
            
            // Detalles del Dinero Entregado
            doc.font('Helvetica-Bold').text('DETALLE DEL DESEMBOLSO:', { align: 'left' });
            doc.fontSize(12).text(`MONTO ENTREGADO: ${moneda} ${formatCurrency(prestamo.monto_prestado, 2)}`, { align: 'center' });
            
            doc.moveDown(0.5);
            doc.fontSize(8).font('Helvetica');
            doc.text(`Total a devolver: ${moneda} ${formatCurrency(prestamo.monto_total, 2)}`);
            doc.text(`Cuotas: ${prestamo.cuotas} (${prestamo.frecuencia})`);
            
            doc.moveDown(3);
            
            // Sección de Firma
            doc.text('________________________________', { align: 'center' });
            doc.text('RECIBÍ CONFORME (Firma Cliente)', { align: 'center' });
            doc.moveDown(0.5);
            doc.text(`DNI: ${prestamo.dni}`, { align: 'center' });

            doc.moveDown(2);
            doc.fontSize(7).text('Este comprobante certifica la recepción del dinero en efectivo o transferencia.', { align: 'center', oblique: true });
            
            doc.end();

        } catch (error) {
            console.error("Error Ticket Desembolso:", error);
            res.redirect('/prestamos');
        }
    }
};

module.exports = reportesController;