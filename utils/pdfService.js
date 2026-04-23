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
                    try { doc.image(`public/uploads/${config.logo}`, 50, 45, { width: 70 }); } catch (e) { }
                }

                doc.fontSize(18).font('Helvetica-Bold').fillColor('#2c3e50').text('CONTRATO DE PRÉSTAMO', 140, 50, { align: 'center' });
                doc.fontSize(10).font('Helvetica').fillColor('#7f8c8d').text(`OPERACIÓN N°: ${prestamo.id.toString().padStart(6, '0')}`, { align: 'center' });
                doc.moveDown(2);
                
                const boxY = 120;
                doc.rect(50, boxY, 500, 100).fill('#f8f9fa').stroke('#dee2e6');
                doc.fillColor('#2c3e50').font('Helvetica-Bold').fontSize(11).text('PARTES CONTRATANTES', 65, boxY + 15);
                
                doc.font('Helvetica-Bold').fontSize(10).text('EL ACREEDOR:', 65, boxY + 35);
                doc.font('Helvetica').text(`${config.nombre_empresa} - RUC: ${config.ruc}`, 150, boxY + 35);
                
                doc.font('Helvetica-Bold').text('EL DEUDOR:', 65, boxY + 55);
                doc.font('Helvetica').text(`${prestamo.nombre} ${prestamo.apellido}`, 150, boxY + 55);
                doc.text(`Documento: ${prestamo.dni}`, 150, boxY + 70);
                doc.text(`Teléfono: ${prestamo.telefono || 'No registrado'}`, 150, boxY + 85);

                doc.moveDown(4);

                // Forzamos el reset de la posición X al margen izquierdo (50)
                doc.x = 50; 
                doc.font('Helvetica-Bold').fontSize(12).fillColor('#0d6efd').text('CLÁUSULAS DEL COMPROMISO', { align: 'center' });
                doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#0d6efd').stroke();
                doc.moveDown(1);

                const clausulaStyle = { align: 'justify', lineGap: 2, indent: 0 };
                doc.x = 50; // Aseguramos que empiece en el margen
                doc.fillColor('#333').font('Helvetica-Bold').text('PRIMERO (OBJETO): ', { continued: true });
                doc.font('Helvetica').text(`El ACREEDOR entrega al DEUDOR la suma de ${moneda} ${formatCurrency(prestamo.monto_prestado, 2)} por concepto de préstamo de libre inversión.`, clausulaStyle);
                doc.moveDown(0.8);

                doc.x = 50;
                doc.font('Helvetica-Bold').text('SEGUNDO (INTERESES Y TOTAL): ', { continued: true });
                doc.font('Helvetica').text(`El DEUDOR se obliga a devolver la suma total de ${moneda} ${formatCurrency(prestamo.monto_total, 2)}, la cual incluye una tasa de interés del ${prestamo.tasa_interes}%.`, clausulaStyle);
                doc.moveDown(0.8);

                doc.x = 50;
                doc.font('Helvetica-Bold').text('TERCERO (FORMA DE PAGO): ', { continued: true });
                doc.font('Helvetica').text(`La obligación será cancelada en ${prestamo.cuotas} cuotas con una frecuencia de pago ${prestamo.frecuencia.toUpperCase()}. La primera cuota vence el ${new Date(prestamo.fecha_inicio).toLocaleDateString()}.`, clausulaStyle);
                doc.moveDown(0.8);

                doc.x = 50;
                doc.font('Helvetica-Bold').text('CUARTO (MORA): ', { continued: true });
                doc.font('Helvetica').text('El incumplimiento en las fechas pactadas generará el reporte en las centrales de riesgo y las acciones legales pertinentes para el cobro del saldo total.', clausulaStyle);
                
                const firmaY = 620;
                doc.strokeColor('#ccc').moveTo(50, firmaY).lineTo(230, firmaY).stroke();
                doc.moveTo(330, firmaY).lineTo(510, firmaY).stroke();
                
                doc.fontSize(10).font('Helvetica-Bold').fillColor('#2c3e50');
                doc.text('FIRMA ACREEDOR', 50, firmaY + 10, { width: 180, align: 'center' });
                doc.text('FIRMA DEUDOR', 330, firmaY + 10, { width: 180, align: 'center' });
                
                doc.fontSize(9).font('Helvetica').fillColor('#7f8c8d');
                doc.text(config.nombre_empresa, 50, firmaY + 25, { width: 180, align: 'center' });
                doc.text(`${prestamo.nombre} ${prestamo.apellido}`, 330, firmaY + 25, { width: 180, align: 'center' });

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

                // Encabezado con Estilo
                if (config.logo) {
                    try { doc.image(`public/uploads/${config.logo}`, 50, 40, { width: 70 }); } catch (e) { }
                }

                // Información de la Empresa (Izquierda)
                doc.fontSize(16).font('Helvetica-Bold').fillColor('#2c3e50').text(config.nombre_empresa.toUpperCase(), 140, 45);
                doc.fontSize(9).font('Helvetica').fillColor('#7f8c8d').text(`RUC: ${config.ruc || 'N/A'}`);
                doc.text(`${config.direccion || 'Oficina Principal'}`);
                doc.text(`Tel: ${config.telefono || 'N/A'}`);

                // Título del Documento (Derecha)
                doc.fontSize(22).font('Helvetica-Bold').fillColor('#0d6efd').text('CRONOGRAMA', 250, 45, { align: 'right' });
                doc.fontSize(10).font('Helvetica').fillColor('#7f8c8d').text('DE PAGOS Y AMORTIZACIÓN', { align: 'right' });
                doc.moveDown(2.5);

                const infoTop = 130;
                // Rectángulo de Información del Cliente
                doc.rect(50, infoTop, 500, 75).fill('#f8f9fa').stroke('#dee2e6');
                doc.fillColor('#2c3e50').font('Helvetica-Bold').fontSize(11).text('INFORMACIÓN DEL CLIENTE:', 65, infoTop + 12);
                doc.font('Helvetica').fontSize(10).fillColor('#444');
                doc.text(`Nombre: ${prestamo.nombre} ${prestamo.apellido}`, 65, infoTop + 30);
                doc.text(`DNI / Documento: ${prestamo.dni}`, 65, infoTop + 45);
                doc.text(`Préstamo N°: #${prestamo.id}`, 65, infoTop + 60);

                // Rectángulo de Resumen de Préstamo (Derecha)
                doc.fillColor('#2c3e50').font('Helvetica-Bold').text('RESUMEN:', 350, infoTop + 12);
                doc.font('Helvetica').text(`Monto Total: ${moneda} ${formatCurrency(prestamo.monto_total, 2)}`, 350, infoTop + 30);
                doc.text(`Frecuencia: ${prestamo.frecuencia.toUpperCase()}`, 350, infoTop + 45);
                doc.text(`Cuotas: ${prestamo.cuotas}`, 350, infoTop + 60);

                doc.moveDown(3);

                // Cabecera de Tabla
                const tableTop = doc.y;
                doc.rect(50, tableTop, 500, 25).fill('#2c3e50');
                doc.font('Helvetica-Bold').fillColor('#ffffff').fontSize(10);
                doc.text('Cuota', 65, tableTop + 8);
                doc.text('Fecha Venc.', 130, tableTop + 8);
                doc.text('Monto de Cuota', 260, tableTop + 8);
                doc.text('Estado de Pago', 410, tableTop + 8);

                let y = tableTop + 25;
                doc.fillColor('#000').font('Helvetica');

                cronograma.forEach((c, index) => {
                    // Filas Cebra
                    if (index % 2 === 0) {
                        doc.rect(50, y, 500, 22).fill('#f2f2f2');
                    }
                    doc.fillColor('#444').fontSize(10).text(c.numero.toString().padStart(2, '0'), 75, y + 6);
                    doc.text(c.fecha.toLocaleDateString(), 130, y + 6);
                    doc.text(`${moneda} ${formatCurrency(c.monto, 2)}`, 260, y + 6);
                    
                    // Estados con Estilo de Badge
                    let estadoColor = '#7f8c8d';
                    if (c.estado === 'PAGADO') estadoColor = '#198754';
                    else if (c.estado === 'PARCIAL') estadoColor = '#fd7e14';
                    
                    doc.font('Helvetica-Bold').fillColor(estadoColor).text(c.estado, 410, y + 6);
                    doc.fillColor('#000').font('Helvetica');
                    y += 22;

                    // Salto de Página si es necesario
                    if (y > 720) {
                        doc.addPage();
                        y = 50;
                        doc.rect(50, y, 500, 25).fill('#2c3e50');
                        doc.font('Helvetica-Bold').fillColor('#ffffff');
                        doc.text('Cuota', 65, y + 8);
                        doc.text('Fecha Venc.', 130, y + 8);
                        doc.text('Monto de Cuota', 260, y + 8);
                        doc.text('Estado de Pago', 410, y + 8);
                        y += 25;
                    }
                });

                // Pie de Página Legal
                const footerY = 760;
                doc.fontSize(8).fillColor('#7f8c8d').text('Este cronograma de pagos es un documento informativo sujeto a términos y condiciones establecidos en el contrato de préstamo.', 50, footerY, { align: 'center', width: 500 });
                doc.text(`Generado automáticamente por el Sistema de Préstamos el ${new Date().toLocaleString()}`, { align: 'center', width: 500 });

                doc.end();

            } catch (error) {
                reject(error);
            }
        });
    },

    generarEstadoCuentaBuffer: async (clienteId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const [cliente, prestamos, ahorros, empenos, config] = await Promise.all([
                    require('../models/ClienteModel').obtenerPorId(clienteId),
                    require('../models/PrestamoModel').obtenerPorCliente(clienteId),
                    require('../models/AhorroModel').buscarPorCliente(clienteId),
                    require('../models/EmpenoModel').obtenerPorCliente(clienteId),
                    ConfigModel.obtener()
                ]);

                if (!cliente) return reject('Cliente no encontrado');
                const conf = config || { nombre_empresa: 'EMPRESA', moneda: '$' };
                const moneda = conf.moneda;

                const doc = new PDFDocument({ margin: 40 });
                let buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => resolve(Buffer.concat(buffers)));

                // Encabezado
                if (conf.logo) try { doc.image(`public/uploads/${conf.logo}`, 40, 40, { width: 50 }); } catch (e) {}
                doc.fontSize(20).font('Helvetica-Bold').fillColor('#2c3e50').text('ESTADO DE CUENTA', 100, 45);
                doc.fontSize(10).font('Helvetica').fillColor('#7f8c8d').text('RESUMEN INTEGRAL DE SERVICIOS', 100, 65);
                
                doc.fontSize(9).font('Helvetica').text(`Fecha Reporte: ${new Date().toLocaleString()}`, 400, 45, { align: 'right' });
                doc.moveDown(3);

                // Cuadro de Cliente
                doc.rect(40, 110, 520, 60).fill('#34495e');
                doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(14).text(`${cliente.nombre} ${cliente.apellido}`, 55, 122);
                doc.fontSize(10).font('Helvetica').text(`Documento: ${cliente.dni}  |  Email: ${cliente.email || 'N/A'}`, 55, 145);

                let y = 190;
                let seccionNum = 1;

                // Sección 1: Ahorros (Solo si hay saldo)
                if (ahorros && ahorros.saldo_actual > 0) {
                    doc.fillColor('#2c3e50').font('Helvetica-Bold').fontSize(13).text(`${seccionNum}. SALDOS EN AHORROS`, 40, y);
                    doc.moveTo(40, y + 18).lineTo(560, y + 18).strokeColor('#0d6efd').stroke();
                    y += 30;
                    
                    doc.rect(40, y, 520, 35).fill('#e7f1ff');
                    doc.fillColor('#0d6efd').font('Helvetica-Bold').fontSize(12).text(`SALDO DISPONIBLE:`, 55, y + 12);
                    doc.text(`${moneda} ${formatCurrency(ahorros.saldo_actual, 2)}`, 400, y + 12, { align: 'right', width: 140 });
                    y += 60;
                    seccionNum++;
                }

                // Sección 2: Préstamos (Siempre se muestra si es el centro del negocio, o podrías condicionarlo también)
                doc.fillColor('#2c3e50').font('Helvetica-Bold').fontSize(13).text(`${seccionNum}. CARTERA DE PRÉSTAMOS`, 40, y);
                doc.moveTo(40, y + 18).lineTo(560, y + 18).strokeColor('#dc3545').stroke();
                y += 30;

                if (prestamos && prestamos.length > 0) {
                    // Cabecera Tabla
                    doc.rect(40, y, 520, 20).fill('#f8f9fa');
                    doc.fillColor('#2c3e50').font('Helvetica-Bold').fontSize(9);
                    doc.text('ID', 50, y + 6);
                    doc.text('FECHA', 90, y + 6);
                    doc.text('TOTAL', 180, y + 6);
                    doc.text('ESTADO', 320, y + 6);
                    doc.text('SALDO PEND.', 440, y + 6);
                    y += 22;

                    let totalDeuda = 0;
                    let prestamosActivos = false;
                    prestamos.forEach(p => {
                        if (p.estado !== 'pagado') {
                            prestamosActivos = true;
                            const saldo = parseFloat(p.monto_total);
                            doc.fillColor('#444').font('Helvetica').text(`#${p.id}`, 50, y);
                            doc.text(new Date(p.fecha_inicio).toLocaleDateString(), 90, y);
                            doc.text(`${moneda} ${formatCurrency(p.monto_total, 2)}`, 180, y);
                            doc.font('Helvetica-Bold').text(p.estado.toUpperCase(), 320, y);
                            doc.fillColor('#dc3545').text(`${moneda} ${formatCurrency(saldo, 2)}`, 440, y);
                            totalDeuda += saldo;
                            y += 18;
                        }
                    });
                    
                    if (prestamosActivos) {
                        doc.moveDown(1.5);
                        doc.rect(340, y, 220, 30).fill('#dc3545');
                        doc.fillColor('#ffffff').font('Helvetica-Bold').text('TOTAL DEUDA:', 355, y + 10);
                        doc.text(`${moneda} ${formatCurrency(totalDeuda, 2)}`, 450, y + 10, { align: 'right', width: 100 });
                        y += 60;
                    } else {
                        doc.fillColor('#7f8c8d').font('Helvetica').fontSize(10).text('No existen obligaciones pendientes de pago actualmente.', 55, y);
                        y += 40;
                    }
                } else {
                    doc.fillColor('#7f8c8d').font('Helvetica').fontSize(10).text('No registra historial de préstamos vinculados.', 55, y);
                    y += 40;
                }
                seccionNum++;

                // Sección 3: Empeños/Garantías (Solo si hay artículos en custodia)
                const garantiasActivas = empenos ? empenos.filter(e => e.estado === 'en_custodia') : [];
                if (garantiasActivas.length > 0) {
                    if (y > 650) { doc.addPage(); y = 50; }
                    doc.fillColor('#2c3e50').font('Helvetica-Bold').fontSize(13).text(`${seccionNum}. GARANTÍAS EN CUSTODIA`, 40, y);
                    doc.moveTo(40, y + 18).lineTo(560, y + 18).strokeColor('#6c757d').stroke();
                    y += 30;
                    
                    garantiasActivas.forEach(e => {
                        doc.fillColor('#444').font('Helvetica').text(`• ${e.nombre_articulo} (Avalúo: ${moneda} ${formatCurrency(e.valor_tasacion, 2)})`, 55, y);
                        y += 18;
                    });
                }

                doc.fontSize(8).fillColor('#aaa').text('Este documento es una representación digital de sus movimientos financieros. Para aclaraciones, contacte a su asesor.', 40, 750, { align: 'center', width: 520 });
                doc.end();

            } catch (error) { reject(error); }
        });
    }
};

module.exports = pdfService;
