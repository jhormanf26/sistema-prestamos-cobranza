const db = require('../config/db');

class PrestamoModel {

    // 1. Obtener paginados (CON SOPORTE DE ORDEN GLOBAL)
    static async obtenerPaginados(limit, offset, sort = 'id', order = 'desc') {
        try {
            const columnasPermitidas = ['id', 'nombre', 'monto_total', 'fecha_inicio', 'estado'];
            const columna = columnasPermitidas.includes(sort) ? sort : 'id';
            const direccion = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

            // Mapeo inteligente de ordenamiento
            let orderBy = `p.${columna} ${direccion}`;
            if (columna === 'nombre') orderBy = `c.nombre ${direccion}, c.apellido ${direccion}`;
            if (columna === 'id') orderBy = `p.id ${direccion}`;

            const query = `
                SELECT p.*, c.nombre, c.apellido, c.dni,
                (SELECT IFNULL(SUM(monto_pagado), 0) FROM pagos WHERE prestamo_id = p.id) as total_pagado
                FROM prestamos p
                INNER JOIN clientes c ON p.cliente_id = c.id
                ORDER BY ${orderBy}
                LIMIT ? OFFSET ?
            `;
            const [rows] = await db.query(query, [limit, offset]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // 2. Buscar paginados (CON SOPORTE DE ORDEN GLOBAL)
    static async buscarPaginados(criterio, limit, offset, sort = 'id', order = 'desc') {
        try {
            const busqueda = `%${criterio}%`;
            const columnasPermitidas = ['id', 'nombre', 'monto_total', 'fecha_inicio', 'estado'];
            const columna = columnasPermitidas.includes(sort) ? sort : 'id';
            const direccion = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

            let orderBy = `p.${columna} ${direccion}`;
            if (columna === 'nombre') orderBy = `c.nombre ${direccion}, c.apellido ${direccion}`;

            const query = `
                SELECT p.*, c.nombre, c.apellido, c.dni,
                (SELECT IFNULL(SUM(monto_pagado), 0) FROM pagos WHERE prestamo_id = p.id) as total_pagado
                FROM prestamos p
                INNER JOIN clientes c ON p.cliente_id = c.id
                WHERE c.nombre LIKE ? OR c.apellido LIKE ? OR p.id LIKE ?
                ORDER BY ${orderBy}
                LIMIT ? OFFSET ?
            `;
            const [rows] = await db.query(query, [busqueda, busqueda, busqueda, limit, offset]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Contadores y otros métodos
    static async contarTotal() {
        try {
            const [rows] = await db.query('SELECT COUNT(*) as total FROM prestamos');
            return rows[0].total;
        } catch (error) { throw error; }
    }

    static async contarBusqueda(criterio) {
        try {
            const busqueda = `%${criterio}%`;
            const query = `SELECT COUNT(*) as total FROM prestamos p JOIN clientes c ON p.cliente_id = c.id WHERE c.nombre LIKE ? OR c.apellido LIKE ? OR p.id LIKE ?`;
            const [rows] = await db.query(query, [busqueda, busqueda, busqueda]);
            return rows[0].total;
        } catch (error) { throw error; }
    }

    static async crear(datos) {
        try {
            const { cliente_id, monto_prestado, tasa_interes, monto_total, cuotas, frecuencia, fecha_inicio, fecha_fin, observaciones } = datos;
            const query = 'INSERT INTO prestamos (cliente_id, monto_prestado, tasa_interes, monto_total, cuotas, frecuencia, fecha_inicio, fecha_fin, observaciones) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
            const [result] = await db.query(query, [cliente_id, monto_prestado, tasa_interes, monto_total, cuotas, frecuencia, fecha_inicio, fecha_fin, observaciones]);
            return result;
        } catch (error) { throw error; }
    }

    static async obtenerPorId(id) {
        try {
            const query = 'SELECT p.*, c.nombre, c.apellido, c.dni, c.email, c.telefono, c.direccion FROM prestamos p JOIN clientes c ON p.cliente_id = c.id WHERE p.id = ?';
            const [rows] = await db.query(query, [id]);
            return rows[0];
        } catch (error) { throw error; }
    }

    static async actualizarEstado(id, nuevoEstado) {
        try { return await db.query('UPDATE prestamos SET estado = ? WHERE id = ?', [nuevoEstado, id]); } catch (error) { throw error; }
    }

    static async obtenerTodos() {
        try { return (await db.query('SELECT p.*, c.nombre, c.apellido, c.dni, c.email, c.telefono, c.direccion FROM prestamos p JOIN clientes c ON p.cliente_id = c.id ORDER BY p.fecha_inicio DESC'))[0]; } catch (error) { throw error; }
    }

    static async obtenerPorCliente(clienteId) {
        try {
            const query = `
                SELECT p.*, 
                (SELECT IFNULL(SUM(monto_pagado), 0) FROM pagos WHERE prestamo_id = p.id) as total_pagado
                FROM prestamos p 
                WHERE p.cliente_id = ? 
                ORDER BY p.fecha_inicio DESC
            `;
            const [rows] = await db.query(query, [clienteId]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    static async procesarVencimientos() {
        try { await db.query("UPDATE prestamos SET estado = 'vencido' WHERE fecha_fin < CURDATE() AND estado = 'pendiente'"); } catch (error) { console.error(error); }
    }

    static async contarVencidos() {
        try { return (await db.query("SELECT COUNT(*) as total FROM prestamos WHERE estado = 'vencido'"))[0][0].total; } catch (error) { throw error; }
    }

    static async obtenerVencidos() {
        try { return (await db.query("SELECT p.*, c.nombre, c.apellido, c.dni, c.telefono FROM prestamos p JOIN clientes c ON p.cliente_id = c.id WHERE p.estado = 'vencido' ORDER BY p.fecha_fin ASC"))[0]; } catch (error) { throw error; }
    }
}

module.exports = PrestamoModel;