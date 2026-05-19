const finance = {
    
    // Función para sumar días o meses a una fecha
    sumarFecha: (fecha, frecuencia) => {
        const nuevaFecha = new Date(fecha);
        // Ajustamos la zona horaria para evitar errores de día
        if (frecuencia === 'diario') {
            nuevaFecha.setDate(nuevaFecha.getDate() + 1);
        } else if (frecuencia === 'semanal') {
            nuevaFecha.setDate(nuevaFecha.getDate() + 7);
        } else if (frecuencia === 'quincenal') {
            nuevaFecha.setDate(nuevaFecha.getDate() + 15);
        } else if (frecuencia === 'mensual') {
            nuevaFecha.setMonth(nuevaFecha.getMonth() + 1);
        } else if (frecuencia === 'bimensual') {
            nuevaFecha.setMonth(nuevaFecha.getMonth() + 2);
        } else if (frecuencia === 'trimensual') {
            nuevaFecha.setMonth(nuevaFecha.getMonth() + 3);
        }
        return nuevaFecha;
    },

    // Calcular interés total basado en tasa mensual y duración
    calcularInteresTotal: (tasaMensual, cuotas, frecuencia) => {
        let factor = 1;
        if (frecuencia === 'diario') factor = 1/30;
        else if (frecuencia === 'semanal') factor = 7/30;
        else if (frecuencia === 'quincenal') factor = 0.5;
        else if (frecuencia === 'mensual') factor = 1;
        else if (frecuencia === 'bimensual') factor = 2;
        else if (frecuencia === 'trimensual') factor = 3;
        
        return tasaMensual * (cuotas * factor);
    },

    // Generar el array de cuotas
    calcularCronograma: (montoTotal, cuotas, frecuencia, fechaInicio) => {
        const listaCuotas = [];
        const montoCuota = montoTotal / cuotas;
        
        // La primera cuota suele ser un periodo DESPUÉS de la fecha de inicio
        let fechaActual = (typeof fechaInicio === 'string' && !fechaInicio.includes('T')) 
            ? new Date(fechaInicio + 'T00:00:00') 
            : new Date(fechaInicio);
        fechaActual = finance.sumarFecha(fechaActual, frecuencia);

        for (let i = 1; i <= cuotas; i++) {
            listaCuotas.push({
                numero: i,
                fecha: new Date(fechaActual), // Copia de la fecha
                monto: montoCuota
            });

            // Avanzamos la fecha para la siguiente vuelta
            fechaActual = finance.sumarFecha(fechaActual, frecuencia);
        }

        return listaCuotas;
    },

    /**
     * Obtiene la proxima cuota pendiente de un prestamo.
     * @param {number} montoTotal - Monto total a pagar del prestamo.
     * @param {number} cuotas - Cantidad de cuotas del prestamo.
     * @param {string} frecuencia - Frecuencia de pago ('diario', 'semanal', etc.).
     * @param {string|Date} fechaInicio - Fecha de inicio del prestamo.
     * @param {number} totalPagado - Suma de pagos realizados hasta la fecha.
     * @returns {Object|null} La proxima cuota pendiente, o null si ya esta todo pagado.
     */
    obtenerProximaCuota: (montoTotal, cuotas, frecuencia, fechaInicio, totalPagado) => {
        let saldoPagado = parseFloat(totalPagado || 0);
        const cronograma = finance.calcularCronograma(parseFloat(montoTotal), parseInt(cuotas), frecuencia, fechaInicio);
        
        for (let c of cronograma) {
            const mc = parseFloat(c.monto);
            if (saldoPagado >= (mc - 0.1)) {
                // Esta cuota esta completamente pagada
                saldoPagado -= mc;
            } else {
                // Esta cuota es la proxima pendiente (puede estar parcialmente pagada o totalmente sin pagar)
                return {
                    numero: c.numero,
                    fecha: c.fecha,
                    monto: c.monto,
                    restante: mc - saldoPagado
                };
            }
        }
        return null;
    }
};

module.exports = finance;