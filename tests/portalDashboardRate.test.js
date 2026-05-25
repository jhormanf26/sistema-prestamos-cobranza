/**
 * @file tests/portalDashboardRate.test.js
 * @description Suite de pruebas TDD para verificar que el controlador del portal del cliente
 *              calcule y proporcione la variable `tasaInfoPortal` a la vista del dashboard.
 * @run node tests/portalDashboardRate.test.js
 */

const assert = require('assert');
const db = require('../config/db');
const portalClienteController = require('../controllers/portalClienteController');

async function testDashboardRate() {
    console.log('🧪 Iniciando prueba TDD para validar tasaInfoPortal en dashboard de Portal de Clientes...');
    let clienteId = null;

    try {
        // 0. Limpieza preventiva
        await db.query("DELETE FROM clientes WHERE dni = '99999992'");

        // 1. Crear un cliente temporal con score que lo asigne a categoría B
        const [resCliente] = await db.query(`
            INSERT INTO clientes (dni, nombre, apellido, telefono, direccion, email, estado, monto_preaprobado)
            VALUES ('99999992', 'TestRate', 'Dashboard', '3000000000', 'Calle Test', 'test.rate@correo.com', 1, 1500000)
        `);
        clienteId = resCliente.insertId;

        // Mock de req y res
        const req = {
            session: {
                cliente: {
                    id: clienteId,
                    nombre: 'TestRate',
                    apellido: 'Dashboard',
                    dni: '99999992'
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
        assert.ok(datosRenderizados.tasaInfoPortal, 'Debería incluir la variable tasaInfoPortal en los datos de la vista');
        
        // El score calculado dinámicamente dependerá del scoringService, pero validamos que la estructura de tasaInfoPortal esté presente
        const tasaInfo = datosRenderizados.tasaInfoPortal;
        assert.ok(tasaInfo.categoria, 'tasaInfoPortal debe contener la propiedad "categoria"');
        assert.ok(tasaInfo.tasaMensual, 'tasaInfoPortal debe contener la propiedad "tasaMensual"');
        assert.ok(tasaInfo.tasaMora, 'tasaInfoPortal debe contener la propiedad "tasaMora"');

        console.log(`✅ PASS: La prueba pasó correctamente. Categoría de tasa asignada: ${tasaInfo.categoria} (${tasaInfo.tasaMensual}% mensual)`);

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

testDashboardRate();
