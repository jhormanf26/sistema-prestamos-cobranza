/**
 * Utilidad de parseo de archivos CSV para el módulo de Inversiones.
 * Soporta archivos exportados con delimitador punto y coma (;) o coma (,).
 */

const MESES_ESPANOL = {
    'ene': '01', 'enero': '01',
    'feb': '02', 'febrero': '02',
    'mar': '03', 'marzo': '03',
    'abr': '04', 'abril': '04',
    'may': '05', 'mayo': '05',
    'jun': '06', 'junio': '06',
    'jul': '07', 'julio': '07',
    'ago': '08', 'agosto': '08',
    'sep': '09', 'septiembre': '09', 'set': '09', 'setiembre': '09',
    'oct': '10', 'octubre': '10',
    'nov': '11', 'noviembre': '11',
    'dic': '12', 'diciembre': '12'
};

/**
 * Normaliza una fecha en texto (ej. "16 ago 2026", "2026-08-16", "16/08/2026") a formato YYYY-MM-DD.
 * @param {string} fechaTexto Texto de la fecha a normalizar
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
function parseFechaEspanol(fechaTexto) {
    if (!fechaTexto) return new Date().toISOString().split('T')[0];
    const limpia = fechaTexto.trim().replace(/'/g, '').replace(/"/g, '');
    
    // Formato ISO: 2026-08-16
    if (/^\d{4}-\d{2}-\d{2}$/.test(limpia)) {
        return limpia;
    }

    // Formato DD/MM/YYYY o DD-MM-YYYY
    const coincideDDMMYYYY = limpia.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (coincideDDMMYYYY) {
        const dia = coincideDDMMYYYY[1].padStart(2, '0');
        const mes = coincideDDMMYYYY[2].padStart(2, '0');
        const anio = coincideDDMMYYYY[3];
        return `${anio}-${mes}-${dia}`;
    }

    // Formato estilo "16 ago 2026" o "16 de agosto de 2026"
    const partes = limpia.toLowerCase().split(/\s+/).filter(p => p !== 'de');
    if (partes.length >= 3) {
        const dia = partes[0].padStart(2, '0');
        const mesTxt = partes[1].toLowerCase().substring(0, 3);
        const mesNum = MESES_ESPANOL[mesTxt] || '01';
        const anio = partes[2];
        return `${anio}-${mesNum}-${dia}`;
    }

    return new Date().toISOString().split('T')[0];
}

/**
 * Normaliza montos numéricos provenientes del CSV (ej: "3114.7", "'3114.7'", "1.500,50", "-500").
 * @param {string|number} valorTexto Texto o número a normalizar
 * @returns {number} Número flotante válido
 */
