const finance = require('../utils/finance');

const simuladorController = {

    // 1. Mostrar la pantalla del simulador
    mostrar: (req, res) => {
        res.render('simulador/index', {
            title: 'Calculadora de Préstamos',
            resultado: null, // Al inicio no hay resultados
            datos: {} // Para mantener los datos en el formulario
        });
    },

    // 2. Procesar el cálculo
    calcular: (req, res) => {
        const { monto, interes, interes_mora, cuotas, frecuencia } = req.body;

        // Validar datos básicos
        if (!monto || !interes || !cuotas) {
            req.flash('mensajeError', 'Complete todos los campos para calcular');
            return res.redirect('/simulador');
        }

        const montoPrestado = parseFloat(monto);
        const tasaMensual = parseFloat(interes);
        const tasaMoraMensual = parseFloat(interes_mora) || 0;
        const numCuotas = parseInt(cuotas);

        // Cálculo de Interés basado en tasa mensual y duración
        const tasaTotal = finance.calcularInteresTotal(tasaMensual, numCuotas, frecuencia);
        const montoInteres = montoPrestado * (tasaTotal / 100);
        const montoTotal = montoPrestado + montoInteres;
        const montoCuota = montoTotal / numCuotas;

        // Interés Diario por Mora (basado en el monto de la cuota)
        const interesMoraDiario = (montoPrestado * (tasaMoraMensual / 100)) / 30;

        // Generar Cronograma (Proyectado desde hoy)
        const cronograma = finance.calcularCronograma(
            montoTotal,
            numCuotas,
            frecuencia,
            new Date() // Usamos fecha de hoy para la simulación
        );

        res.render('simulador/index', {
            title: 'Calculadora de Préstamos',
            resultado: {
                montoPrestado,
                tasa: tasaMensual,
                tasaMora: tasaMoraMensual,
                montoTotal,
                montoInteres,
                interesMoraDiario,
                cronograma
            },
            datos: req.body // Devolvemos lo que escribió el usuario para que no se borre
        });
    }
};

module.exports = simuladorController;