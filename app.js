const express = require('express');
require('dotenv').config(); // Cargar variables de entorno al inicio
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
// const morgan = require('morgan'); // Comentado para evitar errores de instalación

// Inicializar App
const app = express();

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

// 4. Administración
cargarRuta('/usuarios', './routes/usuarios');
cargarRuta('/config', './routes/configuracion'); // El menú apunta a /config
cargarRuta('/bitacora', './routes/bitacora');
cargarRuta('/caja', './routes/caja');
cargarRuta('/perfil', './routes/perfil');
cargarRuta('/mi-licencia', './routes/mi-licencia');

// 5. Reportes
cargarRuta('/reportes', './routes/reportes');
cargarRuta('/reportes-empenos', './routes/empenosReportes');

// 6. Dashboard (Al final)
cargarRuta('/', './routes/index');

// =========================================================
// 4. INICIAR SERVIDOR
// =========================================================
app.listen(app.get('port'), () => {
    console.log(`✅ Servidor ONLINE en puerto ${app.get('port')}`);
    console.log(`💻 Entrar: http://localhost:${app.get('port')}`);
});