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
    max: 100, // Aumentado a 100 para evitar bloqueos accidentales a administradores
    handler: (req, res) => {
        res.status(429).send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Verificación de Seguridad | Préstamos Pro</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Outfit:wght@700&display=swap" rel="stylesheet">
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
                <style>
                    :root {
                        --primary: #0d6efd;
                        --warning: #ffb703;
                        --dark: #0f172a;
                        --slate: #1e293b;
                    }
                    body { 
                        font-family: 'Inter', sans-serif; 
                        background: var(--dark); 
                        color: white; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        min-height: 100vh; 
                        margin: 0;
                        overflow: hidden;
                    }
                    .background-glow {
                        position: absolute;
                        width: 500px;
                        height: 500px;
                        background: radial-gradient(circle, rgba(13, 110, 253, 0.15) 0%, rgba(13, 110, 253, 0) 70%);
                        filter: blur(50px);
                        z-index: -1;
                    }
                    .card { 
                        background: white; 
                        color: var(--slate); 
                        padding: 50px 40px; 
                        border-radius: 24px; 
                        text-align: center; 
                        max-width: 480px; 
                        width: 90%;
                        position: relative;
                        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                        border-top: 8px solid var(--warning);
                        animation: fadeInUp 0.6s ease-out;
                    }
                    @keyframes fadeInUp {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .icon-wrapper {
                        width: 100px;
                        height: 100px;
                        background: #fff8eb;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 25px;
                    }
                    .icon { font-size: 3.5rem; color: var(--warning); }
                    h1 { 
                        font-family: 'Outfit', sans-serif;
                        font-size: 28px; 
                        margin-bottom: 15px; 
                        color: var(--dark); 
                        letter-spacing: -0.5px;
                    }
                    p { color: #64748b; line-height: 1.6; margin-bottom: 30px; font-size: 16px; }
                    .timer-container {
                        background: #f8fafc;
                        padding: 20px;
                        border-radius: 16px;
                        border: 1px dashed #cbd5e1;
                        margin-bottom: 30px;
                    }
                    .timer-label {
                        display: block;
                        font-size: 12px;
                        text-transform: uppercase;
                        font-weight: 700;
                        color: #94a3b8;
                        margin-bottom: 8px;
                        letter-spacing: 1px;
                    }
                    .timer { 
                        font-size: 42px; 
                        font-weight: 800; 
                        color: #856404; 
                        font-family: 'Outfit', sans-serif;
                    }
                    .btn-home { 
                        display: inline-flex;
                        align-items: center;
                        gap: 10px;
                        padding: 14px 28px; 
                        background: var(--primary); 
                        color: white; 
                        text-decoration: none; 
                        border-radius: 12px; 
                        font-weight: 600; 
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 6px -1px rgba(13, 110, 253, 0.2);
                    }
                    .btn-home:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 10px 15px -3px rgba(13, 110, 253, 0.3);
                        background: #0b5ed7;
                    }
                    .footer-text { font-size: 13px; margin-top: 35px; color: #94a3b8; }
                </style>
            </head>
            <body>
                <div class="background-glow"></div>
                <div class="card">
                    <div class="icon-wrapper">
                        <i class="bi bi-shield-lock-fill icon"></i>
                    </div>
                    <h1>Verificación de Seguridad</h1>
                    <p>Hemos detectado una actividad inusual desde tu conexión. Por seguridad de la plataforma, el acceso se ha pausado temporalmente.</p>
                    
                    <div class="timer-container">
                        <span class="timer-label">Podrás reintentar en</span>
                        <div class="timer" id="timer">01:00</div>
                    </div>

                    <a href="/promocion/detalle" class="btn-home">
                        <i class="bi bi-arrow-clockwise"></i> Reintentar ahora
                    </a>
                    
                    <div class="footer-text">
                        Esta medida protege tus datos y previene el acceso no autorizado de bots.
                    </div>
                </div>

                <script>
                    let seconds = 60;
                    const display = document.getElementById('timer');
                    const interval = setInterval(() => {
                        if (seconds > 0) {
                            seconds--;
                            const mins = Math.floor(seconds / 60);
                            const secs = seconds % 60;
                            display.innerText = \`\${mins.toString().padStart(2, '0')}:\${secs.toString().padStart(2, '0')}\`;
                        } else {
                            clearInterval(interval);
                            window.location.reload();
                        }
                    }, 1000);
                </script>
            </body>
            </html>
        `);
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