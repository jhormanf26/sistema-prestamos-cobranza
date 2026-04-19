const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function resetSystem() {
    console.log('🚀 Iniciando limpieza total del sistema...');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    });

    try {
        // 1. DESACTIVAR CHEQUEO DE LLAVES FORÁNEAS
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        const tablas = [
            'pagos', 'prestamos', 'movimientos_ahorro', 'cuentas_ahorro', 
            'empenos', 'gastos', 'caja', 'caja_sesiones', 'bitacora', 
            'clientes', 'usuarios', 'configuracion'
        ];

        console.log('--- Vaciando tablas ---');
        for (const tabla of tablas) {
            await connection.query(`TRUNCATE TABLE ${tabla}`);
            console.log(`✅ Tabla ${tabla} limpia.`);
        }

        // 2. CREAR USUARIO ADMINISTRADOR POR DEFECTO
        console.log('--- Creando usuario maestro ---');
        const passHash = await bcrypt.hash('admin123', 10);
        await connection.query(
            'INSERT INTO usuarios (nombre_completo, email, password, rol, estado) VALUES (?, ?, ?, ?, ?)',
            ['Administrador Global', 'admin@sistema.com', passHash, 'admin', 1]
        );
        console.log('✅ Usuario Administrador creado: admin@sistema.com / admin123');

        // 3. CREAR CONFIGURACIÓN INICIAL
        console.log('--- Restableciendo configuración ---');
        await connection.query(
            'INSERT INTO configuracion (id, nombre_empresa, ruc, moneda, interes_global) VALUES (?, ?, ?, ?, ?)',
            [1, 'Mi Nueva Financiera', '00000000000', '$', 0]
        );
        console.log('✅ Configuración base establecida.');

        // 4. LIMPIAR CARPETA UPLOADS
        console.log('--- Limpiando archivos físicos ---');
        const uploadsDir = path.join(__dirname, 'public/uploads');
        if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir);
            for (const file of files) {
                if (file !== '.gitkeep') {
                    fs.unlinkSync(path.join(uploadsDir, file));
                }
            }
            console.log('✅ Carpeta public/uploads vaciada.');
        }

        // 5. REACTIVAR CHEQUEO
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('\n✨ ¡SISTEMA RESTABLECIDO CON ÉXITO! ✨');
        console.log('Ya puedes iniciar sesión en http://localhost:3000 con los datos del administrador.');

    } catch (error) {
        console.error('❌ ERROR DURANTE EL RESET:', error);
    } finally {
        await connection.end();
    }
}

resetSystem();
