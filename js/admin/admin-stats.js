/**
 * HEMA SEWING — Estadísticas Avanzadas (Sprint 4 — Fase 2.12)
 * Usa Chart.js (cargado via CDN en admin.html)
 */

let graficosInstanciados = {};

// ==================== CARGA PRINCIPAL ====================

async function cargarEstadisticasAvanzadas() {
    const token = sessionStorage.getItem('admin_token');
    const wrapper = document.getElementById('stats-content');
    wrapper.innerHTML = '<p class="catalog-loading">Calculando estadísticas...</p>';

    try {
        const res = await fetch(
            `${URL_WEB_APP_EXCEL}?action=getStatsAvanzadas&token=${encodeURIComponent(token)}`
        );
        const data = await res.json();

        if (data.error) {
            mostrarToast(data.error, 'error');
            return;
        }

        renderizarEstadisticas(data);

    } catch (e) {
        console.error(e);
        wrapper.innerHTML = '<p class="catalog-loading error-txt">Error al cargar estadísticas.</p>';
    }
}

// ==================== RENDERIZADO ====================

function renderizarEstadisticas(data) {
    const wrapper = document.getElementById('stats-content');

    wrapper.innerHTML = `
        <!-- Fila 1: KPI Cards -->
        <div class="stats-kpi-row">
            <div class="kpi-card">
                <span class="kpi-icon">📦</span>
                <span class="kpi-value">${data.totalPedidos}</span>
                <span class="kpi-label">Pedidos Totales</span>
            </div>
            <div class="kpi-card kpi-green">
                <span class="kpi-icon">✅</span>
                <span class="kpi-value">${data.pedidosEntregados}</span>
                <span class="kpi-label">Entregados</span>
            </div>
            <div class="kpi-card kpi-amber">
                <span class="kpi-icon">⏳</span>
                <span class="kpi-value">${data.pedidosPendientes}</span>
                <span class="kpi-label">Pendientes</span>
            </div>
            <div class="kpi-card kpi-blue">
                <span class="kpi-icon">💰</span>
                <span class="kpi-value">$${Number(data.ventasTotal).toLocaleString('es-AR')}</span>
                <span class="kpi-label">Ventas Totales</span>
            </div>
            <div class="kpi-card kpi-purple">
                <span class="kpi-icon">📅</span>
                <span class="kpi-value">$${Number(data.ventasMes).toLocaleString('es-AR')}</span>
                <span class="kpi-label">Este Mes</span>
            </div>
            <div class="kpi-card kpi-rose">
                <span class="kpi-icon">🗓️</span>
                <span class="kpi-value">$${Number(data.ventasSemana).toLocaleString('es-AR')}</span>
                <span class="kpi-label">Esta Semana</span>
            </div>
        </div>

        <!-- Fila 2: Gráficos -->
        <div class="stats-charts-row">
            <!-- Gráfico: Pedidos por estado -->
            <div class="stats-chart-card">
                <h3>Pedidos por Estado</h3>
                <div class="chart-wrap">
                    <canvas id="chart-estados"></canvas>
                </div>
            </div>

            <!-- Gráfico: Top 5 productos -->
            <div class="stats-chart-card">
                <h3>Top 5 Productos Más Vendidos</h3>
                <div class="chart-wrap">
                    <canvas id="chart-productos"></canvas>
                </div>
            </div>
        </div>

        <!-- Fila 3: Ventas por período + Categorías -->
        <div class="stats-charts-row">
            <div class="stats-chart-card">
                <h3>Ventas por Período</h3>
                <div class="chart-wrap">
                    <canvas id="chart-ventas"></canvas>
                </div>
            </div>
            <div class="stats-chart-card">
                <h3>Ventas por Categoría</h3>
                <div class="chart-wrap">
                    <canvas id="chart-categorias"></canvas>
                </div>
            </div>
        </div>
    `;

    // Destruir instancias previas para evitar conflictos al recargar
    Object.values(graficosInstanciados).forEach(g => g.destroy());
    graficosInstanciados = {};

    // Renderizar gráficos con un pequeño delay para que el DOM esté listo
    requestAnimationFrame(() => {
        renderGraficoEstados(data.estados);
        renderGraficoProductos(data.topProductos);
        renderGraficoVentas(data.ventasPorPeriodo);
        renderGraficoCategorias(data.ventasPorCategoria);
    });
}

// ── Gráfico Donut: Estados ──────────────────────────────────

function renderGraficoEstados(estados) {
    const ctx = document.getElementById('chart-estados');
    if (!ctx) return;

    graficosInstanciados['estados'] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pendiente', 'En Proceso', 'Terminado', 'Enviado', 'Entregado'],
            datasets: [{
                data: [
                    estados.pendiente || 0,
                    estados.enProceso || 0,
                    estados.terminado || 0,
                    estados.enviado   || 0,
                    estados.entregado || 0,
                ],
                backgroundColor: ['#f59e0b','#3b82f6','#22c55e','#8b5cf6','#a0816c'],
                borderWidth: 2,
                borderColor: '#fff',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom', labels: { font: { family: 'Outfit' }, padding: 14 } }
            }
        }
    });
}

// ── Gráfico Barras Horizontal: Top productos ────────────────

function renderGraficoProductos(productos) {
    const ctx = document.getElementById('chart-productos');
    if (!ctx || !productos?.length) return;

    graficosInstanciados['productos'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: productos.map(p => p.nombre),
            datasets: [{
                label: 'Unidades vendidas',
                data: productos.map(p => p.cantidad),
                backgroundColor: 'rgba(160,129,108,0.7)',
                borderColor: '#a0816c',
                borderWidth: 1,
                borderRadius: 6,
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { font: { family: 'Outfit' } }, grid: { color: '#f0ece8' } },
                y: { ticks: { font: { family: 'Outfit', size: 12 } } }
            }
        }
    });
}

// ── Gráfico Línea: Ventas por período ──────────────────────

function renderGraficoVentas(ventasPeriodo) {
    const ctx = document.getElementById('chart-ventas');
    if (!ctx || !ventasPeriodo?.length) return;

    graficosInstanciados['ventas'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ventasPeriodo.map(v => v.periodo),
            datasets: [{
                label: 'Ventas ($)',
                data: ventasPeriodo.map(v => v.total),
                borderColor: '#a0816c',
                backgroundColor: 'rgba(160,129,108,0.08)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#a0816c',
                pointRadius: 5,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { font: { family: 'Outfit' } } },
                y: {
                    ticks: {
                        font: { family: 'Outfit' },
                        callback: v => '$' + Number(v).toLocaleString('es-AR')
                    },
                    grid: { color: '#f0ece8' }
                }
            }
        }
    });
}

// ── Gráfico Pie: Ventas por categoría ──────────────────────

function renderGraficoCategorias(categorias) {
    const ctx = document.getElementById('chart-categorias');
    if (!ctx || !categorias?.length) return;

    const palette = ['#a0816c','#c4a882','#e8cdb4','#8c6d59','#d4b896','#6b5244','#f0deca'];

    graficosInstanciados['categorias'] = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: categorias.map(c => c.categoria),
            datasets: [{
                data: categorias.map(c => c.total),
                backgroundColor: palette,
                borderWidth: 2,
                borderColor: '#fff',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom', labels: { font: { family: 'Outfit' }, padding: 14 } },
                tooltip: {
                    callbacks: {
                        label: ctx => ` $${Number(ctx.parsed).toLocaleString('es-AR')}`
                    }
                }
            }
        }
    });
}
