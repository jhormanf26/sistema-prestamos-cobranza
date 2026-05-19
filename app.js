// Configurar Zona Horaria por defecto antes de cargar nada
process.env.TZ = 'America/Bogota';

const express = require('express');
require('dotenv').config(); // Cargar variables de entorno al inicio
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const { initCronJobs } = require('./cron/jobs');
const { runMigrations } = require('./config/migrations');

// Ejecutar migraciones automáticas al inicio de la aplicación
runMigrations().catch(err => console.error('Error en migraciones automáticas:', err));

// Inicializar App
const rateLimit = require('express-rate-limit');

// Limitador de seguridad para la analítica (Evita spam en la base de datos)
const analyticsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Aumentado a 100 para evitar bloqueos accidentales a administradores
    handler: (req, res) => {
        res.status(429).render('errors/429', {
            title: 'Acceso Restringido',
            message: 'Has realizado demasiadas peticiones. Por seguridad, hemos limitado temporalmente el acceso desde tu IP.',
            nextValidTime: new Date(Date.now() + 15 * 60 * 1000)
        });
    }
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
const db = require('./config/db');

app.use(async (req, res, next) => {
    app.locals.version = pkg.version;
    app.locals.formatCurrency = formatCurrency;
    app.locals.mensajeExito = req.flash('mensajeExito');
    app.locals.mensajeError = req.flash('mensajeError');
    app.locals.usuario = req.session.usuario || null;
    app.locals.empresa = app.locals.empresa || { nombre_empresa: 'SISTEMA PRÉSTAMOS', logo: null, moneda: '$' };
    
    // Contadores de mensajes sin leer disponibles en cualquier vista
    res.locals.soporteSinLeer = 0;
    res.locals.clienteChatSinLeer = 0;

    try {
        if (req.session && req.session.usuario) {
            // Chats activos con mensajes del cliente pendientes de lectura
            const [rows] = await db.query(`
                SELECT COUNT(DISTINCT cliente_id) as total 
                FROM soporte_mensajes 
                WHERE remitente = 'cliente' AND leido = 0
            `);
            res.locals.soporteSinLeer = rows[0]?.total || 0;
        }

        if (req.session && req.session.cliente) {
            // Mensajes de la administración pendientes de lectura por parte del cliente actual
            const [rows] = await db.query(`
                SELECT COUNT(*) as total 
                FROM soporte_mensajes 
                WHERE cliente_id = ? AND remitente = 'administrador' AND leido = 0
            `, [req.session.cliente.id]);
            res.locals.clienteChatSinLeer = rows[0]?.total || 0;
        }
    } catch (error) {
        console.error("Aviso: Error cargando contadores de mensajes no leídos:", error.message);
    }
    
    next();
});


// Archivos Estáticos
app.use(express.static(path.join(__dirname, 'public')));

// 6. Analytics API & Log (Se aplica limiter solo a tracking y landing público)
app.use('/promocion/track', analyticsLimiter); 
app.use('/promocion', require('./routes/analytics')); // /detalle está aquí y NO tendrá el limiter
app.use('/promocion', analyticsLimiter, express.static(path.join(__dirname, 'landing')));


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
cargarRuta('/estadisticas', './routes/estadisticas');
cargarRuta('/push', './routes/push');

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

// Portal de Clientes
cargarRuta('/portal-cliente', './routes/portalCliente');

// Administración de Mejoras del Portal del Cliente
cargarRuta('/admin/soporte', './routes/soporte');
cargarRuta('/admin/comprobantes', './routes/comprobantes');
cargarRuta('/admin/solicitudes', './routes/solicitudes');

// 5. Reportes
cargarRuta('/reportes', './routes/reportes');
cargarRuta('/reportes-empenos', './routes/empenosReportes');

// 7. Dashboard (Al final)
cargarRuta('/', './routes/index');

// =========================================================
// 4. INICIAR SERVIDOR
// =========================================================
initCronJobs();

app.listen(app.get('port'), () => {
    console.log(`✅ Servidor ONLINE en puerto ${app.get('port')}`);
    console.log(`💻 Entrar: http://localhost:${app.get('port')}`);
});