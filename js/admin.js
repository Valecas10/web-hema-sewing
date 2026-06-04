/**
 * HEMA SEWING - Lógica del Panel de Administración (Sprint 1 & 2)
 */

let todosLosPedidos = [];
let seccionActiva = 'pedidos';

document.addEventListener('DOMContentLoaded', () => {
    // Verificar si ya hay una sesión iniciada
    const token = sessionStorage.getItem('admin_token');
    
    if (token) {
        mostrarPanelAdmin();
    } else {
        mostrarLogin();
    }
});

// ==================== VISTAS Y NAVEGACIÓN ====================

function mostrarLogin() {
    document.getElementById('login-container').classList.remove('oculto');
    document.getElementById('admin-dashboard').classList.add('oculto');
}

function mostrarPanelAdmin() {
    document.getElementById('login-container').classList.add('oculto');
    document.getElementById('admin-dashboard').classList.remove('oculto');
    
    // Cargar datos iniciales
    cargarPedidos();
    cargarEstadisticas();
}

function cambiarSeccion(seccion) {
    seccionActiva = seccion;
    
    // Cambiar clases de los botones de navegación
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    navItems.forEach(item => item.classList.remove('activo'));
    
    // Buscar y activar el botón correspondiente
    const btnActivo = Array.from(navItems).find(btn => btn.innerText.toLowerCase().includes(seccion.toLowerCase()));
    if (btnActivo) btnActivo.classList.add('activo');
    
    // Cambiar visibilidad de secciones
    document.getElementById('section-pedidos').classList.add('oculto');
    document.getElementById('section-dashboard').classList.add('oculto');
    document.getElementById('section-catalogo').classList.add('oculto');
    document.getElementById('section-telas').classList.add('oculto');
    
    if (seccion === 'pedidos') {
        document.getElementById('section-pedidos').classList.remove('oculto');
        document.getElementById('seccion-titulo').innerText = 'Gestión de Pedidos';
        cargarPedidos();
    } else if (seccion === 'dashboard') {
        document.getElementById('section-dashboard').classList.remove('oculto');
        document.getElementById('seccion-titulo').innerText = 'Resumen del Negocio';
        cargarEstadisticas();
    } else if (seccion === 'catalogo') {
        document.getElementById('section-catalogo').classList.remove('oculto');
        document.getElementById('seccion-titulo').innerText = 'Gestión de Catálogo';
        cargarCatalogo();
    } else if (seccion === 'telas') {
        document.getElementById('section-telas').classList.remove('oculto');
        document.getElementById('seccion-titulo').innerText = 'Gestión de Telas';
        cargarAdminTelas();
    }
}

// ==================== AUTENTICACIÓN (LOGIN) ====================

async function procesarLogin() {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    const btn = document.getElementById('btn-login');
    const err = document.getElementById('login-error');
    
    if (!user || !pass) return;
    
    btn.disabled = true;
    btn.innerText = 'Verificando...';
    err.classList.add('oculto');
    
    try {
        const response = await fetch(URL_WEB_APP_EXCEL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'login',
                username: user,
                password: pass
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.token) {
            sessionStorage.setItem('admin_token', data.token);
            sessionStorage.setItem('admin_user', user);
            mostrarPanelAdmin();
            mostrarToast('¡Bienvenida, Nai!', 'success');
        } else {
            err.innerText = data.error || 'Credenciales incorrectas';
            err.classList.remove('oculto');
        }
    } catch (e) {
        console.error(e);
        err.innerText = 'Error de conexión con el servidor';
        err.classList.remove('oculto');
    } finally {
        btn.disabled = false;
        btn.innerText = 'Ingresar';
    }
}

function logoutAdmin() {
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_user');
    location.reload();
}

// ==================== GESTIÓN DE PEDIDOS ====================

async function cargarPedidos() {
    const token = sessionStorage.getItem('admin_token');
    const tbody = document.getElementById('table-orders-body');
    
    try {
        const response = await fetch(`${URL_WEB_APP_EXCEL}?action=getOrders&token=${encodeURIComponent(token)}`);
        const data = await response.json();
        
        if (data.error) {
            mostrarToast(data.error, 'error');
            if (data.error.includes('No autorizado')) logoutAdmin();
            return;
        }
        
        todosLosPedidos = data;
        
        // Ordenar pedidos: los "Pendiente" primero, luego ordenar por fecha descendente (más nuevos arriba)
        todosLosPedidos.sort((a, b) => {
            const estadoA = a.estado === 'Pendiente' ? 1 : 0;
            const estadoB = b.estado === 'Pendiente' ? 1 : 0;
            
            if (estadoA !== estadoB) {
                return estadoB - estadoA; // Coloca los Pendientes arriba
            }
            // A igual nivel de prioridad, ordenar por fecha descendente
            return new Date(b.fecha) - new Date(a.fecha);
        });
        
        renderizarTablaPedidos(todosLosPedidos);
        actualizarTarjetasResumen(todosLosPedidos);
        
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="6" class="table-loading" style="color:red;">Error al cargar pedidos. Reintenta.</td></tr>';
    }
}

