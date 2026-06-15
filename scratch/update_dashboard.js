const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../views/portal-cliente/dashboard.ejs');
let content = fs.readFileSync(targetFile, 'utf8');

console.log('🔄 Cargando archivo: dashboard.ejs...');

// 1. Modificar el bloque de desglose colapsable en el HTML
const matchHtml = content.match(/<div class="collapse mt-2" id="collapseDesgloseScore">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/);
if (!matchHtml) {
    console.error('❌ Error: No se encontró el bloque HTML del desglose en dashboard.ejs.');
    process.exit(1);
}

const replacementHtml = `<div class="collapse mt-2" id="collapseDesgloseScore">
                                                <div class="card border-0 bg-white bg-opacity-60 rounded-3 p-3 shadow-sm">
                                                    <div class="row g-2 small text-dark">
                                                        <div class="col-6 d-flex justify-content-between border-bottom pb-1 mb-1 align-items-center">
                                                            <span class="text-muted">
                                                                Puntaje Base:
                                                                <i class="bi bi-info-circle text-muted ms-1" style="cursor: pointer; font-size: 0.8rem;" onclick="explicarRegla('base')" title="Saber más"></i>
                                                            </span>
                                                            <span class="fw-bold text-dark">500 pts</span>
                                                        </div>
                                                        <div class="col-6 d-flex justify-content-between border-bottom pb-1 mb-1 ps-md-3 align-items-center">
                                                            <span class="text-muted">
                                                                Pagos a Tiempo:
                                                                <i class="bi bi-info-circle text-muted ms-1" style="cursor: pointer; font-size: 0.8rem;" onclick="explicarRegla('pagos')" title="Saber más"></i>
                                                            </span>
                                                            <span class="fw-bold text-success d-inline-flex align-items-center">
                                                                <span id="desglosePagos">+<%= scoreData.desglose.pagadosATiempo %> pts</span>
                                                                <button type="button" class="btn btn-sm btn-link text-success p-0 ms-1" onclick="auditarPagadosATiempo()" title="Auditar préstamos pagados a tiempo" style="font-size: 0.85rem;"><i class="bi bi-eye-fill"></i></button>
                                                            </span>
                                                        </div>
                                                        <div class="col-6 d-flex justify-content-between border-bottom pb-1 mb-1 align-items-center">
                                                            <span class="text-muted">
                                                                Ahorros Activos:
                                                                <i class="bi bi-info-circle text-muted ms-1" style="cursor: pointer; font-size: 0.8rem;" onclick="explicarRegla('ahorros')" title="Saber más"></i>
                                                            </span>
                                                            <span class="fw-bold text-success" id="desgloseAhorros">+<%= scoreData.desglose.ahorros %> pts</span>
                                                        </div>
                                                        <div class="col-6 d-flex justify-content-between border-bottom pb-1 mb-1 ps-md-3 align-items-center">
                                                            <span class="text-muted">
                                                                Antigüedad Cuenta:
                                                                <i class="bi bi-info-circle text-muted ms-1" style="cursor: pointer; font-size: 0.8rem;" onclick="explicarRegla('antiguedad')" title="Saber más"></i>
                                                            </span>
                                                            <span class="fw-bold text-success" id="desgloseAntiguedad">+<%= scoreData.desglose.antiguedad %> pts</span>
                                                        </div>
                                                        <div class="col-6 d-flex justify-content-between border-bottom pb-1 mb-1 align-items-center">
                                                            <span class="text-muted">
                                                                Préstamos Vencidos:
                                                                <i class="bi bi-info-circle text-muted ms-1" style="cursor: pointer; font-size: 0.8rem;" onclick="explicarRegla('vencidos')" title="Saber más"></i>
                                                            </span>
                                                            <span class="fw-bold <%= scoreData.desglose.prestamosVencidos < 0 ? 'text-danger' : 'text-muted' %>" id="desgloseVencidos"><%= scoreData.desglose.prestamosVencidos %> pts</span>
                                                        </div>
                                                        <div class="col-6 d-flex justify-content-between border-bottom pb-1 mb-1 ps-md-3 align-items-center">
                                                            <span class="text-muted">
                                                                Cuotas Vencidas:
                                                                <i class="bi bi-info-circle text-muted ms-1" style="cursor: pointer; font-size: 0.8rem;" onclick="explicarRegla('cuotas')" title="Saber más"></i>
                                                            </span>
                                                            <span class="fw-bold <%= scoreData.desglose.cuotasVencidas < 0 ? 'text-danger' : 'text-muted' %> d-inline-flex align-items-center">
                                                                <span id="desgloseCuotas"><%= scoreData.desglose.cuotasVencidas %> pts</span>
                                                                <button type="button" class="btn btn-sm btn-link text-danger p-0 ms-1" onclick="auditarCuotasVencidas()" title="Auditar cuotas vencidas" style="font-size: 0.85rem;"><i class="bi bi-eye-fill"></i></button>
                                                            </span>
                                                        </div>
                                                        <div class="col-6 d-flex justify-content-between border-bottom pb-1 mb-1 align-items-center">
                                                            <span class="text-muted">
                                                                Comportamiento Pago:
                                                                <i class="bi bi-info-circle text-muted ms-1" style="cursor: pointer; font-size: 0.8rem;" onclick="explicarRegla('comportamiento')" title="Saber más"></i>
                                                            </span>
                                                            <span class="fw-bold <%= scoreData.desglose.comportamientoPago < 0 ? 'text-danger' : (scoreData.desglose.comportamientoPago > 0 ? 'text-success' : 'text-muted') %> d-inline-flex align-items-center">
                                                                <span id="desgloseComportamiento"><%= scoreData.desglose.comportamientoPago > 0 ? '+' : '' %><%= scoreData.desglose.comportamientoPago %> pts</span>
                                                                <button type="button" class="btn btn-sm btn-link text-success p-0 ms-1" onclick="auditarComportamientoPago()" title="Auditar comportamiento de pago" style="font-size: 0.85rem;"><i class="bi bi-eye-fill"></i></button>
                                                            </span>
                                                        </div>
                                                        <div class="col-6 d-flex justify-content-between border-bottom pb-1 mb-1 ps-md-3 align-items-center">
                                                            <span class="text-muted">
                                                                Reincidencia Mora:
                                                                <i class="bi bi-info-circle text-muted ms-1" style="cursor: pointer; font-size: 0.8rem;" onclick="explicarRegla('reincidencia')" title="Saber más"></i>
                                                            </span>
                                                            <span class="fw-bold <%= (scoreData.desglose.reincidenciaMora || 0) < 0 ? 'text-danger' : 'text-muted' %>" id="desgloseReincidencia"><%= scoreData.desglose.reincidenciaMora || 0 %> pts</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>`;

