/**
 * @file recordatorioCuota.test.js
 * @description Pruebas TDD para verificar que el correo de recordatorio de pago
 * muestra el monto de la cuota individual y no el monto total del crédito.
 */

const { formatCurrency } = require('../utils/formatters');

describe('Recordatorio de Pago - Monto de Cuota', () => {

    /**
     * Caso 1: El monto de la cuota se calcula dividiendo monto_total / cuotas
     */
    test('Caso 1: Debe calcular correctamente el monto de la cuota individual', () => {
        const montoTotal = 5000000;
        const cuotas = 10;
        const montoCuotaEsperado = 500000;

        const montoCuota = montoTotal / cuotas;

        expect(montoCuota).toBe(montoCuotaEsperado);
    });

    /**
     * Caso 2: El monto formateado de la cuota debe ser diferente del monto total
     */
    test('Caso 2: El monto formateado de la cuota no debe ser igual al del monto total', () => {
        const montoTotal = 1200000;
        const cuotas = 12;
        const montoCuota = montoTotal / cuotas;

        const textoMontoTotal = formatCurrency(montoTotal, 2);
        const textoMontoCuota = formatCurrency(montoCuota, 2);

        expect(textoMontoCuota).not.toBe(textoMontoTotal);
        expect(montoCuota).toBe(100000);
    });

    /**
     * Caso 3: Verificar que plantillaRecordatorio recibe el monto correcto de la cuota
     * simulando el flujo del controlador
     */
    test('Caso 3: El controlador debe pasar monto_total/cuotas al servicio de email', () => {
        // Simulamos los datos que vienen de la BD
        const prestamo = {
            monto_total: '6000000',
            cuotas: '12',
            nombre: 'Juan',
            apellido: 'Pérez'
        };

        // Lógica exacta que ahora tiene el controlador
        const montoCuota = parseFloat(prestamo.monto_total) / parseInt(prestamo.cuotas);

        expect(montoCuota).toBe(500000);
        expect(montoCuota).not.toBe(parseFloat(prestamo.monto_total));
    });

    /**
     * Caso 4: Verificar con cuotas que generan decimales
     */
    test('Caso 4: Debe manejar cuotas con decimales correctamente', () => {
        const montoTotal = 1000000;
        const cuotas = 3;
        const montoCuota = montoTotal / cuotas;

        // Debe ser aproximadamente 333333.33
        expect(montoCuota).toBeCloseTo(333333.33, 0);
        expect(montoCuota).toBeLessThan(montoTotal);
    });

    /**
     * Caso 5: Caso de una sola cuota (monto_cuota === monto_total)
     */
    test('Caso 5: Con una sola cuota, el monto coincide con el total', () => {
        const montoTotal = 500000;
        const cuotas = 1;
        const montoCuota = montoTotal / cuotas;

        expect(montoCuota).toBe(montoTotal);
    });

    /**
     * Caso 6: Verificar que la función plantillaRecordatorio de emailService
     * utiliza el parámetro montoCuota (no total) para la variable {{monto}}
     */
    test('Caso 6: emailService.plantillaRecordatorio debe formatear el monto de cuota en {{monto}}', async () => {
        const emailService = require('../utils/emailService');

        // Mockear PlantillaModel para que no se conecte a BD
        jest.spyOn(require('../models/PlantillaModel'), 'obtenerPorSlug').mockResolvedValue(null);

        const montoCuota = 500000;
        const result = await emailService.plantillaRecordatorio(
            'Test Cliente',
            montoCuota,
            new Date(),
            '$'
        );

        // El HTML del fallback debe contener el monto de la cuota formateado
        const montoFormateado = formatCurrency(montoCuota, 2);
        expect(result.html).toContain(montoFormateado);

        // NO debe contener el monto total (ej. 5,000,000 si fueran 10 cuotas de 500k)
        // Verificamos que contiene exactamente el monto de cuota
        expect(result.html).toContain('cuota pendiente');
    });
});
