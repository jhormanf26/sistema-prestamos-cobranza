const db = require('./config/db');

async function seed() {
    try {
        console.log("Iniciando generación de datos de prueba...");
        
        // 1. Clientes
        console.log("Insertando 10 Clientes...");
        const clientes = [];
        for (let i = 1; i <= 10; i++) {
            const dni = '990000' + (i < 10 ? '0' + i : i);
            const res = await db.query(
                `INSERT INTO clientes (dni, nombre, apellido, telefono, direccion, email, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                [dni, `ClientePrueba${i}`, `Apellido${i}`, `99988877${i % 10}`, `Av. Falsa 12${i}`, `cliente${i}@prueba.com`]
            );
            clientes.push(res[0].insertId);
        }

        // 2. Usuarios
        console.log("Insertando 10 Usuarios...");
        for (let i = 1; i <= 10; i++) {
            await db.query(
                `INSERT INTO usuarios (nombre_completo, email, password, rol, estado, created_at) VALUES (?, ?, ?, 'empleado', 1, NOW())`,
                [`EmpleadoPrueba${i}`, `empleado${i}@sistema.local`, `$2b$10$Kjz3C2gtC9YvM/ZTh8qX6O3IkP3Ffvr6FiJhKV.qPcEVn7gvNzkVK`]
            );
        }

        // 3. Cuentas de Ahorro
        console.log("Insertando 10 Cuentas de Ahorro...");
        const cuentas = [];
        for (let i = 0; i < 10; i++) {
            const saldo = (i + 1) * 300;
            const res = await db.query(
                `INSERT INTO cuentas_ahorro (cliente_id, saldo_actual, fecha_apertura) VALUES (?, ?, NOW())`,
                [clientes[i], saldo]
            );
            cuentas.push({ id: res[0].insertId, saldo });
        }

        // 4. Movimientos de Ahorro
        console.log("Insertando 10 Movimientos de Ahorro...");
        for (let i = 0; i < 10; i++) {
            await db.query(
                `INSERT INTO movimientos_ahorro (cuenta_id, tipo_movimiento, monto, fecha_movimiento, observacion) VALUES (?, 'deposito', ?, NOW(), 'Depósito inicial de prueba')`,
                [cuentas[i].id, cuentas[i].saldo]
            );
        }

        // 5. Préstamos
        console.log("Insertando 10 Préstamos...");
        const prestamos = [];
        const estadosPrestamo = ['pendiente', 'pagado', 'vencido'];
        const frecuencias = ['diario', 'semanal', 'mensual'];
        for (let i = 0; i < 10; i++) {
            const monto = (i + 1) * 500;
            const estado = estadosPrestamo[i % 3];
            const frecuencia = frecuencias[i % 3];
            const res = await db.query(
                `INSERT INTO prestamos (cliente_id, monto_prestado, tasa_interes, monto_total, cuotas, frecuencia, estado, fecha_inicio, fecha_fin) VALUES (?, ?, 20.00, ?, ?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 MONTH))`,
                [clientes[i], monto, monto * 1.2, 5, frecuencia, estado]
            );
            prestamos.push(res[0].insertId);
        }

        // 6. Pagos
        console.log("Insertando 10 Pagos de préstamos...");
        for (let i = 0; i < 10; i++) {
            await db.query(
                `INSERT INTO pagos (prestamo_id, monto_pagado, fecha_pago, observaciones) VALUES (?, ?, NOW(), 'Pago de cuota prueba')`,
                [prestamos[i], 120.00]
            );
        }

        // 7. Empeños
        console.log("Insertando 10 Empeños...");
        const estadosEmpeno = ['en_custodia', 'devuelto', 'vendido'];
        for (let i = 0; i < 10; i++) {
            const estadoE = estadosEmpeno[i % 3];
            await db.query(
                `INSERT INTO empenos (cliente_id, nombre_articulo, descripcion, valor_tasacion, monto_prestado, fecha_limite, estado, created_at) VALUES (?, ?, 'Artículo de prueba', ?, ?, DATE_ADD(CURDATE(), INTERVAL 2 MONTH), ?, NOW())`,
                [clientes[i], `Artículo Prueba ${i + 1}`, 1000.00, 500.00, estadoE]
            );
        }

        // 8. Gastos
        console.log("Insertando 10 Gastos...");
        const categoriasGasto = ['Servicios', 'Suministros', 'Otros'];
        for (let i = 0; i < 10; i++) {
            const categoriaG = categoriasGasto[i % 3];
            await db.query(
                `INSERT INTO gastos (descripcion, monto, categoria, fecha_gasto, registrado_por, observacion, created_at) VALUES (?, ?, ?, CURDATE(), 'Sistema', 'Gasto generado automáticamente', NOW())`,
                [`Gasto Prueba ${i + 1}`, (i + 1) * 20, categoriaG]
            );
        }

        console.log("✅ Seeding completado satisfactoriamente.");
        process.exit(0);
    } catch (e) {
        console.error("❌ Error durante el seeding:", e);
        process.exit(1);
    }
}

seed();
