const fs = require('fs');
const path = require('path');
const assert = require('assert');

/**
 * Suite de pruebas TDD para validar que la Landing Page de Promoción
 * incluya al "Banco de Bogotá" y use la imagen "bogota.png".
 * 
 * @returns {Promise<void>}
 */
async function ejecutarPruebasLandingBancos() {
    console.log('🧪 Iniciando prueba TDD para verificar el Banco de Bogotá en la Landing Page...');

    try {
        const filePath = path.join(__dirname, '../landing/index.html');
        
        // 1. Verificar existencia del archivo index.html de la landing
        assert.ok(fs.existsSync(filePath), 'El archivo landing/index.html debe existir.');
        console.log('✅ El archivo index.html existe.');

        // 2. Leer contenido del archivo
        const htmlContent = fs.readFileSync(filePath, 'utf-8');

        // 3. Validar presencia del logo 'bogota.png'
        assert.ok(htmlContent.includes('bogota.png'), 'El HTML debe hacer referencia a la imagen "bogota.png".');
        console.log('✅ Se hace referencia a "bogota.png" en el HTML.');

        // 4. Validar texto 'Banco de Bogotá' o 'Banco Bogotá'
        assert.ok(htmlContent.includes('Banco de Bogotá') || htmlContent.includes('Banco Bogotá'), 'El HTML debe contener el texto "Banco de Bogotá" o "Banco Bogotá".');
        console.log('✅ El HTML contiene el texto correcto para el Banco de Bogotá.');

        // 5. Validar que la estructura del pill del logo sea la correcta
        const expresionPill = /<div class="logo-pill">[\s\S]*?<img src="bogota\.png"[\s\S]*?Banco de Bogotá[\s\S]*?<\/div>/i;
        assert.ok(expresionPill.test(htmlContent), 'La estructura del pill de logo para Banco de Bogotá debe estar bien formada en el HTML.');
        console.log('✅ Estructura del logo-pill del Banco de Bogotá validada exitosamente.');

        console.log('🎉 TODAS LAS PRUEBAS TDD DE LA LANDING PASARON CON ÉXITO.');
    } catch (error) {
        console.error('❌ Error durante la ejecución de las pruebas TDD:', error);
        process.exit(1);
    }
}

ejecutarPruebasLandingBancos();