content = content.replace(matchHtml[0], replacementHtml);

// 2. Modificar el inicio de la función recalcularScore para declarar la variable de auditoría
const scriptStartPattern = /<script>\s*async\s+function\s+recalcularScore\s*\(\s*\)\s*\{/;
const matchScriptStart = content.match(scriptStartPattern);

if (!matchScriptStart) {
    console.error('❌ Error: No se encontró el inicio de la función recalcularScore en dashboard.ejs.');
    process.exit(1);
}

const replacementScriptStart = `<script>
        // Guardar los detalles del score inicial para la auditoría interactiva
        window.scoreDataAuditoria = <%- JSON.stringify(scoreData) %>;

        async function recalcularScore() {`;

content = content.replace(scriptStartPattern, replacementScriptStart);

// 3. Modificar el desglose dinámico de la función recalcularScore para actualizar los nuevos campos
const desgloseUpdatePattern = /\/\/\s*Actualizar desglose de puntos[\s\S]*?dCuotas\.className\s*=\s*`[^`]*`;/;
const matchDesgloseUpdate = content.match(desgloseUpdatePattern);

if (!matchDesgloseUpdate) {
    console.error('❌ Error: No se encontró la lógica de actualización del desglose en recalcularScore.');
    process.exit(1);
}

const replacementDesgloseUpdate = `// Actualizar variable global de auditoría con la respuesta más reciente
                    window.scoreDataAuditoria = sd;

                    // Actualizar desglose de puntos
                    document.getElementById('desglosePagos').textContent = \`+\${sd.desglose.pagadosATiempo} pts\`;
                    document.getElementById('desgloseAhorros').textContent = \`+\${sd.desglose.ahorros} pts\`;
                    document.getElementById('desgloseAntiguedad').textContent = \`+\${sd.desglose.antiguedad} pts\`;
                    
                    const dVencidos = document.getElementById('desgloseVencidos');
                    dVencidos.textContent = \`\${sd.desglose.prestamosVencidos} pts\`;
                    dVencidos.className = \`fw-bold \${sd.desglose.prestamosVencidos < 0 ? 'text-danger' : 'text-muted'}\`;

                    const dCuotas = document.getElementById('desgloseCuotas');
                    dCuotas.textContent = \`\${sd.desglose.cuotasVencidas} pts\`;
                    dCuotas.className = \`fw-bold \${sd.desglose.cuotasVencidas < 0 ? 'text-danger' : 'text-muted'}\`;

                    const dComportamiento = document.getElementById('desgloseComportamiento');
                    dComportamiento.textContent = \`\${sd.desglose.comportamientoPago > 0 ? '+' : ''}\${sd.desglose.comportamientoPago} pts\`;
                    dComportamiento.parentElement.className = \`fw-bold \${sd.desglose.comportamientoPago < 0 ? 'text-danger' : (sd.desglose.comportamientoPago > 0 ? 'text-success' : 'text-muted')} d-inline-flex align-items-center\`;

                    const dReincidencia = document.getElementById('desgloseReincidencia');
                    dReincidencia.textContent = \`\${sd.desglose.reincidenciaMora} pts\`;
                    dReincidencia.className = \`fw-bold \${sd.desglose.reincidenciaMora < 0 ? 'text-danger' : 'text-muted'}\`;`;

