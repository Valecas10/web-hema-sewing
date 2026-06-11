/**
 * =========================
 * CARRITO
 * =========================
 */

let carrito = [];

const cartButton = document.getElementById('cart-button');
const cartWindow = document.getElementById('cart-window');
const closeCart = document.getElementById('close-cart');


/* =========================
   STORAGE
========================= */

function guardarCarrito() {
    localStorage.setItem(
        'carrito',
        JSON.stringify(carrito)
    );
}


/* =========================
   RENDER
========================= */

function renderizarCarrito() {

    const lista = document.getElementById('cart-items');
    const totalTxt = document.getElementById('total-price');
    const contador = document.getElementById('cart-count');

    const cartBtn = document.getElementById('cart-button');
    const btnCheckout = document.getElementById('btn-checkout');

    if (!lista || !contador) return;

    lista.innerHTML = '';

    let total = 0;
    let unidades = 0;


    /* =========================
       ESTADO CARRITO VACÍO
    ========================= */

    if (carrito.length === 0) {

        lista.innerHTML =
            '<p class="empty-msg">El carrito está vacío</p>';

        if (btnCheckout) {
            btnCheckout.disabled = true;

            btnCheckout.classList.add(
                'btn-deshabilitado'
            );
        }

    } else {

        if (btnCheckout) {
            btnCheckout.disabled = false;

            btnCheckout.classList.remove(
                'btn-deshabilitado'
            );
        }

    }


    /* =========================
       ANIMACIÓN BOTÓN
    ========================= */

    if (cartBtn) {

        cartBtn.style.transform =
            'scale(1.5) translateY(-5px)';

        setTimeout(() => {

            cartBtn.style.transform =
                'scale(1) translateY(0)';

        }, 200);

    }


    /* =========================
       ITEMS
    ========================= */


    carrito.forEach(item => {

        total += item.precio * item.cantidad;
        unidades += item.cantidad;

        const div = document.createElement('div');

        div.className = 'cart-item';

        const esBordado =
            item.personalizacion
                ?.toLowerCase()
                .includes('bordado');

        div.innerHTML = `
            <div class="cart-item-content">

                <img 
                    src="${item.imagen}" 
                    alt="${item.nombre}"
                    class="cart-item-image"
                >

                <div class="cart-item-info">
                    <strong>${item.nombre}</strong>

                    <small>
                        ${item.detalle || ''}
                    </small>

                    <small>
                        ${
                            esBordado
                                ? 'Precio a cotizar'
                                : '$' + (item.precio * item.cantidad)
                        }
                    </small>
                </div>

            </div>

            <button
                class="btn-remove"
                onclick="eliminarDelCarrito('${item.id}')"
            >
                Quitar
            </button>
        `;

        lista.appendChild(div);

    });

    contador.innerText = unidades;


    /* =========================
       CHECKOUT
    ========================= */

    const requiereCotizacion = carrito.some(producto =>
        typeof producto.personalizacion === 'string' &&
        producto.personalizacion
            .toLowerCase()
            .includes('bordado')
    );

    const totalLabel =
    document.getElementById(
        'cart-total-label'
    );

    if (requiereCotizacion) {

        btnCheckout.innerText =
            'Cotizar por WhatsApp';

        btnCheckout.onclick =
            enviarCotizacionWhatsApp;

        totalLabel.innerHTML =
            'Pedido sujeto a cotización';

    } else {

        btnCheckout.innerText =
            'Ir a Pagar';

        btnCheckout.onclick = () => {
            mostrarVista('datos-comprador');
        };

        totalLabel.innerHTML =
            'Total: $<span id="total-price">' +
            total +
            '</span>';

    }

}


/* =========================
   ELIMINAR PRODUCTO
========================= */

