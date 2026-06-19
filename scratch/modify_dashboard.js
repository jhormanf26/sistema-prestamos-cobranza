const fs = require('fs');

const dashboardPath = 'views/portal-cliente/dashboard.ejs';
if (fs.existsSync(dashboardPath)) {
    let content = fs.readFileSync(dashboardPath, 'utf8');

    // 1. Modificar el HTML del desglose de score (Ahorros Activos -> Saldo y Consistencia, y balancear el resto)
    const targetHtml = /<div class="col-6 d-flex justify-content-between border-bottom pb-1 mb-1 align-items-center">\s*<span class="text-muted">\s*Ahorros Activos:[\s\S]*?<\/div>\s*<\/div>/;
    
    const newHtml = `<div class="col-6 d-flex justify-content-between border-bottom pb-1 mb-1 align-items-center">
                                                             <span class="text-muted">
                                                                 Saldo de Ahorro:
                                                                 <i class="bi bi-info-circle text-muted ms-1" style="cursor: pointer; font-size: 0.8rem;" onclick="explicarRegla('ahorros')" title="Saber más"></i>
                                                             </span>
                                                             <span class="fw-bold text-success" id="desgloseAhorrosSaldo">+<%= scoreData.desglose.ahorrosSaldo || 0 %> pts</span>
                                                         </div>
                                                         <div class="col-6 d-flex justify-content-between border-bottom pb-1 mb-1 ps-md-3 align-items-center">
                                                             <span class="text-muted">
                                                                 Consistencia de Ahorro:
                                                                 <i class="bi bi-info-circle text-muted ms-1" style="cursor: pointer; font-size: 0.8rem;" onclick="explicarRegla('ahorros')" title="Saber más"></i>
                                                             </span>
                                                             <span class="fw-bold text-success" id="desgloseAhorrosConsistencia">+<%= scoreData.desglose.ahorrosConsistencia || 0 %> pts</span>
                                                         </div>
                                                         <div class="col-6 d-flex justify-content-between border-bottom pb-1 mb-1 align-items-center">
                                                             <span class="text-muted">
                                                                 Antigüedad Cuenta:
                                                                 <i class="bi bi-info-circle text-muted ms-1" style="cursor: pointer; font-size: 0.8rem;" onclick="explicarRegla('antiguedad')" title="Saber más"></i>
                                                             </span>
                                                             <span class="fw-bold text-success" id="desgloseAntiguedad">+<%= scoreData.desglose.antiguedad %> pts</span>
                                                         </div>
                                                         <div class="col-6 d-flex justify-content-between border-bottom pb-1 mb-1 ps-md-3 align-items-center">
                                                             <span class="text-muted">
                                                                 Préstamos Vencidos:
                                                                 <i class="bi bi-info-circle text-muted ms-1" style="cursor: pointer; font-size: 0.8rem;" onclick="explicarRegla('vencidos')" title="Saber más"></i>
                                                             </span>
                                                             <span class="fw-bold <%= scoreData.desglose.prestamosVencidos < 0 ? 'text-danger' : 'text-muted' %>" id="desgloseVencidos"><%= scoreData.desglose.prestamosVencidos %> pts</span>
                                                         </div>
                                                         <div class="col-6 d-flex justify-content-between border-bottom pb-1 mb-1 align-items-center">
                                                             <span class="text-muted">
                                                                 Cuotas Vencidas:
                                                                 <i class="bi bi-info-circle text-muted ms-1" style="cursor: pointer; font-size: 0.8rem;" onclick="explicarRegla('cuotas')" title="Saber más"></i>
                                                             </span>
                                                             <span class="fw-bold <%= scoreData.desglose.cuotasVencidas < 0 ? 'text-danger' : 'text-muted' %> d-inline-flex align-items-center">
                                                                 <span id="desgloseCuotas"><%= scoreData.desglose.cuotasVencidas %> pts</span>
                                                                 <button type="button" class="btn btn-sm btn-link text-danger p-0 ms-1" onclick="auditarCuotasVencidas()" title="Auditar cuotas vencidas" style="font-size: 0.85rem;"><i class="bi bi-eye-fill"></i></button>
                                                             </span>
                                                         </div>
                                                         <div class="col-6 d-flex justify-content-between border-bottom pb-1 mb-1 ps-md-3 align-items-center">
                                                             <span class="text-muted">
                                                                 Comportamiento Pago:
                                                                 <i class="bi bi-info-circle text-muted ms-1" style="cursor: pointer; font-size: 0.8rem;" onclick="explicarRegla('comportamiento')" title="Saber más"></i>
                                                             </span>
                                                             <span class="fw-bold <%= scoreData.desglose.comportamientoPago < 0 ? 'text-danger' : (scoreData.desglose.comportamientoPago > 0 ? 'text-success' : 'text-muted') %> d-inline-flex align-items-center">
                                                                 <span id="desgloseComportamiento"><%= scoreData.desglose.comportamientoPago > 0 ? '+' : '' %><%= scoreData.desglose.comportamientoPago %> pts</span>
                                                                 <button type="button" class="btn btn-sm btn-link text-success p-0 ms-1" onclick="auditarComportamientoPago()" title="Auditar comportamiento de pago" style="font-size: 0.85rem;"><i class="bi bi-eye-fill"></i></button>
                                                             </span>
                                                         </div>
                                                         <div class="col-6 d-flex justify-content-between border-bottom pb-1 mb-1 align-items-center">
                                                             <span class="text-muted">
                                                                 Reincidencia Mora:
                                                                 <i class="bi bi-info-circle text-muted ms-1" style="cursor: pointer; font-size: 0.8rem;" onclick="explicarRegla('reincidencia')" title="Saber más"></i>
                                                             </span>
                                                             <span class="fw-bold <%= (scoreData.desglose.reincidenciaMora || 0) < 0 ? 'text-danger' : 'text-muted' %>" id="desgloseReincidencia"><%= scoreData.desglose.reincidenciaMora || 0 %> pts</span>
                                                         </div>`;

    if (content.match(targetHtml)) {
        content = content.replace(targetHtml, newHtml);
        console.log('1. HTML de desglose de score modificado con éxito.');
    } else {
        console.error('ERROR: No se encontró la sección HTML de Ahorros Activos en desglose de score.');
    }

    // 2. Modificar el JS de recalcularScore
    const targetJs = /document\.getElementById\('desgloseAhorros'\)\.textContent\s*=\s*`\+\${sd\.desglose\.ahorros} pts`;/;
    const newJs = `document.getElementById('desgloseAhorrosSaldo').textContent = \`+\${sd.desglose.ahorrosSaldo || 0} pts\`;
                    document.getElementById('desgloseAhorrosConsistencia').textContent = \`+\${sd.desglose.ahorrosConsistencia || 0} pts\`;`;

    if (content.match(targetJs)) {
        content = content.replace(targetJs, newJs);
        console.log('2. Script JS de recálculo modificado con éxito.');
    } else {
        console.error('ERROR: No se encontró el texto JS de actualizacion de desgloseAhorros.');
    }

    // 3. Modificar la explicación del límite de saldo ahorrado (100 -> 70 puntos) en explicarRegla
    const targetExplicacion = /<li class="mb-2"><strong>Por Saldo Ahorrado:<\/strong> Se otorgan <strong>\+10 pts por cada \$100\.000 COP<\/strong> de saldo disponible, con un límite máximo de 100 puntos \(es decir, saldo de \$1\.000\.000 COP o superior\)\.<\/li>/;
    const newExplicacion = `<li class="mb-2"><strong>Por Saldo Ahorrado:</strong> Se otorgan <strong>+10 pts por cada $100.000 COP</strong> de saldo disponible, con un límite máximo de 70 puntos (es decir, saldo de $700.000 COP o superior).</li>`;

    if (content.match(targetExplicacion)) {
        content = content.replace(targetExplicacion, newExplicacion);
        console.log('3. Texto de explicación de la regla de saldo de ahorros modificado con éxito.');
    } else {
        console.error('ERROR: No se encontró el texto original de explicación de saldo ahorrado en explicarRegla.');
    }

    fs.writeFileSync(dashboardPath, content, 'utf8');
    console.log('Proceso completado. dashboard.ejs guardado.');
} else {
    console.error('ERROR: No se encontró dashboard.ejs en views/portal-cliente/');
}
