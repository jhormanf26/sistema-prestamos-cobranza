const db = require('../config/db');

class CajaModel {

    // =========================================================
    // PARTE 1: GESTIÓN DE TURNOS (TUS FUNCIONES ORIGINALES)
    // =========================================================

    // 1. Verificar si la caja está abierta
    static async obtenerSesionAbierta() {
        try {
            const query = "SELECT * FROM caja_sesiones WHERE estado = 'abierta' ORDER BY id DESC LIMIT 1";
            const [rows] = await db.query(query);
            return rows[0]; 
        } catch (error) {
            console.error("Error en obtenerSesionAbierta:", error);
            throw error;
        }
    }

    // 2. Abrir un nuevo turno
    static async abrirCaja(montoInicial, usuario) {
        try {
            const query = "INSERT INTO caja_sesiones (monto_inicial, usuario, estado, fecha_apertura) VALUES (?, ?, 'abierta', NOW())";
            const [result] = await db.query(query, [montoInicial, usuario]);
            return result.insertId;
        } catch (error) {
            console.error("Error en abrirCaja:", error);
            throw error;
        }
    }

    // 3. Cerrar el turno actual
    static async cerrarCaja(idSesion, montoFinal) {
        try {
            const query = "UPDATE caja_sesiones SET estado = 'cerrada', fecha_cierre = NOW(), monto_final = ? WHERE id = ?";
            const [result] = await db.query(query, [montoFinal, idSesion]);
            return result;
        } catch (error) {
            console.error("Error en cerrarCaja:", error);
            throw error;
        }
    }

    // 4. Obtener movimientos del turno (Resumen)
    static async obtenerMovimientosDesde(fechaInicio) {
        try {
            const query = "SELECT * FROM caja WHERE fecha >= ? ORDER BY fecha DESC";
            const [rows] = await db.query(query, [fechaInicio]);
            return rows;
        } catch (error) {
            console.error("Error en obtenerMovimientosDesde:", error);
            throw error;
        }
    }

    // =========================================================
    // PARTE 2: REGISTRO DE MOVIMIENTOS (CORREGIDO E INTELIGENTE)
    // =========================================================
    
    // Esta función ahora detecta si le envías un OBJETO (desde PagosController)
    // o DATOS SUELTOS (desde otros módulos antiguos) para que nada falle.
    static async registrar(datosOConcepto, monto, tipo, usuario) {
        try {
            // CASO A: Llamada desde PagosController (Envía un objeto completo)
            if (typeof datosOConcepto === 'object' && datosOConcepto !== null) {
                const { tipo, categoria, monto, descripcion, usuario_id, referencia_id } = datosOConcepto;
                
                // UNIFICADO: Usamos 'concepto' que es lo que la vista muestra.
                const query = `
                    INSERT INTO caja (tipo, categoria, monto, concepto, usuario_id, referencia_id, fecha)
                    VALUES (?, ?, ?, ?, ?, ?, NOW())
                `;
                
                const [result] = await db.query(query, [
                    tipo, 
                    categoria || 'General', 
                    monto, 
                    descripcion, // El texto recibido se guarda ahora en 'concepto'
                    usuario_id, 
                    referencia_id || null
                ]);
                return result.insertId;

            } else {
                // CASO B: Llamada antigua (Empeños, etc.)
                // (concepto, monto, tipo, usuario)
                const query = 'INSERT INTO caja (concepto, monto, tipo, usuario_id, fecha) VALUES (?, ?, ?, ?, NOW())';
                const [result] = await db.query(query, [datosOConcepto, monto, tipo, usuario]);
                return result.insertId;
            }
        } catch (error) {
            console.error("Error en CajaModel.registrar:", error);
            throw error;
        }
    }
}

module.exports = CajaModel;