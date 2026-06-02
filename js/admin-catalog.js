/**
 * HEMA SEWING — Gestión de Catálogo (Sprint 3)
 * Fases 2.7, 2.8, 2.9, 2.10
 */

let todosLosProductos = [];
let productoEditandoId = null; // null = crear, string = editar

// ==================== CARGA ====================

async function cargarCatalogo() {
    const token = sessionStorage.getItem('admin_token');
    const grid = document.getElementById('catalogo-grid');
    grid.innerHTML = '<p class="catalog-loading">Cargando catálogo...</p>';

    try {
        const res = await fetch(
            `${URL_WEB_APP_EXCEL}?action=getCatalog&token=${encodeURIComponent(token)}`
        );
        const data = await res.json();

        if (data.error) {
            mostrarToast(data.error, 'error');
            if (data.error.includes('No autorizado')) logoutAdmin();
            return;
        }

        todosLosProductos = data;
        renderizarCatalogo(todosLosProductos);

    } catch (e) {
        console.error(e);
        grid.innerHTML = '<p class="catalog-loading error-txt">Error al cargar el catálogo. Reintenta.</p>';
    }
}

// ==================== RENDERIZADO ====================

function renderizarCatalogo(productos) {
    const grid = document.getElementById('catalogo-grid');
    grid.innerHTML = '';

    if (!productos || productos.length === 0) {
        grid.innerHTML = '<p class="catalog-loading">No hay productos en el catálogo aún.</p>';
        return;
    }

    productos.forEach(p => {
        const card = document.createElement('div');
        card.className = `product-card ${p.activo == false || p.activo === 'false' || p.activo === 'FALSE' ? 'inactiva' : ''}`;
        card.dataset.id = p.id;

        const imgSrc = p.imagen || 'assets/Logo.jpg';
        const estaActivo = !(p.activo == false || p.activo === 'false' || p.activo === 'FALSE');
        const badgeClass = estaActivo ? 'badge-activo' : 'badge-inactivo';
        const badgeLabel = estaActivo ? 'Activo' : 'Inactivo';
        const stockBajo = parseInt(p.stock) <= 3;

        card.innerHTML = `
            <div class="product-card-img-wrap">
                <img src="${imgSrc}" alt="${p.nombre}" onerror="this.src='assets/Logo.jpg'">
                <span class="product-badge ${badgeClass}">${badgeLabel}</span>
            </div>
            <div class="product-card-body">
                <span class="product-category">${p.categoria || '—'}</span>
                <h3 class="product-name">${p.nombre}</h3>
                <p class="product-description">${p.descripcion || ''}</p>
                <div class="product-meta">
                    <span class="product-price">$${Number(p.precio).toLocaleString('es-AR')}</span>
                    <span class="product-stock ${stockBajo ? 'stock-bajo' : ''}">
                        Stock: ${p.stock}
                    </span>
                </div>
                <div class="product-stock-controls">
                    <label class="stock-label">Ajustar stock:</label>
                    <input
                        type="number"
                        min="0"
                        class="stock-input"
                        value="${p.stock}"
                        data-id="${p.id}"
                        onchange="confirmarActualizarStock('${p.id}', this)"
                    >
                </div>
                <div class="product-card-actions">
                    <button class="btn-card-edit" onclick="abrirModalProducto('${p.id}')">✏️ Editar</button>
                    <button class="btn-card-toggle ${estaActivo ? 'btn-desactivar' : 'btn-activar'}"
                        onclick="toggleActivoProducto('${p.id}', ${!estaActivo})">
                        ${estaActivo ? '🚫 Desactivar' : '✅ Activar'}
                    </button>
                    <button class="btn-card-delete" onclick="confirmarEliminarProducto('${p.id}', '${p.nombre}')">🗑️ Eliminar</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// ==================== BUSCADOR CATÁLOGO ====================

function filtrarCatalogo() {
    const q = document.getElementById('catalogo-search').value.toLowerCase().trim();
    const filtroEstado = document.getElementById('catalogo-filter-estado').value;

    const filtrados = todosLosProductos.filter(p => {
        const estaActivo = !(p.activo == false || p.activo === 'false' || p.activo === 'FALSE');
        const cumpleEstado =
            filtroEstado === 'todos' ||
            (filtroEstado === 'activo' && estaActivo) ||
            (filtroEstado === 'inactivo' && !estaActivo);

        const cumpleBusqueda =
            !q ||
            (p.nombre || '').toLowerCase().includes(q) ||
            (p.categoria || '').toLowerCase().includes(q);

        return cumpleEstado && cumpleBusqueda;
    });

    renderizarCatalogo(filtrados);
}

// ==================== MODAL PRODUCTO ====================

function abrirModalProducto(productoId) {
    productoEditandoId = productoId || null;
    const modal = document.getElementById('modal-producto');
    const titulo = document.getElementById('modal-producto-titulo');
    const form = document.getElementById('form-producto');

    form.reset();

    if (productoId) {
        const p = todosLosProductos.find(x => x.id === productoId);
        if (!p) return;
        titulo.innerText = 'Editar Producto';
        document.getElementById('prod-nombre').value = p.nombre || '';
        document.getElementById('prod-categoria').value = p.categoria || '';
        document.getElementById('prod-descripcion').value = p.descripcion || '';
        document.getElementById('prod-precio').value = p.precio || '';
        document.getElementById('prod-stock').value = p.stock || 0;
        document.getElementById('prod-imagen').value = p.imagen || '';
        document.getElementById('prod-color').value = p.color || '';
        document.getElementById('prod-activo').value = (p.activo === true || p.activo === 'true' || p.activo === 'TRUE') ? 'true' : 'false';
    } else {
        titulo.innerText = 'Nuevo Producto';
        document.getElementById('prod-activo').value = 'true';
    }

    modal.classList.remove('oculto');
}

function cerrarModalProducto() {
    document.getElementById('modal-producto').classList.add('oculto');
    productoEditandoId = null;
}

// ==================== GUARDAR PRODUCTO (CREAR / EDITAR) ====================

async function guardarProducto() {
    const token = sessionStorage.getItem('admin_token');
    const btnGuardar = document.getElementById('btn-guardar-producto');

    const nombre = document.getElementById('prod-nombre').value.trim();
    const precio = document.getElementById('prod-precio').value.trim();
    if (!nombre || !precio) {
        mostrarToast('Nombre y Precio son obligatorios', 'error');
        return;
    }

    const payload = {
        action: productoEditandoId ? 'updateProduct' : 'createProduct',
        token,
        id: productoEditandoId || '',
        nombre,
        categoria: document.getElementById('prod-categoria').value.trim(),
        descripcion: document.getElementById('prod-descripcion').value.trim(),
        precio,
        stock: parseInt(document.getElementById('prod-stock').value) || 0,
        imagen: document.getElementById('prod-imagen').value.trim(),
        color: document.getElementById('prod-color').value.trim(),
        activo: document.getElementById('prod-activo').value,
    };

    btnGuardar.disabled = true;
    btnGuardar.innerText = 'Guardando...';

    try {
        const res = await fetch(URL_WEB_APP_EXCEL, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (data.success) {
            mostrarToast(
                productoEditandoId ? 'Producto actualizado ✓' : 'Producto creado ✓',
                'success'
            );
            cerrarModalProducto();
            cargarCatalogo();
        } else {
            mostrarToast(data.error || 'Error al guardar', 'error');
        }
    } catch (e) {
        console.error(e);
        mostrarToast('Error de conexión', 'error');
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.innerText = 'Guardar';
    }
}

// ==================== STOCK ====================

async function confirmarActualizarStock(productoId, inputEl) {
    const nuevoStock = parseInt(inputEl.value);
    if (isNaN(nuevoStock) || nuevoStock < 0) {
        mostrarToast('El stock debe ser un número mayor o igual a 0', 'error');
        inputEl.value = todosLosProductos.find(p => p.id === productoId)?.stock || 0;
        return;
    }

    const token = sessionStorage.getItem('admin_token');
    inputEl.disabled = true;

    try {
        const res = await fetch(URL_WEB_APP_EXCEL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'updateStock',
                token,
                id: productoId,
                stock: nuevoStock,
            }),
        });
        const data = await res.json();

        if (data.success) {
            mostrarToast('Stock actualizado ✓', 'success');
            const p = todosLosProductos.find(x => x.id === productoId);
            if (p) p.stock = nuevoStock;
            renderizarCatalogo(todosLosProductos);
        } else {
            mostrarToast(data.error || 'Error al actualizar stock', 'error');
        }
    } catch (e) {
        console.error(e);
        mostrarToast('Error de conexión', 'error');
    } finally {
        inputEl.disabled = false;
    }
}

// ==================== ACTIVAR / DESACTIVAR ====================

async function toggleActivoProducto(productoId, nuevoActivo) {
    const token = sessionStorage.getItem('admin_token');

    try {
        const res = await fetch(URL_WEB_APP_EXCEL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'toggleProducto',
                token,
                id: productoId,
                activo: nuevoActivo,
            }),
        });
        const data = await res.json();

        if (data.success) {
            mostrarToast(nuevoActivo ? 'Producto activado ✓' : 'Producto desactivado', 'success');
            const p = todosLosProductos.find(x => x.id === productoId);
            if (p) p.activo = nuevoActivo;
            renderizarCatalogo(todosLosProductos);
        } else {
            mostrarToast(data.error || 'Error', 'error');
        }
    } catch (e) {
        mostrarToast('Error de conexión', 'error');
    }
}

// ==================== ELIMINAR ====================

function confirmarEliminarProducto(productoId, nombre) {
    if (!confirm(`¿Eliminar el producto "${nombre}"? Esta acción no se puede deshacer.`)) return;
    eliminarProducto(productoId);
}

async function eliminarProducto(productoId) {
    const token = sessionStorage.getItem('admin_token');

    try {
        const res = await fetch(URL_WEB_APP_EXCEL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'deleteProduct',
                token,
                id: productoId,
            }),
        });
        const data = await res.json();

        if (data.success) {
            mostrarToast('Producto eliminado', 'success');
            todosLosProductos = todosLosProductos.filter(p => p.id !== productoId);
            renderizarCatalogo(todosLosProductos);
        } else {
            mostrarToast(data.error || 'Error al eliminar', 'error');
        }
    } catch (e) {
        mostrarToast('Error de conexión', 'error');
    }
}