content = content.replace(matchDesgloseUpdate[0], replacementDesgloseUpdate);

// 4. Agregar funciones auxiliares de explicación de reglas y auditorías antes de mostrarAyudaScore
const helpStartPattern = /function\s+mostrarAyudaScore\s*\(\s*\)\s*\{/;
const matchHelpStart = content.match(helpStartPattern);

if (!matchHelpStart) {
    console.error('❌ Error: No se encontró mostrarAyudaScore en dashboard.ejs.');
    process.exit(1);
}

const helperFunctions = `function explicarRegla(regla) {
            let titulo = '';
            let html = '';

            switch (regla) {
                case 'base':
                    titulo = 'Puntaje Base del Sistema';
                    html = \`
                        <div class="text-start small text-muted">
                            <p>El sistema asigna un **puntaje inicial de 500 puntos** a todos los clientes.</p>
                            <p>Este puntaje actúa como el punto de partida neutral a partir del cual se suman recompensas por buen comportamiento o se restan penalizaciones por mora.</p>
                            <hr>
                            <div class="p-2 bg-light rounded-3">
                                <span class="fw-bold text-dark">Fórmula:</span> Puntaje Base = 500 pts
                            </div>
                        </div>
                    \`;
                    break;
                case 'pagos':
                    titulo = 'Préstamos Pagados a Tiempo';
                    html = \`
                        <div class="text-start small text-muted">
                            <p>Premia la liquidación completa de créditos sin haber incurrido en mora al finalizar el préstamo. Los puntos se otorgan según el monto prestado:</p>
                            <ul>
                                <li><strong>Microcréditos (&lt; $200.000):</strong> +50 pts c/u</li>
                                <li><strong>Créditos Medianos ($200.000 a $1.000.000):</strong> +100 pts c/u</li>
                                <li><strong>Créditos Grandes (&gt; $1.000.000):</strong> +150 pts c/u</li>
                            </ul>
                            <p>El puntaje obtenido se pondera con un <strong>factor de recencia</strong> basado en la antigüedad del último pago del préstamo liquidado:</p>
                            <ul>
                                <li><strong>Últimos 3 meses:</strong> Multiplicador 1.0 (100% de los puntos)</li>
                                <li><strong>Entre 3 y 6 meses:</strong> Multiplicador 0.7 (70% de los puntos)</li>
                                <li><strong>Más de 6 meses:</strong> Multiplicador 0.4 (40% de los puntos)</li>
                            </ul>
                            <p class="mb-0">El tope máximo acumulable en esta regla es de <strong>300 puntos</strong>.</p>
                        </div>
                    \`;
                    break;
                case 'ahorros':
                    titulo = 'Saldo e Historial de Ahorros';
                    html = \`
                        <div class="text-start small text-muted">
                            <p>Evalúa tanto el respaldo de capital como la consistencia en el hábito de ahorro:</p>
                            <ol class="ps-3">
                                <li class="mb-2"><strong>Por Saldo Ahorrado:</strong> Se otorgan <strong>+10 pts por cada $100.000 COP</strong> de saldo disponible, con un límite máximo de 100 puntos (es decir, saldo de $1.000.000 COP o superior).</li>
                                <li><strong>Por Consistencia de Depósito:</strong> Se premia con <strong>+10 pts por cada depósito de $10.000 COP o más</strong> realizado en los últimos 90 días, con un límite de hasta +30 puntos adicionales.</li>
                            </ol>
                            <p>El tope total acumulable combinando saldo y consistencia es de <strong>100 puntos</strong>.</p>
                            <div class="alert alert-warning border-0 p-2 rounded-3 small mt-2 mb-0">
                                <i class="bi bi-exclamation-triangle me-1"></i> <strong>Regla Limitante:</strong> Si el saldo en ahorros es inferior a $500.000 COP (o no tiene cuenta activa), el Score máximo final del cliente estará limitado a <strong>850 puntos</strong> (impidiendo alcanzar la Categoría A - Excelente).
                            </div>
                        </div>
                    \`;
                    break;
                case 'antiguedad':
                    titulo = 'Antigüedad de la Cuenta';
                    html = \`
                        <div class="text-start small text-muted">
                            <p>Premia la lealtad y el tiempo de permanencia del cliente en el sistema desde su registro inicial.</p>
                            <p>Si el cliente tiene una antigüedad en el sistema <strong>mayor a 6 meses</strong> (calculado con exactitud en días), recibe una bonificación única de <strong>+50 puntos</strong> en su score.</p>
                        </div>
                    \`;
                    break;
                case 'vencidos':
                    titulo = 'Préstamos Vencidos';
                    html = \`
                        <div class="text-start small text-muted">
                            <p>Penaliza gravemente tener créditos actualmente en estado de vencimiento.</p>
                            <p>Cada préstamo activo cuyo plazo final haya expirado y no se encuentre completamente pagado resta <strong>-200 puntos</strong> de forma directa.</p>
                            <p class="text-danger fw-bold mb-0">Esta penalización no tiene límite o tope máximo.</p>
                        </div>
                    \`;
                    break;
                case 'cuotas':
                    titulo = 'Cuotas Activas Vencidas';
                    html = \`
                        <div class="text-start small text-muted">
                            <p>Afecta el puntaje por cada cuota de préstamo activa que haya superado su fecha límite de pago:</p>
                            <ul>
                                <li><strong>Mora menor a 30 días:</strong> Penalización de <strong>-50 puntos</strong> por cada cuota vencida.</li>
                                <li><strong>Mora mayor o igual a 30 días:</strong> Penalización de <strong>-100 puntos</strong> por cada cuota vencida.</li>
                            </ul>
                            <p class="text-danger fw-bold mb-0">Estas penalizaciones se acumulan por cada cuota individual vencida y no tienen tope máximo.</p>
                        </div>
                    \`;
                    break;
                case 'comportamiento':
                    titulo = 'Comportamiento de Pago';
                    html = \`
                        <div class="text-start small text-muted">
                            <p>Evalúa el comportamiento diario de pago del cliente analizando la anticipación o demora en cada una de sus cuotas históricas ya saldadas:</p>
                            <ul>
                                <li><strong>Días de anticipación:</strong> Suma <strong>+1 punto por cada día</strong> que se pague antes de la fecha de vencimiento (máximo +10 puntos por cuota, con un límite acumulado de +50 puntos en total de recompensa).</li>
                                <li><strong>Días de demora:</strong> Resta <strong>-2 puntos por cada día</strong> transcurrido desde el vencimiento hasta el momento del pago efectivo de la cuota (resta de forma directa e ilimitada).</li>
                            </ul>
                        </div>
                    \`;
                    break;
                case 'reincidencia':
                    titulo = 'Reincidencia en Moras';
                    html = \`
                        <div class="text-start small text-muted">
                            <p>Penaliza el hábito recurrente de realizar pagos tardíos, midiendo el número total de cuotas pagadas con demora (1 o más días de retraso) a lo largo de todo el historial:</p>
                            <ul>
                                <li><strong>De 3 a 5 cuotas tardías en total:</strong> Penalización de <strong>-50 puntos</strong>.</li>
                                <li><strong>6 o más cuotas tardías en total:</strong> Penalización de <strong>-100 puntos</strong>.</li>
                            </ul>
                            <p class="mb-0">Los retrasos ocasionales (1 o 2 cuotas tardías) no aplican penalización por reincidencia.</p>
                        </div>
                    \`;
                    break;
                default:
                    titulo = 'Detalle de Regla';
                    html = '<p class="text-muted small">No hay información detallada disponible para esta variable.</p>';
            }

            Swal.fire({
                title: titulo,
                html: html,
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#10b981',
                customClass: {
                    popup: 'rounded-4'
                }
            });
        }

        function auditarPagadosATiempo() {
            const det = window.scoreDataAuditoria.detalles.prestamosPagadosATiempoDetalle || [];
            if (det.length === 0) {
                Swal.fire({
                    icon: 'info',
                    title: 'Sin Registros',
                    text: 'No tienes préstamos finalizados y pagados a tiempo registrados.',
                    confirmButtonColor: '#10b981'
                });
                return;
            }

            const esMovil = window.innerWidth < 768;
            let html = '';

            if (esMovil) {
                html = \`<div class="text-start d-flex flex-column gap-2" style="max-height: 400px; overflow-y: auto; padding: 2px;">\`;
                det.forEach(item => {
                    const fFin = new Date(item.fechaFin).toLocaleDateString('es-CO');
                    const fPago = new Date(item.fechaUltimoPago).toLocaleDateString('es-CO');
                    const badgeClass = item.pagadoATiempo ? 'bg-success' : 'bg-secondary';
                    const pts = item.puntosNetos !== undefined ? item.puntosNetos : 100;
                    const badgeText = item.pagadoATiempo ? \`+\${pts} pts\` : '+0 pts (Tardío)';
                    html += \`
                        <div class="card border p-3 rounded-4 bg-white shadow-sm">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="fw-bold text-dark">Préstamo #\${item.id}</span>
                                <span class="badge \${badgeClass} text-white">\${badgeText}</span>
                            </div>
                            <div class="d-flex justify-content-between text-muted mb-1" style="font-size: 0.75rem;">
                                <span>Monto: $\${item.monto.toLocaleString('es-CO')}</span>
                                <span>Límite: \${fFin}</span>
                            </div>
                            <div class="text-muted" style="font-size: 0.75rem;">
                                Último Pago: <span class="fw-semibold text-dark">\${fPago}</span>
                            </div>
                        </div>
                    \`;
                });
                html += \`</div>\`;
            } else {
                html = \`
                    <div class="table-responsive text-start small">
                        <table class="table table-sm table-bordered align-middle text-nowrap">
                            <thead class="table-light">
                                <tr>
                                    <th>Préstamo</th>
                                    <th>Monto</th>
                                    <th>Fecha Límite</th>
                                    <th>Último Pago</th>
                                    <th>Puntos</th>
                                </tr>
                            </thead>
                            <tbody>
                \`;

                det.forEach(item => {
                    const fFin = new Date(item.fechaFin).toLocaleDateString('es-CO');
                    const fPago = new Date(item.fechaUltimoPago).toLocaleDateString('es-CO');
                    const badgeClass = item.pagadoATiempo ? 'bg-success' : 'bg-secondary';
                    const pts = item.puntosNetos !== undefined ? item.puntosNetos : 100;
                    const badgeText = item.pagadoATiempo ? \`+\${pts} pts\` : '+0 pts (Tardío)';
                    html += \`
                        <tr>
                            <td><strong>#\${item.id}</strong></td>
                            <td>$\${item.monto.toLocaleString('es-CO')}</td>
                            <td>\${fFin}</td>
                            <td>\${fPago}</td>
                            <td><span class="badge \${badgeClass} text-white">\${badgeText}</span></td>
                        </tr>
                    \`;
                });

                html += \`
                            </tbody>
                        </table>
                    </div>
                \`;
            }

            Swal.fire({
                title: 'Auditoría: Préstamos Pagados a Tiempo',
                html: html,
                confirmButtonText: 'Cerrar',
                confirmButtonColor: '#6c757d',
                width: esMovil ? '95%' : '720px',
                customClass: {
                    popup: 'rounded-4'
                }
            });
        }

        function auditarCuotasVencidas() {
            const det = window.scoreDataAuditoria.detalles.cuotasVencidasDetalle || [];
            if (det.length === 0) {
                Swal.fire({
                    icon: 'success',
                    title: 'Al Día',
                    text: 'No tienes cuotas vencidas e impagadas actualmente.',
                    confirmButtonColor: '#10b981'
                });
                return;
            }

            const esMovil = window.innerWidth < 768;
            let html = '';

            if (esMovil) {
                html = \`<div class="text-start d-flex flex-column gap-2" style="max-height: 400px; overflow-y: auto; padding: 2px;">\`;
                det.forEach(item => {
                    const fVenc = new Date(item.fechaVencimiento).toLocaleDateString('es-CO');
                    html += \`
                        <div class="card border border-danger border-opacity-10 p-3 rounded-4 bg-white shadow-sm">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="fw-bold text-dark">#\${item.prestamoId} - Cuota \${item.numeroCuota}</span>
                                <span class="badge bg-danger text-white">-\${item.puntosPenalizacion} pts</span>
                            </div>
                            <div class="d-flex justify-content-between text-muted mb-1" style="font-size: 0.75rem;">
                                <span>Monto: $\${item.monto.toLocaleString('es-CO')}</span>
                                <span>Vence: \${fVenc}</span>
                            </div>
                            <div class="text-danger fw-bold" style="font-size: 0.75rem;">
                                Mora: \${item.diasMora} días
                            </div>
                        </div>
                    \`;
                });
                html += \`</div>\`;
            } else {
                html = \`
                    <div class="table-responsive text-start small">
                        <table class="table table-striped table-hover align-middle mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>Préstamo</th>
                                    <th class="text-center">Cuota</th>
                                    <th>Monto</th>
                                    <th>Vencimiento</th>
                                    <th>Días Mora</th>
                                    <th>Penalización</th>
                                </tr>
                            </thead>
                            <tbody>
                \`;

                det.forEach(item => {
                    const fVenc = new Date(item.fechaVencimiento).toLocaleDateString('es-CO');
                    html += \`
                        <tr>
                            <td><strong>#\${item.prestamoId}</strong></td>
                            <td class="text-center">\${item.numeroCuota}</td>
                            <td>$\${item.monto.toLocaleString('es-CO')}</td>
                            <td>\${fVenc}</td>
                            <td class="text-danger fw-bold">\${item.diasMora} días</td>
                            <td><span class="badge bg-danger text-white">-\${item.puntosPenalizacion} pts</span></td>
                        </tr>
                    \`;
                });

                html += \`
                            </tbody>
                        </table>
                    </div>
                \`;
            }

            Swal.fire({
                title: 'Auditoría: Cuotas Vencidas',
                html: html,
                confirmButtonText: 'Cerrar',
                confirmButtonColor: '#6c757d',
                width: esMovil ? '95%' : '720px',
                customClass: {
                    popup: 'rounded-4'
                }
            });
        }

        function auditarComportamientoPago() {
            const det = window.scoreDataAuditoria.detalles.comportamientoPagoDetalle || [];
            if (det.length === 0) {
                Swal.fire({
                    icon: 'info',
                    title: 'Sin Registros',
                    text: 'No hay cuotas saldadas con anticipación o demora para auditar.',
                    confirmButtonColor: '#10b981'
                });
                return;
            }
            const totalFavor = det.filter(item => item.tipo === 'anticipacion').reduce((sum, item) => sum + item.puntos, 0);
            const totalContra = det.filter(item => item.tipo !== 'anticipacion').reduce((sum, item) => sum + item.puntos, 0);
            const netoPuntos = totalFavor + totalContra; // totalContra ya es negativo

            const esMovil = window.innerWidth < 768;
            const netoColor = netoPuntos > 0 ? 'success' : (netoPuntos < 0 ? 'danger' : 'secondary');
            const netoBorderColor = netoPuntos > 0 ? 'success' : (netoPuntos < 0 ? 'danger' : 'secondary');
            const netoPrefix = netoPuntos > 0 ? '+' : '';

            let html = \`
                <div class="alert alert-info text-start py-2 px-3 mb-3" style="font-size: 0.8rem; border-radius: 10px; background-color: rgba(13, 110, 253, 0.05); border-color: rgba(13, 110, 253, 0.15); color: #0a58ca;">
                    <i class="bi bi-info-circle-fill me-1"></i>
                    <strong>Regla de cálculo:</strong> Los días de anticipación otorgan +1 punto por día (máx. 10 pts por cuota). Los días de demora restan -2 puntos por día.
                </div>
                <div class="row g-2 mb-3 text-center">
                    <div class="col-4">
                        <div class="p-2 border border-success border-opacity-20 rounded-3 bg-success bg-opacity-10 text-success">
                            <div class="small fw-semibold" style="font-size: 0.7rem;">Puntos a Favor</div>
                            <div class="fs-5 fw-bold">+\${totalFavor} pts</div>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="p-2 border border-danger border-opacity-20 rounded-3 bg-danger bg-opacity-10 text-danger">
                            <div class="small fw-semibold" style="font-size: 0.7rem;">Puntos en Contra</div>
                            <div class="fs-5 fw-bold">\${totalContra} pts</div>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="p-2 border border-\${netoBorderColor} border-opacity-20 rounded-3 bg-\${netoColor} bg-opacity-10 text-\${netoColor}" style="position: relative;">
                            <div class="small fw-semibold" style="font-size: 0.7rem;">Resultado Neto</div>
                            <div class="fs-5 fw-bold">\${netoPrefix}\${netoPuntos} pts</div>
                            <span style="position: absolute; top: 4px; right: 6px; font-size: 0.6rem; opacity: 0.6;" title="Puntos a favor menos puntos en contra"><i class="bi bi-calculator"></i></span>
                        </div>
                    </div>
                </div>
            \`;

            if (esMovil) {
                html += \\\`<div class="text-start d-flex flex-column gap-2" style="max-height: 300px; overflow-y: auto; padding: 2px;">\\\`;
                det.forEach(item => {
                    const fVenc = new Date(item.fechaVencimiento).toLocaleDateString('es-CO');
                    const fPago = new Date(item.fechaPago).toLocaleDateString('es-CO');
                    const esAnticipado = item.tipo === 'anticipacion';
                    const badgeClass = esAnticipado ? 'bg-success' : 'bg-danger';
                    const pointsText = esAnticipado ? \\\`+\\\${item.puntos} pts\\\` : \\\`\\\${item.puntos} pts\\\`;
                    const labelTipo = esAnticipado ? 'Anticipación' : 'Demora';
                    html += \\\`
                        <div class="card border p-3 rounded-4 bg-white shadow-sm" style="border-left: 4px solid \\\${esAnticipado ? '#10b981' : '#ef4444'} !important;">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="fw-bold text-dark">#\\\${item.prestamoId} - Cuota \\\${item.numeroCuota}</span>
                                <span class="badge \\\${badgeClass} text-white">\\\${pointsText}</span>
                            </div>
                            <div class="d-flex justify-content-between text-muted mb-1" style="font-size: 0.75rem;">
                                <span>Vencía: \\\${fVenc}</span>
                                <span>Pagado: \\\${fPago}</span>
                            </div>
                            <div class="\\\${esAnticipado ? 'text-success' : 'text-danger'} fw-bold" style="font-size: 0.75rem;">
                                \\\${labelTipo}: \\\${item.diasDiferencia} días
                            </div>
                        </div>
                    \\\`;
                });
                html += \\\`</div>\\\`;
            } else {
                html += \\\`
                    <div style="max-height: 350px; overflow-y: auto;">
                        <div class="table-responsive text-start small">
                            <table class="table table-striped table-hover align-middle mb-0">
                                <thead class="table-light">
                                    <tr>
                                        <th>Préstamo</th>
                                        <th class="text-center">Cuota</th>
                                        <th>Vencimiento</th>
                                        <th>Fecha Pago</th>
                                        <th>Días Desvío</th>
                                        <th>Impacto</th>
                                    </tr>
                                </thead>
                                <tbody>
                \\\`;

                det.forEach(item => {
                    const fVenc = new Date(item.fechaVencimiento).toLocaleDateString('es-CO');
                    const fPago = new Date(item.fechaPago).toLocaleDateString('es-CO');
                    const esAnticipado = item.tipo === 'anticipacion';
                    const badgeClass = esAnticipado ? 'bg-success' : 'bg-danger';
                    const pointsText = esAnticipado ? \\\`+\\\${item.puntos} pts\\\` : \\\`\\\${item.puntos} pts\\\`;
                    const labelTipo = esAnticipado ? 'Anticipación' : 'Demora';
                    
                    html += \\\`
                        <tr>
                            <td><strong>#\\\${item.prestamoId}</strong></td>
                            <td class="text-center">\\\${item.numeroCuota}</td>
                            <td>\\\${fVenc}</td>
                            <td>\\\${fPago}</td>
                            <td class="\\\${esAnticipado ? 'text-success' : 'text-danger'} fw-bold">\\\${item.diasDiferencia} días (\\\${labelTipo})</td>
                            <td><span class="badge \\\${badgeClass} text-white">\\\${pointsText}</span></td>
                        </tr>
                    \\\`;
                });

                html += \\\`
                                </tbody>
                            </table>
                        </div>
                    </div>
                \\\`;
            }

            Swal.fire({
                title: 'Auditoría: Comportamiento de Pago',
                html: html,
                confirmButtonText: 'Cerrar',
                confirmButtonColor: '#6c757d',
                width: esMovil ? '95%' : '780px',
                customClass: {
                    popup: 'rounded-4'
                }
            });
        }

        function mostrarAyudaScore() {`;

content = content.replace(helpStartPattern, helperFunctions);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('✅ Reemplazos completados con éxito y guardados en dashboard.ejs.');
