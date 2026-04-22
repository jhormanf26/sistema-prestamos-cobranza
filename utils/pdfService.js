const PDFDocument = require('pdfkit');
const PrestamoModel = require('../models/PrestamoModel');
const ConfigModel = require('../models/ConfigModel');
const PagoModel = require('../models/PagoModel');
const finance = require('./finance');
const { formatCurrency } = require('./formatters');

const pdfService = {

    generarContratoBuffer: async (id) => {
        return new Promise(async (resolve, reject) => {
            try {
                const prestamo = await PrestamoModel.obtenerPorId(id);
                let config = await ConfigModel.obtener();
                if (!config) config = { nombre_empresa: 'EMPRESA', moneda: '$', ruc: '000000000' };
                const moneda = config.moneda;
                if (!prestamo) return reject('Préstamo no encontrado');

                const doc = new PDFDocument({ margin: 50 });
                let buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    let pdfData = Buffer.concat(buffers);
                    resolve(pdfData);
                });

                if (config.logo) {
                    try { doc.image(`public/uploads/${config.logo}`, 50, 45, { width: 60 }); } catch (e) { }
                }

                doc.fontSize(16).font('Helvetica-Bold').text('CONTRATO DE PRÉSTAMO DE DINERO', { align: 'center' });
                doc.fontSize(10).font('Helvetica').text(`NRO OPERACIÓN: ${prestamo.id}`, { align: 'center' });
                
                doc.y = 110;

                doc.fontSize(11).font('Helvetica');
                doc.text(`En la ciudad, a los ${new Date(prestamo.fecha_inicio).toLocaleDateString()}, se celebra el presente contrato entre:`);
                doc.moveDown(0.8);

                doc.font('Helvetica-Bold').text('EL ACREEDOR:', { underline: true });
                doc.font('Helvetica').text(`Empresa: ${config.nombre_empresa}`);
                doc.text(`Documento: ${config.ruc}`);
                doc.text(`Dirección: ${config.direccion || 'Oficina Principal'}`);
                doc.moveDown(0.8);

                doc.font('Helvetica-Bold').text('EL DEUDOR (CLIENTE):', { underline: true });
                doc.font('Helvetica').text(`Nombre: ${prestamo.nombre} ${prestamo.apellido}`);
                doc.text(`Documento(CC): ${prestamo.dni}`);
                doc.text(`Teléfono: ${prestamo.telefono || 'No registrado'}`);
                doc.moveDown(1.5);

                doc.font('Helvetica-Bold').text('CLÁUSULAS DEL CONTRATO:', { align: 'center' });
                doc.moveDown(0.8);

                doc.font('Helvetica-Bold').text('PRIMERO (DEL MONTO):', { continued: true });
                doc.font('Helvetica').text(` EL ACREEDOR entrega a EL DEUDOR la suma de ${moneda} ${formatCurrency(prestamo.monto_prestado, 2)} en calidad de préstamo.`);
                doc.moveDown(0.4);

                doc.font('Helvetica-Bold').text('SEGUNDO (DE LA DEVOLUCIÓN):', { continued: true });
                doc.font('Helvetica').text(` EL DEUDOR se compromete a devolver la suma total de ${moneda} ${formatCurrency(prestamo.monto_total, 2)}, la cual incluye capital e intereses.`);
                doc.moveDown(0.4);

                doc.font('Helvetica-Bold').text('TERCERO (FORMA DE PAGO):', { continued: true });
                doc.font('Helvetica').text(` El pago se realizará en ${prestamo.cuotas} cuotas con frecuencia ${prestamo.frecuencia.toUpperCase()}.`);
                
                const firmaY = 620;
                doc.text('__________________________', 50, firmaY);
                doc.text('__________________________', 350, firmaY);
                
                doc.font('Helvetica-Bold');
                doc.text('FIRMA DE ACREEDOR', 50, firmaY + 15);
                doc.text('FIRMA DE DEUDOR', 350, firmaY + 15);
                
                doc.font('Helvetica');
                doc.text(config.nombre_empresa, 50, firmaY + 30);
                doc.text(`${prestamo.nombre} ${prestamo.apellido}`, 350, firmaY + 30);
                doc.text(`CC: ${prestamo.dni}`, 350, firmaY + 45);

                doc.end();

            } catch (error) {
                reject(error);
            }
        });
    },

    generarTicketDesembolsoBuffer: async (id) => {
        return new Promise(async (resolve, reject) => {
            try {
                const prestamo = await PrestamoModel.obtenerPorId(id);
                let config = await ConfigModel.obtener();
                if (!config) config = { nombre_empresa: 'Sistema Financiero', ruc: '000000', direccion: 'Oficina Principal' };
                const moneda = config.moneda;
                if (!prestamo) return reject('Préstamo no encontrado');

                const doc = new PDFDocument({ size: [226, 500], margin: 10 });
                let buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    let pdfData = Buffer.concat(buffers);
                    resolve(pdfData);
                });

                if (config.logo) {
                    try { doc.image(`public/uploads/${config.logo}`, 90, 10, { width: 40 }); doc.moveDown(4); }
                    catch (e) { doc.moveDown(2); }
                } else { doc.moveDown(2); }

                doc.fontSize(10).font('Helvetica-Bold').text(config.nombre_empresa.toUpperCase(), { align: 'center' });
                doc.fontSize(8).font('Helvetica').text(`CC: ${config.ruc || '---'}`, { align: 'center' });
                doc.text(config.direccion || '', { align: 'center' });
                doc.text('--------------------------------', { align: 'center' });

                doc.moveDown(0.5);
                doc.fontSize(11).font('Helvetica-Bold').text('COMPROBANTE DE ENTREGA', { align: 'center' });
                doc.fontSize(9).text('DE PRÉSTAMO', { align: 'center' });
                doc.fontSize(8).font('Helvetica').text(`NRO OP: ${prestamo.id}`, { align: 'center' });
                doc.text(`Fecha: ${new Date(prestamo.fecha_inicio).toLocaleDateString()}`, { align: 'center' });

                doc.moveDown(0.5);
                doc.text('--------------------------------', { align: 'center' });

                doc.font('Helvetica-Bold').text('CLIENTE (DEUDOR):', { align: 'left' });
                doc.font('Helvetica').text(`${prestamo.nombre} ${prestamo.apellido}`);
                doc.text(`CC: ${prestamo.dni}`);

                doc.moveDown(1);

                doc.font('Helvetica-Bold').text('DETALLE DEL DESEMBOLSO:', { align: 'left' });
                doc.fontSize(12).text(`MONTO ENTREGADO: ${moneda} ${formatCurrency(prestamo.monto_prestado, 2)}`, { align: 'center' });

                doc.moveDown(0.5);
                doc.fontSize(8).font('Helvetica');
                doc.text(`Total a devolver: ${moneda} ${formatCurrency(prestamo.monto_total, 2)}`);
                doc.text(`Cuotas: ${prestamo.cuotas} (${prestamo.frecuencia})`);

                doc.moveDown(3);

                doc.text('________________________________', { align: 'center' });
                doc.text('RECIBÍ CONFORME (Firma Cliente)', { align: 'center' });
                doc.moveDown(0.5);
                doc.text(`CC: ${prestamo.dni}`, { align: 'center' });

                doc.moveDown(2);
                doc.fontSize(7).text('Este comprobante certifica la recepción del dinero en efectivo o transferencia.', { align: 'center', oblique: true });

                doc.end();

            } catch (error) {
                reject(error);
            }
        });
    },

    generarCronogramaBuffer: async (id) => {
        return new Promise(async (resolve, reject) => {
            try {
                const prestamo = await PrestamoModel.obtenerPorId(id);
                if (!prestamo) return reject('Préstamo no encontrado');
                let config = await ConfigModel.obtener();
                const moneda = (config && config.moneda) ? config.moneda : '$';
                const pagos = await PagoModel.obtenerHistorial(id);
                let totalPagado = pagos.reduce((acc, p) => acc + parseFloat(p.monto_pagado), 0);
                let cronograma = finance.calcularCronograma(
                    parseFloat(prestamo.monto_total),
                    prestamo.cuotas,
                    prestamo.frecuencia,
                    prestamo.fecha_inicio
                );
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
                let buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    let pdfData = Buffer.concat(buffers);
                    resolve(pdfData);
                });

                if (config.logo) {
                    try { doc.image(`public/uploads/${config.logo}`, 50, 40, { width: 60 }); } catch (e) { }
                }

                doc.fontSize(20).font('Helvetica-Bold').fillColor('#2c3e50').text('CRONOGRAMA DE PAGOS', { align: 'right' });
                doc.fontSize(10).font('Helvetica').fillColor('#7f8c8d').text(`Generado: ${new Date().toLocaleString()}`, { align: 'right' });
                doc.moveDown(2);

                doc.fillColor('#000').font('Helvetica-Bold').fontSize(12).text('ESTADO DEL PRÉSTAMO');
                doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#e0e0e0').stroke();
                doc.moveDown(0.5);

                doc.font('Helvetica').fontSize(10);
                doc.text(`Cliente: ${prestamo.nombre} ${prestamo.apellido}`);
                doc.text(`CC: ${prestamo.dni}`);
                doc.text(`Monto Total: ${moneda} ${formatCurrency(prestamo.monto_total, 2)}`);
                doc.text(`Frecuencia: ${prestamo.frecuencia.toUpperCase()}`);
                doc.moveDown(1.5);

                const tableTop = doc.y;
                doc.rect(50, tableTop, 500, 20).fill('#34495e');
                doc.font('Helvetica-Bold').fillColor('#ffffff');
                doc.text('Cuota', 60, tableTop + 5);
                doc.text('Fecha Venc.', 120, tableTop + 5);
                doc.text('Monto', 280, tableTop + 5);
                doc.text('Estado', 400, tableTop + 5);

                let y = tableTop + 25;
                doc.fillColor('#000').font('Helvetica');

                cronograma.forEach((c, index) => {
                    if (index % 2 === 0) {
                        doc.rect(50, y - 5, 500, 20).fill('#f9f9f9');
                    }
                    doc.fillColor('#000').text(c.numero.toString(), 70, y);
                    doc.text(c.fecha.toLocaleDateString(), 120, y);
                    doc.text(`${moneda} ${formatCurrency(c.monto, 2)}`, 280, y);
                    if (c.estado === 'PAGADO') doc.fillColor('#27ae60');
                    else if (c.estado === 'PARCIAL') doc.fillColor('#e67e22');
                    else doc.fillColor('#7f8c8d');
                    doc.font('Helvetica-Bold').text(c.estado, 400, y);
                    doc.fillColor('#000').font('Helvetica');
                    y += 20;

                    if (y > 700) {
                        doc.addPage();
                        y = 50;
                        doc.rect(50, y, 500, 20).fill('#34495e');
                        doc.font('Helvetica-Bold').fillColor('#ffffff');
                        doc.text('Cuota', 60, y + 5);
                        doc.text('Fecha Venc.', 120, y + 5);
                        doc.text('Monto', 280, y + 5);
                        doc.text('Estado', 400, y + 5);
                        y += 25;
                    }
                });

                doc.end();

            } catch (error) {
                reject(error);
            }
        });
    }
};

module.exports = pdfService;