function renderizarTablaPedidos(pedidos) {
    const tbody = document.getElementById('table-orders-body');
    tbody.innerHTML = '';
    
    if (pedidos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="table-loading">No se encontraron pedidos.</td></tr>';
        return;
    }
    
    pedidos.forEach(p => {
        const tr = document.createElement('tr');
        const fechaFormateada = new Date(p.fecha).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const claseChip = p.estado.toLowerCase().replace(/\s+/g, '');
        
        tr.innerHTML = `
            <td><strong>#${p.tracking_id}</strong></td>
            <td>${fechaFormateada}</td>
            <td>${p.cliente}</td>
            <td><span class="chip ${claseChip}">${p.estado}</span></td>
            <td>$${p.total}</td>
            <td>
                <button class="btn-detalle" onclick="mostrarDetallePedido('${p.tracking_id}')">
                    Ver Detalle
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function actualizarTarjetasResumen(pedidos) {
    let pendientes = 0, enProceso = 0, terminados = 0, enviados = 0;
    
    pedidos.forEach(p => {
        const est = p.estado.toLowerCase();
        if (est === 'pendiente') pendientes++;
        else if (est === 'en proceso') enProceso++;
        else if (est === 'terminado') terminados++;
        else if (est === 'enviado') enviados++;
    });
    
    document.getElementById('stat-pendiente-count').innerText = pendientes;
    document.getElementById('stat-proceso-count').innerText = enProceso;
    document.getElementById('stat-terminado-count').innerText = terminados;
    document.getElementById('stat-enviado-count').innerText = enviados;
}

// Búsqueda y Filtro de pedidos
function filtrarPedidos() {
    const buscador = document.getElementById('admin-search-input').value.toLowerCase().trim();
    const filtroEstado = document.getElementById('admin-filter-status').value;
    
    const pedidosFiltrados = todosLosPedidos.filter(p => {
        const cumpleEstado = (filtroEstado === 'todos' || p.estado === filtroEstado);
        
        const cumpleBuscador = (
            p.tracking_id.toLowerCase().includes(buscador) ||
            p.cliente.toLowerCase().includes(buscador) ||
            p.email.toLowerCase().includes(buscador) ||
            p.ciudad.toLowerCase().includes(buscador)
        );
        
        return cumpleEstado && cumpleBuscador;
    });
    
    renderizarTablaPedidos(pedidosFiltrados);
}

// ==================== MODAL DETALLE DE PEDIDO ====================

function mostrarDetallePedido(trackingId) {
    const modal = document.getElementById('modal-detalle-pedido');
    const content = document.getElementById('modal-pedido-content');
    
    const p = todosLosPedidos.find(item => item.tracking_id === trackingId);
    if (!p) return;
    
    // Renderizar HTML del detalle
    let productosHTML = '';
    
    p.productos.forEach((prod, index) => {
        productosHTML += `
            <div class="modal-product-item">
                <img class="modal-product-img" src="${prod.imagen || 'assets/Logo.jpg'}" alt="${prod.nombre}" onerror="this.src='assets/Logo.jpg';">
                <div class="modal-product-info">
                    <strong>${prod.nombre} (x${prod.cantidad || 1})</strong>
                    <small>${prod.detalle || 'Sin personalizaciones adicionales'}</small>
                </div>
                <div class="modal-product-price">$${prod.precio}</div>
            </div>
        `;
    });
    
    content.innerHTML = `
        <div class="modal-info-grid">
            <div class="info-block">
                <h4>Contacto del Cliente</h4>
                <p><strong>Nombre:</strong> ${p.cliente}</p>
                <p><strong>Email:</strong> ${p.email}</p>
                <p><strong>Teléfono:</strong> ${p.telefono}</p>
            </div>
            
            <div class="info-block">
                <h4>Dirección de Envío</h4>
                <p><strong>Provincia:</strong> ${p.provincia}</p>
                <p><strong>Ciudad:</strong> ${p.ciudad}</p>
                <p><strong>Calle/Altura:</strong> ${p.calle}</p>
                ${p.dato_extra ? `<p><strong>Extra:</strong> ${p.dato_extra}</p>` : ''}
                <a class="link-mapa" href="${p.link_mapa}" target="_blank">📍 Ver mapa de entrega</a>
            </div>
        </div>

        <div class="info-block">
            <h4>Listado de Compra (Total: $${p.total})</h4>
            <div class="modal-products-list">
                ${productosHTML}
            </div>
        </div>

        <div class="modal-status-update">
            <label for="update-estado-select"><strong>Estado del pedido:</strong></label>
            <select id="update-estado-select" onchange="cambiarEstadoPedido('${p.tracking_id}', this.value)">
                <option value="Pendiente" ${p.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                <option value="En Proceso" ${p.estado === 'En Proceso' || p.estado === 'En proceso' ? 'selected' : ''}>En Proceso</option>
                <option value="Terminado" ${p.estado === 'Terminado' ? 'selected' : ''}>Terminado</option>
                <option value="Enviado" ${p.estado === 'Enviado' ? 'selected' : ''}>Enviado</option>
                <option value="Entregado" ${p.estado === 'Entregado' ? 'selected' : ''}>Entregado</option>
            </select>
        </div>
    `;
    
    modal.classList.remove('oculto');
}

function cerrarModalPedido() {
    document.getElementById('modal-detalle-pedido').classList.add('oculto');
}

// Cambiar estado e integraciones (EmailJS)
async function cambiarEstadoPedido(trackingId, nuevoEstado) {
    const token = sessionStorage.getItem('admin_token');
    const select = document.getElementById('update-estado-select');
    
    select.disabled = true;
    
    try {
        const response = await fetch(URL_WEB_APP_EXCEL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'updateOrderStatus',
                token: token,
                tracking_id: trackingId,
                nuevo_estado: nuevoEstado
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarToast(`Pedido #${trackingId} actualizado a ${nuevoEstado}`, 'success');
            
            // Actualizar localmente la lista de pedidos
            const p = todosLosPedidos.find(item => item.tracking_id === trackingId);
            if (p) {
                p.estado = nuevoEstado;
            }
            
            actualizarTarjetasResumen(todosLosPedidos);
            filtrarPedidos();
            
            // Enviar notificaciones de estado por email vía EmailJS
            enviarNotificacionEmail(p, nuevoEstado);
            
        } else {
            mostrarToast(data.error || 'Error al cambiar estado', 'error');
        }
    } catch (e) {
        console.error(e);
        mostrarToast('Error al conectar con la planilla', 'error');
    } finally {
        if (select) select.disabled = false;
    }
}

// Enviar correos específicos de actualización de estado
async function enviarNotificacionEmail(pedido, estado) {
    let templateId = '';
    
    // Plantilla según el nuevo estado
    // Deberás configurar estas plantillas en tu panel de EmailJS
    if (estado === 'En Proceso' || estado === 'En proceso') {
        templateId = 'template_estado_proceso'; // "Tu pedido comenzó a prepararse"
    } else if (estado === 'Terminado') {
        templateId = 'template_estado_listo';    // "Tu pedido ya está listo"
    } else if (estado === 'Enviado') {
        templateId = 'template_estado_enviado';  // "Tu pedido fue despachado"
    } else if (estado === 'Entregado') {
        templateId = 'template_estado_entregado';// "Tu pedido fue entregado"
    }
    
    if (!templateId) return; // Si es 'Pendiente' no enviamos correo duplicado
    
    const emailParams = {
        cliente: pedido.cliente,
        email: pedido.email,
        tracking_id: pedido.tracking_id,
        estado: estado,
        total: pedido.total,
        provincia: pedido.provincia,
        ciudad: pedido.ciudad,
        calle: pedido.calle
    };

    try {
        await emailjs.send('service_gnblx8l', templateId, emailParams);
        console.log(`Email de estado "${estado}" enviado con éxito a ${pedido.email}`);
    } catch (err) {
        console.error('Error al enviar email de estado por EmailJS:', err);
    }
}

// ==================== ESTADÍSTICAS (DASHBOARD) ====================

async function cargarEstadisticas() {
    const token = sessionStorage.getItem('admin_token');
    
    try {
        const response = await fetch(`${URL_WEB_APP_EXCEL}?action=getStats&token=${encodeURIComponent(token)}`);
        const data = await response.json();
        
        if (data.error) return;
        
        // Ventas
        document.getElementById('dash-sales-total').innerText = `$${data.ventas.total}`;
        document.getElementById('dash-sales-mes').innerText = `$${data.ventas.mes}`;
        document.getElementById('dash-sales-semana').innerText = `$${data.ventas.semana}`;
        
        // Productos más vendidos
        const list = document.getElementById('dash-top-products');
        list.innerHTML = '';
        
        if (data.productosMasVendidos.length === 0) {
            list.innerHTML = '<li>Sin datos de productos vendidos aún.</li>';
        } else {
            data.productosMasVendidos.forEach(p => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>🛍️ ${p.nombre}</span>
                    <span>${p.cantidad} unidades</span>
                `;
                list.appendChild(li);
            });
        }
    } catch (e) {
        console.error('Error al cargar estadísticas del dashboard:', e);
    }
}

// ==================== TOASTS ====================

function mostrarToast(mensaje, tipo = 'success') {
    const container = document.getElementById('toast-hema');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerText = mensaje;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
