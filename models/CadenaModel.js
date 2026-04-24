const db = require('../config/db');

class CadenaModel {

    // Listar Cadenas
    static async obtenerTodas() {
        try {
            const [rows] = await db.query('SELECT * FROM cadenas ORDER BY created_at DESC');
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Crear Cadena
    static async crear(datos) {
        try {
            const { nombre, monto_cuota, frecuencia, fecha_inicio, numero_participantes } = datos;
            const query = 'INSERT INTO cadenas (nombre, monto_cuota, frecuencia, fecha_inicio, numero_participantes) VALUES (?, ?, ?, ?, ?)';
            const [result] = await db.query(query, [nombre, monto_cuota, frecuencia, fecha_inicio, numero_participantes]);
            return result;
        } catch (error) {
            throw error;
        }
    }

    // Obtener Detalle (con participantes)
    static async obtenerPorId(id) {
        try {
            const [cadena] = await db.query('SELECT * FROM cadenas WHERE id = ?', [id]);
            if (!cadena[0]) return null;

            const cicloActual = cadena[0].ciclo_actual;

            const [participantes] = await db.query(`
                SELECT p.*, 
                (SELECT pagado FROM pagos_cadena WHERE participante_id = p.id AND ciclo = ? LIMIT 1) as pagado_actual
                FROM participantes_cadena p 
                WHERE p.cadena_id = ? 
                ORDER BY p.turno ASC
            `, [cicloActual, id]);

            return { ...cadena[0], participantes };
        } catch (error) {
            throw error;
        }
    }

    // Agregar Participante con validación de Turno
    static async agregarParticipante(cadenaId, nombre, telefono, email, turno) {
        try {
            const query = 'INSERT INTO participantes_cadena (cadena_id, nombre, telefono, email, turno) VALUES (?, ?, ?, ?, ?)';
            const [result] = await db.query(query, [cadenaId, nombre, telefono, email, turno]);
            return result;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('El turno seleccionado ya está ocupado en esta cadena.');
            }
            throw error;
        }
    }

    // Marcar Pago para un Ciclo
    static async registrarPago(participanteId, cadenaId, ciclo) {
        try {
            const query = `
                INSERT INTO pagos_cadena (participante_id, cadena_id, ciclo, pagado, fecha_pago) 
                VALUES (?, ?, ?, true, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE pagado = true, fecha_pago = CURRENT_TIMESTAMP
            `;
            const [result] = await db.query(query, [participanteId, cadenaId, ciclo]);
            return result;
        } catch (error) {
            throw error;
        }
    }

    // Entregar Acumulado
    static async entregarAcumulado(participanteId) {
        try {
            const query = 'UPDATE participantes_cadena SET estado_entrega = true WHERE id = ?';
            const [result] = await db.query(query, [participanteId]);
            return result;
        } catch (error) {
            throw error;
        }
    }

    // Obtener ciclo actual (ahora desde la BD)
    static async obtenerCicloActual(id) {
        try {
            const [rows] = await db.query('SELECT ciclo_actual, fecha_inicio, frecuencia FROM cadenas WHERE id = ?', [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Calcular el rango de fechas de un ciclo específico
    static obtenerRangoCiclo(fechaInicio, frecuencia, ciclo) {
        const inicio = new Date(fechaInicio);
        let diasPorCiclo = 30;

        if (frecuencia === 'semanal') diasPorCiclo = 7;
        else if (frecuencia === 'quincenal') diasPorCiclo = 15;
        else if (frecuencia === 'mensual') diasPorCiclo = 30;

        const fechaDesde = new Date(inicio);
        fechaDesde.setDate(inicio.getDate() + (diasPorCiclo * (ciclo - 1)));

        const fechaHasta = new Date(fechaDesde);
        fechaHasta.setDate(fechaDesde.getDate() + diasPorCiclo - 1);

        return { desde: fechaDesde, hasta: fechaHasta };
    }

    // Avanzar de ciclo
    static async avanzarCiclo(id) {
        try {
            const query = 'UPDATE cadenas SET ciclo_actual = ciclo_actual + 1 WHERE id = ?';
            const [result] = await db.query(query, [id]);
            return result;
        } catch (error) {
            throw error;
        }
    }

    // Obtener días restantes para el próximo ciclo (ajustado al ciclo persistente)
    static calcularDiasRestantes(fechaInicio, frecuencia, cicloActual) {
        const inicio = new Date(fechaInicio);
        const hoy = new Date();
        hoy.setHours(0,0,0,0);
        
        let diasPorCiclo = 30;
        if (frecuencia === 'semanal') diasPorCiclo = 7;
        else if (frecuencia === 'quincenal') diasPorCiclo = 15;
        else if (frecuencia === 'mensual') diasPorCiclo = 30;

        const fechaFinCiclo = new Date(inicio);
        fechaFinCiclo.setDate(inicio.getDate() + (diasPorCiclo * cicloActual));

        const diffTime = fechaFinCiclo - hoy;
        const msPorDia = 1000 * 60 * 60 * 24;
        return Math.ceil(diffTime / msPorDia);
    }

    // Finalizar cadena
    static async finalizar(id) {
        try {
            const query = 'UPDATE cadenas SET estado = "finalizada" WHERE id = ?';
            const [result] = await db.query(query, [id]);
            return result;
        } catch (error) {
            throw error;
        }
    }

    // Obtener participante por ID (con estado de pago)
    static async obtenerParticipantePorId(id) {
        try {
            const query = `
                SELECT p.*, c.nombre as cadena_nombre, c.monto_cuota, c.ciclo_actual
                FROM participantes_cadena p
                JOIN cadenas c ON p.cadena_id = c.id
                WHERE p.id = ?
            `;
            const [rows] = await db.query(query, [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }
}

module.exports = CadenaModel;
