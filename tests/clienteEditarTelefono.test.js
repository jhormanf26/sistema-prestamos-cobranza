/**
 * @file tests/clienteEditarTelefono.test.js
 * @description Suite de pruebas TDD para verificar que la vista de edición de clientes contenga el campo de teléfono.
 *              Esta prueba asegura que los administradores tengan el control visual para actualizar el teléfono del cliente.
 * @run node tests/clienteEditarTelefono.test.js
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

/**
 * Ejecuta la validación del formulario de edición del cliente.
 * Verifica la presencia física de la etiqueta label y el campo input con nombre 'telefono'.
 * 
 * @returns {void} No retorna ningún valor. Termina el proceso con código 0 si pasa, o lanza un error assert.
 */
function testClienteEditarTelefono() {
    console.log('🧪 Iniciando prueba TDD para verificar el campo teléfono en la edición de clientes...');

    const viewPath = path.join(__dirname, '../views/clientes/editar.ejs');
    
    // Verificar que la vista de edición existe
    assert.ok(fs.existsSync(viewPath), 'El archivo editar.ejs de clientes debe existir');

    const htmlContent = fs.readFileSync(viewPath, 'utf8');

    // 1. Validar que exista la etiqueta label de teléfono
    console.log('  - Validando etiqueta (label) para Teléfono...');
    assert.ok(
        htmlContent.toLowerCase().includes('teléfono') || htmlContent.toLowerCase().includes('telefono'),
        'Debe existir una etiqueta o texto explicativo para "Teléfono" en el formulario.'
    );

    // 2. Validar que exista el input con name="telefono"
    console.log('  - Validando campo de entrada (input) con name="telefono"...');
    assert.ok(
        htmlContent.includes('name="telefono"'),
        'Debe existir un input con la propiedad name="telefono" para enviar el dato al controlador.'
    );

    console.log('✅ PASS: El formulario de edición de clientes contiene el campo de Teléfono.');
    process.exit(0);
}

testClienteEditarTelefono();