function eliminarDelCarrito(id) {

    const producto = carrito.find(
        item => item.id === id
    );


     const antes = carrito.length;

    carrito = carrito.filter(item => item.id !== id);

    if (producto) {

        const telaCard = document.querySelector(
            `#contenedor-telas .card-opcion[data-valor="${producto.telaId}"]`
        );

        if (telaCard) {

            const stockGuardado =
                obtenerStockGuardado();

            const stockActual =
                stockGuardado[producto.telaId] ?? 0;

            if (stockActual !== -1) {

                const nuevoStock =
                    stockActual + 1;

                stockGuardado[producto.telaId] =
                    nuevoStock;

                guardarStock(stockGuardado);

                telaCard.dataset.stock =
                    nuevoStock;

                const stockTexto =
                    telaCard.querySelector(
                        '.stock-limitado, .stock-ilimitado, .stock-agotado'
                    );

                telaCard.classList.remove('agotada');

                if (stockTexto && nuevoStock > 0) {
                    stockTexto.className = 'stock-limitado';
                    stockTexto.innerText =
                        nuevoStock === 1
                            ? 'Ultima Unidad Disponible🔥'
                            : `Quedan ${nuevoStock}`;
                }

            }

        }


        /* =========================
           DEVOLVER STOCK CATÁLOGO
        ========================= */

        if (producto.personalizacion === 'catalogo') {

            const stockGuardado =
                obtenerStockGuardado();

            const stockActual =
                stockGuardado[producto.telaId] ?? 0;

            if (stockActual !== -1) {

                const nuevoStock =
                    stockActual + 1;

                stockGuardado[producto.telaId] =
                    nuevoStock;

                guardarStock(stockGuardado);

                // Refresh cards belonging to this product
                actualizarTarjetasProducto(producto);

            }

        }

    }


    carrito = carrito.filter(
        item => item.id !== id
    );

    guardarCarrito();
    renderizarCarrito();

}


/* =========================
   AGREGAR PRODUCTO
========================= */

function actualizarTarjetasProducto(producto) {
    // Find all catalog cards that belong to this product name
    const cards = document.querySelectorAll(`.card-catalogo[data-producto="${producto.nombre}"]`);
    const stockGuardado = obtenerStockGuardado();
    cards.forEach(card => {
        const varianteId = card.dataset.id;
        // Determine stock: prefer saved stock, else fallback to product variant data if available, else use existing dataset stock
        const stockActual = stockGuardado[varianteId] ?? (
            producto.variantes ?
                parseInt((producto.variantes.find(v => v.id === varianteId) || {}).stock || '0') :
                (parseInt(card.dataset.stock) || 0)
        );
        // Update dataset and UI
        card.dataset.stock = stockActual;
        const stockTexto = card.querySelector('.stock-limitado, .stock-ilimitado, .stock-agotado');
        if (stockTexto) {
            if (stockActual === -1) {
                stockTexto.className = 'stock-ilimitado';
                stockTexto.innerText = 'Disponible';
                card.classList.remove('agotado');
            } else if (stockActual === 0) {
                stockTexto.className = 'stock-agotado';
                stockTexto.innerText = 'Agotado';
                card.classList.add('agotado');
            } else if (stockActual === 1) {
                stockTexto.className = 'stock-limitado';
                stockTexto.innerText = 'Ultima Unidad Disponible🔥';
                card.classList.remove('agotado');
            } else {
                stockTexto.className = 'stock-limitado';
                stockTexto.innerText = `Quedan ${stockActual}`;
                card.classList.remove('agotado');
            }
        }
        const boton = card.querySelector('.btn-catalogo');
        if (boton) {
            boton.disabled = stockActual === 0;
        }
    });
}
window.actualizarTarjetasProducto = actualizarTarjetasProducto;

function agregarAlCarritoPersonalizado(producto) {
    carrito.push(producto);

    guardarCarrito();

    renderizarCarrito();


    const cartBtn =
        document.getElementById('cart-button');

    if (cartBtn) {

        cartBtn.classList.add(
            'pulse-animation'
        );

        setTimeout(() => {

            cartBtn.classList.remove(
                'pulse-animation'
            );

        }, 500);

    }
}
window.agregarAlCarritoPersonalizado = agregarAlCarritoPersonalizado;




/* =========================
   INICIALIZAR
========================= */

function inicializarCarrito() {

    const cartWindow =
        document.getElementById('cart-window');

    if (cartWindow) {
        cartWindow.classList.add('oculto');
    }


    document.getElementById(
        'cart-button'
    ).onclick = () => {

        cartWindow.classList.remove(
            'oculto'
        );

        cartWindow.classList.toggle(
            'activo'
        );

    };


    document.getElementById(
        'close-cart'
    ).onclick = (e) => {

        e.stopPropagation();

        cartWindow.classList.remove(
            'oculto'
        );

        cartWindow.classList.toggle(
            'activo'
        );

    };


    const carritoGuardado =
        localStorage.getItem('carrito');

    if (carritoGuardado) {

        carrito =
            JSON.parse(carritoGuardado);

    }

    renderizarCarrito();

}


/* =========================
   TOTAL
========================= */

function calcularTotal() {

    let total = 0;

    carrito.forEach(item => {

        total +=
            item.precio * item.cantidad;

    });

    return total;

}

window.inicializarCarrito = inicializarCarrito;