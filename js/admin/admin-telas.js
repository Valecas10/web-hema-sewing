/**
 * HEMA SEWING — Gestión de Telas (Sprint 4 — Fase 2.11)
 * 
 * Columnas de la hoja "Telas":
 *   A: id | B: nombre | C: costo | D: imagen (Drive URL) | E: stock | F: activo
 */

let todasLasTelas = [];
let telaEditandoId = null;

// ==================== CARGA ====================

async function cargarAdminTelas() {
    const token = sessionStorage.getItem('admin_token');
    const grid = document.getElementById('telas-admin-grid');
    grid.innerHTML = '<p class="catalog-loading">Cargando telas...</p>';

    try {
        const res = await fetch(
            `${URL_WEB_APP_EXCEL}?action=getAdminTelas&token=${encodeURIComponent(token)}`
        );
        const data = await res.json();

        if (data.error) {
            mostrarToast(data.error, 'error');
            if (data.error.includes('No autorizado')) logoutAdmin();
            return;
        }

        todasLasTelas = data;
        renderizarAdminTelas(todasLasTelas);

    } catch (e) {
        console.error(e);
        grid.innerHTML = '<p class="catalog-loading error-txt">Error al cargar telas. Reintenta.</p>';
    }
}

// ==================== RENDERIZADO ====================

