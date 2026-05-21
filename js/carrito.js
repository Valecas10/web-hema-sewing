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

    if (!lista || !totalTxt || !contador) return;

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
                        $${item.precio * item.cantidad}
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


    totalTxt.innerText = total;
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

    if (requiereCotizacion) {

        btnCheckout.innerText =
            'Cotizar por WhatsApp';

        btnCheckout.onclick =
            enviarCotizacionWhatsApp;

    } else {

        btnCheckout.innerText =
            'Ir a Pagar';

        btnCheckout.onclick = () => {
            mostrarVista('datos-comprador');
        };

    }

}


/* =========================
   ELIMINAR PRODUCTO
========================= */

function eliminarDelCarrito(id) {

    const producto = carrito.find(
        item => item.id === id
    );

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

                telaCard.classList.remove(
                    'agotada'
                );

                if (nuevoStock > 0) {

                    stockTexto.className =
                        'stock-limitado';

                    stockTexto.innerText =
                        `Quedan ${nuevoStock}`;

                }

            }

        }

    }


    /* =========================
       DEVOLVER STOCK CATÁLOGO
    ========================= */

    if (producto.personalizacion === 'catalogo') {

        const cardCatalogo =
            document.querySelector(
                `.card-catalogo[data-id="${producto.telaId}"]`
            );

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

            if (cardCatalogo) {

                cardCatalogo.dataset.stock =
                    nuevoStock;

                const stockTexto =
                    cardCatalogo.querySelector(
                        '.stock-limitado, .stock-ilimitado, .stock-agotado'
                    );

                cardCatalogo.classList.remove(
                    'agotado'
                );

                if (nuevoStock > 0) {

                    stockTexto.className =
                        'stock-limitado';

                    stockTexto.innerText =
                        `Quedan ${nuevoStock}`;

                }

                const boton =
                    cardCatalogo.querySelector(
                        '.btn-catalogo'
                    );

                boton.disabled = false;

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