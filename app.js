const express = require('express');
require('dotenv').config(); // Cargar variables de entorno al inicio
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
// const morgan = require('morgan'); // Comentado para evitar errores de instalación

// Inicializar App
const rateLimit = require('express-rate-limit');

// Limitador de seguridad para la analítica (Evita spam en la base de datos)
const analyticsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 50, // Limita cada IP a 50 peticiones por ventana
    message: 'Demasiadas peticiones desde esta IP, por favor intente más tarde.'
});

const app = express();

// Confiar en el proxy para obtener la IP real del cliente (necesario en Dockploy/Docker/Nginx)
app.set('trust proxy', true);

// --- 1. CONFIGURACIONES ---
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// --- 2. MIDDLEWARES ---
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Configuración de Sesión
app.use(session({
    secret: 'clave_secreta_sistema_pro',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 horas
}));

app.use(flash());

// Variables Globales
const { formatCurrency } = require('./utils/formatters');
const pkg = require('./package.json');

app.use((req, res, next) => {
    app.locals.version = pkg.version;
    app.locals.formatCurrency = formatCurrency;
    app.locals.mensajeExito = req.flash('mensajeExito');
    app.locals.mensajeError = req.flash('mensajeError');
    app.locals.usuario = req.session.usuario || null;
    app.locals.empresa = app.locals.empresa || { nombre_empresa: 'SISTEMA PRÉSTAMOS', logo: null, moneda: '$' };
    next();
});

// Archivos Estáticos
app.use(express.static(path.join(__dirname, 'public')));

// 6. Analytics API & Log (Debe ir antes que el static)
app.use('/promocion', analyticsLimiter, require('./routes/analytics'));
app.use('/promocion', express.static(path.join(__dirname, 'landing')));


// Inyección del Validador de Licencia Offline
const { verificarLicencia } = require('./middleware/licencias');
app.use(verificarLicencia); 
app.use('/licencia-web', require('./routes/licencia-web'));

// =========================================================
// 3. CARGA DE RUTAS (COMPLETO)
// =========================================================

function cargarRuta(url, pathArchivo) {
    try {
        app.use(url, require(pathArchivo));
        console.log(`[OK] Ruta cargada: ${url}`);
    } catch (error) {
        console.error(`[AVISO] No se pudo cargar ${url}: ${error.message}`);
    }
}

// 1. Auth
cargarRuta('/auth', './routes/auth');

// 2. Módulos Core
cargarRuta('/clientes', './routes/clientes');
cargarRuta('/prestamos', './routes/prestamos');
cargarRuta('/pagos', './routes/pagos');
cargarRuta('/gastos', './routes/gastos');

// 3. Servicios (AQUÍ ESTABA EL ERROR, FALTABA SIMULADOR)
cargarRuta('/simulador', './routes/simulador'); 
cargarRuta('/empenos', './routes/empenos');
cargarRuta('/ahorros', './routes/ahorros');
cargarRuta('/cadenas', './routes/cadenas');

// 4. Administración
cargarRuta('/usuarios', './routes/usuarios');
cargarRuta('/config', './routes/configuracion'); // El menú apunta a /config
cargarRuta('/bitacora', './routes/bitacora');
cargarRuta('/caja', './routes/caja');
cargarRuta('/perfil', './routes/perfil');
cargarRuta('/mi-licencia', './routes/mi-licencia');
cargarRuta('/plantillas', './routes/plantillas');
cargarRuta('/plantillas-pdf', './routes/plantillasPdf');

// 5. Reportes
cargarRuta('/reportes', './routes/reportes');
cargarRuta('/reportes-empenos', './routes/empenosReportes');

// 7. Dashboard (Al final)
cargarRuta('/', './routes/index');

// =========================================================
// 4. INICIAR SERVIDOR
// =========================================================
app.listen(app.get('port'), () => {
    console.log(`✅ Servidor ONLINE en puerto ${app.get('port')}`);
    console.log(`💻 Entrar: http://localhost:${app.get('port')}`);
});