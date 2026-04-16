/**
 * Utilidades para formateo de datos en el sistema.
 */

const formatters = {
    /**
     * Formatea un número como moneda colombiana.
     * Ejemplo: 100000 -> 100.000 o 100.000,00 dependiendo de los decimales.
     * @param {number|string} valor - El valor a formatear.
     * @param {number} [decimales=0] - Cantidad de decimales a mostrar.
     * @returns {string} - El valor formateado.
     */
    formatCurrency: (valor, decimales = 0) => {
        if (valor === null || valor === undefined || isNaN(valor)) return '0';
        
        return new Intl.NumberFormat('es-CO', {
            minimumFractionDigits: decimales,
            maximumFractionDigits: decimales
        }).format(valor);
    }
};

module.exports = formatters;