function renderizarAdminTelas(telas) {
    const grid = document.getElementById('telas-admin-grid');
    grid.innerHTML = '';

    if (!telas || telas.length === 0) {
        grid.innerHTML = '<p class="catalog-loading">No hay telas registradas aún.</p>';
        return;
    }

    telas.forEach(t => {
        const card = document.createElement('div');
        const estaActiva = !(t.activo === false || t.activo === 'false' || t.activo === 'FALSE');
        card.className = `product-card ${!estaActiva ? 'inactiva' : ''}`;

        const stockBajo = parseInt(t.stock) !== -1 && parseInt(t.stock) <= 3;
        const stockLabel = t.stock == -1 ? 'Ilimitado' : t.stock;

        card.innerHTML = `
            <div class="product-card-img-wrap">
                <img src="${t.imagen || 'assets/Logo.jpg'}" alt="${t.nombre}"
                    onerror="this.src='assets/Logo.jpg'">
                <span class="product-badge ${estaActiva ? 'badge-activo' : 'badge-inactivo'}">
                    ${estaActiva ? 'Activa' : 'Inactiva'}
                </span>
            </div>
            <div class="product-card-body">
                <span class="product-category">Tela</span>
                <h3 class="product-name">${t.nombre}</h3>
                <div class="product-meta">
                    <span class="product-price">$${Number(t.costo).toLocaleString('es-AR')}</span>
                    <span class="product-stock ${stockBajo ? 'stock-bajo' : ''}">
                        Stock: ${stockLabel}
                    </span>
                </div>
                <div class="product-stock-controls">
                    <label class="stock-label">Ajustar stock:</label>
                    <input
                        type="number"
                        min="-1"
                        class="stock-input"
                        value="${t.stock}"
                        data-id="${t.id}"
                        title="-1 = ilimitado"
                        onchange="confirmarActualizarStockTela('${t.id}', this)"
                    >
                </div>
                <div class="product-card-actions">
                    <button class="btn-card-edit" onclick="abrirModalTela('${t.id}')">✏️ Editar</button>
                    <button class="btn-card-toggle ${estaActiva ? 'btn-desactivar' : 'btn-activar'}"
                        onclick="toggleActivaTela('${t.id}', ${!estaActiva})">
                        ${estaActiva ? '🚫 Desactivar' : '✅ Activar'}
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// ==================== BUSCADOR ====================

function filtrarTelasAdmin() {
    const q = document.getElementById('telas-admin-search').value.toLowerCase().trim();
    const filtrados = todasLasTelas.filter(t =>
        !q || (t.nombre || '').toLowerCase().includes(q)
    );
    renderizarAdminTelas(filtrados);
}

// ==================== MODAL TELA ====================

function abrirModalTela(telaId) {
    telaEditandoId = telaId || null;
    const modal = document.getElementById('modal-tela');
    const titulo = document.getElementById('modal-tela-titulo');
    const form = document.getElementById('form-tela');
    form.reset();

    if (telaId) {
        const t = todasLasTelas.find(x => x.id === telaId);
        if (!t) return;
        titulo.innerText = 'Editar Tela';
        document.getElementById('tela-nombre').value = t.nombre || '';
        document.getElementById('tela-costo').value = t.costo || '';
        document.getElementById('tela-imagen').value = t.imagen || '';
        document.getElementById('tela-stock').value = t.stock ?? 0;
        document.getElementById('tela-activa').value =
            (t.activo === true || t.activo === 'true' || t.activo === 'TRUE') ? 'true' : 'false';
    } else {
        titulo.innerText = 'Nueva Tela';
        document.getElementById('tela-activa').value = 'true';
    }

    modal.classList.remove('oculto');
}

function cerrarModalTela() {
    document.getElementById('modal-tela').classList.add('oculto');
    telaEditandoId = null;
}

// ==================== GUARDAR TELA ====================

async function guardarTela() {
    const token = sessionStorage.getItem('admin_token');
    const btn = document.getElementById('btn-guardar-tela');

    const nombre = document.getElementById('tela-nombre').value.trim();
    const costo = document.getElementById('tela-costo').value.trim();
    if (!nombre || !costo) {
        mostrarToast('Nombre y costo son obligatorios', 'error');
        return;
    }

    const payload = {
        action: telaEditandoId ? 'updateTela' : 'createTela',
        token,
        id: telaEditandoId || '',
        nombre,
        costo: parseFloat(costo),
        imagen: document.getElementById('tela-imagen').value.trim(),
        stock: parseInt(document.getElementById('tela-stock').value) ?? 0,
        activo: document.getElementById('tela-activa').value,
    };

    btn.disabled = true;
    btn.innerText = 'Guardando...';

    try {
        const res = await fetch(URL_WEB_APP_EXCEL, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (data.success) {
            mostrarToast(telaEditandoId ? 'Tela actualizada ✓' : 'Tela creada ✓', 'success');
            cerrarModalTela();
            cargarAdminTelas();
        } else {
            mostrarToast(data.error || 'Error al guardar', 'error');
        }
    } catch (e) {
        mostrarToast('Error de conexión', 'error');
    } finally {
        btn.disabled = false;
        btn.innerText = 'Guardar';
    }
}

// ==================== STOCK TELAS ====================

async function confirmarActualizarStockTela(telaId, inputEl) {
    const nuevoStock = parseInt(inputEl.value);
    if (isNaN(nuevoStock) || nuevoStock < -1) {
        mostrarToast('Stock debe ser ≥ -1 (-1 = ilimitado)', 'error');
        inputEl.value = todasLasTelas.find(t => t.id === telaId)?.stock ?? 0;
        return;
    }

    const token = sessionStorage.getItem('admin_token');
    inputEl.disabled = true;

    try {
        const res = await fetch(URL_WEB_APP_EXCEL, {
            method: 'POST',
            body: JSON.stringify({ action: 'updateStockTela', token, id: telaId, stock: nuevoStock }),
        });
        const data = await res.json();

        if (data.success) {
            mostrarToast('Stock de tela actualizado ✓', 'success');
            const t = todasLasTelas.find(x => x.id === telaId);
            if (t) t.stock = nuevoStock;
            renderizarAdminTelas(todasLasTelas);
        } else {
            mostrarToast(data.error || 'Error al actualizar stock', 'error');
        }
    } catch (e) {
        mostrarToast('Error de conexión', 'error');
    } finally {
        inputEl.disabled = false;
    }
}

// ==================== ACTIVAR / DESACTIVAR ====================

async function toggleActivaTela(telaId, nuevoActivo) {
    const token = sessionStorage.getItem('admin_token');
    try {
        const res = await fetch(URL_WEB_APP_EXCEL, {
            method: 'POST',
            body: JSON.stringify({ action: 'toggleTela', token, id: telaId, activo: nuevoActivo }),
        });
        const data = await res.json();

        if (data.success) {
            mostrarToast(nuevoActivo ? 'Tela activada ✓' : 'Tela desactivada', 'success');
            const t = todasLasTelas.find(x => x.id === telaId);
            if (t) t.activo = nuevoActivo;
            renderizarAdminTelas(todasLasTelas);
        } else {
            mostrarToast(data.error || 'Error', 'error');
        }
    } catch (e) {
        mostrarToast('Error de conexión', 'error');
    }
}
