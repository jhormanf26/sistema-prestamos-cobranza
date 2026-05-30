/**
 * @file tests/portalTenureCelebration.test.js
 * @description Suite de pruebas TDD para verificar que el controlador del portal del cliente
 *              calcule con precisión la antigüedad (meses y días) del cliente y la pase
 *              a la vista para la celebración y gamificación.
 * @run node tests/portalTenureCelebration.test.js
 */

const assert = require('assert');
const db = require('../config/db');
const portalClienteController = require('../controllers/portalClienteController');

async function testTenureCelebration() {
    console.log('🧪 Iniciando prueba TDD para validar Trayectoria y Aniversarios de Clientes...');
    let clienteId = null;

    try {
        // 0. Limpieza preventiva
        await db.query("DELETE FROM clientes WHERE dni = '99999998'");

        // 1. Crear un cliente temporal registrado exactamente hace 7 meses (para validar que tenga más de 6 meses y se calcule bien)
        const sieteMesesAtras = new Date();
        sieteMesesAtras.setMonth(sieteMesesAtras.getMonth() - 7);
        // Ajustamos created_at en la consulta de inserción
        const createdStr = sieteMesesAtras.toISOString().slice(0, 19).replace('T', ' ');

        const [resCliente] = await db.query(`
            INSERT INTO clientes (dni, nombre, apellido, telefono, direccion, email, estado, monto_preaprobado, created_at)
            VALUES ('99999998', 'TestTenure', 'Celebration', '3000000000', 'Calle Test', 'test.tenure@correo.com', 1, 0, ?)
        `, [createdStr]);
        clienteId = resCliente.insertId;

        // Mock de req y res
        const req = {
            session: {
                cliente: {
                    id: clienteId,
                    nombre: 'TestTenure',
                    apellido: 'Celebration',
                    dni: '99999998'
                }
            }
        };

        let renderLlamado = false;
        let vistaRenderizada = '';
        let datosRenderizados = null;

        const res = {
            render: (vista, datos) => {
                renderLlamado = true;
                vistaRenderizada = vista;
                datosRenderizados = datos;
            },
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            send: function(msg) {
                this.sentMessage = msg;
                return this;
            }
        };

        // Ejecutar dashboard
        await portalClienteController.dashboard(req, res);

        assert.ok(renderLlamado, 'Debería llamarse al método res.render');
        assert.strictEqual(vistaRenderizada, 'portal-cliente/dashboard', 'Debería renderizar la vista correcta');
        assert.ok(datosRenderizados, 'Debería pasar datos a la vista');
        assert.ok(datosRenderizados.antiguedadInfo, 'Debería incluir la variable antiguedadInfo en los datos de la vista');
        
        const ant = datosRenderizados.antiguedadInfo;
        console.log(`ℹ️ Registro formateado: ${ant.fechaRegistroFormateada}`);
        console.log(`ℹ️ Tiempo en plataforma: ${ant.totalMeses} meses, ${ant.dias} días (Total: ${ant.totalDias} días)`);
        console.log(`ℹ️ Aniversario de mes exacto hoy: ${ant.esAniversarioMes ? 'SÍ' : 'NO'}`);
        console.log(`ℹ️ Beneficio >6 meses activo: ${ant.tieneMasDeSeisMeses ? 'SÍ' : 'NO'}`);

        assert.strictEqual(ant.totalMeses, 7, 'Debería calcular exactamente 7 meses de antigüedad');
        assert.ok(ant.tieneMasDeSeisMeses, 'Debería tener activado el flag de tieneMasDeSeisMeses');
        assert.ok(ant.fechaRegistroFormateada, 'Debería contener la fecha de registro formateada en español');

        console.log('✅ PASS: La prueba de trayectoria y aniversarios del Portal de Clientes ha pasado exitosamente.');

    } catch (error) {
        console.error('❌ FAIL: Error en la prueba:', error);
        process.exit(1);
    } finally {
        if (clienteId) {
            await db.query('DELETE FROM clientes WHERE id = ?', [clienteId]);
            console.log('🧹 Limpieza: Cliente de prueba eliminado.');
        }
        await db.end();
        process.exit(0);
    }
}

testTenureCelebration();