function parseMonto(valorTexto) {
    if (typeof valorTexto === 'number') return valorTexto;
    if (!valorTexto) return 0;
    
    let str = String(valorTexto).trim().replace(/'/g, '').replace(/"/g, '');
    
    // Si contiene miles con punto y decimales con coma (ej. 1.250,50)
    if (str.includes('.') && str.includes(',')) {
        str = str.replace(/\./g, '').replace(',', '.');
    } else if (str.includes(',')) {
        // Solo comas para decimales
        str = str.replace(',', '.');
    }
    
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

/**
 * Determina la categoría del movimiento (rendimiento, retiro, inversion).
 * @param {string} descripcion Descripción del movimiento
 * @param {number} monto Monto numérico
 * @returns {string} Tipo de movimiento
 */
function determinarTipoMovimiento(descripcion, monto) {
    const desc = (descripcion || '').toLowerCase();
    if (desc.includes('rendimiento') || desc.includes('interés') || desc.includes('interes') || desc.includes('ganancia')) {
        return 'rendimiento';
    }
    if (desc.includes('retiro') || desc.includes('egreso') || desc.includes('salida')) {
        return 'retiro';
    }
    if (desc.includes('inversión') || desc.includes('inversion') || desc.includes('depósito') || desc.includes('deposito') || desc.includes('aporte')) {
        return 'inversion';
    }
    return monto < 0 ? 'retiro' : 'rendimiento';
}

/**
 * Parsea el contenido completo del CSV de inversiones.
 * @param {string} contenidoCSV Contenido del CSV como string
 * @returns {Object} { tipo_cuenta, numero_cuenta, saldo, movimientos: [{ fecha, descripcion, tipo_movimiento, valor }] }
 */
function parsearCSVInversiones(contenidoCSV) {
    if (!contenidoCSV || typeof contenidoCSV !== 'string') {
        throw new Error('El contenido del archivo CSV es nulo o inválido.');
    }

    const lineas = contenidoCSV.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lineas.length === 0) {
        throw new Error('El archivo CSV se encuentra vacío.');
    }

    // Detectar separador principal (; o ,)
    const separador = lineas[0].includes(';') ? ';' : ',';

    let tipo_cuenta = 'Inversión General';
    let numero_cuenta = '000000000000';
    let saldo = 0;
    let movimientos = [];
    let inicioTablaIndex = -1;

    // 1. Extraer metadatos de la cuenta si existen en las primeras líneas
    for (let i = 0; i < lineas.length; i++) {
        const columnas = lineas[i].split(separador).map(c => c.trim().replace(/^['"]|['"]$/g, ''));
        const primeraCol = columnas[0].toLowerCase();

        // Cabecera de cuenta: Tipo de cuenta;Número;Saldo
        if (primeraCol.includes('tipo de cuenta') || primeraCol.includes('tipo cuenta') || primeraCol.includes('cuenta')) {
            if (i + 1 < lineas.length) {
                const datosCuenta = lineas[i + 1].split(separador).map(c => c.trim().replace(/^['"]|['"]$/g, ''));
                if (datosCuenta[0]) tipo_cuenta = datosCuenta[0];
                if (datosCuenta[1]) numero_cuenta = datosCuenta[1];
                if (datosCuenta[2] && datosCuenta[2] !== '---') saldo = parseMonto(datosCuenta[2]);
            }
        }

        // Detectar inicio de la tabla de movimientos (Fecha;Descripción;Valor)
        if (primeraCol.includes('fecha') && columnas.some(c => c.toLowerCase().includes('descrip') || c.toLowerCase().includes('valor'))) {
            inicioTablaIndex = i + 1;
            break;
        }
    }

    // Si no se encontró la fila de cabecera explicitamente, asumimos que los datos empiezan después de la fila 2 o desde 0
    if (inicioTablaIndex === -1) {
        inicioTablaIndex = lineas.length > 2 && lineas[0].toLowerCase().includes('tipo') ? 3 : 0;
    }

    // 2. Extraer filas de movimientos
    for (let i = inicioTablaIndex; i < lineas.length; i++) {
        const columnas = lineas[i].split(separador).map(c => c.trim().replace(/^['"]|['"]$/g, ''));
        if (columnas.length < 2) continue; // Saltar filas vacías o malformadas

        const fechaRaw = columnas[0];
        const descRaw = columnas[1];
        const valorRaw = columnas[2] !== undefined ? columnas[2] : (columnas[1] !== undefined ? columnas[1] : 0);

        // Si la fila parece la cabecera repetida, ignorar
        if (fechaRaw.toLowerCase().includes('fecha')) continue;

        const fecha = parseFechaEspanol(fechaRaw);
        const descripcion = descRaw || 'Movimiento de Inversión';
        const valor = parseMonto(valorRaw);
        const tipo_movimiento = determinarTipoMovimiento(descripcion, valor);

        movimientos.push({
            fecha,
            descripcion,
            tipo_movimiento,
            valor
        });
    }

    return {
        tipo_cuenta,
        numero_cuenta,
        saldo,
        movimientos
    };
}

module.exports = {
    parseFechaEspanol,
    parseMonto,
    determinarTipoMovimiento,
    parsearCSVInversiones
};
